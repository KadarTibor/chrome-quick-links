# 🦘 Jumpy

A Chrome extension that maps short keywords to URLs, so you can jump to any
saved link straight from the address bar.

Type `/` in the address bar, then a keyword — `gh`, `mail`, `jira` — and Jumpy
navigates the current tab there. No new-tab page to replace, no bookmark bar to
scroll.

## Features

- **Omnibox jumping** — `/` plus a keyword, with live autocomplete over your
  saved links as you type.
- **Keyword editor** — add, rename, and delete keyword → URL pairs from the
  toolbar popup.
- **Synced across devices** — mappings live in `chrome.storage.sync`, so they
  follow your Chrome profile.
- **Import / export** — back up your mappings as JSON, or load someone else's.
- **Tab shortcuts** — `Ctrl+Shift+U` duplicates the current tab,
  `Ctrl+Shift+Y` moves it to a new window.

URLs are stored as typed; anything without a scheme is resolved as `https://`.

## Install from source

Requires Node.js 20+.

```bash
npm install
npm run build
```

Then load it into Chrome:

1. Visit `chrome://extensions`.
2. Enable **Developer mode** (top right).
3. Click **Load unpacked** and select the generated `dist/` directory.

To package a distributable zip into `web-ext-artifacts/`:

```bash
npm run zip
```

## Development

```bash
npm run dev     # Vite dev server — popup UI only, Chrome APIs unavailable
npm run build   # type-check and build the extension into dist/
npm run lint    # ESLint
```

The popup is a normal React app, so `npm run dev` is useful for iterating on
layout, but anything touching `chrome.*` needs a real build loaded as an
unpacked extension.

## How it works

The extension is Manifest V3, which means the background script is a service
worker that Chrome can stop at any time.

- `src/background.ts` — omnibox and keyboard-command handling. Every listener is
  registered synchronously at the top level, because MV3 drops events that
  arrive before a listener exists. The keyword map is cached in memory as a fast
  path only, and every read falls back to `chrome.storage.sync`.
- `src/components/quick-links-map.tsx` — the popup editor. It writes mappings
  directly to storage; the background picks up changes via
  `chrome.storage.onChanged` rather than a message round-trip.
- `public/manifest.json` — permissions (`storage`, `tabs`), the `/` omnibox
  keyword, and the two tab commands.

Built with React 19, TypeScript, Tailwind CSS v4, and shadcn/ui components on
Radix primitives. Bundled by Vite, packaged with `web-ext`.

## License

[MIT](LICENSE)
