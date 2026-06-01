import * as vscode from 'vscode';
import * as path from 'path';
import { ProjectTreeProvider, FsNode } from './ProjectTreeProvider';
import { SelectionModel } from './SelectionModel';
import { collectSelectedFiles, collectAllFiles, summarizeSelection } from './collect';
// Reuse the directory-scanner core for the actual scanning/skeleton logic.
// Import from the CLI-free core modules so the bundle never pulls in the
// `scanner.ts`/`tree.ts` CLI entry points (shebang / `require.main` guard).
import { scanSelectionToString } from '../../src/scan-core';
import { buildTree, renderTree, resolveRootName } from '../../src/tree-core';
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

  // Footer with the selected file count and approximate size. The walk is async,
  // so it is debounced and runs after the (snappy) tree refresh.
  let countTimer: ReturnType<typeof setTimeout> | undefined;
  async function updateCount(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      treeView.message = 'Open a folder to begin.';
      return;
    }
    const summary = { files: 0, bytes: 0 };
    for (const folder of folders) {
      await summarizeSelection(folder.uri.fsPath, selection, summary);
    }
    const strip = vscode.workspace
      .getConfiguration('projectContext')
      .get<boolean>('stripComments', false);
    const commentsNote = strip ? 'comments: stripped' : 'comments: kept';
    treeView.message =
      summary.files > 0
        ? `${summary.files} file(s) selected · ~${formatBytes(summary.bytes)} · ${commentsNote}. Run "Generate Contents".`
        : `Tick files and folders to include them · ${commentsNote}.`;
  }
  function scheduleCount(): void {
    if (countTimer) {
      clearTimeout(countTimer);
    }
    countTimer = setTimeout(() => {
      countTimer = undefined;
      void updateCount();
    }, 350);
  }
  void updateCount();

  // Re-render the tree on the next tick: VS Code needs to finish applying the
  // user's checkbox change before we recompute ancestor "partial" badges.
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  function scheduleRefresh(): void {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(() => {
      refreshTimer = undefined;
      provider.refresh();
    }, 0);
  }

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
      scheduleCount();
    },
    undefined,
    context.subscriptions
  );

  // Keep the footer in sync if the strip-comments setting changes (e.g. via the
  // Settings UI or the toggle button).
  vscode.workspace.onDidChangeConfiguration(
    (event) => {
      if (event.affectsConfiguration('projectContext.stripComments')) {
        void updateCount();
      }
    },
    undefined,
    context.subscriptions
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projectContext.refresh', () => {
      provider.refresh();
      void updateCount();
    }),

    vscode.commands.registerCommand('projectContext.enableStripComments', async () => {
      await setStripComments(true);
      void updateCount();
    }),

    vscode.commands.registerCommand('projectContext.disableStripComments', async () => {
      await setStripComments(false);
      void updateCount();
    }),

    vscode.commands.registerCommand('projectContext.clear', () => {
      selection.clear();
      provider.refresh();
      void updateCount();
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
        scheduleCount();
      }
    ),

    vscode.commands.registerCommand('projectContext.copyContentsHere', (uri?: vscode.Uri) =>
      copyContentsHere(uri)
    ),

    vscode.commands.registerCommand('projectContext.skeletonHere', (uri?: vscode.Uri) =>
      skeletonHere(uri)
    )
  );
}

export function deactivate(): void {
  // Nothing to clean up; subscriptions are disposed by VS Code.
}

/** Persists the strip-comments setting (workspace scope when a folder is open). */
async function setStripComments(value: boolean): Promise<void> {
  const target = vscode.workspace.workspaceFolders?.length
    ? vscode.ConfigurationTarget.Workspace
    : vscode.ConfigurationTarget.Global;
  await vscode.workspace.getConfiguration('projectContext').update('stripComments', value, target);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

function readScanConfig(): { includeEnvFiles: boolean; stripComments: boolean } {
  const cfg = vscode.workspace.getConfiguration('projectContext');
  return {
    includeEnvFiles: cfg.get<boolean>('includeEnvFiles', false),
    stripComments: cfg.get<boolean>('stripComments', false),
  };
}

async function scanFilesToOutput(rootDir: string, files: string[]): Promise<void> {
  const { includeEnvFiles, stripComments } = readScanConfig();
  const text = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Project Context: generating' },
    (progress) => {
      let lastPct = 0;
      return scanSelectionToString({
        rootDir,
        includedFiles: files,
        includeEnvFiles,
        stripComments,
        onProgress: (done, total) => {
          const pct = Math.floor((done / total) * 100);
          progress.report({ increment: pct - lastPct, message: `${done}/${total} files (${pct}%)` });
          lastPct = pct;
        },
      });
    }
  );
  await deliver(text);
  vscode.window.showInformationMessage(`Project Context: generated ${files.length} file(s).`);
}

/** Collects the checkbox selection and outputs the formatted file contents. */
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

  await scanFilesToOutput(folders[0].uri.fsPath, files);
}

/** Renders the project skeleton of the first workspace folder. */
async function copySkeleton(): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage('Project Context: open a folder first.');
    return;
  }
  await deliverSkeleton(folders[0].uri.fsPath);
}

/** Explorer quick action: output the contents of the clicked file/folder. */
async function copyContentsHere(uri?: vscode.Uri): Promise<void> {
  if (!uri) {
    vscode.window.showWarningMessage('Project Context: right-click a file or folder in the Explorer.');
    return;
  }
  const files: string[] = [];
  await collectAllFiles(uri.fsPath, files);
  if (files.length === 0) {
    vscode.window.showInformationMessage('Project Context: no files found here.');
    return;
  }
  const wsFolder = vscode.workspace.getWorkspaceFolder(uri);
  const rootDir = wsFolder ? wsFolder.uri.fsPath : path.dirname(uri.fsPath);
  await scanFilesToOutput(rootDir, files);
}

/** Explorer quick action: output the skeleton rooted at the clicked folder. */
async function skeletonHere(uri?: vscode.Uri): Promise<void> {
  if (!uri) {
    vscode.window.showWarningMessage('Project Context: right-click a folder in the Explorer.');
    return;
  }
  await deliverSkeleton(uri.fsPath);
}

async function deliverSkeleton(dir: string): Promise<void> {
  const children = await buildTree(dir, dir, { blacklist: [...DEFAULT_IGNORE] });
  const tree = { name: resolveRootName(dir), isDirectory: true, children };
  await deliver(renderTree(tree));
}
