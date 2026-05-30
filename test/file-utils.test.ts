import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { isEnvFile, isTextFile, safeReadFile } from '../src/file-utils';

describe('isEnvFile', () => {
  test('matches plain .env', () => {
    assert.equal(isEnvFile('/project/.env'), true);
  });

  test('matches .env.<suffix> variants', () => {
    assert.equal(isEnvFile('/project/.env.local'), true);
    assert.equal(isEnvFile('/project/.env.production'), true);
  });

  test('matches *.env files', () => {
    assert.equal(isEnvFile('config/prod.env'), true);
  });

  test('is case-insensitive', () => {
    assert.equal(isEnvFile('/project/.ENV'), true);
  });

  test('does not match unrelated files', () => {
    assert.equal(isEnvFile('/project/environment.ts'), false);
    assert.equal(isEnvFile('/project/readme.md'), false);
  });
});

describe('isTextFile', () => {
  test('detects common text extensions', () => {
    assert.equal(isTextFile('a/b/index.ts'), true);
    assert.equal(isTextFile('styles.css'), true);
    assert.equal(isTextFile('data.json'), true);
  });

  test('detects well-known extension-less files', () => {
    assert.equal(isTextFile('project/Dockerfile'), true);
    assert.equal(isTextFile('project/Makefile'), true);
    assert.equal(isTextFile('project/LICENSE'), true);
  });

  test('treats binary-ish extensions as non-text', () => {
    assert.equal(isTextFile('image.png'), false);
    assert.equal(isTextFile('archive.zip'), false);
    assert.equal(isTextFile('app.exe'), false);
  });

  test('is case-insensitive on the extension', () => {
    assert.equal(isTextFile('README.MD'), true);
  });
});

describe('safeReadFile', () => {
  let tmpDir: string;

  before(async () => {
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'fileutils-test-'));
  });

  after(async () => {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  });

  test('reads an existing file', async () => {
    const file = path.join(tmpDir, 'hello.txt');
    await fs.promises.writeFile(file, 'hello world', 'utf-8');
    assert.equal(await safeReadFile(file), 'hello world');
  });

  test('returns a bracketed error message instead of throwing', async () => {
    const result = await safeReadFile(path.join(tmpDir, 'missing.txt'));
    assert.match(result, /^\[Error reading file: /);
  });
});
