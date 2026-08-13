import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  buildTree,
  buildTreeFromPaths,
  renderTree,
  countTree,
  resolveRootName,
  buildProjectTree,
  parseTreeArgs,
  TreeNode,
} from '../src/tree';

async function makeFixture(): Promise<string> {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'tree-test-'));
  await fs.promises.mkdir(path.join(root, 'src'));
  await fs.promises.mkdir(path.join(root, 'src', 'nested'));
  await fs.promises.mkdir(path.join(root, 'node_modules', 'pkg'), { recursive: true });
  await fs.promises.mkdir(path.join(root, '.git'));
  await fs.promises.writeFile(path.join(root, 'package.json'), '{}');
  await fs.promises.writeFile(path.join(root, 'README.md'), '# readme');
  await fs.promises.writeFile(path.join(root, 'src', 'a.ts'), 'a');
  await fs.promises.writeFile(path.join(root, 'src', 'b.ts'), 'b');
  await fs.promises.writeFile(path.join(root, 'src', 'nested', 'deep.ts'), 'deep');
  await fs.promises.writeFile(path.join(root, 'node_modules', 'pkg', 'index.js'), 'x');
  await fs.promises.writeFile(path.join(root, '.git', 'config'), 'cfg');
  return root;
}

describe('buildTree', () => {
  let root: string;

  before(async () => {
    root = await makeFixture();
  });

  after(async () => {
    await fs.promises.rm(root, { recursive: true, force: true });
  });

  test('lists directories before files, alphabetically', async () => {
    const nodes = await buildTree(root, root, { blacklist: ['node_modules', '.git'] });
    const names = nodes.map((n) => n.name);
    assert.deepEqual(names, ['src', 'package.json', 'README.md']);
  });

  test('excludes blacklisted directories', async () => {
    const nodes = await buildTree(root, root, { blacklist: ['node_modules', '.git'] });
    assert.ok(!nodes.some((n) => n.name === 'node_modules'));
    assert.ok(!nodes.some((n) => n.name === '.git'));
  });

  test('recurses into subdirectories', async () => {
    const nodes = await buildTree(root, root, { blacklist: ['node_modules', '.git'] });
    const src = nodes.find((n) => n.name === 'src');
    assert.ok(src);
    assert.equal(src!.isDirectory, true);
    const nested = src!.children.find((n) => n.name === 'nested');
    assert.ok(nested);
    assert.deepEqual(nested!.children.map((n) => n.name), ['deep.ts']);
  });

  test('respects maxDepth', async () => {
    const nodes = await buildTree(root, root, { blacklist: ['node_modules', '.git'], maxDepth: 1 });
    const src = nodes.find((n) => n.name === 'src');
    assert.ok(src);
    // depth 1 means we list src but do not descend into it
    assert.deepEqual(src!.children, []);
  });
});

describe('renderTree', () => {
  test('renders a tree with box-drawing connectors and the project name as root', () => {
    const tree: TreeNode = {
      name: 'my-project',
      isDirectory: true,
      children: [
        {
          name: 'src',
          isDirectory: true,
          children: [
            { name: 'a.ts', isDirectory: false, children: [] },
            { name: 'b.ts', isDirectory: false, children: [] },
          ],
        },
        { name: 'package.json', isDirectory: false, children: [] },
      ],
    };

    const expected = [
      'my-project',
      '├── src/',
      '│   ├── a.ts',
      '│   └── b.ts',
      '└── package.json',
    ].join('\n');

    assert.equal(renderTree(tree), expected);
  });

  test('honours a custom (or empty) directory suffix', () => {
    const tree: TreeNode = {
      name: 'root',
      isDirectory: true,
      children: [{ name: 'dir', isDirectory: true, children: [] }],
    };
    assert.equal(renderTree(tree, { dirSuffix: '' }), 'root\n└── dir');
  });
});

describe('countTree', () => {
  test('counts directories and files excluding the root', () => {
    const tree: TreeNode = {
      name: 'root',
      isDirectory: true,
      children: [
        {
          name: 'src',
          isDirectory: true,
          children: [{ name: 'a.ts', isDirectory: false, children: [] }],
        },
        { name: 'package.json', isDirectory: false, children: [] },
      ],
    };
    assert.deepEqual(countTree(tree), { dirs: 1, files: 2 });
  });
});

describe('resolveRootName', () => {
  test('uses the folder name by default', () => {
    assert.equal(resolveRootName('/some/path/my-app'), 'my-app');
  });

  test('prefers an explicit name when given', () => {
    assert.equal(resolveRootName('/some/path/my-app', 'custom'), 'custom');
  });
});

