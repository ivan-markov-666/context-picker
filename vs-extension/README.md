# Context Picker — Visual Studio 2022 extension (work in progress)

A native **Visual Studio 2022** (full IDE, not VS Code) version of Context Picker.
Because Visual Studio extensions are C#/.NET (not TypeScript), this is a separate
project. The heavy scanning logic is **reused** from the existing
`directory-scanner` core (including `comment-bear`) through a small **Node bridge**,
so we don't reimplement comment stripping in C#.

## Architecture (thin C#, logic reused via Node)

```
┌─────────────────────────── Visual Studio (C#) ───────────────────────────┐
│  Tool window (WPF)                                                         │
│   • checkbox tree of the workspace        → built from the bridge's JSON   │
│   • toggles: strip comments / blank lines / .gitignore                     │
│   • buttons: Generate Contents, Copy Skeleton                              │
│                                                                            │
│  NodeBridge.cs  ──spawns──►  node scan-selection.js  (stdin JSON / stdout) │
└────────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
        directory-scanner core (TypeScript, bundled): scanSelectionToString,
        buildTree/renderTree, .gitignore, comment-bear, blank-line removal
```

The goal is to keep **C# thin** (UI + process calls) and do the real work in the
already-tested JS core. The Node bridge is a single self-contained file
(`dist-cli/scan-selection.js`, built with `npm run bundle:cli`, ~142 KB,
comment-bear inlined). It requires **Node.js on PATH** on the user's machine.

## Status

- ✅ **Bridge spike (done & verified):** `src/NodeBridge.cs` calls the bundled
  `scan-selection.js`; the console harness in `bridge-test/` proves a C# process
  can produce the formatted scan (with comment stripping + blank-line removal).
  This is the equivalent of the VS Code "M1 spike".
- ⏳ **Next — extend the bridge to multiple modes** (in the npm project):
  - `mode: "scan"` — files → formatted contents (done).
  - `mode: "tree"` — root + respectGitignore → JSON listing for the checkbox tree.
  - `mode: "skeleton"` — root + respectGitignore → the project skeleton string.
  Putting tree/gitignore/skeleton in Node keeps C# thin and reuses tested code.
- ⏳ **Then — the VSIX itself:** AsyncPackage + a `ToolWindowPane` hosting a WPF
  `UserControl` with the checkbox tree, toolbar buttons and the toggles.

## How to verify the bridge now

```bash
# 1. Build the self-contained bridge bundle (from the repo root):
npm install
npm run bundle:cli            # -> dist-cli/scan-selection.js

# 2. Run the C# harness (needs the .NET SDK + Node on PATH):
dotnet run --project vs-extension/bridge-test -- \
  "<repo>/dist-cli/scan-selection.js" "<repo>" "<repo>/src/file-utils.ts"
```
It prints the selected file's contents with comments and blank lines removed.

## Building the VSIX (planned approach)

To avoid hand-authoring a fragile `.csproj`/`.vsixmanifest` for a specific VS
version, the recommended path is:

1. In Visual Studio 2022, install the **"Visual Studio extension development"**
   workload (includes the VSSDK).
2. **File → New → Project → "VSIX Project w/ Tool Window (Community)"** (or the
   built-in VSIX + Tool Window template). This generates a correct project for
   your exact VS version.
3. Drop in `src/NodeBridge.cs` and the WPF control + view models (added next),
   and wire the tool window to host the control.
4. Add a build step that copies `dist-cli/scan-selection.js` into the VSIX
   content (so it ships with the extension).
5. **F5** launches the VS Experimental Instance with the extension loaded.

## Layout

```
vs-extension/
├── src/NodeBridge.cs          # C# → Node bridge (shared by harness + VSIX)
├── bridge-test/               # .NET console harness that verifies the bridge
│   ├── Program.cs
│   └── ContextPicker.BridgeTest.csproj
└── README.md                  # this file
```
