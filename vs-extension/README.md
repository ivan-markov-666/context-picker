# Context Picker — Visual Studio extension

A native Visual Studio tool window that lets you tick files/folders in the open
solution and copy their contents (or a project skeleton) for pasting into an LLM.
It reuses the TypeScript core (comment stripping, blank-line removal, gitignore
handling) through a small **Node bridge** instead of re-implementing that logic
in C#.

## Layout

```
vs-extension/
  ContextPicker/            <- the actual VS extension project (open this)
    ContextPicker.csproj
    ContextPickerPackage.cs            (AsyncPackage)
    ContextPickerToolWindow.cs         (ToolWindowPane)
    ContextPickerToolWindowControl.xaml(.cs)   (the WPF UI)
    ContextPickerViewModel.cs          (MVVM logic)
    FileNode.cs / RelayCommand.cs      (tree node + ICommand)
    NodeBridge.cs                      (spawns `node`, talks JSON over stdin/stdout)
    BridgeLocator.cs                   (finds node + the bundled script)
    node-bridge/scan-selection.js      (the bundled TS core — see below)
  src/NodeBridge.cs         <- reference copy used by the bridge test harness
  bridge-test/              <- dotnet console harness that exercises the bridge
```

The `node-bridge/scan-selection.js` file is the bundled output of
`npm run bundle:cli` (from the repo root). It is committed so the project builds
on a fresh clone. **If you change the TypeScript core, re-run
`npm run bundle:cli` and copy `dist-cli/scan-selection.js` over this file.**

## Architecture (thin C#, logic reused via Node)

```
Visual Studio (C#)                          directory-scanner core (TypeScript)
  Tool window (WPF)                            scanSelectionToString
   • checkbox tree of the workspace            buildTree / renderTree
   • toggles: comments / blank lines / .gitignore   .gitignore filtering
   • buttons: Generate / Copy Skeleton         comment-bear, blank-line removal
        │                                              ▲
        └── NodeBridge.cs ──spawns──► node scan-selection.js (JSON via stdin/stdout)
```

The bridge has three modes: `scan` (files → contents), `tree` (root → flat
listing for the checkbox tree), `skeleton` (root → project skeleton). All the
real work runs in the already-tested JS core; C# stays thin (UI + process calls).

## Build & run (developer)

1. Install the **"Visual Studio extension development"** workload (VSSDK).
2. Open `ContextPicker/ContextPicker.csproj` (or its `.slnx`) in Visual Studio.
3. **F5** → launches an Experimental Instance of VS.
4. Open a solution there → **Tools → ContextPickerToolWindow** → **Refresh** →
   tick files → **Generate** (opens the result in an editor) or **Copy Skeleton**.

> Requires **Node.js on PATH** on the machine that runs the extension (the bridge
> shells out to `node`).

## Install / transfer to another machine

Building in **Release** produces a single self-contained `ContextPicker.vsix`
(it bundles `scan-selection.js`). To move the extension to another PC:

1. In VS, set the configuration dropdown to **Release** → **Build → Build Solution**.
2. Grab the `.vsix` from `ContextPicker/bin/Release/` (e.g. `ContextPicker.vsix`).
3. Copy it to the target machine and **double-click** it → the VSIX Installer
   installs it into VS. Restart VS.
4. Ensure **Node.js** is installed on that machine (`node --version`).

No source, no repo, no build tools needed on the target machine — just VS + Node.

## Verify the bridge standalone (optional)

```bash
npm install && npm run bundle:cli            # -> dist-cli/scan-selection.js
dotnet run --project vs-extension/bridge-test -- \
  "<repo>/dist-cli/scan-selection.js" "<repo>" "<repo>/src/file-utils.ts"
```

## Notes / scope

- Output opens in an editor document (and is best-effort copied to the clipboard).
- Workspace root comes from the **open solution**; "Open Folder" mode can be added
  later via `IVsFolderWorkspaceService`.
- WPF tool windows don't auto-theme, so foreground colors use `VsBrushes` and the
  tree selection brush is pinned so it stays readable when the window loses focus.
