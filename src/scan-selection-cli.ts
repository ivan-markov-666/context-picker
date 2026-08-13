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
 *   mode "skeleton" -> the skeleton (tree) of the selected files, as text
 *     { mode, rootDir, includedFiles[] }
 *
 * Usage:  echo <json> | node scan-selection.js      |      node scan-selection.js request.json
 */
import * as fs from 'fs';
import { scanSelectionToString, copySelectionToDir } from './scan-core';
import { buildTree, buildTreeFromPaths, renderTree, resolveRootName, TreeNode } from './tree-core';
import { DEFAULT_IGNORE } from './blacklist';
import { createGitignorePredicate } from './gitignore';

interface Request {
  mode?: 'scan' | 'tree' | 'skeleton' | 'count' | 'copyfiles';
  rootDir?: string;
  /** copyfiles mode only: destination directory for the exported copies. */
  targetDir?: string;
  includedFiles?: string[];
  includeEnvFiles?: boolean;
  stripComments?: boolean;
  removeBlankLines?: boolean;
  respectGitignore?: boolean;
  /** copyfiles mode only: append .txt to each copied file's name. */
  appendTxt?: boolean;
  /** copyfiles mode only: encode each file's relative path (vs rootDir) into its name. */
  pathInName?: boolean;
  /** copyfiles mode only: separator used when pathInName is set (default "__"). */
  separator?: string;
  /** copyfiles mode only: mirror the target (write only changed, delete stale) instead of wiping it. */
  syncOnly?: boolean;
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

  if (mode === 'scan' || mode === 'count') {
    const text = await scanSelectionToString({
      rootDir,
      includedFiles: req.includedFiles ?? [],
      includeEnvFiles: req.includeEnvFiles ?? false,
      stripComments: req.stripComments ?? false,
      removeBlankLines: req.removeBlankLines ?? false,
    });
    if (mode === 'count') {
      // Return just the size, so the host can show a live counter cheaply.
      const chars = text.length;
      const lines = chars === 0 ? 0 : text.split(/\r\n|\r|\n/).length;
      process.stdout.write(lines + '\t' + chars);
    } else {
      process.stdout.write(text);
    }
    return;
  }

  if (mode === 'copyfiles') {
    if (!req.targetDir) {
      process.stderr.write('scan-selection: copyfiles requires a targetDir\n');
      process.exitCode = 2;
      return;
    }
    const written = await copySelectionToDir({
      targetDir: req.targetDir,
      includedFiles: req.includedFiles ?? [],
      stripComments: req.stripComments ?? false,
      removeBlankLines: req.removeBlankLines ?? false,
      includeEnvFiles: req.includeEnvFiles ?? false,
      appendTxtExtension: req.appendTxt ?? false,
      rootDir: req.rootDir,
      pathInName: req.pathInName ?? false,
      pathSeparator: req.separator,
      syncOnly: req.syncOnly ?? false,
    });
    process.stdout.write(String(written));
    return;
  }

  if (mode === 'skeleton') {
    // The skeleton mirrors the selection: only the folders holding one of the
    // given files (plus their ancestors) are listed. No walk, no excludes — the
    // host's file list has already been filtered.
    const children = buildTreeFromPaths(rootDir, req.includedFiles ?? []);
    const root: TreeNode = { name: resolveRootName(rootDir), isDirectory: true, children };
    process.stdout.write(renderTree(root));
    return;
  }

  if (mode === 'tree') {
    // The checkbox view walks the workspace, honouring .gitignore and the
    // default ignores so it stays clean.
    const isIgnored = await createGitignorePredicate([rootDir], req.respectGitignore ?? true);
    const children = await buildTree(rootDir, rootDir, {
      blacklist: [...DEFAULT_IGNORE],
      isIgnored,
    });
    const lines: string[] = [];
    flattenTree(children, lines);
    process.stdout.write(lines.join('\n'));
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
