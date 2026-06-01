# Design: "Project Context" VS Code Extension

Status: **Draft for review** · Target: an MVP that reuses the existing `directory-scanner` core.

This document describes how to turn the existing CLI into a VS Code extension where the
user picks — with the mouse — which files/folders ("classes") to include or exclude
(recursively), then generates either the **combined file contents** or the **project
skeleton (tree)** for pasting into an LLM.

It is a plan only. No extension code is written yet.

---

## 1. Goals & non-goals

### Goals
- A sidebar **tree of the workspace with checkboxes**; checking/unchecking a folder
  cascades to all its children (recursive include/exclude) with one click.
- One action to **generate the contents** of the selected files (the current scanner
  behaviour, but for an explicit selection instead of "whole dir minus blacklist").
- One action to **copy the project skeleton** (the current `tree` command).
- Right-click actions on the native Explorer for quick "scan this folder / file".
- Output to **clipboard**, a **new editor tab**, or a **file** (configurable).
- Reuse the existing core logic (`isTextFile`, `safeReadFile`, `stripCommentsFromFile`,
  `buildTree`, `renderTree`, blacklist matching) — no duplicated logic.

### Non-goals (for the MVP)
- Web/remote (vscode.dev) support — desktop only first (see §8 for the path to web).
- Language-aware "class" extraction (we treat a file as the unit; "class" == file, which
  matches the user's Java/C#-style mental model). Symbol-level selection is a future idea.
- Token counting / cost estimation (nice future add-on).

---

## 2. Repository layout (chosen: separate folder, shared core)

The extension lives in a new top-level `extension/` folder and imports the existing core.
The current project is **not** restructured.

```
file-copy-project/
├── src/                      # existing core + CLI (unchanged)
│   ├── index.ts              # <-- the extension imports from here
│   ├── blacklist.ts
│   ├── file-utils.ts
│   ├── scanner.ts
│   └── tree.ts
├── extension/                # NEW — the VS Code extension
│   ├── package.json          # extension manifest (separate from the root one)
│   ├── tsconfig.json
│   ├── esbuild.js            # bundler (pulls the core in, no publish needed)
│   ├── src/
│   │   ├── extension.ts      # activate()/deactivate() entry point
│   │   ├── ProjectTreeProvider.ts   # TreeDataProvider + checkbox logic
│   │   ├── SelectionModel.ts        # what is included/excluded (persisted)
│   │   └── generate.ts              # collects selection -> calls core -> output
│   ├── resources/            # icons
│   └── README.md             # marketplace listing
└── docs/
    └── vscode-extension-design.md   # this file
```

### How the extension consumes the core
The core is plain TypeScript with no browser-hostile dependencies, and a VS Code desktop
extension runs in **Node.js** — so for the MVP the extension can import the core directly
and bundle it. Recommended: **esbuild** bundles `extension/src/extension.ts` and follows
the `import { ... } from '../../src/index'` (or from the built `../../dist`) into a single
`extension/dist/extension.js`. This means:
- No need to publish the npm package first.
- The core stays a single source of truth.

(If we later prefer a hard package boundary, switch to npm workspaces with
`packages/core`. Deferred — the user chose "separate folder, no restructure".)

---

## 3. User experience

### 3.1 The "Project Context" view (primary UI)

A dedicated container in the Activity Bar (its own icon), containing a checkbox tree:

```
 PROJECT CONTEXT                         [⟳ Refresh] [📋 Generate] [⋯]
 ▾ ☑ my-project
   ▾ ☐ src              1/2   ← partially selected (badge shows the count)
       ☑ scanner.ts
       ☐ legacy.ts            ← excluded with one click
     ▸ ☑ utils                ← whole folder, recursively
   ▾ ☐ test                   ← whole folder excluded
     ☑ README.md
 ──────────────────────────────────────
 12 files selected · ~48 KB
```

Behaviour:
- **Checkbox per node.** Checking a folder selects every descendant; unchecking clears them.
- **Partial folders.** VS Code's tree checkboxes are **two-state only** (`Checked` /
  `Unchecked`) — there is no native indeterminate/tri-state checkbox. To still convey "some
  children selected", a partially-selected folder keeps its checkbox `Unchecked` and shows a
  **count badge** in the item `description` (e.g. `1/2`) plus a distinct icon colour. This is
  the faithful approximation of "indeterminate" within the current API (see §4.1).
- Default state mirrors the CLI: `node_modules`, `.git`, anything in `blacklist.txt`/
  `.gitignore` start **unchecked/hidden**.
