#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { Writable } from 'stream';
import { stripCommentsFromFile } from './comment-stripper';
import { readBlacklist, isBlacklisted } from './blacklist';
import { isEnvFile, isTextFile, safeReadFile } from './file-utils';

/**
 * Statistics tracked while scanning.
 */
export interface ScanStats {
  dirs: number;
  files: number;
  skipped: number;
  envFiles: number;
}

/**
 * Options accepted by {@link scanDirectory}.
 */
export interface ScanDirectoryOptions {
  /** Current directory to scan. */
  dirPath: string;
  /** List of excluded paths/patterns. */
  blacklist: string[];
  /** Stream for writing the output. */
  outputStream: Writable;
  /** Base directory (starting point of the scan) used to compute relative paths. */
  basePath: string;
  /** Mutable statistics object updated as the scan progresses. */
  stats: ScanStats;
  /** Whether to include the content of `.env` files. */
  includeEnvFiles: boolean;
  /** Whether to strip comments from supported source files. */
  stripComments: boolean;
  /** Absolute paths that must never be read (e.g. the output file itself). */
  excludedAbsolutePaths?: ReadonlySet<string>;
  /** Logger used for progress/debug output. */
  logger?: Pick<Console, 'log' | 'warn' | 'error'>;
}

/**
 * Writes a chunk to a stream while respecting backpressure, so very large
 * scans do not buffer the whole output in memory.
 */
function writeChunk(stream: Writable, chunk: string): Promise<void> {
  if (stream.write(chunk)) {
    return Promise.resolve();
  }
  return new Promise((resolve) => stream.once('drain', resolve));
}

/**
 * Recursively scans a directory, writing each path and (for text files) its
 * content to the output stream.
 */
export async function scanDirectory(options: ScanDirectoryOptions): Promise<void> {
  const {
    dirPath,
    blacklist,
    outputStream,
    basePath,
    stats,
    includeEnvFiles,
    stripComments,
    excludedAbsolutePaths,
    logger = console,
  } = options;

  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath).replace(/\\/g, '/');

      // Never scan an explicitly excluded absolute path (e.g. the output file).
      if (excludedAbsolutePaths?.has(path.resolve(fullPath))) {
        stats.skipped++;
        continue;
      }

      // Skip if the path is in the blacklist.
      if (isBlacklisted(relativePath, blacklist)) {
        stats.skipped++;
        if (process.env.DEBUG) {
          logger.log(`Skipping blacklisted path: ${relativePath}`);
        }
        continue;
      }

      // Write the path to file.
      await writeChunk(outputStream, `${relativePath}\n`);

      // Symbolic links are not followed (avoids cycles and EISDIR noise).
      if (entry.isSymbolicLink()) {
        stats.files++;
        await writeChunk(outputStream, `[Symbolic link - not followed]\n\n`);
        continue;
      }

      if (entry.isDirectory()) {
        stats.dirs++;
        if (stats.dirs % 100 === 0) {
          logger.log(
            `Progress: ${stats.dirs} directories, ${stats.files} files processed, ` +
              `${stats.skipped} skipped, ${stats.envFiles} .env files`
          );
        }
        await scanDirectory({ ...options, dirPath: fullPath });
        continue;
      }

      if (!entry.isFile()) {
        // Sockets, FIFOs, block/character devices, etc.
        stats.files++;
        await writeChunk(outputStream, `[Special file - content not shown]\n\n`);
        continue;
      }

      stats.files++;
      if (isEnvFile(fullPath)) {
        stats.envFiles++;
      }

      // Render this file's content block using the shared logic.
      const body = await renderFileBody(fullPath, includeEnvFiles, stripComments);
      await writeChunk(outputStream, body);

      if (process.env.DEBUG && isEnvFile(fullPath)) {
        logger.log(`${includeEnvFiles ? 'Included' : 'Skipping'} .env file: ${relativePath}`);
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Error scanning directory ${dirPath}: ${error.message}`);
    } else {
      logger.error(`Unexpected error scanning directory ${dirPath}`);
    }
  }
}

/**
 * Renders the content block for a single file using the same markers as a full
 * scan: `.env` handling, the binary/non-text notice, and optional comment
 * stripping. Returns the body only — callers prepend the relative path line.
 *
 * @param filePath Absolute path to the file
 * @param includeEnvFiles Whether to include `.env` content
 * @param stripComments Whether to strip comments from supported files
 */
export async function renderFileBody(
  filePath: string,
  includeEnvFiles: boolean,
  stripComments: boolean
): Promise<string> {
  if (isEnvFile(filePath)) {
    if (!includeEnvFiles) {
      return `[.env file - content skipped according to settings]\n\n`;
    }
    const content = await safeReadFile(filePath);
    return `### .env file content ###\n${content}\n### End of .env file ###\n\n`;
  }

  if (!isTextFile(filePath)) {
    return `[Binary or non-text content not shown]\n\n`;
  }

  let content = await safeReadFile(filePath);
  if (stripComments) {
    content = stripCommentsFromFile(content, filePath);
  }
  return `${content}\n\n`;
}

/**
 * Options for {@link scanSelectionToString}.
 */
export interface ScanSelectionOptions {
  /** Base directory used to compute the relative path shown for each file. */
  rootDir: string;
  /** Absolute paths of the files to include, in any order. */
  includedFiles: string[];
  /** Whether to include the content of `.env` files. */
  includeEnvFiles: boolean;
  /** Whether to strip comments from supported source files. */
  stripComments: boolean;
}

