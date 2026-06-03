import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

/** Returns true when an absolute path should be excluded. */
export type IgnorePredicate = (fsPath: string, isDirectory: boolean) => boolean;

/** The matcher instance type, derived from the factory's return type. */
type IgnoreInstance = ReturnType<typeof ignore>;

const ALLOW_ALL: IgnorePredicate = () => false;

/** Loads the `.gitignore` matcher for a single workspace folder root. */
async function loadMatcher(root: string): Promise<IgnoreInstance | null> {
  try {
    const content = await fs.promises.readFile(path.join(root, '.gitignore'), 'utf-8');
    return ignore().add(content);
  } catch {
    return null; // no .gitignore (or unreadable) -> nothing ignored for this root
  }
}

/**
 * Builds a predicate that returns true when an absolute path is ignored by the
 * `.gitignore` of its workspace folder. Returns an allow-all predicate when
 * `respect` is false or no `.gitignore` files are present.
 *
 * Note: only each workspace folder's root `.gitignore` is consulted (nested
 * `.gitignore` files are not yet supported).
 */
export async function createGitignorePredicate(
  roots: string[],
  respect: boolean
): Promise<IgnorePredicate> {
  if (!respect || roots.length === 0) {
    return ALLOW_ALL;
  }

  const matchers = (
    await Promise.all(roots.map(async (root) => ({ root, ig: await loadMatcher(root) })))
  ).filter((m): m is { root: string; ig: IgnoreInstance } => m.ig !== null);

  if (matchers.length === 0) {
    return ALLOW_ALL;
  }

  return (fsPath: string, isDirectory: boolean): boolean => {
    for (const { root, ig } of matchers) {
      if (fsPath === root) {
        continue;
      }
      if (fsPath.startsWith(root + path.sep)) {
        const rel = path.relative(root, fsPath).replace(/\\/g, '/');
        if (!rel) {
          continue;
        }
        // Directories must be tested with a trailing slash so that directory-only
        // patterns (e.g. `dist/`) prune the folder itself, not just its contents.
        const ignored = isDirectory ? ig.ignores(rel) || ig.ignores(rel + '/') : ig.ignores(rel);
        if (ignored) {
          return true;
        }
      }
    }
    return false;
  };
}
