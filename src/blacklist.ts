import * as fs from 'fs';
import * as readline from 'readline';

/**
 * Interface for typing filesystem errors (they carry an optional `code`).
 */
export interface FileSystemError extends Error {
  code?: string;
}

/**
 * Directory names that are almost never useful in a scan or tree and are
 * therefore ignored by default (e.g. by the `tree` command) even when no
 * blacklist file is provided.
 */
export const DEFAULT_IGNORE: string[] = [
  'node_modules',
  '.git',
];

/**
 * Reads the blacklist file with excluded paths.
 *
 * Lines that are empty or start with `#` are ignored. Remaining lines are
 * trimmed and normalised to forward-slash notation.
 *
 * @param blacklistPath Path to the blacklist file
 * @param logger Optional logger (defaults to `console`); pass a no-op logger to silence output
 * @returns Array with paths to exclude
 */
export async function readBlacklist(
  blacklistPath: string,
  logger: Pick<Console, 'log' | 'warn'> = console
): Promise<string[]> {
  const blacklist: string[] = [];

  try {
    // Check if the blacklist file exists and is readable
    await fs.promises.access(blacklistPath, fs.constants.R_OK);

    // Create readline interface for reading line by line
    const fileStream = fs.createReadStream(blacklistPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    // Process each line
    for await (const line of rl) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        // Normalize the path (use unified notation for separators)
        blacklist.push(trimmedLine.replace(/\\/g, '/'));
      }
    }

    logger.log(`Loaded ${blacklist.length} paths from blacklist in ${blacklistPath}`);
  } catch (error: unknown) {
    // Safe error handling with unknown type
    if (error instanceof Error) {
      const fsError = error as FileSystemError;
      if (fsError.code === 'ENOENT') {
        logger.warn(`Warning: Blacklist file ${blacklistPath} does not exist. No paths will be excluded.`);
      } else {
        logger.warn(`Warning: Cannot read blacklist file ${blacklistPath}: ${fsError.message}`);
      }
    } else {
      logger.warn(`Warning: Unexpected error reading blacklist file ${blacklistPath}`);
    }
  }

  return blacklist;
}

/**
 * Decides whether a blacklist entry should be treated as a directory pattern
 * (matched against any path segment) rather than an exact file name.
 *
 * A directory entry is one that:
 *  - ends with a slash (explicit), or
 *  - is a hidden entry with no extension (e.g. `.git`), or
 *  - has no extension at all (e.g. `node_modules`, `dist`).
 */
function isDirectoryPattern(normalizedItem: string): boolean {
  const endsWithSlash = normalizedItem.endsWith('/');
  // Hidden entry such as `.git` (a leading dot but no further dot/extension)
  const isHiddenDir = normalizedItem.startsWith('.') && !normalizedItem.includes('.', 1);
  const hasNoExtension = !normalizedItem.includes('.');

  return endsWithSlash || isHiddenDir || hasNoExtension;
}

/**
 * Checks whether a given (relative) path should be excluded (blacklisted).
 *
 * Matching rules:
 *  1. Exact match of the whole relative path.
 *  2. Directory patterns (see {@link isDirectoryPattern}) match the path itself,
 *     any path that starts with `<dir>/`, or any path that contains `<dir>` as a
 *     segment (so `node_modules` is excluded at any depth).
 *  3. File patterns match when the final path segment (file name) is equal.
 *
 * @param currentPath Current relative path to check (any slash style)
 * @param blacklist List of excluded paths/patterns
 * @returns true if the path should be excluded, false otherwise
 */
export function isBlacklisted(currentPath: string, blacklist: string[]): boolean {
  const normalizedPath = currentPath.replace(/\\/g, '/');
  const pathSegments = normalizedPath.split('/');

  for (const item of blacklist) {
    // Remove leading and trailing slashes for comparison
    const normalizedItem = item.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

    if (!normalizedItem) {
      continue;
    }

    // 1. Direct match of the entire path
    if (normalizedPath === normalizedItem) {
      return true;
    }

    if (isDirectoryPattern(normalizedItem)) {
      // 2a. Path starts with the directory pattern (standard, anchored case)
      if (normalizedPath.startsWith(normalizedItem + '/')) {
        return true;
      }
      // 2b. Any path segment matches the directory name (matches at any depth)
      if (pathSegments.includes(normalizedItem)) {
        return true;
      }
    } else {
      // 3. For files: match the last segment (file name)
      const fileName = pathSegments[pathSegments.length - 1];
      if (fileName === normalizedItem) {
        return true;
      }
    }
  }

  return false;
}
