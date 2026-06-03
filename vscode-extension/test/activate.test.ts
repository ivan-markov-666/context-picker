import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'path';
import Module from 'module';

/**
 * Integration smoke test: load the *built* extension bundle with a minimal fake
 * `vscode` module and call `activate()`. This exercises the real esbuild output
 * (catching bundle-level problems like invalid JS) and verifies the tree view +
 * commands register without throwing — the failure mode we hit when bundled
 * license comments produced an invalid bundle.
 *
 * Requires `npm run build` first (the test script builds before running).
 */

const registeredCommands: string[] = [];
let createdViewId: string | undefined;

function makeFakeVscode(): any {
  class EventEmitter {
    event = (): { dispose(): void } => ({ dispose() {} });
    fire(): void {}
    dispose(): void {}
  }
  return {
    EventEmitter,
    window: {
      createTreeView: (id: string) => {
        createdViewId = id;
        return {
          onDidChangeCheckboxState: () => ({ dispose() {} }),
          message: '',
          dispose() {},
        };
      },
      showInformationMessage() {},
      showWarningMessage() {},
      showErrorMessage() {},
      withProgress: (_opts: unknown, task: (p: unknown, t: unknown) => unknown) =>
        Promise.resolve(
          task(
            { report() {} },
            { isCancellationRequested: false, onCancellationRequested: () => ({ dispose() {} }) }
          )
        ),
    },
    commands: {
      registerCommand: (id: string) => {
        registeredCommands.push(id);
        return { dispose() {} };
      },
    },
    workspace: {
      workspaceFolders: undefined,
      getConfiguration: () => ({ get: (_k: string, d: unknown) => d, update: () => Promise.resolve() }),
      onDidChangeConfiguration: () => ({ dispose() {} }),
    },
    env: { clipboard: { writeText: () => Promise.resolve() } },
    TreeItemCheckboxState: { Unchecked: 0, Checked: 1 },
    TreeItemCollapsibleState: { None: 0, Collapsed: 1 },
    ProgressLocation: { Notification: 15 },
    ConfigurationTarget: { Global: 1, Workspace: 2, WorkspaceFolder: 3 },
  };
}

describe('extension activate() (built bundle)', () => {
  let activate: (ctx: unknown) => void;
  let restore: () => void;

  before(() => {
    const fake = makeFakeVscode();
    const loader = Module as unknown as {
      _load: (request: string, parent: unknown, isMain: boolean) => unknown;
    };
    const original = loader._load;
    loader._load = function (request: string, parent: unknown, isMain: boolean): unknown {
      if (request === 'vscode') {
        return fake;
      }
      return original.call(this, request, parent, isMain);
    };
    restore = () => {
      loader._load = original;
    };

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bundle = require(path.join(__dirname, '..', 'dist', 'extension.js'));
    activate = bundle.activate;
  });

  after(() => {
    if (restore) {
      restore();
    }
  });

  test('the built bundle exports activate()', () => {
    assert.equal(typeof activate, 'function');
  });

  test('activates without throwing and registers the tree view + commands', () => {
    const context = {
      subscriptions: [] as unknown[],
      workspaceState: { get: () => undefined, update: () => Promise.resolve() },
    };

    assert.doesNotThrow(() => activate(context));
    assert.equal(createdViewId, 'projectContext.tree');

    const expected = [
      'projectContext.generate',
      'projectContext.copySkeleton',
      'projectContext.enableStripComments',
      'projectContext.disableStripComments',
      'projectContext.enableRemoveBlankLines',
      'projectContext.disableRemoveBlankLines',
      'projectContext.showGitignored',
      'projectContext.respectGitignore',
      'projectContext.refresh',
      'projectContext.clear',
      'projectContext.addFromExplorer',
      'projectContext.copyContentsHere',
      'projectContext.skeletonHere',
    ];
    for (const id of expected) {
      assert.ok(registeredCommands.includes(id), `command "${id}" should be registered`);
    }
  });
});
