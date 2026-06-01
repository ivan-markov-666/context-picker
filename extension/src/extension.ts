import * as vscode from 'vscode';
import { ProjectTreeProvider, FsNode } from './ProjectTreeProvider';
import { SelectionModel } from './SelectionModel';
import { collectSelectedFiles } from './collect';
// Reuse the directory-scanner core for the actual scanning/skeleton logic.
import { scanSelectionToString } from '../../src/scanner';
import { buildTree, renderTree, resolveRootName } from '../../src/tree';
import { DEFAULT_IGNORE } from '../../src/blacklist';

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

    vscode.commands.registerCommand('projectContext.copySkeleton', () => copySkeleton()),

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

type OutputSink = 'editor' | 'clipboard' | 'file';

/** Sends the generated text to the configured destination. */
async function deliver(text: string): Promise<void> {
  const sink = vscode.workspace
    .getConfiguration('projectContext')
    .get<OutputSink>('output', 'editor');

  if (sink === 'clipboard') {
    await vscode.env.clipboard.writeText(text);
    vscode.window.showInformationMessage('Project Context: copied to clipboard.');
    return;
  }

  if (sink === 'file') {
    const uri = await vscode.window.showSaveDialog({
      saveLabel: 'Save context',
      filters: { Text: ['txt', 'md'] },
    });
    if (!uri) {
      return;
    }
    await vscode.workspace.fs.writeFile(uri, Buffer.from(text, 'utf8'));
    vscode.window.showInformationMessage(`Project Context: saved to ${uri.fsPath}.`);
    return;
  }

  // Default: open in a new editor tab for review.
  const doc = await vscode.workspace.openTextDocument({ content: text, language: 'markdown' });
  await vscode.window.showTextDocument(doc, { preview: false });
}

/**
 * Collects the selected files and outputs their formatted contents via the
 * directory-scanner core (same format as the CLI scanner).
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

  const cfg = vscode.workspace.getConfiguration('projectContext');
  const rootDir = folders[0].uri.fsPath;

  const text = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Project Context: generating…' },
    () =>
      scanSelectionToString({
        rootDir,
        includedFiles: files,
        includeEnvFiles: cfg.get<boolean>('includeEnvFiles', false),
        stripComments: cfg.get<boolean>('stripComments', false),
      })
  );

  await deliver(text);
  vscode.window.showInformationMessage(`Project Context: generated ${files.length} file(s).`);
}

/**
 * Renders the project skeleton (tree) of the first workspace folder, with the
 * folder name as the root, ignoring node_modules/.git.
 */
async function copySkeleton(): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage('Project Context: open a folder first.');
    return;
  }

  const folder = folders[0];
  const children = await buildTree(folder.uri.fsPath, folder.uri.fsPath, {
    blacklist: [...DEFAULT_IGNORE],
  });
  const tree = {
    name: resolveRootName(folder.uri.fsPath),
    isDirectory: true,
    children,
  };

  await deliver(renderTree(tree));
}
