# Context Picker

**Pick files and folders with checkboxes, then copy their code — or a project skeleton — ready to paste into an LLM.**

> [!IMPORTANT]
> 🔴 <span style="color:#e51400"><strong>Using Microsoft 365 Copilot? Turn on “Copy as .txt” first.</strong></span>
> Copilot 365 **blocks code files** (`.ts`, `.cs`, `.js`, …), so uploads fail. Enable
> **Settings → `Context Picker: Copy as .txt`** — a red **“Copy as .txt: OFF”** badge
> stays in the status bar until you do. Then **Copy Files to Folder** saves your files
> as e.g. `app.ts.txt`, which Copilot accepts (the original extension stays in the name,
> so the AI still detects the language).

Context Picker adds a sidebar panel with a checkbox tree of your workspace. Tick
what matters and generate a single, well-formatted block of file contents (or
just the directory tree) to paste into any AI assistant or large language model.
It can even collect the files into a folder for drag-and-drop upload.

## Features

- **Checkbox tree** of your project — tick a folder to include everything under
  it recursively; untick a file to exclude it. Partially-selected folders are
  marked so you always know what's in.
- **Generate Contents** — outputs the path + content of every selected file in
  one block, opened in a new editor tab (or copied to the clipboard / saved to a
  file).
- **Select Files by Path** 🔍 — paste a list of paths (e.g. the files an LLM asked
  for) and every matching file is ticked automatically.
- **Copy Files to Folder** 🗎 — copies the selected files into one folder and opens
  it, so you can drag them straight into a chat. Cleaned on each run.
  - **Copy as .txt** — optionally renames copies to `app.ts.txt`, so uploaders
    that block source extensions (e.g. **Microsoft 365 Copilot**) accept them
    while keeping the language visible in the name.
- **Copy Project Skeleton** — outputs just the directory tree, with your project
  name as the root.
  - **Configure Skeleton Excludes** ⚙ — tick which folders to omit from the
    skeleton (any depth); the choice is saved per-workspace.
- **Live size counter** — the footer shows how many files are selected and the
  exact **lines** and **characters** the output will be (honouring the transforms
  below), so you know if it fits your LLM's context. Set **Max Characters** to get
  an over-limit warning.
- **Strip comments** / **Remove blank lines** — one-click toggles to shrink the
  output; the counter and the copied files reflect them.
- **Respect `.gitignore`** — files/folders matched by `.gitignore` are hidden by
  default (tree, generation and skeleton); a toggle reveals them.
- **Build/IDE folders hidden** — `node_modules`, `.git`, `bin`, `obj`, `.vs` are
  skipped automatically.
- **Skip secrets** — `.env` contents are excluded by default.
- **Explorer quick actions** — right-click any file/folder to *Copy Contents
  (with subfolders)* or *Copy Skeleton From Here* without opening the panel.
- Your selection is **remembered** between sessions.

## How to use

1. Click the **Context Picker** icon in the Activity Bar.
2. Tick files/folders — or click **Select Files by Path** and paste a list.
3. Watch the footer for the size (lines / chars).
4. **Generate Contents** to get the text, or **Copy Files to Folder** to drag the
   actual files into a chat.

> Uploading to **Microsoft 365 Copilot**? Turn on **Copy as .txt** (a red status-bar
> reminder appears until you do) so the copied files upload as `.txt`.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `projectContext.output` | `editor` | Where output goes: a new `editor` tab, the `clipboard`, or a `file` |
| `projectContext.stripComments` | `false` | Strip comments from supported source files |
| `projectContext.removeBlankLines` | `false` | Drop blank/whitespace-only lines from generated content |
| `projectContext.respectGitignore` | `true` | Hide files/folders matched by the workspace `.gitignore` |
| `projectContext.includeEnvFiles` | `false` | Include `.env` content (off by default to protect secrets) |
| `projectContext.maxChars` | `0` | Warn in the footer when the output exceeds this many characters (0 = off) |
| `projectContext.skeletonExcludeFolders` | `node_modules, .git, bin, obj, .vs` | Folders omitted from Copy Skeleton (edit via the gear button) |
| `projectContext.copyAsTxt` | `false` | Append `.txt` to files in *Copy Files to Folder* (for Microsoft 365 Copilot) |

Most actions also have a one-click button in the panel's title bar (some under the
`…` overflow menu); the footer shows which transforms are currently active.

## Privacy

Context Picker runs entirely locally. It reads the files you select and produces
text in your editor, clipboard, or a folder you choose. It does not send anything
anywhere.

## License

MIT
