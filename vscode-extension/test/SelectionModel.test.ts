import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'path';
import { SelectionModel } from '../src/SelectionModel';

// Minimal fake of vscode.ExtensionContext.workspaceState.
function fakeContext(): any {
  let stored: unknown;
  return {
    workspaceState: {
      get: () => stored,
      update: (_key: string, value: unknown) => {
        stored = value;
        return Promise.resolve();
      },
    },
  };
}

const ROOT = path.resolve(path.sep === '\\' ? 'C:\\proj' : '/proj');
const src = path.join(ROOT, 'src');
const cli = path.join(src, 'cli.ts');
const cfg = path.join(src, 'config.ts');

describe('SelectionModel', () => {
  let m: SelectionModel;
  beforeEach(() => {
    m = new SelectionModel(fakeContext());
  });

  test('checking a folder selects descendants and is not partial', () => {
    m.include(src);
    assert.equal(m.isSelected(src), true);
    assert.equal(m.isSelected(cli), true);
    assert.equal(m.isPartial(src), false);
    assert.equal(m.isPartial(ROOT), true); // root has a selected descendant
  });

  test('checking SOME files marks the parent folder partial', () => {
    m.include(cli);
    assert.equal(m.isSelected(cli), true);
    assert.equal(m.isSelected(cfg), false);
    assert.equal(m.isPartial(src), true); // <-- reported as not working
  });

  test('excluding a child of a checked folder marks the folder partial', () => {
    m.include(src);
    m.exclude(cli);
    assert.equal(m.isSelected(cli), false);
    assert.equal(m.isSelected(cfg), true);
    assert.equal(m.isPartial(src), true); // <-- reported as not working
  });
});
