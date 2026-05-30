#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { readBlacklist, isBlacklisted, DEFAULT_IGNORE } from './blacklist';

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

/**
 * Parsed command line options for the tree command.
 */
export interface TreeCliOptions {
  targetDir: string;
  blacklistPath: string;
  outputPath: string;
  maxDepth: number;
  rootName?: string;
  /** When true, do not apply the built-in default ignore (node_modules, .git). */
  includeAll: boolean;
  help: boolean;
}

export const TREE_HELP_TEXT = `
Directory Tree - Prints only the directory tree of a project (no file contents)

Usage:
  npm run tree -- [options]

Options:
  --dir, -d         Target directory (default: current directory)
  --blacklist, -b   Path to blacklist file (default: <target_directory>/blacklist.txt)
  --output, -o      Write the tree to a file instead of stdout
  --depth, -L       Maximum depth to display (default: unlimited)
  --name, -n        Override the root label (default: the project folder name)
  --all, -a         Include node_modules/.git (disabled by default)
  --help, -h        Show this help message

The root of the tree is labelled with the project name (the target folder's name).
node_modules and .git are ignored by default; anything in blacklist.txt is also excluded.
`;

/**
 * Parses command line arguments for the tree command.
 */
export function parseTreeArgs(
  argv: string[] = process.argv,
  logger: Pick<Console, 'warn'> = console
): TreeCliOptions {
  let targetDir = process.cwd();
  let blacklistPath = '';
  let outputPath = '';
  let maxDepth = Infinity;
  let rootName: string | undefined;
  let includeAll = false;
  let help = false;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--dir' || arg === '-d') {
      targetDir = argv[++i] || targetDir;
    } else if (arg === '--blacklist' || arg === '-b') {
      blacklistPath = argv[++i] || '';
    } else if (arg === '--output' || arg === '-o') {
      outputPath = argv[++i] || '';
    } else if (arg === '--depth' || arg === '-L') {
      const value = Number(argv[++i]);
      if (Number.isFinite(value) && value > 0) {
        maxDepth = Math.floor(value);
      } else {
        logger.warn(`Warning: Invalid --depth value ignored. Using unlimited depth.`);
      }
    } else if (arg === '--name' || arg === '-n') {
      rootName = argv[++i] || undefined;
    } else if (arg === '--all' || arg === '-a') {
      includeAll = true;
    } else if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg.startsWith('-')) {
      logger.warn(`Warning: Unknown option "${arg}" ignored.`);
    } else {
      targetDir = arg;
    }
  }

  if (!blacklistPath) {
    blacklistPath = path.join(targetDir, 'blacklist.txt');
  }

  return { targetDir, blacklistPath, outputPath, maxDepth, rootName, includeAll, help };
}

/**
 * Builds the full tree (root node included) for the given CLI options,
 * combining the blacklist file with the default ignore list.
 */
export async function buildProjectTree(
  options: TreeCliOptions,
  logger: Pick<Console, 'log' | 'warn'> = console
): Promise<TreeNode> {
  const fileBlacklist = await readBlacklist(options.blacklistPath, logger);
  const blacklist = options.includeAll
    ? fileBlacklist
    : [...new Set([...DEFAULT_IGNORE, ...fileBlacklist])];

  const children = await buildTree(options.targetDir, options.targetDir, {
    blacklist,
    maxDepth: options.maxDepth,
  });

  return {
    name: resolveRootName(options.targetDir, options.rootName),
    isDirectory: true,
    children,
  };
}

/**
 * CLI entry point for the tree command. Writes ONLY the tree to stdout (or the
 * output file); all informational logging goes to stderr so stdout stays clean.
 */
export async function main(argv: string[] = process.argv): Promise<void> {
  const options = parseTreeArgs(argv);

  if (options.help) {
    console.log(TREE_HELP_TEXT);
    return;
  }

  // Route informational logs to stderr to keep stdout limited to the tree.
  const stderrLogger: Pick<Console, 'log' | 'warn'> = {
    log: (...args: unknown[]) => console.error(...args),
    warn: (...args: unknown[]) => console.error(...args),
  };

  const root = await buildProjectTree(options, stderrLogger);
  const output = renderTree(root);

  if (options.outputPath) {
    await fs.promises.writeFile(options.outputPath, output + '\n', 'utf-8');
    const { dirs, files } = countTree(root);
    console.error(`Tree written to ${options.outputPath} (${dirs} directories, ${files} files).`);
  } else {
    console.log(output);
  }
}

// Execute only when run directly.
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
