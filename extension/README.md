# Project Context (VS Code extension)

Pick files and folders in a checkbox tree and generate their contents — or the
project skeleton — for pasting into an LLM. Built on top of the
[`directory-scanner`](../README.md) core.

> **Status: M2 MVP.** The checkbox tree, recursive include/exclude, simulated
> "partial" folder badges and persistence work. **Generate Contents** emits the
> actual formatted file **contents** (via the core's `scanSelectionToString`),
> **Copy Project Skeleton** emits the project tree (via `renderTree`), and output
> can be sent to a new editor tab, the clipboard, or a file (see settings).

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

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `projectContext.output` | `editor` | Where output goes: `editor` tab, `clipboard`, or `file` |
| `projectContext.stripComments` | `false` | Strip comments from supported source files |
| `projectContext.includeEnvFiles` | `false` | Include `.env` content (off by default to protect secrets) |

## How it reuses the core

The extension imports the core directly from `../src` — `scanSelectionToString`
(scanner), `buildTree` / `renderTree` / `resolveRootName` (tree) and
`isBlacklisted` / `DEFAULT_IGNORE` (blacklist). esbuild bundles those modules
(and their `comment-bear` dependency) in, so there is a single source of truth
and no need to publish the npm package first.

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
