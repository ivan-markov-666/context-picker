import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { stripCommentsFromFile, isCommentStrippingSupported } from '../src/comment-stripper';

describe('stripCommentsFromFile', () => {
  test('removes line and block comments from JavaScript', () => {
    const input = '// a comment\nconst x = 5; /* inline */\n';
    const output = stripCommentsFromFile(input, 'example.js');
    assert.ok(!output.includes('a comment'), 'line comment should be removed');
    assert.ok(!output.includes('inline'), 'block comment should be removed');
    assert.ok(output.includes('const x = 5;'), 'code should be preserved');
  });

  test('removes # comments from Python', () => {
    const input = '# comment\nx = 1\n';
    const output = stripCommentsFromFile(input, 'script.py');
    assert.ok(!output.includes('comment'));
    assert.ok(output.includes('x = 1'));
  });

  test('returns the original content for unsupported file types', () => {
    const input = 'some plain text with // not really a comment';
    const output = stripCommentsFromFile(input, 'notes.unknownext');
    assert.equal(output, input);
  });
});

describe('isCommentStrippingSupported', () => {
  test('returns true for supported languages', () => {
    assert.equal(isCommentStrippingSupported('app.ts'), true);
    assert.equal(isCommentStrippingSupported('main.py'), true);
  });

  test('returns false for unknown file types', () => {
    assert.equal(isCommentStrippingSupported('archive.xyz'), false);
  });
});
