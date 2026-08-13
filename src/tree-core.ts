import * as fs from 'fs';
import * as path from 'path';
import { isBlacklisted } from './blacklist';

/**
 * A node in the directory tree.
 */
export interface TreeNode {
  /** Display name (file or directory name). */
  name: string;
  /** Whether this node is a directory. */
  isDirectory: boolean;
  /** Child nodes (only for directories). */
  children: TreeNode[];
  /** Absolute filesystem path. Populated by {@link buildTree}; optional otherwise. */
  path?: string;
}

/**
 * Options for building a directory tree.
 */
export interface BuildTreeOptions {
  /** List of excluded paths/patterns (relative, forward-slash style). */
  blacklist?: string[];
  /** Maximum depth to descend (1 = only direct children). `Infinity` by default. */
  maxDepth?: number;
  /**
   * Optional predicate; when it returns true for an entry's absolute path, the
   * entry (and its subtree) is excluded. Used to honour `.gitignore`. The second
   * argument indicates whether the entry is a directory.
   */
  isIgnored?: (fullPath: string, isDirectory: boolean) => boolean;
}

/**
 * Sorts entries: directories first, then files, each alphabetically
 * (case-insensitive) for stable, predictable output.
 */
function compareEntries(a: fs.Dirent, b: fs.Dirent): number {
  const aDir = a.isDirectory();
  const bDir = b.isDirectory();
  if (aDir !== bDir) {
    return aDir ? -1 : 1;
  }
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'accent' });
}

/**
 * Recursively builds the list of child nodes for `dirPath`.
 *
 * @param dirPath Directory to read
 * @param basePath Base directory used to compute relative paths for blacklisting
 * @param options Build options
 * @param depth Current depth (internal)
 * @returns The child nodes of `dirPath`
 */
export async function buildTree(
  dirPath: string,
  basePath: string,
  options: BuildTreeOptions = {},
  depth = 1
): Promise<TreeNode[]> {
  const { blacklist = [], maxDepth = Infinity, isIgnored } = options;

  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  } catch {
    // Unreadable directory (permissions, etc.) - treat as empty.
    return [];
  }

  entries.sort(compareEntries);

  const nodes: TreeNode[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(basePath, fullPath).replace(/\\/g, '/');

    // Symbolic links are listed but never followed.
    const isDirectory = entry.isDirectory() && !entry.isSymbolicLink();

    if (isBlacklisted(relativePath, blacklist) || isIgnored?.(fullPath, isDirectory)) {
      continue;
    }

    const node: TreeNode = { name: entry.name, isDirectory, children: [], path: fullPath };

    if (isDirectory && depth < maxDepth) {
      node.children = await buildTree(fullPath, basePath, options, depth + 1);
    }

    nodes.push(node);
  }

  return nodes;
}

/**
 * Builds a tree out of an explicit list of files instead of walking the disk.
 *
 * Only the directories that actually hold one of the given files appear, plus
 * the ancestors that link them to `rootDir` (a tree needs the connecting
 * chain). Sibling folders without a single listed file are left out entirely.
 * The files themselves are kept as leaves. This is what the editor extensions
 * use for "Copy Skeleton": the skeleton mirrors the current selection, so no
 * blacklist or `.gitignore` filtering is needed here — the caller's file list
 * has already been through it.
 *
 * Files outside `rootDir` keep the `..` segments of their relative path, which
 * matches how the scanner labels them.
 *
 * @param rootDir Base directory the paths are made relative to
 * @param filePaths Absolute paths of the selected files, in any order
 * @returns The child nodes of `rootDir`, sorted like {@link buildTree}
 */
export function buildTreeFromPaths(rootDir: string, filePaths: string[]): TreeNode[] {
  const root: TreeNode = { name: '', isDirectory: true, children: [], path: rootDir };
  const dirs = new Map<string, TreeNode>([['', root]]);
  const seenFiles = new Set<string>();

  for (const filePath of filePaths) {
    const rel = path.relative(rootDir, filePath).replace(/\\/g, '/');
    if (!rel || seenFiles.has(rel)) {
      continue; // outside/equal to the root, or already added
    }
    seenFiles.add(rel);

    const segments = rel.split('/');
    const fileName = segments.pop() as string;

    // Walk down the chain, creating the directory nodes that do not exist yet.
    let parent = root;
    let key = '';
    for (const segment of segments) {
      key = key ? `${key}/${segment}` : segment;
      let node = dirs.get(key);
      if (!node) {
        node = {
          name: segment,
          isDirectory: true,
          children: [],
          path: path.join(rootDir, ...key.split('/')),
        };
        dirs.set(key, node);
        parent.children.push(node);
      }
      parent = node;
    }

    parent.children.push({
      name: fileName,
      isDirectory: false,
      children: [],
      path: path.join(rootDir, ...rel.split('/')),
    });
  }

  sortNodes(root.children);
  return root.children;
}

/** Sorts a tree in place the same way {@link buildTree} orders a directory. */
function sortNodes(nodes: TreeNode[]): void {
  nodes.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'accent' });
  });
  for (const node of nodes) {
    if (node.isDirectory) {
      sortNodes(node.children);
    }
  }
}

/**
 * Options for rendering a tree to text.
 */
export interface RenderTreeOptions {
  /** Suffix appended to directory names (default `/`). Pass `''` to disable. */
  dirSuffix?: string;
}

/**
 * Renders a root node and its children into a `tree`-style string.
 *
 * @example
 * project-name
 * ├── src/
 * │   ├── scanner.ts
 * │   └── tree.ts
 * └── package.json
 */
export function renderTree(root: TreeNode, options: RenderTreeOptions = {}): string {
  const { dirSuffix = '/' } = options;
  const lines: string[] = [root.name];

  const label = (node: TreeNode): string =>
    node.isDirectory ? `${node.name}${dirSuffix}` : node.name;

  const walk = (children: TreeNode[], prefix: string): void => {
    children.forEach((child, index) => {
      const isLast = index === children.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      lines.push(`${prefix}${connector}${label(child)}`);

      if (child.children.length > 0) {
        const childPrefix = `${prefix}${isLast ? '    ' : '│   '}`;
        walk(child.children, childPrefix);
      }
    });
  };

  walk(root.children, '');
  return lines.join('\n');
}

/**
 * Counts directories and files in a tree (excluding the root node).
 */
export function countTree(root: TreeNode): { dirs: number; files: number } {
  let dirs = 0;
  let files = 0;
  const walk = (nodes: TreeNode[]): void => {
    for (const node of nodes) {
      if (node.isDirectory) {
        dirs++;
        walk(node.children);
      } else {
        files++;
      }
    }
  };
  walk(root.children);
  return { dirs, files };
}

/**
 * Determines the root label: an explicit name, otherwise the target folder's
 * own name (i.e. the project name), falling back to the absolute path.
 */
export function resolveRootName(targetDir: string, explicitName?: string): string {
  if (explicitName) {
    return explicitName;
  }
  const resolved = path.resolve(targetDir);
  return path.basename(resolved) || resolved;
}
