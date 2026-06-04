import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import { ProjectTreeProvider, FsNode } from './ProjectTreeProvider';
import { SelectionModel } from './SelectionModel';
import { collectSelectedFiles, collectAllFiles } from './collect';
import { createGitignorePredicate, IgnorePredicate } from './gitignore';
// Reuse the directory-scanner core for the actual scanning/skeleton logic.
// Import from the CLI-free core modules so the bundle never pulls in the
// `scanner.ts`/`tree.ts` CLI entry points (shebang / `require.main` guard).
import { scanSelectionToString, copySelectionToDir } from '../../src/scan-core';
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
  // Sequence guard: each recount bumps this, so a slower run that finishes after
  // a newer change discards its (stale) result instead of overwriting the message.
  let countSeq = 0;
  async function updateCount(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      treeView.message = 'Open a folder to begin.';
      return;
    }
    const seq = ++countSeq;

    // Show only the transforms that are currently ACTIVE, to keep it compact.
    const cfg = vscode.workspace.getConfiguration('projectContext');
    const flags: string[] = [];
    if (cfg.get<boolean>('stripComments', false)) flags.push('no comments');
    if (cfg.get<boolean>('removeBlankLines', false)) flags.push('no blank lines');
    if (!cfg.get<boolean>('respectGitignore', true)) flags.push('incl. .gitignore');
    const tail = flags.length ? ` · ${flags.join(' · ')}` : '';

    const isIgnored = await buildIgnorePredicate();
    const files: string[] = [];
    for (const folder of folders) {
      await collectSelectedFiles(folder.uri.fsPath, selection, files, isIgnored);
    }
    if (seq !== countSeq) return; // superseded by a newer change

    if (files.length === 0) {
      treeView.message = `Tick files and folders to include them${tail}.`;
      return;
    }

    // Build the real output (respecting strip-comments / blank-lines) and measure
    // it, so the counter reflects exactly what "Generate Contents" would produce.
    treeView.message = `${files.length} file(s) · measuring…${tail}`;
    const { includeEnvFiles, stripComments, removeBlankLines } = readScanConfig();
    let text: string;
    try {
      text = await scanSelectionToString({
        rootDir: folders[0].uri.fsPath,
        includedFiles: files,
        includeEnvFiles,
        stripComments,
        removeBlankLines,
        isCancelled: () => seq !== countSeq,
      });
    } catch {
      return;
    }
    if (seq !== countSeq) return; // superseded

    const chars = text.length;
    const lines = chars === 0 ? 0 : text.split(/\r\n|\r|\n/).length;
    const maxChars = cfg.get<number>('maxChars', 0);
    const over = maxChars > 0 && chars > maxChars;
    const limit = maxChars > 0 ? ` / ${maxChars.toLocaleString()} max` : '';
    const prefix = over ? '⚠ OVER LIMIT — ' : '';
    treeView.message =
      `${prefix}${files.length} file(s) · ${lines.toLocaleString()} lines · ${chars.toLocaleString()} chars${limit}${tail}`;
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

  // React to our settings changing from the Settings UI or the toggle buttons.
  vscode.workspace.onDidChangeConfiguration(
    (event) => {
      // respectGitignore changes which entries are shown -> refresh the tree.
      if (event.affectsConfiguration('projectContext.respectGitignore')) {
        provider.refresh();
      }
      if (
        event.affectsConfiguration('projectContext.stripComments') ||
        event.affectsConfiguration('projectContext.removeBlankLines') ||
        event.affectsConfiguration('projectContext.respectGitignore') ||
        event.affectsConfiguration('projectContext.maxChars')
      ) {
        void updateCount();
      }
    },
    undefined,
    context.subscriptions
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('projectContext.refresh', () => {
      scheduleRefresh();
      scheduleCount();
    }),

    vscode.commands.registerCommand('projectContext.enableStripComments', () =>
      setBoolConfig('stripComments', true)
    ),
    vscode.commands.registerCommand('projectContext.disableStripComments', () =>
      setBoolConfig('stripComments', false)
    ),

    vscode.commands.registerCommand('projectContext.enableRemoveBlankLines', () =>
      setBoolConfig('removeBlankLines', true)
    ),
    vscode.commands.registerCommand('projectContext.disableRemoveBlankLines', () =>
      setBoolConfig('removeBlankLines', false)
    ),

    // "show .gitignored" stops respecting .gitignore; "respect" honours it again.
    vscode.commands.registerCommand('projectContext.showGitignored', () =>
      setBoolConfig('respectGitignore', false)
    ),
    vscode.commands.registerCommand('projectContext.respectGitignore', () =>
      setBoolConfig('respectGitignore', true)
    ),

    vscode.commands.registerCommand('projectContext.clear', () => {
      selection.clear();
      scheduleRefresh();
      scheduleCount();
    }),

    vscode.commands.registerCommand('projectContext.selectByPaths', async () => {
      await selectByPaths(selection);
      scheduleRefresh();
      scheduleCount();
    }),

    vscode.commands.registerCommand('projectContext.generate', () => generate(selection)),

    vscode.commands.registerCommand('projectContext.copyFilesToFolder', () =>
      copyFilesToFolder(selection)
    ),

    vscode.commands.registerCommand('projectContext.copySkeleton', () => copySkeleton()),

    vscode.commands.registerCommand('projectContext.configureSkeletonExcludes', () =>
      configureSkeletonExcludes()
    ),

    vscode.commands.registerCommand('projectContext.setMaxChars', () => setMaxChars()),

    vscode.commands.registerCommand(
      'projectContext.addFromExplorer',
      (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
        const targets = uris && uris.length ? uris : uri ? [uri] : [];
        for (const target of targets) {
          selection.include(target.fsPath);
        }
        scheduleRefresh();
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

/** Persists a boolean setting (workspace scope when a folder is open). */
async function setBoolConfig(key: string, value: boolean): Promise<void> {
  const target = vscode.workspace.workspaceFolders?.length
    ? vscode.ConfigurationTarget.Workspace
    : vscode.ConfigurationTarget.Global;
  await vscode.workspace.getConfiguration('projectContext').update(key, value, target);
}

/** Builds a .gitignore predicate for the current workspace, honouring the setting. */
async function buildIgnorePredicate(): Promise<IgnorePredicate> {
  const respect = vscode.workspace
    .getConfiguration('projectContext')
    .get<boolean>('respectGitignore', true);
  const roots = (vscode.workspace.workspaceFolders ?? []).map((f) => f.uri.fsPath);
  return createGitignorePredicate(roots, respect);
}

type OutputSink = 'editor' | 'clipboard' | 'file';

/** Sends the generated text to the configured destination. */
async function deliver(text: string): Promise<void> {
  const sink = vscode.workspace
    .getConfiguration('projectContext')
    .get<OutputSink>('output', 'editor');

  if (sink === 'clipboard') {
    await vscode.env.clipboard.writeText(text);
    vscode.window.showInformationMessage('Context Picker: copied to clipboard.');
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
    vscode.window.showInformationMessage(`Context Picker: saved to ${uri.fsPath}.`);
    return;
  }

  // Default: open in a new editor tab for review.
  const doc = await vscode.workspace.openTextDocument({ content: text, language: 'markdown' });
  await vscode.window.showTextDocument(doc, { preview: false });
}

function readScanConfig(): {
  includeEnvFiles: boolean;
  stripComments: boolean;
  removeBlankLines: boolean;
} {
  const cfg = vscode.workspace.getConfiguration('projectContext');
  return {
    includeEnvFiles: cfg.get<boolean>('includeEnvFiles', false),
    stripComments: cfg.get<boolean>('stripComments', false),
    removeBlankLines: cfg.get<boolean>('removeBlankLines', false),
  };
}

async function scanFilesToOutput(rootDir: string, files: string[]): Promise<void> {
  const { includeEnvFiles, stripComments, removeBlankLines } = readScanConfig();

  let cancelled = false;
  const text = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'Context Picker: generating',
      cancellable: true,
    },
    (progress, token) => {
      token.onCancellationRequested(() => {
        cancelled = true;
      });
      let lastPct = 0;
      return scanSelectionToString({
        rootDir,
        includedFiles: files,
        includeEnvFiles,
        stripComments,
        removeBlankLines,
        isCancelled: () => token.isCancellationRequested,
        onProgress: (done, total) => {
          const pct = Math.floor((done / total) * 100);
          progress.report({ increment: pct - lastPct, message: `${done}/${total} files (${pct}%)` });
          lastPct = pct;
        },
      });
    }
  );

  if (cancelled) {
    vscode.window.showInformationMessage('Context Picker: generation cancelled.');
    return;
  }

  await deliver(text);
  vscode.window.showInformationMessage(`Context Picker: generated ${files.length} file(s).`);
}

/** Collects the checkbox selection and outputs the formatted file contents. */
async function generate(selection: SelectionModel): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage('Context Picker: open a folder first.');
    return;
  }

  const isIgnored = await buildIgnorePredicate();
  const files: string[] = [];
  for (const folder of folders) {
    await collectSelectedFiles(folder.uri.fsPath, selection, files, isIgnored);
  }

  if (files.length === 0) {
    vscode.window.showInformationMessage('Context Picker: no files selected yet.');
    return;
  }

  await scanFilesToOutput(folders[0].uri.fsPath, files);
}

