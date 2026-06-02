#!/usr/bin/env node
/**
 * Thin CLI bridge around {@link scanSelectionToString}, intended to be called
 * from non-Node hosts (e.g. a Visual Studio C# extension). It reads a JSON
 * request and writes the formatted scan output to stdout.
 *
 * Request shape (all fields except `includedFiles` optional):
 * {
 *   "rootDir": "C:\\proj",
 *   "includedFiles": ["C:\\proj\\src\\a.ts", ...],
 *   "includeEnvFiles": false,
 *   "stripComments": true,
 *   "removeBlankLines": false
 * }
 *
 * Usage:
 *   echo <json> | node scan-selection-cli.js     // request on stdin
 *   node scan-selection-cli.js request.json       // request from a file
 */
import * as fs from 'fs';
import { scanSelectionToString } from './scan-core';

interface Request {
  rootDir?: string;
  includedFiles?: string[];
  includeEnvFiles?: boolean;
  stripComments?: boolean;
  removeBlankLines?: boolean;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf-8');
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

  const text = await scanSelectionToString({
    rootDir: req.rootDir ?? process.cwd(),
    includedFiles: req.includedFiles ?? [],
    includeEnvFiles: req.includeEnvFiles ?? false,
    stripComments: req.stripComments ?? false,
    removeBlankLines: req.removeBlankLines ?? false,
  });

  process.stdout.write(text);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  });
}
