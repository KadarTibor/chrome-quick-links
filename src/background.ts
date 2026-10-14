chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  void warmCache();
});

// Pull the map into the fast caches before the user can type, so the first
// jump of a browser session doesn't pay for the sync read.
chrome.runtime.onStartup.addListener(() => {
  void warmCache();
});

type KeywordMap = Record<string, string>;

const STORAGE_KEY = "keywordMap";
// Jumps are compared case-insensitively, so the lookup table is keyed on the
// lowercased keyword. storage.sync keeps the keywords exactly as typed.
let lookup: KeywordMap | null = null;

function toLookup(map: KeywordMap): KeywordMap {
  const normalized: KeywordMap = {};
  for (const [keyword, url] of Object.entries(map)) {
    normalized[keyword.trim().toLowerCase()] = url;
  }
  return normalized;
}

// storage.sync is the source of truth, but it is the one area that can block on
// Chrome's sync backend — a cold read has been seen to stall for seconds, and
// it sits directly in the navigation path. storage.session is in-memory, never
// touches disk or the network, and survives service worker restarts within a
// browser session, so it absorbs the MV3 teardown that empties `lookup`.
async function getLookup(): Promise<KeywordMap> {
  if (lookup) return lookup;

  const cached = await chrome.storage.session.get(STORAGE_KEY);
  if (cached[STORAGE_KEY]) {
    lookup = cached[STORAGE_KEY] as KeywordMap;
    return lookup;
  }

  return warmCache();
}

async function warmCache(): Promise<KeywordMap> {
  const started = performance.now();
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  const elapsed = performance.now() - started;
  if (elapsed > 1000) {
    console.warn(`storage.sync read took ${Math.round(elapsed)}ms`);
  }

  lookup = toLookup((result[STORAGE_KEY] as KeywordMap) || {});
  await chrome.storage.session.set({ [STORAGE_KEY]: lookup });
  return lookup;
}

// The popup writes straight to storage, so watching for changes replaces the
// old "tell the background to reload" message round-trip.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes[STORAGE_KEY]) return;
  lookup = toLookup((changes[STORAGE_KEY].newValue as KeywordMap) || {});
  void chrome.storage.session.set({ [STORAGE_KEY]: lookup });
});

function resolveUrl(value: string): string {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
}

// Every listener below is registered synchronously at the top level. MV3 spins
// the service worker up fresh for each event and drops events that have no
// listener registered yet, so registering them from inside a callback means the
// first omnibox entry after the worker sleeps goes nowhere.
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const map = await getLookup();
  const query = text.trim().toLowerCase();
  const matches = Object.entries(map).filter(([keyword]) =>
    keyword.startsWith(query)
  );

  if (matches.length === 0) {
    chrome.omnibox.setDefaultSuggestion({
      description: query ? `Unknown keyword: "${query}"` : "Type a keyword",
    });
    suggest([]);
    return;
  }

  chrome.omnibox.setDefaultSuggestion({ description: "Jump to a saved link" });
  suggest(
    matches.map(([keyword, url]) => ({
      content: keyword,
      description: `${keyword} — ${url}`,
    }))
  );
});

chrome.omnibox.onInputEntered.addListener(async (text) => {
  // Resolving the keyword and finding the target tab are independent, so they
  // run together rather than adding their latencies.
  const [map, [tab]] = await Promise.all([
    getLookup(),
    chrome.tabs.query({ active: true, currentWindow: true }),
  ]);

  const url = map[text.trim().toLowerCase()];
  if (!url) {
    console.warn(`No mapping for "${text.trim()}"`);
    return;
  }
  if (tab?.id) {
    chrome.tabs.update(tab.id, { url: resolveUrl(url) });
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  if (command === "duplicate-tab" && tab.id) {
    chrome.tabs.duplicate(tab.id);
  } else if (command === "move-tab-to-new-window" && tab.id) {
    chrome.windows.create({ tabId: tab.id });
  }
});