/**
 * Copies the selected files into a single folder (cleaned on each run) and opens
 * it, so they can be dragged straight into an LLM chat. When "Strip comments" /
 * "Remove blank lines" are on, text files are written transformed; binary and
 * .env files are always copied verbatim.
 */
async function copyFilesToFolder(selection: SelectionModel): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage('Context Picker: open a folder first.');
    return;
  }

  const isIgnored = await buildIgnorePredicate();
  const files: string[] = [];
  for (const folder of folders) {
    await collectSelectedFiles(folder.uri.fsPath, selection, files, isIgnored);
  }
  if (files.length === 0) {
    vscode.window.showInformationMessage('Context Picker: no files selected yet.');
    return;
  }

  const { stripComments, removeBlankLines } = readScanConfig();
  const appendTxtExtension = vscode.workspace
    .getConfiguration('projectContext')
    .get<boolean>('copyAsTxt', false);
  const dir = path.join(os.tmpdir(), 'context-picker-files');
  try {
    const written = await copySelectionToDir({
      targetDir: dir,
      includedFiles: files,
      stripComments,
      removeBlankLines,
      appendTxtExtension,
    });
    await vscode.env.openExternal(vscode.Uri.file(dir));
    const notes: string[] = [];
    if (stripComments || removeBlankLines) notes.push('transforms applied');
    if (appendTxtExtension) notes.push('.txt added');
    const note = notes.length ? ` (${notes.join(', ')})` : '';
    vscode.window.showInformationMessage(
      `Context Picker: copied ${written} file(s) to a folder${note} — drag them into your chat.`
    );
  } catch (err) {
    vscode.window.showErrorMessage(`Context Picker: could not copy files — ${String(err)}`);
  }
}