describe('buildProjectTree', () => {
  let root: string;

  before(async () => {
    root = await makeFixture();
  });

  after(async () => {
    await fs.promises.rm(root, { recursive: true, force: true });
  });

  test('applies the default ignore (node_modules/.git) without a blacklist file', async () => {
    const options = parseTreeArgs(['node', 'tree', '--dir', root]);
    const tree = await buildProjectTree(options, { log: () => {}, warn: () => {} });
    assert.equal(tree.name, path.basename(root));
    const names = tree.children.map((n) => n.name);
    assert.ok(!names.includes('node_modules'));
    assert.ok(!names.includes('.git'));
    assert.ok(names.includes('src'));
  });

  test('--all includes node_modules and .git', async () => {
    const options = parseTreeArgs(['node', 'tree', '--dir', root, '--all']);
    const tree = await buildProjectTree(options, { log: () => {}, warn: () => {} });
    const names = tree.children.map((n) => n.name);
    assert.ok(names.includes('node_modules'));
    assert.ok(names.includes('.git'));
  });
});

describe('parseTreeArgs', () => {
  test('parses depth, name and flags', () => {
    const opts = parseTreeArgs(['node', 'tree', '-d', '/x', '-L', '2', '-n', 'proj', '-a']);
    assert.equal(opts.targetDir, '/x');
    assert.equal(opts.maxDepth, 2);
    assert.equal(opts.rootName, 'proj');
    assert.equal(opts.includeAll, true);
  });

  test('defaults to unlimited depth and folder-name root', () => {
    const opts = parseTreeArgs(['node', 'tree', '-d', '/x']);
    assert.equal(opts.maxDepth, Infinity);
    assert.equal(opts.rootName, undefined);
    assert.equal(opts.includeAll, false);
  });

  test('sets help when requested', () => {
    assert.equal(parseTreeArgs(['node', 'tree', '--help']).help, true);
  });
});

describe('buildTreeFromPaths', () => {
  const root = path.join(path.sep, 'proj');
  const abs = (...parts: string[]): string => path.join(root, ...parts);

  test('keeps only the folders that hold a selected file', () => {
    const nodes = buildTreeFromPaths(root, [abs('src', 'a.ts'), abs('docs', 'guide.md')]);
    const rendered = renderTree({ name: 'proj', isDirectory: true, children: nodes });
    assert.equal(
      rendered,
      ['proj', '├── docs/', '│   └── guide.md', '└── src/', '    └── a.ts'].join('\n')
    );
  });

  test('keeps the ancestor chain of a nested folder', () => {
    const nodes = buildTreeFromPaths(root, [abs('src', 'lib', 'deep', 'app.ts')]);
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0].name, 'src');
    assert.equal(nodes[0].children[0].name, 'lib');
    assert.equal(nodes[0].children[0].children[0].name, 'deep');
    assert.deepEqual(
      nodes[0].children[0].children[0].children.map((n) => n.name),
      ['app.ts']
    );
  });

  test('lists only the selected files of a folder, directories first', () => {
    const nodes = buildTreeFromPaths(root, [
      abs('src', 'b.ts'),
      abs('src', 'a.ts'),
      abs('src', 'nested', 'deep.ts'),
    ]);
    assert.deepEqual(
      nodes[0].children.map((n) => n.name),
      ['nested', 'a.ts', 'b.ts']
    );
  });

  test('sets the absolute path on every node', () => {
    const nodes = buildTreeFromPaths(root, [abs('src', 'a.ts')]);
    assert.equal(nodes[0].path, abs('src'));
    assert.equal(nodes[0].children[0].path, abs('src', 'a.ts'));
  });

  test('ignores duplicates and the root itself', () => {
    const nodes = buildTreeFromPaths(root, [abs('a.ts'), abs('a.ts'), root]);
    assert.deepEqual(
      nodes.map((n) => n.name),
      ['a.ts']
    );
  });

  test('returns nothing for an empty selection', () => {
    assert.deepEqual(buildTreeFromPaths(root, []), []);
  });

  test('counts as files-only (no folders invented)', () => {
    const nodes = buildTreeFromPaths(root, [abs('src', 'a.ts'), abs('README.md')]);
    const counts = countTree({ name: 'proj', isDirectory: true, children: nodes });
    assert.deepEqual(counts, { dirs: 1, files: 2 });
  });
});
