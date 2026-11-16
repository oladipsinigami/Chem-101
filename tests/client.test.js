'use strict';

/**
 * Structural checks on the browser bundle.
 *
 * A missing function reference (a call to a helper that was renamed or never
 * written) throws at runtime inside startExam, where the catch blocks make it
 * look like a working screen. These two checks make that class of bug fail in
 * CI instead: every bare call must resolve to a declaration, and every id the
 * client looks up must exist in the markup.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const js = fs.readFileSync(path.join(ROOT, 'app', 'public', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(ROOT, 'app', 'public', 'index.html'), 'utf8');

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}

const BUILTINS = new Set([
  'if', 'for', 'while', 'switch', 'catch', 'return', 'typeof', 'async', 'await',
  'function', 'new', 'delete', 'void', 'in', 'of', 'do', 'else', 'try', 'throw',
  'Number', 'String', 'Boolean', 'Date', 'Math', 'JSON', 'Object', 'Array', 'Set',
  'Map', 'Promise', 'Error', 'fetch', 'setTimeout', 'clearTimeout', 'setInterval',
  'clearInterval', 'parseInt', 'parseFloat', 'isNaN', 'structuredClone', 'URL',
  'encodeURIComponent', 'decodeURIComponent', 'requestAnimationFrame',
]);

test('every bare call in the client resolves to a declaration', () => {
  const code = stripComments(js);
  const declared = new Set();
  for (const match of code.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)) declared.add(match[1]);
  for (const match of code.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g)) declared.add(match[1]);
  for (const match of code.matchAll(/(?:const|let|var)\s*\{([^}]*)\}/g)) {
    for (const part of match[1].split(',')) declared.add(part.split(':').pop().trim());
  }
  for (const match of code.matchAll(/(?:\(|,)\s*([A-Za-z_$][\w$]*)\s*(?:,|\))\s*=>/g)) {
    declared.add(match[1]);
  }

  const unresolved = new Set();
  // Drop string and template literals so prose cannot masquerade as a call.
  const bare = code.replace(/'[^'\n]*'/g, "''").replace(/`[^`]*`/g, '``').replace(/"[^"\n]*"/g, '""');
  for (const match of bare.matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) {
    const name = match[2];
    if (BUILTINS.has(name) || declared.has(name)) continue;
    unresolved.add(name);
  }
  assert.deepEqual([...unresolved].sort(), [], `undefined client calls: ${[...unresolved]}`);
});

test('every static id the client looks up exists in the markup', () => {
  const ids = new Set();
  for (const match of js.matchAll(/\$\('([A-Za-z0-9_-]+)'\)/g)) ids.add(match[1]);
  const missing = [...ids].filter((id) => !new RegExp(`id="${id}"`).test(html));
  assert.deepEqual(missing, [], `markup is missing ids: ${missing}`);
});

test('the bundle is loaded as a same-origin asset with no inline script', () => {
  assert.match(html, /<script src="\/app\.js"><\/script>/);
  assert.ok(!/<script(?![^>]*src=)/i.test(html), 'inline script found');
  assert.match(html, /<link rel="stylesheet" href="\/app\.css">/);
});

test('the client never asks for a score, grade, or answer key', () => {
  assert.ok(!/\/api\/(result|score|grade)/i.test(js));
  assert.ok(!/correctAnswer|displayAnswer|bankVersion/i.test(js));
});