/**
 * Prompts for a list of file paths (e.g. pasted from an LLM) and ticks every
 * file whose path contains one of them. Matching is case-insensitive and by
 * substring, so partial paths or whole folders work too.
 */
async function selectByPaths(selection: SelectionModel): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage('Context Picker: open a folder first.');
    return;
  }

  const input = await vscode.window.showInputBox({
    title: 'Context Picker — select files by path',
    prompt: 'Paste file paths (separated by new lines, commas or spaces). Matching files get ticked.',
    placeHolder: 'tools/lib/jira-mapping.ts, src/tests/e2e/registrationTest.spec.ts',
    ignoreFocusOut: true,
  });
  if (!input) {
    return;
  }

  const terms = input
    .split(/[\s,;]+/)
    .map((t) => t.trim().replace(/\\/g, '/').toLowerCase())
    .filter((t) => t.length > 0);
  if (terms.length === 0) {
    return;
  }

  const isIgnored = await buildIgnorePredicate();
  const allFiles: string[] = [];
  for (const folder of folders) {
    await collectAllFiles(folder.uri.fsPath, allFiles, isIgnored);
  }

  let matched = 0;
  for (const file of allFiles) {
    const norm = file.replace(/\\/g, '/').toLowerCase();
    if (terms.some((t) => norm.includes(t))) {
      selection.include(file);
      matched++;
    }
  }

  if (matched === 0) {
    vscode.window.showInformationMessage('Context Picker: no files matched those paths.');
  } else {
    vscode.window.showInformationMessage(
      `Context Picker: ticked ${matched} matching file(s). Run "Generate Contents".`
    );
  }
}

/** Renders the project skeleton of the first workspace folder. */
async function copySkeleton(): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage('Context Picker: open a folder first.');
    return;
  }
  await deliverSkeleton(folders[0].uri.fsPath);
}