- A status footer (view title or a `TreeItem`) shows the selected file count and an
  approximate byte size, so the user knows roughly how big the paste will be.
- The selection is **persisted** in `workspaceState`, so it survives reloads.

### 3.2 Title-bar actions (on the view)
- **Generate contents** → reads selected files via the core and opens the result in a **new
  editor tab** (an untitled document) for review (the chosen default output, see §4.3).
- **Copy skeleton** → renders the tree of the selection (or whole project) into a new editor tab.
- **Refresh**, **Select all**, **Clear selection**.

### 3.3 Explorer right-click (secondary, fast path)
On the native File Explorer (`explorer/context` menu):
- **Add to Project Context** / **Remove from Project Context** (updates the checkbox model).
- **Copy contents (with subfolders)** — immediate scan of the clicked file/folder.
- **Copy skeleton from here** — tree rooted at the clicked folder.

This covers "I just want this one class/folder, fast" without opening the panel.

---

## 4. Architecture & VS Code APIs

| Concern | API / mechanism |
| --- | --- |
| Activity-bar container + view | `contributes.viewsContainers.activitybar` + `contributes.views` |
| Checkbox tree | `vscode.TreeDataProvider<Node>` + `TreeItem.checkboxState` |
| Create the view (checkbox-enabled) | `vscode.window.createTreeView(id, { treeDataProvider, manageCheckboxStateManually })` |
| React to (un)checking | `TreeView.onDidChangeCheckboxState` |
| Refresh the tree | `EventEmitter` wired to `TreeDataProvider.onDidChangeTreeData` |
| Commands & buttons | `contributes.commands` + `contributes.menus` (`view/title`, `view/item/context`, `explorer/context`) |
| Settings | `contributes.configuration` |
| Read files / dirs | `fs.promises` (desktop MVP) → later `vscode.workspace.fs` for web |
| Output to clipboard | `vscode.env.clipboard.writeText()` |
| Output to a new tab | `workspace.openTextDocument({ content }) ` + `window.showTextDocument` |
| Progress while scanning | `window.withProgress({ location: Notification })` |

### 4.1 Checkbox cascade & the "indeterminate" decision
We use `manageCheckboxStateManually: true` and own the logic in `onDidChangeCheckboxState`:
toggling a node cascades **down** to all descendants, and each ancestor is then recomputed.

**Important API constraint:** VS Code's `TreeItemCheckboxState` has only `Checked` and
`Unchecked` — there is **no native indeterminate/tri-state** for tree checkboxes (confirmed
against the current API; it has been a long-standing feature request). We therefore *simulate*
the requested indeterminate state for partially-selected folders:
- The folder checkbox stays `Unchecked` (it is not fully selected).
- We add a `◍ partial` badge to the `TreeItem.description` and a yellow `ThemeIcon('folder', …)`
  so the partial state is obvious at a glance.
- "Select all under here" remains one click on the (unchecked) checkbox.
- Note: `getTreeItem` is synchronous, so the badge cannot do a live filesystem count; an exact
  `n/m` count would need precomputed data (future enhancement).

If VS Code later adds a native tri-state, swapping our simulation for it is a localised change
in `ProjectTreeProvider.getTreeItem`.

### 4.2 Selection model (`SelectionModel.ts`)
Storing one boolean per file does not scale and breaks with lazy-loaded/unexpanded nodes.
Instead store **overrides relative to the default policy**:

```ts
interface SelectionState {
  // Paths the user explicitly force-included (even if default policy would hide them).
  included: Set<string>;
  // Paths the user explicitly excluded (wins over included; applies recursively).
  excluded: Set<string>;
}
```
A node's effective checkbox state is computed as:
`excluded(self or ancestor)  →  unchecked`, else `included(self or ancestor) or default-included  →  checked`.
This makes "exclude a whole folder recursively" a single entry in `excluded`, independent
of whether children are loaded. Persisted to `workspaceState` keyed by workspace folder.

### 4.3 Generation (`generate.ts`)
1. Walk the selection (respecting `excluded`) to produce the concrete list of files.
2. For each file, apply the same rules the CLI uses: `isEnvFile` handling, `isTextFile`
   gate, optional `stripCommentsFromFile`, `safeReadFile`.
3. Concatenate using the same output format as the scanner (path header + content), or
   render a tree via `renderTree` for the skeleton action.
