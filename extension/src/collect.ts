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
