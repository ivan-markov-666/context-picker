import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { isBlacklisted, readBlacklist } from '../src/blacklist';

const silentLogger = { log: () => {}, warn: () => {} };

describe('isBlacklisted', () => {
  test('matches a directory by exact name', () => {
    assert.equal(isBlacklisted('node_modules', ['node_modules']), true);
  });

  test('matches files inside a blacklisted directory', () => {
    assert.equal(isBlacklisted('node_modules/foo.js', ['node_modules']), true);
    assert.equal(isBlacklisted('dist/bundle.js', ['dist']), true);
  });

  test('matches a blacklisted directory at any depth (segment match)', () => {
    assert.equal(isBlacklisted('packages/app/node_modules/x.js', ['node_modules']), true);
  });

  test('does not match an unrelated path', () => {
    assert.equal(isBlacklisted('src/index.ts', ['node_modules']), false);
  });

  test('does not partially match a directory name', () => {
    // "source" should not be excluded by the pattern "src"
    assert.equal(isBlacklisted('source/index.ts', ['src']), false);
  });

  test('matches hidden directories like .git', () => {
    assert.equal(isBlacklisted('.git/config', ['.git']), true);
    assert.equal(isBlacklisted('sub/.git/config', ['.git']), true);
  });

  test('matches a file by name at any depth', () => {
    assert.equal(isBlacklisted('package-lock.json', ['package-lock.json']), true);
    assert.equal(isBlacklisted('nested/dir/package-lock.json', ['package-lock.json']), true);
  });

  test('does not exclude a different file with a similar name', () => {
    assert.equal(isBlacklisted('package.json', ['package-lock.json']), false);
  });

  test('handles trailing slashes in the blacklist entry', () => {
    assert.equal(isBlacklisted('build/output.js', ['build/']), true);
  });

  test('normalises backslash paths', () => {
    assert.equal(isBlacklisted('node_modules\\foo\\bar.js', ['node_modules']), true);
  });

  test('returns false for an empty blacklist', () => {
    assert.equal(isBlacklisted('anything/here.js', []), false);
  });

  test('ignores empty / whitespace-only blacklist entries', () => {
    assert.equal(isBlacklisted('src/index.ts', ['', '   ', '/']), false);
  });

  test('matches an extension-less file like LICENSE', () => {
    assert.equal(isBlacklisted('LICENSE', ['LICENSE']), true);
  });
});

describe('readBlacklist', () => {
  let tmpDir: string;

  before(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'blacklist-test-'));
  });

  after(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  test('parses entries, skipping comments and blank lines', async () => {
    const file = path.join(tmpDir, 'blacklist.txt');
    await fs.promises.writeFile(
      file,
      '# comment\nnode_modules\n\n  dist  \n# another\nLICENSE\n',
      'utf-8'
    );
    const result = await readBlacklist(file, silentLogger);
    assert.deepEqual(result, ['node_modules', 'dist', 'LICENSE']);
  });

  test('normalises backslashes to forward slashes', async () => {
    const file = path.join(tmpDir, 'win.txt');
    await fs.promises.writeFile(file, 'src\\generated\n', 'utf-8');
    const result = await readBlacklist(file, silentLogger);
    assert.deepEqual(result, ['src/generated']);
  });

  test('returns an empty array for a non-existent file', async () => {
    const result = await readBlacklist(path.join(tmpDir, 'nope.txt'), silentLogger);
    assert.deepEqual(result, []);
  });
});