4. Send to the configured sink. **Default: a new editor tab** — `workspace.openTextDocument`
   then `window.showTextDocument`, so the user reviews the result before copying. `clipboard`
   and `file` remain selectable via settings.

### 4.4 Core changes required (small)
The core is mostly reusable as-is. We add **one** function to `src/index.ts` so the
extension does not re-implement walking/formatting:

```ts
// Reads an explicit set of files and returns the formatted scan text (no streaming).
export async function scanSelectionToString(options: {
  rootDir: string;
  includedFiles: string[];          // absolute paths, already filtered by the UI
  includeEnvFiles: boolean;
  stripComments: boolean;
}): Promise<string>;
```
Internally it reuses `isEnvFile`/`isTextFile`/`safeReadFile`/`stripCommentsFromFile` and the
exact same text markers as `scanDirectory`, so CLI and extension output stay identical.
This is additive and fully unit-testable in the existing `node:test` suite.

(Optional, for web support later: refactor `safeReadFile`/`scanDirectory` to accept an
injected `FileSystem` interface so a `vscode.workspace.fs`-backed reader can be plugged in.)

---

## 5. Manifest sketch (`extension/package.json`)

```jsonc
{
  "name": "project-context",
  "displayName": "Project Context",
  "description": "Pick files/folders and copy their contents or skeleton for LLMs.",
  "publisher": "<your-publisher-id>",
  "engines": { "vscode": "^1.84.0" },
  "categories": ["Other"],
  "activationEvents": [],            // implicit from the view contribution
  "main": "./dist/extension.js",
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        { "id": "projectContext", "title": "Project Context", "icon": "resources/icon.svg" }
      ]
    },
    "views": {
      "projectContext": [
        { "id": "projectContext.tree", "name": "Selection" }
      ]
    },
    "commands": [
      { "command": "projectContext.generate", "title": "Generate Contents", "icon": "$(clippy)" },
      { "command": "projectContext.copySkeleton", "title": "Copy Skeleton" },
      { "command": "projectContext.refresh", "title": "Refresh", "icon": "$(refresh)" },
      { "command": "projectContext.selectAll", "title": "Select All" },
      { "command": "projectContext.clear", "title": "Clear Selection" },
      { "command": "projectContext.addFromExplorer", "title": "Add to Project Context" }
    ],
    "menus": {
      "view/title": [
        { "command": "projectContext.generate", "when": "view == projectContext.tree", "group": "navigation" },
        { "command": "projectContext.refresh", "when": "view == projectContext.tree", "group": "navigation" }
      ],
      "explorer/context": [
        { "command": "projectContext.addFromExplorer", "group": "9_context" }
      ]
    },
    "configuration": {
      "title": "Project Context",
      "properties": {
        "projectContext.stripComments": { "type": "boolean", "default": false },
        "projectContext.includeEnvFiles": { "type": "boolean", "default": false },
        "projectContext.output": {
          "type": "string", "enum": ["editor", "clipboard", "file"], "default": "editor"
        },
        "projectContext.respectGitignore": { "type": "boolean", "default": true },
        "projectContext.maxFileSizeKB": { "type": "number", "default": 512 }
      }
    }
  }
}
```

---

## 6. Build & local run

- **Bundler:** `esbuild` (fast, single-file output). `extension/esbuild.js` builds
  `src/extension.ts` → `dist/extension.js`, bundling the imported core.
- **Run/debug:** press **F5** in VS Code → an "Extension Development Host" window opens with
  the extension loaded. No publishing needed to use it yourself.
- **Package without publishing:** `npx @vscode/vsce package` → a `.vsix` you can install via
  `code --install-extension project-context-x.y.z.vsix` (or share with colleagues).
- **Tests:** `@vscode/test-electron` runs the extension host headless for integration tests;
  the pure core stays covered by the existing `node:test` suite.

---

## 7. Publishing to the Marketplace

1. Install the CLI: `npm i -g @vscode/vsce` (and `ovsx` if also targeting Open VSX).
2. Create an **Azure DevOps** organization and a **Personal Access Token** with scope
   *Marketplace → Manage* (full).
3. Create a **publisher** at https://marketplace.visualstudio.com/manage and set
   `"publisher"` in `package.json` to its id.
4. `vsce login <publisher>` (paste the PAT), then `vsce publish` (or `vsce publish minor`).
5. Required manifest fields for a good listing: `displayName`, `description`, `icon`
   (128×128 PNG), `repository`, `categories`, a `README.md` (becomes the listing page),
   and a `LICENSE`.
