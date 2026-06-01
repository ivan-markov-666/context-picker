import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectTreeProvider, FsNode } from './ProjectTreeProvider';
import { SelectionModel } from './SelectionModel';
import { collectSelectedFiles } from './collect';

export function activate(context: vscode.ExtensionContext): void {
  const selection = new SelectionModel(context);
  const provider = new ProjectTreeProvider(selection);

  const treeView = vscode.window.createTreeView<FsNode>('projectContext.tree', {
    treeDataProvider: provider,
    manageCheckboxStateManually: true,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  function updateMessage(): void {
    const { includes, excludes } = selection.stats();
    treeView.message =
      includes || excludes
        ? `Selection: ${includes} included / ${excludes} excluded path(s). Run "Generate Contents".`
        : 'Tick files and folders to include them, then run "Generate Contents".';
  }
  updateMessage();

  // Re-render on the next tick: VS Code needs to finish applying the user's
  // checkbox change before we recompute ancestor "partial" badges. Refreshing
  // synchronously inside the event handler can be coalesced away, leaving parent
  // folders without their badge.
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  function scheduleRefresh(): void {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(() => {
      refreshTimer = undefined;
      provider.refresh();
      updateMessage();
    }, 0);
  }

  // React to the user (un)checking a node: update the model, then refresh so
  // descendants and ancestor badges recompute.
  treeView.onDidChangeCheckboxState(
    (event) => {
      for (const [node, state] of event.items) {
        if (state === vscode.TreeItemCheckboxState.Checked) {
          selection.include(node.fsPath);
        } else {
          selection.exclude(node.fsPath);
        }
      }
      scheduleRefresh();
    },
    undefined,
    context.subscriptions
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projectContext.refresh', () => provider.refresh()),

    vscode.commands.registerCommand('projectContext.clear', () => {
      selection.clear();
      provider.refresh();
      updateMessage();
    }),

    vscode.commands.registerCommand('projectContext.generate', () => generate(selection)),

    vscode.commands.registerCommand(
      'projectContext.addFromExplorer',
      (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
        const targets = uris && uris.length ? uris : uri ? [uri] : [];
        for (const target of targets) {
          selection.include(target.fsPath);
        }
        provider.refresh();
        updateMessage();
      }
    )
  );
}

export function deactivate(): void {
  // Nothing to clean up; subscriptions are disposed by VS Code.
}

/**
 * M1 spike: collect the selected files and open their relative paths in a new
 * editor tab. M2 will replace the body with the formatted file contents from
 * the directory-scanner core (`scanSelectionToString`).
 */
async function generate(selection: SelectionModel): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage('Project Context: open a folder first.');
    return;
  }

  const files: string[] = [];
  for (const folder of folders) {
    await collectSelectedFiles(folder.uri.fsPath, selection, files);
  }

  if (files.length === 0) {
    vscode.window.showInformationMessage('Project Context: no files selected yet.');
    return;
  }

  const relativeOf = (file: string): string => {
    const folder = folders.find((f) => file.startsWith(f.uri.fsPath));
    const base = folder ? folder.uri.fsPath : '';
    return path.relative(base, file).replace(/\\/g, '/');
  };

  const header =
    `# Project Context\n` +
    `# ${files.length} file(s) selected\n` +
    `# (M1 spike: file paths only — contents come in M2)\n\n`;
  const body = files.map(relativeOf).sort().join('\n');

  const doc = await vscode.workspace.openTextDocument({
    content: header + body + '\n',
    language: 'markdown',
  });
  await vscode.window.showTextDocument(doc, { preview: false });
  vscode.window.showInformationMessage(`Project Context: ${files.length} file(s) selected.`);
}
