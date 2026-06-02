import * as fs from 'fs';
import * as path from 'path';

/**
 * Checks if the file is an `.env` file.
 * Matches `.env`, `.env.*` (e.g. `.env.local`) and `*.env` (e.g. `prod.env`).
 *
 * @param filePath Path to the file
 * @returns true if the file is an `.env` file, false otherwise
 */
export function isEnvFile(filePath: string): boolean {
  const fileName = path.basename(filePath).toLowerCase();
  return fileName === '.env' || fileName.startsWith('.env.') || fileName.endsWith('.env');
}

/**
 * File extensions that are treated as text and whose content is included in scans.
 */
export const TEXT_EXTENSIONS: ReadonlySet<string> = new Set([
  '.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.css', '.scss', '.html', '.htm',
  '.xml', '.json', '.yaml', '.yml', '.csv', '.ini', '.conf', '.py', '.java',
  '.c', '.cpp', '.h', '.hpp', '.cs', '.go', '.rb', '.php', '.pl', '.sh', '.bat',
  '.ps1', '.sql', '.gitignore', '.env', '.config', '.toml', '.dockerfile',
]);

/**
 * Extension-less file names that are commonly text files.
 */
export const TEXT_FILENAMES: ReadonlySet<string> = new Set([
  'dockerfile', 'makefile', 'jenkinsfile', 'vagrantfile', 'readme', 'license',
  'gemfile', 'rakefile', 'procfile', '.gitignore', '.dockerignore', '.npmignore',
]);

/**
 * Checks if the file is a text file based on its extension or well-known name.
 *
 * @param filePath Path to the file
 * @returns true if the file is a text file, false otherwise
 */
export function isTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const filename = path.basename(filePath).toLowerCase();

  return TEXT_EXTENSIONS.has(ext) || TEXT_FILENAMES.has(filename);
}

/**
 * Safely reads a text file, returning a descriptive placeholder on failure
 * instead of throwing.
 *
 * @param filePath Path to the file
 * @returns File content or an error message wrapped in brackets
 */
export async function safeReadFile(filePath: string): Promise<string> {
  try {
    return await fs.promises.readFile(filePath, 'utf-8');
  } catch (error: unknown) {
    if (error instanceof Error) {
      return `[Error reading file: ${error.message}]`;
    }
    return '[Unexpected error reading file]';
  }
}
