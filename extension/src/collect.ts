import * as fs from 'fs';
import * as path from 'path';
import { isBlacklisted, DEFAULT_IGNORE } from '../../src/blacklist';
import { SelectionModel } from './SelectionModel';

/**
 * Walks `root` and collects the absolute paths of all files whose effective
 * selection state is "checked", skipping default-ignored directories and
 * symbolic links. (M1: paths only — file contents are added in M2 via the core.)
 */
export async function collectSelectedFiles(
  root: string,
  selection: SelectionModel,
  out: string[]
): Promise<void> {
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(root, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (isBlacklisted(entry.name, DEFAULT_IGNORE)) {
      continue;
    }
    if (entry.isSymbolicLink()) {
      continue;
    }
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      await collectSelectedFiles(full, selection, out);
    } else if (entry.isFile() && selection.isSelected(full)) {
      out.push(full);
    }
  }
}

/** Summary of the current selection: how many files and roughly how many bytes. */
export interface SelectionSummary {
  files: number;
  bytes: number;
}

/**
 * Walks `root` and tallies the selected files and their total size. Used for the
 * status footer so the user knows roughly how big the generated paste will be.
 */
export async function summarizeSelection(
  root: string,
  selection: SelectionModel,
  acc: SelectionSummary = { files: 0, bytes: 0 }
): Promise<SelectionSummary> {
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(root, { withFileTypes: true });
  } catch {
    return acc;
  }

  for (const entry of entries) {
    if (isBlacklisted(entry.name, DEFAULT_IGNORE) || entry.isSymbolicLink()) {
      continue;
    }
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      await summarizeSelection(full, selection, acc);
    } else if (entry.isFile() && selection.isSelected(full)) {
      acc.files++;
      try {
        acc.bytes += (await fs.promises.stat(full)).size;
      } catch {
        // Ignore files we cannot stat.
      }
    }
  }

  return acc;
}

/**
 * Collects every (non-ignored) file at or under `target`, regardless of the
 * checkbox selection. Used by the Explorer "from here" quick actions. A file
 * target yields just that file; a directory is walked recursively.
 */
export async function collectAllFiles(target: string, out: string[]): Promise<void> {
  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(target);
  } catch {
    return;
  }

  if (stat.isFile()) {
    out.push(target);
    return;
  }
  if (!stat.isDirectory()) {
    return;
  }

  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(target, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (isBlacklisted(entry.name, DEFAULT_IGNORE) || entry.isSymbolicLink()) {
      continue;
    }
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await collectAllFiles(full, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
}