/** Explorer quick action: output the contents of the clicked file/folder. */
async function copyContentsHere(uri?: vscode.Uri): Promise<void> {
  if (!uri) {
    vscode.window.showWarningMessage('Context Picker: right-click a file or folder in the Explorer.');
    return;
  }
  const isIgnored = await buildIgnorePredicate();
  const files: string[] = [];
  await collectAllFiles(uri.fsPath, files, isIgnored);
  if (files.length === 0) {
    vscode.window.showInformationMessage('Context Picker: no files found here.');
    return;
  }
  const wsFolder = vscode.workspace.getWorkspaceFolder(uri);
  const rootDir = wsFolder ? wsFolder.uri.fsPath : path.dirname(uri.fsPath);
  await scanFilesToOutput(rootDir, files);
}

/** Explorer quick action: output the skeleton rooted at the clicked folder. */
async function skeletonHere(uri?: vscode.Uri): Promise<void> {
  if (!uri) {
    vscode.window.showWarningMessage('Context Picker: right-click a folder in the Explorer.');
    return;
  }
  await deliverSkeleton(uri.fsPath);
}

async function deliverSkeleton(dir: string): Promise<void> {
  const isIgnored = await buildIgnorePredicate();
  // The complete list of folder names to omit from the skeleton, editable via
  // the "Configure Skeleton Excludes" command. Matched at any depth.
  const excludes = vscode.workspace
    .getConfiguration('projectContext')
    .get<string[]>('skeletonExcludeFolders', [...DEFAULT_IGNORE]);
  const children = await buildTree(dir, dir, { blacklist: excludes, isIgnored });
  const tree = { name: resolveRootName(dir), isDirectory: true, children };
  await deliver(renderTree(tree));
}

/**
 * Lets the user tick which folders are omitted from Copy Skeleton. Candidates
 * are the defaults plus the actual top-level folders of the workspace; the
 * chosen set is saved to the projectContext.skeletonExcludeFolders setting
 * (workspace scope when a folder is open, so a team shares it).
 */
async function configureSkeletonExcludes(): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('projectContext');
  const current = cfg.get<string[]>('skeletonExcludeFolders', [...DEFAULT_IGNORE]);

  const candidates = new Set<string>([...DEFAULT_IGNORE, ...current]);
  for (const folder of vscode.workspace.workspaceFolders ?? []) {
    try {
      for (const [name, type] of await vscode.workspace.fs.readDirectory(folder.uri)) {
        if (type === vscode.FileType.Directory) {
          candidates.add(name);
        }
      }
    } catch {
      // Unreadable workspace root — ignore.
    }
  }

  const items: vscode.QuickPickItem[] = [...candidates]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ label: name, picked: current.includes(name) }));

  const picked = await vscode.window.showQuickPick(items, {
    canPickMany: true,
    title: 'Copy Skeleton — folders to exclude',
    placeHolder: 'Tick the folders to OMIT from the skeleton (Esc to cancel)',
  });
  if (!picked) {
    return; // cancelled
  }

  const selected = picked.map((p) => p.label);
  const target = vscode.workspace.workspaceFolders?.length
    ? vscode.ConfigurationTarget.Workspace
    : vscode.ConfigurationTarget.Global;
  await cfg.update('skeletonExcludeFolders', selected, target);
  vscode.window.showInformationMessage(
    `Context Picker: ${selected.length} folder name(s) will be omitted from the skeleton.`
  );
}

/** Prompts for the max-characters warning threshold (0 disables it). */
async function setMaxChars(): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('projectContext');
  const current = cfg.get<number>('maxChars', 0);
  const input = await vscode.window.showInputBox({
    title: 'Context Picker — max characters',
    prompt: 'Warn (in the footer) when the generated content exceeds this many characters. 0 = no warning.',
    value: String(current),
    validateInput: (v) => (/^\d+$/.test(v.trim()) ? undefined : 'Enter a whole number (0 to disable).'),
  });
  if (input === undefined) {
    return; // cancelled
  }
  const n = parseInt(input.trim(), 10) || 0;
  const target = vscode.workspace.workspaceFolders?.length
    ? vscode.ConfigurationTarget.Workspace
    : vscode.ConfigurationTarget.Global;
  await cfg.update('maxChars', n, target);
}