6. (Optional) `ovsx publish` to also list on Open VSX for VSCodium users.

> You can ship a fully working extension for yourself with steps 1–2 of §6 alone;
> Marketplace publishing is only needed to distribute it publicly.

---

## 8. Future enhancements
- **Web/remote support** via the injected `FileSystem` abstraction + a `browser` entry.
- **Symbol-level selection** (pick individual classes/functions) using the document symbol
  provider, so "class" can mean a real class, not just a file.
- **Token estimate** next to the byte size.
- **Saved presets** (named selections) and quick re-generate.
- **Respect `.gitignore` automatically** using VS Code's `findFiles`/`isIgnored`.
- **Drag & drop** between an "available" and a "selected" tree.

---

## 9. Risks & mitigations
| Risk | Mitigation |
| --- | --- |
| Bundling `comment-bear` breaks the build (its source has literal `@license */` text that closes esbuild's inlined "Bundled license information" comment early → invalid JS) | Build with `legalComments: 'external'` so license notices go to `dist/extension.js.LEGAL.txt` instead of being inlined. (Discovered in M2; `node --check dist/extension.js` is a quick guard.) |
| Large selections produce huge pastes | Live byte/file count footer + `maxFileSizeKB` cap + binary skip (reuse `isTextFile`) |
| Accidentally leaking `.env`/secrets | `.env` skipped by default (reuse existing logic); explicit opt-in toggle |
| Performance on big repos | Lazy `getChildren`; selection model independent of expansion; `withProgress` during generation |
| Checkbox cascade semantics differ by VS Code version | Pin `engines.vscode`; verify during spike; manual-management fallback designed in |
| Web/remote has no Node `fs` | Desktop-only MVP; abstraction ready for phase 2 |

---

## 10. Proposed milestones
1. **M1 — Spike ✅ done:** scaffold in `extension/`, checkbox tree of the workspace, recursive
   include/exclude, simulated partial badges, persistence, esbuild bundling of the core.
2. **M2 — MVP ✅ done:** `scanSelectionToString` + shared `renderFileBody` in core (with tests);
   "Generate Contents" now emits real file contents; "Copy Project Skeleton" via `renderTree`;
   output sink setting (editor/clipboard/file) + `stripComments` / `includeEnvFiles` settings.
   - ✅ Bumped the core's `comment-bear` dependency to `^1.2.0`, updated the lockfile, and
     re-ran `npm test` (all green) before wiring it into the extension.
3. **M3 — Polish (mostly done):** ✅ settings, ✅ progress notifications, ✅ footer with selected
   file count + approximate size, ✅ Explorer quick actions ("Copy Contents (with subfolders)",
   "Copy Skeleton From Here"), ✅ checklist icon, ✅ unit tests for the file-collection helpers.
   - ✅ Extracted CLI-free core modules (`scan-core.ts`, `tree-core.ts`) so the extension
     bundle no longer pulls in the `require.main`/shebang CLI entry of `scanner.ts`/`tree.ts`
     (verified: zero `require.main` references in the bundle).
   - ✅ Added an activation smoke test that loads the *built bundle* with a mocked `vscode`
     and asserts `activate()` registers the view + commands (catches bundle-level breakage
     like the license-comment issue, headless, no Electron download).
   - Remaining (optional): full UI-level end-to-end tests with `@vscode/test-electron`
     (drives a real VS Code window — heavier; the smoke test already covers activation).
4. **M4 — Publish:** marketplace assets, publisher + PAT, `vsce publish` (+ Open VSX).

---

## 11. Resolved decisions (v1)
1. **Output sink → a new editor tab.** Generated contents and skeletons open in an untitled
   editor document so the user can review them before copying. `clipboard` and `file` remain
   available as settings.
2. **Partial folders → simulated indeterminate.** Confirmed in testing that the VS Code API has
   no tri-state checkbox, so a partially-selected folder keeps an `Unchecked` checkbox and is
   marked with a `◍ partial` `description` badge **and a yellow folder icon** (chosen over a
   "checked + (partial)" look so that one click on the checkbox still means "select everything
   in this folder"). Implemented with `manageCheckboxStateManually: true` (see §4.1). Exact
   counts (e.g. `3/8`) are deferred: `getTreeItem` is synchronous and a precise count needs a
   filesystem walk, so it requires precomputed/cached data (a later enhancement).
3. **Display name → deferred.** The extension uses the working name **"Project Context"** for
   now; the final marketplace name is decided at publish time (M4).
