import type * as vscode from 'vscode';
import * as path from 'path';

const STATE_KEY = 'projectContext.selection.v1';

interface PersistedState {
  included: string[];
  excluded: string[];
}

/**
 * Tracks which files/folders the user has included or excluded.
 *
 * Instead of storing one flag per file (which does not scale and breaks with
 * lazily-loaded tree nodes), we store **overrides**: a small set of explicitly
 * included paths and explicitly excluded paths. A path's effective state is
 * decided by the nearest override among itself and its ancestors. This makes
 * "include/exclude a whole folder recursively" a single entry.
 */
export class SelectionModel {
  private included = new Set<string>();
  private excluded = new Set<string>();

  constructor(private readonly context: vscode.ExtensionContext) {
    const saved = context.workspaceState.get<PersistedState>(STATE_KEY);
    if (saved) {
      this.included = new Set(saved.included ?? []);
      this.excluded = new Set(saved.excluded ?? []);
    }
  }

  private norm(p: string): string {
    return path.resolve(p);
  }

  private isDescendantOrSelf(target: string, ancestor: string): boolean {
    return target === ancestor || target.startsWith(ancestor + path.sep);
  }

  /**
   * Effective selection state of a path: true if checked.
   * The closest (deepest) override among self + ancestors wins; default is false.
   */
  isSelected(target: string): boolean {
    const p = this.norm(target);
    let bestLen = -1;
    let bestIncluded = false;

    for (const inc of this.included) {
      if (inc.length > bestLen && this.isDescendantOrSelf(p, inc)) {
        bestLen = inc.length;
        bestIncluded = true;
      }
    }
    for (const exc of this.excluded) {
      if (exc.length > bestLen && this.isDescendantOrSelf(p, exc)) {
        bestLen = exc.length;
        bestIncluded = false;
      }
    }
    return bestLen >= 0 ? bestIncluded : false;
  }

  /**
   * Whether a directory is partially selected, i.e. its effective state differs
   * from at least one descendant override. Used to render the simulated
   * "indeterminate" badge (the VS Code checkbox API is two-state only).
   */
  isPartial(dir: string): boolean {
    const d = this.norm(dir);
    const prefix = d + path.sep;
    if (this.isSelected(d)) {
      for (const exc of this.excluded) {
        if (exc.startsWith(prefix)) return true;
      }
    } else {
      for (const inc of this.included) {
        if (inc.startsWith(prefix)) return true;
      }
    }
    return false;
  }

  /** Mark a path (and its subtree) as included. */
  include(target: string): void {
    const p = this.norm(target);
    this.clearSubtree(p);
    this.excluded.delete(p);
    this.included.add(p);
    this.save();
  }

  /** Mark a path (and its subtree) as excluded. */
  exclude(target: string): void {
    const p = this.norm(target);
    this.clearSubtree(p);
    this.included.delete(p);
    this.excluded.add(p);
    this.save();
  }

  /** Remove all selections. */
  clear(): void {
    this.included.clear();
    this.excluded.clear();
    this.save();
  }

  stats(): { includes: number; excludes: number } {
    return { includes: this.included.size, excludes: this.excluded.size };
  }

  /** Drop any overrides that live strictly under `p` (they become redundant). */
  private clearSubtree(p: string): void {
    const prefix = p + path.sep;
    for (const x of [...this.included]) {
      if (x.startsWith(prefix)) this.included.delete(x);
    }
    for (const x of [...this.excluded]) {
      if (x.startsWith(prefix)) this.excluded.delete(x);
    }
  }

  private save(): void {
    const state: PersistedState = {
      included: [...this.included],
      excluded: [...this.excluded],
    };
    void this.context.workspaceState.update(STATE_KEY, state);
  }
}
