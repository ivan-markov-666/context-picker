import * as fs from 'fs';
import * as path from 'path';
import { stripCommentsFromFile } from './comment-stripper';
import { isEnvFile, isTextFile, safeReadFile } from './file-utils';

/**
 * Renders the content block for a single file using the same markers as a full
 * scan: `.env` handling, the binary/non-text notice, and optional comment
 * stripping. Returns the body only — callers prepend the relative path line.
 *
 * @param filePath Absolute path to the file
 * @param includeEnvFiles Whether to include `.env` content
 * @param stripComments Whether to strip comments from supported files
 * @param removeBlankLines Whether to drop blank/whitespace-only lines (reduces size)
 */
export async function renderFileBody(
  filePath: string,
  includeEnvFiles: boolean,
  stripComments: boolean,
  removeBlankLines = false
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
  if (removeBlankLines) {
    content = stripBlankLines(content);
  }
  return `${content}\n\n`;
}

/** Removes blank / whitespace-only lines from text (to reduce LLM context size). */
export function stripBlankLines(content: string): string {
  return content
    .split('\n')
    .filter((line) => line.trim() !== '')
    .join('\n');
}

/**
 * Returns the processed text to write when exporting a file copy, or `null` when
 * the file should be copied verbatim (binary, `.env`, or no transforms enabled).
 */
export async function processFileForCopy(
  filePath: string,
  stripComments: boolean,
  removeBlankLines: boolean
): Promise<string | null> {
  if (!stripComments && !removeBlankLines) {
    return null; // nothing to transform -> copy as-is
  }
  if (isEnvFile(filePath) || !isTextFile(filePath)) {
    return null; // never rewrite .env or binary files
  }
  let content = await safeReadFile(filePath);
  if (stripComments) {
    content = stripCommentsFromFile(content, filePath);
  }
  if (removeBlankLines) {
    content = stripBlankLines(content);
  }
  return content;
}

/** Builds a unique, readable flat file name (parent folder prefixed on clashes). */
function uniqueFlatName(filePath: string, used: Set<string>): string {
  const base = path.basename(filePath);
  let name = base;
  if (used.has(name.toLowerCase())) {
    const parent = path.basename(path.dirname(filePath));
    if (parent) {
      name = `${parent}_${base}`;
    }
  }
  let candidate = name;
  let i = 2;
  while (used.has(candidate.toLowerCase())) {
    const ext = path.extname(name);
    const stem = name.slice(0, name.length - ext.length);
    candidate = `${stem}_${i}${ext}`;
    i += 1;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

/** Options for {@link copySelectionToDir}. */
export interface CopyFilesOptions {
  /** Destination directory (its contents are cleared first). */
  targetDir: string;
  /** Absolute paths of the files to copy. */
  includedFiles: string[];
  /** Strip comments from supported text files before writing. */
  stripComments: boolean;
  /** Drop blank/whitespace-only lines from text files before writing. */
  removeBlankLines: boolean;
}

/**
 * Copies the selected files into `targetDir` as a flat set (cleaning it first),
 * applying comment / blank-line stripping to text files when requested. Binary
 * and `.env` files are copied verbatim. Returns the number of files written.
 */
export async function copySelectionToDir(options: CopyFilesOptions): Promise<number> {
  const { targetDir, includedFiles, stripComments, removeBlankLines } = options;

  await fs.promises.mkdir(targetDir, { recursive: true });
  // Clear the contents but keep the folder itself (it may be open in a file manager).
  for (const entry of await fs.promises.readdir(targetDir)) {
    await fs.promises.rm(path.join(targetDir, entry), { recursive: true, force: true });
  }

  const used = new Set<string>();
  let written = 0;
  for (const file of includedFiles) {
    const dest = path.join(targetDir, uniqueFlatName(file, used));
    const processed = await processFileForCopy(file, stripComments, removeBlankLines);
    if (processed === null) {
      await fs.promises.copyFile(file, dest);
    } else {
      await fs.promises.writeFile(dest, processed, 'utf8');
    }
    written += 1;
  }
  return written;
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
  /** Whether to drop blank/whitespace-only lines from file content. */
  removeBlankLines?: boolean;
  /**
   * Optional progress callback, invoked after each file is processed with the
   * number of files done and the total. Lets callers render a progress bar.
   */
  onProgress?: (done: number, total: number) => void;
  /**
   * Optional cancellation check, consulted before each file. When it returns
   * true the scan stops early and returns the partial output gathered so far.
   */
  isCancelled?: () => boolean;
}

/**
 * Scans an explicit set of files (rather than walking a directory) and returns
 * the formatted output as a string, using the exact same per-file format as the
 * directory scanner. Files are emitted sorted by their relative path.
 *
 * This is the entry point used by editor integrations (e.g. the VS Code
 * extension) where the user has hand-picked the files to include. It lives in a
 * CLI-free module so consumers can import it without pulling in the CLI entry
 * point (shebang / `require.main` guard) of `scanner.ts`.
 */
export async function scanSelectionToString(options: ScanSelectionOptions): Promise<string> {
  const {
    rootDir,
    includedFiles,
    includeEnvFiles,
    stripComments,
    removeBlankLines = false,
    onProgress,
    isCancelled,
  } = options;

  const entries = includedFiles
    .map((file) => ({ file, rel: path.relative(rootDir, file).replace(/\\/g, '/') }))
    .sort((a, b) => a.rel.localeCompare(b.rel));

  const total = entries.length;
  let done = 0;
  let output = '';
  for (const { file, rel } of entries) {
    if (isCancelled?.()) {
      break;
    }
    const body = await renderFileBody(file, includeEnvFiles, stripComments, removeBlankLines);
    output += `${rel}\n${body}`;
    done++;
    onProgress?.(done, total);
  }
  return output;
}
