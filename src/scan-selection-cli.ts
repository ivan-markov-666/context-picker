#!/usr/bin/env node
/**
 * Node "bridge" CLI for non-Node hosts (e.g. a Visual Studio C# extension).
 * Reads a JSON request from stdin (or a file arg) and writes the result to
 * stdout. Three modes:
 *
 *   mode "scan"     -> formatted contents of the given files (default)
 *     { mode, rootDir, includedFiles[], includeEnvFiles, stripComments, removeBlankLines }
 *   mode "tree"     -> JSON listing of the workspace for a checkbox UI
 *     { mode, rootDir, respectGitignore }
 *   mode "skeleton" -> the project skeleton (tree) as text
 *     { mode, rootDir, respectGitignore }
 *
 * Usage:  echo <json> | node scan-selection.js      |      node scan-selection.js request.json
 */
import * as fs from 'fs';
import { scanSelectionToString } from './scan-core';
import { buildTree, renderTree, resolveRootName, TreeNode } from './tree-core';
import { DEFAULT_IGNORE } from './blacklist';
import { createGitignorePredicate } from './gitignore';

interface Request {
  mode?: 'scan' | 'tree' | 'skeleton';
  rootDir?: string;
  includedFiles?: string[];
  includeEnvFiles?: boolean;
  stripComments?: boolean;
  removeBlankLines?: boolean;
  respectGitignore?: boolean;
  /** skeleton mode only: explicit folder-name excludes (overrides DEFAULT_IGNORE). */
  excludeFolders?: string[];
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Flattens the tree into pre-order lines `D\t<absPath>` / `F\t<absPath>` so a
 * host can rebuild the hierarchy with zero dependencies (a parent line always
 * precedes its children). One line per entry; directories first within a folder.
 */
function flattenTree(nodes: TreeNode[], out: string[]): void {
  for (const node of nodes) {
    out.push(`${node.isDirectory ? 'D' : 'F'}\t${node.path ?? ''}`);
    if (node.isDirectory) {
      flattenTree(node.children, out);
    }
  }
}

export async function main(argv: string[] = process.argv): Promise<void> {
  const fileArg = argv[2];
  const raw = fileArg ? fs.readFileSync(fileArg, 'utf-8') : await readStdin();

  let req: Request;
  try {
    req = JSON.parse(raw) as Request;
  } catch (error) {
    process.stderr.write(`scan-selection: invalid JSON request: ${String(error)}\n`);
    process.exitCode = 2;
    return;
  }

  const rootDir = req.rootDir ?? process.cwd();
  const mode = req.mode ?? 'scan';

  if (mode === 'scan') {
    const text = await scanSelectionToString({
      rootDir,
      includedFiles: req.includedFiles ?? [],
      includeEnvFiles: req.includeEnvFiles ?? false,
      stripComments: req.stripComments ?? false,
      removeBlankLines: req.removeBlankLines ?? false,
    });
    process.stdout.write(text);
    return;
  }

  // tree / skeleton both walk the directory honouring .gitignore. The tree keeps
  // the default ignores so the checkbox view stays clean; the skeleton may be
  // given an explicit folder-exclude list by the host (see excludeFolders).
  const isIgnored = await createGitignorePredicate([rootDir], req.respectGitignore ?? true);
  const blacklist =
    mode === 'skeleton' && Array.isArray(req.excludeFolders)
      ? req.excludeFolders
      : [...DEFAULT_IGNORE];
  const children = await buildTree(rootDir, rootDir, { blacklist, isIgnored });

  if (mode === 'tree') {
    const lines: string[] = [];
    flattenTree(children, lines);
    process.stdout.write(lines.join('\n'));
    return;
  }

  if (mode === 'skeleton') {
    const root: TreeNode = { name: resolveRootName(rootDir), isDirectory: true, children };
    process.stdout.write(renderTree(root));
    return;
  }

  process.stderr.write(`scan-selection: unknown mode "${mode}"\n`);
  process.exitCode = 2;
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  });
}
