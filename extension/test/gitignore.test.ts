import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createGitignorePredicate } from '../src/gitignore';

describe('createGitignorePredicate', () => {
  let root: string;

  before(async () => {
    root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'gitignore-test-'));
    await fs.promises.writeFile(
      path.join(root, '.gitignore'),
      'node_modules/\ndist/\n*.log\n/secret.txt\n',
      'utf-8'
    );
  });

  after(async () => {
    await fs.promises.rm(root, { recursive: true, force: true });
  });

  const abs = (p: string): string => path.join(root, p);

  test('ignores directories matched by directory patterns', async () => {
    const pred = await createGitignorePredicate([root], true);
    assert.equal(pred(abs('dist'), true), true); // the directory itself
    assert.equal(pred(abs('dist/x.js'), false), true); // its contents
    assert.equal(pred(abs('node_modules'), true), true);
  });

  test('ignores files by glob and anchored patterns', async () => {
    const pred = await createGitignorePredicate([root], true);
    assert.equal(pred(abs('app.log'), false), true);
    assert.equal(pred(abs('secret.txt'), false), true); // anchored to root
    assert.equal(pred(abs(path.join('sub', 'secret.txt')), false), false); // not at root
  });

  test('does not ignore unmatched paths or the root', async () => {
    const pred = await createGitignorePredicate([root], true);
    assert.equal(pred(abs('src'), true), false);
    assert.equal(pred(abs('src/index.ts'), false), false);
    assert.equal(pred(root, true), false);
  });

  test('a FILE named like a directory-only pattern is not ignored', async () => {
    const pred = await createGitignorePredicate([root], true);
    // "dist/" only matches the directory; a file named "dist" must stay.
    assert.equal(pred(abs('dist'), false), false);
  });

  test('respect=false disables all filtering', async () => {
    const pred = await createGitignorePredicate([root], false);
    assert.equal(pred(abs('dist/x.js'), false), false);
    assert.equal(pred(abs('app.log'), false), false);
  });

  test('no .gitignore -> allow all', async () => {
    const empty = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'gi-empty-'));
    const pred = await createGitignorePredicate([empty], true);
    assert.equal(pred(path.join(empty, 'dist', 'x.js'), false), false);
    await fs.promises.rm(empty, { recursive: true, force: true });
  });
});
