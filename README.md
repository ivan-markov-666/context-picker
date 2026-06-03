# Project Directory and File Content Scanner

A small TypeScript toolkit that helps you turn a project into LLM-friendly context. It offers:

1. **`scanner`** (CLI) — recursively collects the paths **and contents** of all files into a single text file (with optional comment stripping and `.env` handling).
2. **`tree`** (CLI) — prints **only** the directory tree of a project, with the root labelled by the project name.
3. **Context Picker editor extensions** — pick files/folders visually with checkboxes inside **VS Code** or **Visual Studio**, then copy their contents (or a project skeleton). See [Editor extensions](#editor-extensions).

The final output can easily be pasted into any LLM to assist with faster code development.

> **Note**
> - This is a Node.js project. You need Node.js installed (Node 20+ recommended).
> - After cloning, run `npm install` to install dependencies.
> - Both commands can process **any** project, not only Node.js ones.

---

## Quick start

```bash
npm install

# Dump every file's path + content into output.txt
npm run scanner -- --dir "C:\projects\my-project" --output "output.txt"

# Print just the directory tree of the current project
npm run tree

# Run the test suite
npm test
```

---

## 1. `scanner` — collect paths and file contents

```bash
npm run scanner -- --dir "C:\projects\my-project" --blacklist "blacklist.txt" --output "output.txt" --env --strip-comments
```

### Options

| Option | Alias | Description | Default |
| --- | --- | --- | --- |
| `--dir` | `-d` | Path to the project to scan | current directory |
| `--blacklist` | `-b` | Path to a blacklist file (paths/files to skip) | `<dir>/blacklist.txt` |
| `--output` | `-o` | Path to the output file | `<dir>/project_files.txt` |
| `--env` | `-e` | Include the content of `.env` files | disabled |
| `--strip-comments` | `-s` | Strip comments from source files | disabled |
| `--help` | `-h` | Show help | — |

Environment variable `DEBUG=1` enables additional debug output.

> The output file is **automatically excluded** from the scan, so it never scans its own (growing) output.

### Examples

```bash
# Standard scan (no .env contents)
npm run scanner -- --dir "C:\projects\my-project" --output "output.txt"

# Include .env files
npm run scanner -- --dir "C:\projects\my-project" --output "output.txt" --env

# Strip comments
npm run scanner -- --dir "C:\projects\my-project" --output "output.txt" --strip-comments

# Both
npm run scanner -- --dir "C:\projects\my-project" --output "output.txt" --env --strip-comments
```

### `.env` file handling

By default the scanner **skips** `.env` file contents to protect secrets (keys, passwords, tokens). With `--env`, they are included with clear markers:

```
### .env file content ###
API_KEY=your_secret_key
DATABASE_URL=your_database_connection_string
### End of .env file ###
```

### Comment stripping

By default all comments are kept. With `--strip-comments`, comments are removed from supported file types before writing. Powered by [comment-bear](https://www.npmjs.com/package/comment-bear), which supports JavaScript, TypeScript, Python, Ruby, Java, C#, C, C++, HTML, CSS, SQL, YAML, JSON, XML, PHP, Go, Rust, and Swift. Unsupported file types are passed through unchanged.

### How different files are handled

The scanner always writes the **path** of every (non-blacklisted) entry, then writes its content according to type:

| Entry type | What is written |
| --- | --- |
| Text file | The file content (optionally comment-stripped) |
| Binary / non-text file | `[Binary or non-text content not shown]` |
| `.env` file | Skipped by default, or wrapped in markers with `--env` |
| Symbolic link | `[Symbolic link - not followed]` (links are never followed, avoiding cycles) |
| Special file (socket, FIFO, device) | `[Special file - content not shown]` |
| Unreadable file | `[Error reading file: <reason>]` (the scan keeps going) |

Unknown CLI options produce a warning and are ignored, rather than failing silently.

---

## 2. `tree` — print only the project tree

Prints a `tree`-style view of the project. The **root node is labelled with the project name** (the target folder's own name), and `node_modules` / `.git` are ignored by default.

```bash
npm run tree
```

Example output:

```
my-project
├── src/
│   ├── scanner.ts
│   └── tree.ts
├── package.json
└── README.md
```

### Options

| Option | Alias | Description | Default |
| --- | --- | --- | --- |
| `--dir` | `-d` | Target directory | current directory |
| `--blacklist` | `-b` | Path to a blacklist file | `<dir>/blacklist.txt` |
| `--output` | `-o` | Write the tree to a file instead of stdout | stdout |
| `--depth` | `-L` | Maximum depth to display | unlimited |
| `--name` | `-n` | Override the root label | the project folder name |
| `--all` | `-a` | Include `node_modules` / `.git` | disabled |
| `--help` | `-h` | Show help | — |

Only the tree is written to **stdout** (informational logs go to stderr), so it is safe to redirect:

```bash
npm run tree -- --dir "C:\projects\my-project" > tree.txt
# or
npm run tree -- --dir "C:\projects\my-project" --output tree.txt
```

---

## Editor extensions

Both editors get the same **Context Picker** UI: a checkbox tree of your project where
you tick files/folders, then copy their **contents** or a **project skeleton** — with
toggles for *strip comments*, *remove blank lines* and *respect `.gitignore`*. Both
extensions reuse the same TypeScript core, so the output matches the CLI.

| Editor | Source folder | Reuses the core via |
| --- | --- | --- |
| VS Code | [`vscode-extension/`](vscode-extension/) | direct import (the extension runs in Node) |
| Visual Studio | [`vs-extension/ContextPicker/`](vs-extension/) | a small Node bridge (`node scan-selection.js`) |

### VS Code extension

**Generate the installer (`.vsix`):**

```bash
cd vscode-extension
npm install
npm run package      # -> context-picker-<version>.vsix  (e.g. context-picker-0.2.0.vsix)
```

`npm run package` runs `vsce package`, which first bundles the extension (esbuild) and
then writes the `.vsix`. (`@vscode/vsce` is already a dev dependency; no global install
needed.)

**Import (install) into VS Code** — either way:

- **From the UI:** open the **Extensions** view (`Ctrl+Shift+X`) → click the `…` menu
  (top-right of the view) → **Install from VSIX…** → choose the `.vsix` → reload.
- **From the terminal:** `code --install-extension context-picker-0.2.0.vsix`

After installing, the **Context Picker** icon appears in the **Activity Bar** (left). Open
a folder, tick files in the tree, then run **Generate Contents** or **Copy Project
Skeleton** (also available via right-click in the Explorer → **Add to Context Picker**).

### Visual Studio extension

> **To build:** the **"Visual Studio extension development"** workload (VSSDK).
> **To run (any machine):** **Node.js on PATH** — the extension shells out to `node` to
> run the shared core. Check with `node --version`.

**Generate the installer (`.vsix`):**

1. Open `vs-extension/ContextPicker/ContextPicker.csproj` (or its `.slnx`) in Visual Studio.
2. **Build → Build Solution** (`Ctrl+Shift+B`).
3. The installer is produced at
   `vs-extension/ContextPicker/bin/Debug/net472/ContextPicker.vsix`.

> If you changed the TypeScript core, first refresh the bundled bridge: from the repo
> root run `npm run bundle:cli`, then copy `dist-cli/scan-selection.js` over
> `vs-extension/ContextPicker/node-bridge/scan-selection.js` and rebuild.

**Import (install) into Visual Studio:**

1. **Close all Visual Studio windows.**
2. **Double-click** `ContextPicker.vsix` → the VSIX Installer opens → **Install** → **Close**.
3. Reopen Visual Studio → open a **solution** → **Tools → ContextPickerToolWindow**.
4. **Refresh** → tick files → **Generate** (opens the result in an editor) or **Copy Skeleton**.

The `.vsix` is **self-contained** (the Node bridge is bundled inside), so you can copy it
to another PC and double-click to install — no source or repo needed there. The target
needs **Visual Studio 17.14+** (Community, Pro or Enterprise) and **Node.js**.

---

## The blacklist file

A `blacklist.txt` lists paths to skip, one per line. Lines starting with `#` are comments.

```
# Directories skipped recursively (matched at any depth)
node_modules
.git
dist

# Specific files skipped by name
package-lock.json
yarn.lock
```

Matching rules:
- An entry **without an extension** (e.g. `node_modules`, `dist`) or ending in `/` is treated as a **directory** and is skipped wherever it appears in the tree.
- An entry **with an extension** (e.g. `package-lock.json`) is treated as a **file name** and is skipped wherever a file with that name appears.

---

## Programmatic API

Everything is exported from the package, so you can use it from your own code instead of the CLI:

```ts
import {
  runScan,
  buildProjectTree,
  renderTree,
  isBlacklisted,
} from 'directory-scanner';

// Scan to a file
await runScan({
  targetDir: '/path/to/project',
  blacklistPath: '/path/to/project/blacklist.txt',
  outputPath: 'output.txt',
  includeEnvFiles: false,
  stripComments: true,
  help: false,
});

// Build a tree and render it
const root = await buildProjectTree({
  targetDir: '/path/to/project',
  blacklistPath: '/path/to/project/blacklist.txt',
  outputPath: '',
  maxDepth: Infinity,
  includeAll: false,
  help: false,
});
console.log(renderTree(root));
```

---

## Development

| Script | Purpose |
| --- | --- |
| `npm run scanner` / `npm run scan` | Run the scanner via ts-node |
| `npm run tree` | Run the tree command via ts-node |
| `npm test` | Run the test suite (Node's built-in test runner) |
| `npm run test:coverage` | Run tests with coverage |
| `npm run typecheck` | Type-check without emitting |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled scanner |

After `npm run build`, the package also exposes two binaries: `directory-scanner` and `directory-tree` (e.g. `npx directory-tree`).

---

## Testing

Tests use Node's built-in test runner (`node:test`) with `ts-node` — no extra test framework is required.

```bash
npm test                # run all tests
npm run test:coverage   # run tests and print a coverage report
npm run typecheck       # type-check the source without emitting
```

Test files live in `test/` (one `*.test.ts` per module) and cover blacklist matching, file-type detection, comment stripping, tree building/rendering, an end-to-end scan, and the CLI entry points.

---

## What's new in 2.1.0

- **New `tree` command** — prints only the project tree, with the root labelled by the project name.
- **Programmatic API** — all functions are exported (`runScan`, `buildProjectTree`, `renderTree`, …) with TypeScript types; the package also ships two CLI binaries.
- **Full test suite** — 60+ tests on Node's built-in runner.
- **Bug fixes & hardening:**
  - The scanner no longer scans its own (growing) output file.
  - Output-stream errors (e.g. an unwritable path) are handled instead of crashing or hanging.
  - Large scans no longer buffer the whole output in memory (write backpressure is respected).
  - Symbolic links are no longer followed (no cycles / `EISDIR` noise).
  - Unknown CLI options now warn instead of being silently ignored.
- `dist/` is now build output (git-ignored) and is produced on publish.
