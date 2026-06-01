# Project Context (VS Code extension)

Pick files and folders in a checkbox tree and generate their contents — or the
project skeleton — for pasting into an LLM. Built on top of the
[`directory-scanner`](../README.md) core.

> **Status: M1 spike.** The checkbox tree, recursive include/exclude, simulated
> "partial" folder badges, persistence and the "Generate" → new-editor-tab flow
> work. Generation currently lists the selected file **paths**; the formatted
> file **contents** (via the core's `scanSelectionToString`) land in M2.

## Run it locally (no publishing needed)

1. Open **this `extension/` folder** in VS Code (File → Open Folder…).
2. `npm install`
3. Press **F5** → an "Extension Development Host" window opens with the extension
   loaded. Click the **Project Context** icon in the Activity Bar.
4. Tick files/folders, then use the **Generate Contents** button in the view's
   title bar (or right-click items in the Explorer → *Add to Project Context*).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run build` | Bundle `src/` (+ the imported core) into `dist/extension.js` with esbuild |
| `npm run watch` | Rebuild on change |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm run package` | Produce a `.vsix` with `@vscode/vsce` |

## How it reuses the core

The extension imports `isBlacklisted` / `DEFAULT_IGNORE` directly from
`../src/blacklist.ts`; esbuild bundles those modules in, so there is a single
source of truth and no need to publish the npm package first.

## Layout

```
extension/
├── package.json              # manifest (views, commands, menus)
├── esbuild.js                # bundler
├── src/
│   ├── extension.ts          # activate(): wires the view, commands, generate
│   ├── ProjectTreeProvider.ts# TreeDataProvider + checkbox rendering
│   ├── SelectionModel.ts     # include/exclude overrides (persisted)
│   └── collect.ts            # walk that gathers the selected files
└── resources/activity-icon.svg
```
