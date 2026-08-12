chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// Only a fast path. The MV3 service worker can be torn down at any moment, so
// every read falls back to storage instead of trusting this to be populated.
let keywordMap: Record<string, string> | null = null;

async function getKeywordMap(): Promise<Record<string, string>> {
  if (keywordMap) return keywordMap;
  const result = await chrome.storage.sync.get("keywordMap");
  keywordMap = (result.keywordMap as Record<string, string>) || {};
  return keywordMap;
}

// The popup writes straight to storage, so watching for changes replaces the
// old "tell the background to reload" message round-trip.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.keywordMap) {
    keywordMap = (changes.keywordMap.newValue as Record<string, string>) || {};
  }
});

function resolveUrl(value: string): string {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
}

// Every listener below is registered synchronously at the top level. MV3 spins
// the service worker up fresh for each event and drops events that have no
// listener registered yet, so registering them from inside a callback means the
// first omnibox entry after the worker sleeps goes nowhere.
chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const map = await getKeywordMap();
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
  const map = await getKeywordMap();
  const url = map[text.trim().toLowerCase()];
  if (!url) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
