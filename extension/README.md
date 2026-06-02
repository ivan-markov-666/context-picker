# Context Picker

**Pick files and folders with checkboxes, then copy their code — or a project skeleton — ready to paste into an LLM.**

Context Picker adds a sidebar panel with a checkbox tree of your workspace. Tick
what matters, and generate a single, well-formatted block of file contents (or
just the directory tree) to paste into any AI assistant or large language model.

## Features

- **Checkbox tree** of your project — tick a folder to include everything under
  it recursively; untick a file to exclude it. Partially-selected folders are
  marked so you always know what's in.
- **Generate Contents** — outputs the path + content of every selected file in
  one block, opened in a new editor tab (or copied to the clipboard / saved to a
  file).
- **Copy Project Skeleton** — outputs just the directory tree, with your project
  name as the root.
- **Optional comment stripping** — one-click toggle to remove comments from
  supported languages, so the paste is smaller and focused on code.
- **Skip secrets** — `.env` file contents are excluded by default.
- **A footer** shows how many files are selected and the approximate size, so you
  know how big the paste will be before you generate.
- **Progress + Cancel** — a progress bar with a percentage and a cancel button
  for large selections.
- **Explorer quick actions** — right-click any file or folder to *Copy Contents
  (with subfolders)* or *Copy Skeleton From Here* without opening the panel.
- Your selection is **remembered** between sessions.

`node_modules` and `.git` are ignored automatically.

## How to use

1. Click the **Context Picker** icon in the Activity Bar.
2. Tick the files and folders you want.
3. Click **Generate Contents** in the panel's title bar.
4. Paste the result into your LLM of choice.

Prefer a quick one-off? Right-click a file or folder in the Explorer and choose
**Copy Contents (with subfolders)**.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `projectContext.output` | `editor` | Where output goes: a new `editor` tab, the `clipboard`, or a `file` |
| `projectContext.stripComments` | `false` | Strip comments from supported source files |
| `projectContext.includeEnvFiles` | `false` | Include `.env` content (off by default to protect secrets) |

Comment stripping also has a one-click toggle in the panel's title bar; the
footer shows whether comments are currently stripped or kept.

## Privacy

Context Picker runs entirely locally. It reads the files you select and produces
text in your editor, clipboard, or a file you choose. It does not send anything
anywhere.

## License

MIT
