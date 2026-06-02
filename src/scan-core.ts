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
  const { rootDir, includedFiles, includeEnvFiles, stripComments, onProgress, isCancelled } =
    options;

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
    const body = await renderFileBody(file, includeEnvFiles, stripComments);
    output += `${rel}\n${body}`;
    done++;
    onProgress?.(done, total);
  }
  return output;
}
