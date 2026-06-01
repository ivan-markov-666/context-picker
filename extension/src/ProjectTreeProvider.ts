import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SelectionModel } from './SelectionModel';
// Reuse the core's blacklist logic so the extension and the CLI stay consistent.
import { isBlacklisted, DEFAULT_IGNORE } from '../../src/blacklist';

/** A node in the workspace tree. */
export interface FsNode {
  uri: vscode.Uri;
  fsPath: string;
  name: string;
  isDirectory: boolean;
}

export class ProjectTreeProvider implements vscode.TreeDataProvider<FsNode> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<FsNode | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly selection: SelectionModel) {}

  refresh(node?: FsNode): void {
    this._onDidChangeTreeData.fire(node);
  }

  getTreeItem(node: FsNode): vscode.TreeItem {
    const item = new vscode.TreeItem(
      node.name,
      node.isDirectory
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );
    item.id = node.fsPath;
    item.resourceUri = node.uri; // gives native file icons
    item.contextValue = node.isDirectory ? 'folder' : 'file';

    const selected = this.selection.isSelected(node.fsPath);

    if (node.isDirectory) {
      const partial = this.selection.isPartial(node.fsPath);
      // VS Code checkboxes are two-state; show partial folders as unchecked + a badge.
      item.checkboxState =
        selected && !partial
          ? vscode.TreeItemCheckboxState.Checked
          : vscode.TreeItemCheckboxState.Unchecked;
      if (partial) {
        item.description = '◍ partial';
      }
    } else {
      item.checkboxState = selected
        ? vscode.TreeItemCheckboxState.Checked
        : vscode.TreeItemCheckboxState.Unchecked;
    }

    return item;
  }

  async getChildren(element?: FsNode): Promise<FsNode[]> {
    if (!element) {
      const folders = vscode.workspace.workspaceFolders ?? [];
      return folders.map((f) => ({
        uri: f.uri,
        fsPath: f.uri.fsPath,
        name: f.name,
        isDirectory: true,
      }));
    }

    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(element.fsPath, { withFileTypes: true });
    } catch {
      return [];
    }

    const nodes: FsNode[] = [];
    for (const entry of entries) {
      // M1 uses the built-in default ignore (node_modules/.git); the full
      // blacklist.txt integration comes in a later milestone.
      if (isBlacklisted(entry.name, DEFAULT_IGNORE)) {
        continue;
      }
      const full = path.join(element.fsPath, entry.name);
      const isDirectory = entry.isDirectory() && !entry.isSymbolicLink();
      nodes.push({
        uri: vscode.Uri.file(full),
        fsPath: full,
        name: entry.name,
        isDirectory,
      });
    }

    nodes.sort((a, b) =>
      a.isDirectory === b.isDirectory
        ? a.name.localeCompare(b.name, undefined, { sensitivity: 'accent' })
        : a.isDirectory
          ? -1
          : 1
    );

    return nodes;
  }

  getParent(node: FsNode): FsNode | undefined {
    const folders = vscode.workspace.workspaceFolders ?? [];
    if (folders.some((f) => f.uri.fsPath === node.fsPath)) {
      return undefined;
    }
    const parent = path.dirname(node.fsPath);
    if (parent === node.fsPath) {
      return undefined;
    }
    return {
      uri: vscode.Uri.file(parent),
      fsPath: parent,
      name: path.basename(parent),
      isDirectory: true,
    };
  }
}
