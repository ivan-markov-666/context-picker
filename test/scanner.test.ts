import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runScan, parseArgs, ScannerCliOptions } from '../src/scanner';

const silentLogger = { log: () => {}, warn: () => {}, error: () => {} };

async function makeFixture(): Promise<string> {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'scanner-test-'));
  await fs.promises.writeFile(path.join(root, 'a.txt'), 'hello world', 'utf-8');
  await fs.promises.writeFile(path.join(root, 'code.js'), '// secret comment\nconst x = 1;\n', 'utf-8');
  await fs.promises.writeFile(path.join(root, '.env'), 'SECRET=super-secret', 'utf-8');
  // A non-text (binary-ish) file
  await fs.promises.writeFile(path.join(root, 'image.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  await fs.promises.mkdir(path.join(root, 'sub'));
  await fs.promises.writeFile(path.join(root, 'sub', 'b.md'), '# title', 'utf-8');
  return root;
}

function baseOptions(root: string, overrides: Partial<ScannerCliOptions> = {}): ScannerCliOptions {
  return {
    targetDir: root,
    blacklistPath: path.join(root, 'does-not-exist-blacklist.txt'),
    outputPath: path.join(root, 'out.txt'),
    includeEnvFiles: false,
    stripComments: false,
    help: false,
    ...overrides,
  };
}

describe('runScan', () => {
  let root: string;

  beforeEach(async () => {
    root = await makeFixture();
  });

  // Clean each fixture after the test that created it.
  test('writes paths and text-file contents to the output file', async () => {
    const opts = baseOptions(root);
    const stats = await runScan(opts, silentLogger);
    const output = await fs.promises.readFile(opts.outputPath, 'utf-8');

    assert.ok(output.includes('a.txt'), 'should list a.txt');
    assert.ok(output.includes('hello world'), 'should include text content');
    assert.ok(output.includes('sub/b.md'), 'should list nested files with forward slashes');
    assert.ok(output.includes('# title'), 'should include nested content');
    assert.ok(stats.files >= 4);
    assert.ok(stats.dirs >= 1);

    await fs.promises.rm(root, { recursive: true, force: true });
  });

  test('marks non-text files as binary', async () => {
    const opts = baseOptions(root);
    await runScan(opts, silentLogger);
    const output = await fs.promises.readFile(opts.outputPath, 'utf-8');
    assert.ok(output.includes('image.png'));
    assert.ok(output.includes('[Binary or non-text content not shown]'));

    await fs.promises.rm(root, { recursive: true, force: true });
  });

  test('skips .env content by default', async () => {
    const opts = baseOptions(root);
    const stats = await runScan(opts, silentLogger);
    const output = await fs.promises.readFile(opts.outputPath, 'utf-8');
    assert.ok(!output.includes('super-secret'), '.env content must not leak by default');
    assert.ok(output.includes('[.env file - content skipped according to settings]'));
    assert.equal(stats.envFiles, 1);

    await fs.promises.rm(root, { recursive: true, force: true });
  });

  test('includes .env content when enabled', async () => {
    const opts = baseOptions(root, { includeEnvFiles: true });
    await runScan(opts, silentLogger);
    const output = await fs.promises.readFile(opts.outputPath, 'utf-8');
    assert.ok(output.includes('SECRET=super-secret'));
    assert.ok(output.includes('### .env file content ###'));

    await fs.promises.rm(root, { recursive: true, force: true });
  });

  test('strips comments when enabled', async () => {
    const opts = baseOptions(root, { stripComments: true });
    await runScan(opts, silentLogger);
    const output = await fs.promises.readFile(opts.outputPath, 'utf-8');
    assert.ok(!output.includes('secret comment'), 'comment should be stripped');
    assert.ok(output.includes('const x = 1;'), 'code should remain');

    await fs.promises.rm(root, { recursive: true, force: true });
  });

  test('handles an unwritable output path without hanging or throwing', async () => {
    // Output directory does not exist -> the write stream emits an error.
    const opts = baseOptions(root, {
      outputPath: path.join(root, 'missing-dir', 'out.txt'),
    });
    const stats = await runScan(opts, silentLogger);
    // It should resolve (not hang) and return stats rather than throwing.
    assert.ok(stats);
    assert.equal(fs.existsSync(opts.outputPath), false);

    await fs.promises.rm(root, { recursive: true, force: true });
  });

  test('does not scan its own output file', async () => {
    const opts = baseOptions(root);
    await runScan(opts, silentLogger);
    const output = await fs.promises.readFile(opts.outputPath, 'utf-8');
    // The output file's own relative path should never appear in the output.
    assert.ok(!output.includes('out.txt'), 'output file must be excluded from the scan');

    await fs.promises.rm(root, { recursive: true, force: true });
  });
});

describe('parseArgs', () => {
  test('uses sensible defaults', () => {
    const opts = parseArgs(['node', 'scanner', '--dir', '/project']);
    assert.equal(opts.targetDir, '/project');
    assert.equal(opts.includeEnvFiles, false);
    assert.equal(opts.stripComments, false);
    assert.equal(opts.blacklistPath, path.join('/project', 'blacklist.txt'));
    assert.equal(opts.outputPath, path.join('/project', 'project_files.txt'));
  });

  test('parses all flags', () => {
    const opts = parseArgs([
      'node', 'scanner',
      '-d', '/p', '-b', 'bl.txt', '-o', 'o.txt', '-e', '-s',
    ]);
    assert.equal(opts.targetDir, '/p');
    assert.equal(opts.blacklistPath, 'bl.txt');
    assert.equal(opts.outputPath, 'o.txt');
    assert.equal(opts.includeEnvFiles, true);
    assert.equal(opts.stripComments, true);
  });

  test('treats a bare positional argument as the target directory', () => {
    const opts = parseArgs(['node', 'scanner', '/some/dir']);
    assert.equal(opts.targetDir, '/some/dir');
  });

  test('flags help', () => {
    assert.equal(parseArgs(['node', 'scanner', '--help']).help, true);
  });
});
