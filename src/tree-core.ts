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
}

/**
 * Options for building a directory tree.
 */
export interface BuildTreeOptions {
  /** List of excluded paths/patterns (relative, forward-slash style). */
  blacklist?: string[];
  /** Maximum depth to descend (1 = only direct children). `Infinity` by default. */
  maxDepth?: number;
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
  const { blacklist = [], maxDepth = Infinity } = options;

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

    if (isBlacklisted(relativePath, blacklist)) {
      continue;
    }

    // Symbolic links are listed but never followed.
    const isDirectory = entry.isDirectory() && !entry.isSymbolicLink();

    const node: TreeNode = { name: entry.name, isDirectory, children: [] };

    if (isDirectory && depth < maxDepth) {
      node.children = await buildTree(fullPath, basePath, options, depth + 1);
    }

    nodes.push(node);
  }

  return nodes;
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