/**
 * Scans an explicit set of files (rather than walking a directory) and returns
 * the formatted output as a string, using the exact same per-file format as
 * {@link scanDirectory}. Files are emitted sorted by their relative path.
 *
 * This is the entry point used by editor integrations (e.g. the VS Code
 * extension) where the user has hand-picked the files to include.
 */
export async function scanSelectionToString(options: ScanSelectionOptions): Promise<string> {
  const { rootDir, includedFiles, includeEnvFiles, stripComments } = options;

  const entries = includedFiles
    .map((file) => ({ file, rel: path.relative(rootDir, file).replace(/\\/g, '/') }))
    .sort((a, b) => a.rel.localeCompare(b.rel));

  let output = '';
  for (const { file, rel } of entries) {
    const body = await renderFileBody(file, includeEnvFiles, stripComments);
    output += `${rel}\n${body}`;
  }
  return output;
}

/**
 * Parsed command line options for the scanner.
 */
export interface ScannerCliOptions {
  targetDir: string;
  blacklistPath: string;
  outputPath: string;
  includeEnvFiles: boolean;
  stripComments: boolean;
  /** True when `--help` was requested. */
  help: boolean;
}

export const HELP_TEXT = `
Directory Scanner - Recursively scans a directory and outputs paths and file contents

Usage:
  npm run scanner -- [options]

Options:
  --dir, -d             Target directory to scan (default: current directory)
  --blacklist, -b       Path to blacklist file (default: <target_directory>/blacklist.txt)
  --output, -o          Path to output file (default: <target_directory>/project_files.txt)
  --env, -e             Include content of .env files (default: disabled)
  --strip-comments, -s  Strip comments from source code files (default: disabled)
  --help, -h            Show this help message

Environment variables:
  DEBUG=1          Enable additional debug output
`;

/**
 * Parses command line arguments.
 *
 * @param argv Full argv array (defaults to `process.argv`)
 * @param logger Logger for warnings about unknown flags
 * @returns Parsed options
 */
export function parseArgs(
  argv: string[] = process.argv,
  logger: Pick<Console, 'warn'> = console
): ScannerCliOptions {
  let targetDir = process.cwd();
  let blacklistPath = '';
  let outputPath = '';
  let includeEnvFiles = false;
  let stripComments = false;
  let help = false;

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--dir' || arg === '-d') {
      targetDir = argv[++i] || targetDir;
    } else if (arg === '--blacklist' || arg === '-b') {
      blacklistPath = argv[++i] || '';
    } else if (arg === '--output' || arg === '-o') {
      outputPath = argv[++i] || '';
    } else if (arg === '--env' || arg === '-e') {
      includeEnvFiles = true;
    } else if (arg === '--strip-comments' || arg === '-s') {
      stripComments = true;
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

  if (!outputPath) {
    outputPath = path.join(targetDir, 'project_files.txt');
  }

  return { targetDir, blacklistPath, outputPath, includeEnvFiles, stripComments, help };
}

/**
 * High-level scan entry: reads the blacklist, scans the target directory and
 * writes the result to the output file. Returns the collected statistics.
 */
export async function runScan(
  options: ScannerCliOptions,
  logger: Pick<Console, 'log' | 'warn' | 'error'> = console
): Promise<ScanStats> {
  const { targetDir, blacklistPath, outputPath, includeEnvFiles, stripComments } = options;

  logger.log(`Starting directory scan: ${targetDir}`);
  logger.log(`Using blacklist from: ${blacklistPath}`);
  logger.log(`Output will be written to: ${outputPath}`);
  logger.log(`.env files: ${includeEnvFiles ? 'will be included' : 'will not be included'}`);
  logger.log(`Comment stripping: ${stripComments ? 'enabled' : 'disabled'}`);

  const blacklist = await readBlacklist(blacklistPath, logger);

  const outputStream = fs.createWriteStream(outputPath);

  // Surface stream errors instead of letting them crash the process unhandled.
  const streamError = new Promise<never>((_, reject) => {
    outputStream.once('error', reject);
  });

  const stats: ScanStats = { dirs: 0, files: 0, skipped: 0, envFiles: 0 };

  try {
    logger.log('Starting scan...');
    const startTime = Date.now();

    await Promise.race([
      scanDirectory({
        dirPath: targetDir,
        blacklist,
        outputStream,
        basePath: targetDir,
        stats,
        includeEnvFiles,
        stripComments,
        // Never read the output file we are currently writing.
        excludedAbsolutePaths: new Set([path.resolve(outputPath)]),
        logger,
      }),
      streamError,
    ]);

    const duration = (Date.now() - startTime) / 1000;

    logger.log(`
Scan completed in ${duration.toFixed(2)} seconds:
- Directories processed: ${stats.dirs}
- Files processed: ${stats.files}
- Items skipped (blacklist): ${stats.skipped}
- .env files found: ${stats.envFiles} ${includeEnvFiles ? '(included)' : '(skipped)'}
- Output written to: ${outputPath}
`);
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error(`Error during scanning: ${error.message}`);
    } else {
      logger.error(`Unexpected error during scanning`);
    }
  } finally {
    // Wait for the stream to fully close. Listening on 'close' (rather than the
    // end() callback) resolves on both success and error/destroy, so a failing
    // output path cannot leave this hanging.
    await new Promise<void>((resolve) => {
      if (outputStream.destroyed) {
        resolve();
        return;
      }
      outputStream.on('close', () => resolve());
      outputStream.end();
    });
  }

  return stats;
}

/**
 * CLI entry point.
 */
export async function main(argv: string[] = process.argv): Promise<void> {
  const options = parseArgs(argv);

  if (options.help) {
    console.log(HELP_TEXT);
    return;
  }

  await runScan(options);
}

// Execute only when run directly (not when imported by tests or other modules).
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
