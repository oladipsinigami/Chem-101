'use strict';

/** Bank integrity, overlay application, and the public question shape. */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadBank, publicQuestion, canonicalHash } = require('../app/lib/bank');

const ROOT = path.resolve(__dirname, '..');
const bank = loadBank({ root: ROOT });

test('the bank loads and matches its display manifest', () => {
  assert.equal(bank.items.length, 119);
  assert.equal(bank.version, '950bc02e');
  assert.equal(bank.displayManifest.bank_version, '950bc02e');
});

test('nothing is waiting for human review', () => {
  assert.deepEqual(require(path.join(ROOT, 'bank', 'needs-review.json')), []);
  // Every item the manifest marks as needing typesetting has an override.
  assert.ok(bank.cleared.length >= 18);
  for (const id of bank.cleared) assert.ok(bank.overrides[id], id);
});

test('every item is drawable and has a keyed answer inside its options', () => {
  assert.equal(bank.drawable.size, bank.items.length);
  for (const item of bank.items) {
    assert.ok(item.options.length >= 4 && item.options.length <= 6, item.id);
    assert.ok(item.answer >= 0 && item.answer < item.options.length, item.id);
    assert.ok(item.topicLabel, item.id);
  }
});

test('option and answer counts match the published distribution', () => {
  const four = bank.items.filter((i) => i.options.length === 4).length;
  const five = bank.items.filter((i) => i.options.length === 5).length;
  assert.equal(four, 45);
  assert.equal(five, 74);
  assert.equal(bank.items.filter((i) => !i.option_shuffle).length, 9);
});

test('display overrides are applied and auditable', () => {
  const overridden = bank.items.filter((i) => i.displayOverridden);
  assert.ok(overridden.length >= 35, `expected at least 35 overrides, saw ${overridden.length}`);
  for (const item of overridden) {
    assert.ok(item.stemHtml && item.stemHtml.length > 0, item.id);
  }
});

test('no public question leaks the key, the seed, or a score', () => {
  for (const item of bank.items.slice(0, 30)) {
    const order = item.options.map((_, i) => i);
    const q = publicQuestion(item, order, 1);
    const json = JSON.stringify(q);
    assert.ok(!('answer' in q));
    assert.ok(!('correct' in q));
    assert.ok(!/displayAnswer|bankVersion|seed|percentage|grade|score/i.test(json), item.id);
    assert.equal(q.options.length, item.options.length);
    assert.equal(q.options[0].letter, 'A');
  }
});

test('canonicalHash is stable and changes with content', () => {
  const ids = bank.items.slice(0, 5).map((i) => ({ id: i.id, options: i.options }));
  assert.equal(canonicalHash(ids), canonicalHash(structuredClone(ids)));
  const changed = structuredClone(ids);
  changed[0].options = [...changed[0].options, 'extra'];
  assert.notEqual(canonicalHash(ids), canonicalHash(changed));
});
