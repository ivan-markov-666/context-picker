import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

/** Returns true when an absolute path should be excluded. */
export type IgnorePredicate = (fsPath: string, isDirectory: boolean) => boolean;

type IgnoreInstance = ReturnType<typeof ignore>;

const ALLOW_ALL: IgnorePredicate = () => false;

/** Loads the `.gitignore` matcher for a single folder root. */
async function loadMatcher(root: string): Promise<IgnoreInstance | null> {
  try {
    const content = await fs.promises.readFile(path.join(root, '.gitignore'), 'utf-8');
    return ignore().add(content);
  } catch {
    return null;
  }
}

/**
 * Builds a predicate that returns true when an absolute path is ignored by the
 * `.gitignore` of its root. Returns allow-all when `respect` is false or no
 * `.gitignore` is present. Directories are tested with a trailing slash so that
 * directory-only patterns (e.g. `dist/`) prune the folder itself.
 *
 * Only each root's top-level `.gitignore` is consulted (nested ones are ignored).
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
        const ignored = isDirectory ? ig.ignores(rel) || ig.ignores(rel + '/') : ig.ignores(rel);
        if (ignored) {
          return true;
        }
      }
    }
    return false;
  };
}
