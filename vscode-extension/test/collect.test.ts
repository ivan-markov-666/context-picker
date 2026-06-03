import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SelectionModel } from '../src/SelectionModel';
import { collectAllFiles, summarizeSelection, collectSelectedFiles } from '../src/collect';

function fakeContext(): any {
  let stored: unknown;
  return {
    workspaceState: {
      get: () => stored,
      update: (_k: string, v: unknown) => {
        stored = v;
        return Promise.resolve();
      },
    },
  };
}

async function makeFixture(): Promise<string> {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'collect-test-'));
  await fs.promises.writeFile(path.join(root, 'a.txt'), 'hello'); // 5 bytes
  await fs.promises.writeFile(path.join(root, 'b.ts'), 'xx'); // 2 bytes
  await fs.promises.mkdir(path.join(root, 'sub'));
  await fs.promises.writeFile(path.join(root, 'sub', 'c.md'), 'abc'); // 3 bytes
  await fs.promises.mkdir(path.join(root, 'node_modules'));
  await fs.promises.writeFile(path.join(root, 'node_modules', 'x.js'), 'zzzz');
  return root;
}

describe('collectAllFiles', () => {
  let root: string;
  before(async () => {
    root = await makeFixture();
  });
  after(async () => {
    await fs.promises.rm(root, { recursive: true, force: true });
  });

  test('collects every non-ignored file under a directory', async () => {
    const out: string[] = [];
    await collectAllFiles(root, out);
    const names = out.map((f) => path.basename(f)).sort();
    assert.deepEqual(names, ['a.txt', 'b.ts', 'c.md']);
    assert.ok(!out.some((f) => f.includes('node_modules')));
  });

  test('a file target yields just that file', async () => {
    const out: string[] = [];
    await collectAllFiles(path.join(root, 'a.txt'), out);
    assert.deepEqual(out.map((f) => path.basename(f)), ['a.txt']);
  });
});

describe('summarizeSelection', () => {
  let root: string;
  before(async () => {
    root = await makeFixture();
  });
  after(async () => {
    await fs.promises.rm(root, { recursive: true, force: true });
  });

  test('counts files and bytes for the whole selection', async () => {
    const m = new SelectionModel(fakeContext());
    m.include(root);
    const summary = await summarizeSelection(root, m);
    assert.equal(summary.files, 3);
    assert.equal(summary.bytes, 10); // 5 + 2 + 3
  });

  test('counts only the selected subtree', async () => {
    const m = new SelectionModel(fakeContext());
    m.include(path.join(root, 'sub'));
    const summary = await summarizeSelection(root, m);
    assert.equal(summary.files, 1);
    assert.equal(summary.bytes, 3);
  });

  test('empty selection summarizes to zero', async () => {
    const m = new SelectionModel(fakeContext());
    const summary = await summarizeSelection(root, m);
    assert.deepEqual(summary, { files: 0, bytes: 0 });
  });
});

describe('collectSelectedFiles', () => {
  let root: string;
  before(async () => {
    root = await makeFixture();
  });
  after(async () => {
    await fs.promises.rm(root, { recursive: true, force: true });
  });

  test('collects only selected files, ignoring node_modules', async () => {
    const m = new SelectionModel(fakeContext());
    m.include(path.join(root, 'a.txt'));
    m.include(path.join(root, 'sub'));
    const out: string[] = [];
    await collectSelectedFiles(root, m, out);
    assert.deepEqual(out.map((f) => path.basename(f)).sort(), ['a.txt', 'c.md']);
  });
});
