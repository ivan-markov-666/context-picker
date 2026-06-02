/**
 * Public library API for directory-scanner.
 *
 * Import the pieces you need instead of shelling out to the CLI, e.g.:
 *
 * ```ts
 * import { runScan, buildTree, renderTree, resolveRootName } from 'directory-scanner';
 * ```
 */

// Scanner
export {
  scanDirectory,
  scanSelectionToString,
  renderFileBody,
  stripBlankLines,
  runScan,
  parseArgs,
  main as runScannerCli,
  HELP_TEXT,
} from './scanner';
export type {
  ScanStats,
  ScanDirectoryOptions,
  ScanSelectionOptions,
  ScannerCliOptions,
} from './scanner';

// Tree
export {
  buildTree,
  buildProjectTree,
  renderTree,
  countTree,
  resolveRootName,
  parseTreeArgs,
  main as runTreeCli,
  TREE_HELP_TEXT,
} from './tree';
export type {
  TreeNode,
  BuildTreeOptions,
  RenderTreeOptions,
  TreeCliOptions,
} from './tree';

// Blacklist
export { readBlacklist, isBlacklisted, DEFAULT_IGNORE } from './blacklist';
export type { FileSystemError } from './blacklist';

// File helpers
export {
  isEnvFile,
  isTextFile,
  safeReadFile,
  TEXT_EXTENSIONS,
  TEXT_FILENAMES,
} from './file-utils';

// Comment stripping
export { stripCommentsFromFile, isCommentStrippingSupported } from './comment-stripper';
