# Bug report: `removeComments` hangs (infinite loop / catastrophic backtracking) on JavaScript input that mixes regex literals with `//` comments

## Summary
`removeComments(code, { language: 'javascript' })` **never returns** for certain
JavaScript inputs. The call pins one CPU core at 100% and hangs indefinitely
(no error, no timeout). Because the function is synchronous and CPU-bound, it
freezes any host that calls it (e.g. a VS Code extension — the whole extension
host becomes unresponsive and cannot be cancelled).

The trigger is JavaScript source that **interleaves regex literals (`/.../`) with
`//` line comments**. comment-bear's own `dist/detectors/language-detector.js`
triggers it.

## Affected versions
- Reproduced on **comment-bear 1.2.1** and **1.2.0** (so it is a pre-existing
  bug, not a 1.2.1 regression). Earlier versions are likely affected too.
- Node.js v25 (Windows), but the cause is a regex/parser issue, so it is
  platform- and Node-version-independent.

## Severity
High. A single bad input hangs the process forever. For any tool that strips
comments over many files (CLIs, editor extensions), one triggering file makes
the whole tool hang with no way to recover except killing the process.

## Reproduction A — self-contained (uses comment-bear's own file)
```js
const { removeComments } = require('comment-bear');
const fs = require('fs');

const code = fs.readFileSync(
  require.resolve('comment-bear/dist/detectors/language-detector.js'),
  'utf8'
);

console.log('start');
removeComments(code, { language: 'javascript' }); // <-- never returns
console.log('done'); // unreachable
```
Run it: prints `start`, then hangs forever (kill with Ctrl+C).

## Reproduction B — minimal (367 chars, auto-bisected)
Save this as `input.js`:
```js
        /\bputs\s+["']/.test(trimmed) ||
        // Ruby's begin/end blocks
        /\bbegin\b[\s\S]*?\bend\b/m.test(trimmed) ||
        // Ruby's do/end blocks
        /\bdo\s*\|.*\|\s*\n[\s\S]*?\n\s*end\b/m.test(trimmed) ||
        // Ruby's multi-line comments
        /^=begin\s*\n[\s\S]*?\n=end\b/m.test(trimmed)) {
        return 'ruby';
    }
    // Haskell -
```
Then:
```js
const { removeComments } = require('comment-bear');
const fs = require('fs');
removeComments(fs.readFileSync('input.js', 'utf8'), { language: 'javascript' }); // hangs
```

This minimal case is what makes it obvious: the input is a sequence of
**regex literals** (`/\bputs\s+["']/`, `/\bbegin\b[\s\S]*?\bend\b/m`,
`/\bdo\s*\|.*\|\s*\n[\s\S]*?\n\s*end\b/m`, …) separated by **`//` line comments**.

## Expected vs actual
- **Expected:** `removeComments` returns the code with comments removed (or, if
  it cannot safely parse, returns quickly / unchanged).
- **Actual:** the call never returns.

## Root-cause hypothesis
The JavaScript comment remover must distinguish, in a single scan, between:
`//` line comments, `/* */` block comments, string literals (`'…'`, `"…"`,
`` `…` ``) and **regex literals** (`/…/flags`). The tokenizer almost certainly
uses a regular expression with **nested/ambiguous quantifiers** (e.g. something
shaped like `\/(?:\\.|[^\/\\\n])*\/` combined with alternations for comments and
strings). On input that contains many `/`, `\`, `|`, `[`, `]` and `//` sequences
(exactly what these regex-literal-heavy lines contain), this backtracks
catastrophically — effectively an infinite loop.

The decisive clue: the input that hangs is *code that itself contains regex
literals next to `//` comments*. The remover mis-tokenizes a `/` (start of a
regex literal) vs `//` (start of a line comment) and backtracks.

## Suggested fix
1. **Replace the backtracking regex with a linear single-pass scanner.** Walk the
   source character by character with a small state machine (states: code,
   line-comment, block-comment, single/double/backtick string, regex literal).
   This is O(n) and cannot backtrack. Correct regex-literal detection needs the
   "previous significant token" heuristic (a `/` starts a regex only when the
   previous non-space token is an operator/keyword/`(`/`,`/`=`/`return`/…, not an
   identifier, number, `)` or `]`).
2. **Add a safety valve** as defense-in-depth: cap total scan iterations or wrap
   with a time budget, returning the original code if exceeded (so a pathological
   input degrades gracefully instead of hanging).
3. **Add regression tests** using Reproduction A (comment-bear's own
   `language-detector.js`) and Reproduction B (the 367-char minimal input). A
   fast unit test can assert the call completes within, say, 1 second.

## How it was found
Stripping comments across a project with comment-bear, the process hung. An
auto-bisection (each candidate substring run in a child process with a 2 s
timeout) reduced `language-detector.js` (13,408 chars) to the 367-char minimal
input above in 7 iterations. Specifying `{ language: 'javascript' }` reproduces
it directly, confirming the hang is in the **JavaScript remover**, not language
detection.
