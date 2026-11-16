'use strict';

/** Deterministic paper draw and option ordering — design/06 §4.2. */

const test = require('node:test');
const assert = require('node:assert/strict');
const { loadBank } = require('../app/lib/bank');
const {
  TOPICS,
  newSeed,
  streamFactory,
  quotas,
  drawPaper,
  optionOrder,
  reference,
} = require('../app/lib/random');

const ROOT = require('node:path').resolve(__dirname, '..');
const bank = loadBank({ root: ROOT });
const SEED = '0123456789abcdef0123456789abcdef';

test('seed is 128 bits of lowercase hex', () => {
  for (let i = 0; i < 25; i += 1) {
    const seed = newSeed();
    assert.match(seed, /^[0-9a-f]{32}$/);
  }
});

test('stream rejects malformed seeds and is reproducible', () => {
  assert.throws(() => streamFactory('XYZ'), /32 lowercase hex/);
  const a = streamFactory(SEED);
  const b = streamFactory(SEED);
  assert.deepEqual([a.next64('s'), a.next64('s')], [b.next64('s'), b.next64('s')]);
  assert.notEqual(a.next64('s'), a.next64('t'));
});

test('largest-remainder quotas reproduce the published 40-question and 60-question tables', () => {
  const counts = Object.fromEntries(
    TOPICS.map((topic) => [topic, bank.items.filter((i) => i.topic === topic).length]),
  );
  assert.deepEqual(quotas(counts, 40), {
    'atomic-structure': 12,
    'electronic-structure': 9,
    stoichiometry: 3,
    equilibrium: 8,
    kinetics: 8,
  });
  assert.deepEqual(quotas(counts, 60), {
    'atomic-structure': 17,
    'electronic-structure': 14,
    stoichiometry: 4,
    equilibrium: 12,
    kinetics: 13,
  });
});

test('quotas always sum to the paper length and stay within the pool', () => {
  const counts = Object.fromEntries(
    TOPICS.map((topic) => [topic, bank.items.filter((i) => i.topic === topic).length]),
  );
  for (const length of [20, 21, 45, 60, 77, 100]) {
    const q = quotas(counts, length);
    assert.equal(Object.values(q).reduce((a, b) => a + b, 0), length);
    for (const topic of TOPICS) assert.ok(q[topic] <= counts[topic], topic);
  }
  assert.throws(() => quotas(counts, 19), /20/);
  assert.throws(() => quotas(counts, 120), /20/);
});

test('the same seed draws the same paper; a different seed draws another', () => {
  const draw = (seed) => drawPaper(bank.items, { seed, length: 60, drawable: bank.drawable });
  const first = draw(SEED);
  const second = draw(SEED);
  assert.deepEqual(first, second);
  assert.equal(new Set(first).size, 60);
  assert.equal(first.length, 60);
  const other = draw('ffffffffffffffffffffffffffffffff');
  assert.notDeepEqual(first, other);
});

test('a paper honours per-topic quotas exactly', () => {
  const paper40 = drawPaper(bank.items, { seed: SEED, length: 40, drawable: bank.drawable });
  assert.equal(paper40.length, 40);
  assert.equal(new Set(paper40).size, 40);
  const counts40 = {};
  for (const id of paper40) {
    const topic = bank.byId.get(id).topic;
    counts40[topic] = (counts40[topic] || 0) + 1;
  }
  assert.deepEqual(counts40, {
    'atomic-structure': 12,
    'electronic-structure': 9,
    stoichiometry: 3,
    equilibrium: 8,
    kinetics: 8,
  });

  const paper = drawPaper(bank.items, { seed: SEED, length: 60, drawable: bank.drawable });
  const counts = {};
  for (const id of paper) {
    const topic = bank.byId.get(id).topic;
    counts[topic] = (counts[topic] || 0) + 1;
  }
  assert.deepEqual(counts, {
    'atomic-structure': 17,
    'electronic-structure': 14,
    stoichiometry: 4,
    equilibrium: 12,
    kinetics: 13,
  });
});

test('option order is a permutation, deterministic, and maps the keyed answer', () => {
  const shuffled = bank.items.filter((i) => i.option_shuffle);
  assert.ok(shuffled.length > 0);
  for (const item of shuffled.slice(0, 12)) {
    const { order, displayAnswer } = optionOrder(item, SEED);
    assert.deepEqual([...order].sort(), item.options.map((_, i) => i));
    assert.equal(order[displayAnswer], item.answer);
    assert.deepEqual(optionOrder(item, SEED), { order, displayAnswer });
  }
});

test('referential options keep source order', () => {
  const fixed = bank.items.filter((i) => !i.option_shuffle);
  assert.ok(fixed.length > 0);
  for (const item of fixed.slice(0, 12)) {
    const { order, displayAnswer } = optionOrder(item, SEED);
    assert.deepEqual(order, item.options.map((_, i) => i));
    assert.equal(displayAnswer, item.answer);
  }
});

test('references use the unambiguous alphabet and a fixed shape', () => {
  for (let i = 0; i < 50; i += 1) {
    const ref = reference();
    assert.match(ref, /^CH101-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/);
    assert.ok(!/[IO01]/.test(ref.slice(6)));
  }
});
