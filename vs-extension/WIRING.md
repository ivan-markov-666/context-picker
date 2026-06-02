# Building the Context Picker VSIX in Visual Studio 2026

The reusable logic is done (Node bridge + `NodeBridge.cs`) and the WPF UI is in
`vsix/`. These steps create a correct VSIX project from the official template
(so the fragile `.csproj` / manifest / package GUIDs are generated for your exact
VS version) and drop in our files.

> Prereq: the **"Visual Studio extension development"** workload (VSSDK) must be
> installed. If the templates below don't appear, run the Visual Studio Installer
> → Modify → Workloads → check it.

## 1. Create the project + tool window

1. **File → New → Project** → search **"VSIX"** → **"VSIX Project"** (C#).
   - **Name it exactly `ContextPicker`** (so the C# namespaces match our files).
2. Right-click the project → **Add → New Item** → search **"Tool Window"** →
   **"Tool Window"**. Name it `ContextPickerToolWindow`.
   - This generates: a `ToolWindowPane`, a placeholder WPF control, and a command
     (under **View → Other Windows → ContextPickerToolWindow**) to open it.
3. Press **F5** once. A second VS ("Experimental Instance") launches; open the
   tool window from the menu to confirm the blank window shows. Then close it.
   (This proves the project builds before we add logic.)

## 2. Add our files

Add these existing files to the project (drag into Solution Explorer, or
**Add → Existing Item**):

- From `vs-extension/src/`: **`NodeBridge.cs`**
- From `vs-extension/vsix/`: **`FileNode.cs`, `RelayCommand.cs`,
  `ContextPickerViewModel.cs`, `BridgeLocator.cs`,
  `ContextPickerControl.xaml`** (+ its `ContextPickerControl.xaml.cs`).

You can delete the placeholder control the template generated
(`ContextPickerToolWindowControl.xaml` + `.cs`) — we host our own.

## 3. Host our control + wire the bridge

Open the generated **`ContextPickerToolWindow.cs`** (the `ToolWindowPane`) and
make its constructor host our control and start loading:

```csharp
public ContextPickerToolWindow() : base(null)
{
    this.Caption = "Context Picker";

    var control = new ContextPickerControl();
    this.Content = control;

    // Resolve the workspace root from the open solution (folder-mode support
    // can be added later).
    var dte = (EnvDTE.DTE)Microsoft.VisualStudio.Shell.Package.GetGlobalService(typeof(EnvDTE.DTE));
    string root = (dte != null && dte.Solution != null && !string.IsNullOrEmpty(dte.Solution.FullName))
        ? System.IO.Path.GetDirectoryName(dte.Solution.FullName)
        : null;

    var vm = new ContextPickerViewModel(BridgeLocator.NodeExe(), BridgeLocator.ScriptPath());
    control.SetViewModel(vm);
    _ = vm.InitializeAsync(root); // fire-and-forget; errors appear in the status line
}
```

(If `EnvDTE` isn't referenced, add a reference to **EnvDTE** — it ships with the
VSSDK.)

## 4. Ship the Node bridge script in the VSIX

The extension calls `node node-bridge/scan-selection.js`, so that file must ship
inside the VSIX next to the assembly.

1. From the repo root, build it: `npm install` then `npm run bundle:cli`
   → produces `dist-cli/scan-selection.js`.
2. In the VSIX project, create a folder **`node-bridge`** and **Add → Existing
   Item** the file `dist-cli/scan-selection.js` into it.
3. Select the added file → **Properties**:
   - **Copy to Output Directory** = *Copy if newer*
   - **Include in VSIX** = *True*  (and *Build Action* = *Content*)

This matches `BridgeLocator.ScriptPath()` (`<assemblyDir>/node-bridge/scan-selection.js`).

## 5. Run

- **F5** → Experimental Instance → open a **solution** → open the **Context
  Picker** tool window → tick files → **Generate** (copies to clipboard) or
  **Copy Skeleton**. Toggles: Strip comments / Remove blank lines / Respect
  .gitignore.
- Requires **Node.js on PATH** (the bridge runs `node`).

## Notes / v1 scope

- Output goes to the **clipboard** for v1; opening a new editor document (via DTE)
  is a later enhancement.
- Workspace root currently comes from the **open solution**; "Open Folder" mode
  support can be added with `IVsFolderWorkspaceService`.
- If you hit build errors, paste them back and we'll fix them together.
