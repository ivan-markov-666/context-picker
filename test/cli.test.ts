import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { main as scannerMain } from '../src/scanner';
import { main as treeMain } from '../src/tree';

/**
 * Temporarily captures console output so CLI entry points can be tested without
 * spamming the test reporter, and so stdout can be asserted on.
 */
function captureConsole() {
  const logs: string[] = [];
  const errs: string[] = [];
  const orig = { log: console.log, error: console.error, warn: console.warn };
  console.log = (...a: unknown[]) => void logs.push(a.join(' '));
  console.error = (...a: unknown[]) => void errs.push(a.join(' '));
  console.warn = (...a: unknown[]) => void errs.push(a.join(' '));
  return {
    logs,
    errs,
    restore() {
      console.log = orig.log;
      console.error = orig.error;
      console.warn = orig.warn;
    },
  };
}

async function makeFixture(): Promise<string> {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'cli-test-'));
  await fs.promises.mkdir(path.join(root, 'src'));
  await fs.promises.writeFile(path.join(root, 'src', 'a.ts'), 'const a = 1;', 'utf-8');
  await fs.promises.writeFile(path.join(root, 'README.md'), '# hi', 'utf-8');
  return root;
}

describe('scanner main()', () => {
  let root: string;

  before(async () => {
    root = await makeFixture();
  });

  after(async () => {
    await fs.promises.rm(root, { recursive: true, force: true });
  });

  test('--help prints help and writes no output file', async () => {
    const out = path.join(root, 'should-not-exist.txt');
    const cap = captureConsole();
    try {
      await scannerMain(['node', 'scanner', '--help', '-o', out]);
    } finally {
      cap.restore();
    }
    assert.ok(cap.logs.join('\n').includes('Directory Scanner'));
    // --help returns early, so the configured output file is never created.
    assert.equal(fs.existsSync(out), false);
  });

  test('runs a scan and writes the output file', async () => {
    const out = path.join(root, 'scan-out.txt');
    const cap = captureConsole();
    try {
      await scannerMain(['node', 'scanner', '-d', root, '-o', out]);
    } finally {
      cap.restore();
    }
    const content = await fs.promises.readFile(out, 'utf-8');
    assert.ok(content.includes('src/a.ts'));
    assert.ok(content.includes('const a = 1;'));
  });
});

describe('tree main()', () => {
  let root: string;

  before(async () => {
    root = await makeFixture();
  });

  after(async () => {
    await fs.promises.rm(root, { recursive: true, force: true });
  });

  test('--help prints tree help', async () => {
    const cap = captureConsole();
    try {
      await treeMain(['node', 'tree', '--help']);
    } finally {
      cap.restore();
    }
    assert.ok(cap.logs.join('\n').includes('Directory Tree'));
  });

  test('prints the tree to stdout with the folder name as root', async () => {
    const cap = captureConsole();
    try {
      await treeMain(['node', 'tree', '-d', root]);
    } finally {
      cap.restore();
    }
    const stdout = cap.logs.join('\n');
    assert.ok(stdout.includes(path.basename(root)));
    assert.ok(stdout.includes('src/'));
    assert.ok(stdout.includes('a.ts'));
  });

  test('--output writes the tree to a file', async () => {
    const out = path.join(root, 'tree-out.txt');
    const cap = captureConsole();
    try {
      await treeMain(['node', 'tree', '-d', root, '-o', out]);
    } finally {
      cap.restore();
    }
    const content = await fs.promises.readFile(out, 'utf-8');
    assert.ok(content.includes(path.basename(root)));
    assert.ok(content.includes('src/'));
    // stdout (logs) should NOT contain the tree when writing to a file.
    assert.ok(!cap.logs.join('\n').includes('└──'));
  });
});
