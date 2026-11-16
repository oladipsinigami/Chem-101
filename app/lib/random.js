'use strict';

/**
 * Deterministic paper and option ordering.
 *
 * Normative definition: design/06-question-bank-and-randomisation.md §4.2.
 * Replay must not depend on a language runtime shuffle, so the stream,
 * rejection sampling, and Fisher–Yates loop are written out exactly as
 * specified. SHA-256 counters are per stream for the life of one attempt.
 */

const crypto = require('node:crypto');

const TWO64 = 1n << 64n;

function newSeed() {
  return crypto.randomBytes(16).toString('hex'); // 128 bits, 32 lowercase hex
}

function streamFactory(seedHex) {
  if (typeof seedHex !== 'string' || !/^[0-9a-f]{32}$/.test(seedHex)) {
    throw new Error('seed must be 32 lowercase hex characters');
  }
  const counters = new Map();

  function next64(name) {
    const next = (counters.get(name) || 0) + 1;
    counters.set(name, next);
    const h = crypto
      .createHash('sha256')
      .update(`${seedHex}|${name}|${next}`, 'utf8')
      .digest();
    return h.readBigUInt64BE(0);
  }

  function range(name, n) {
    if (!Number.isInteger(n) || n <= 0) throw new Error('range needs a positive integer');
    const limit = (TWO64 / BigInt(n)) * BigInt(n);
    let r;
    do {
      r = next64(name);
    } while (r >= limit);
    return Number(r % BigInt(n));
  }

  function shuffle(list, name) {
    const out = list.slice();
    for (let i = out.length - 1; i >= 1; i -= 1) {
      const j = range(name, i + 1);
      const t = out[i];
      out[i] = out[j];
      out[j] = t;
    }
    return out;
  }

  return { next64, range, shuffle };
}

const TOPICS = [
  'atomic-structure',
  'electronic-structure',
  'stoichiometry',
  'equilibrium',
  'kinetics',
];

/**
 * Largest-remainder quotas. Ties break by the fixed TOPICS order, which
 * reproduces the published table (at 60: 17 / 14 / 4 / 12 / 13).
 */
function quotas(counts, length) {
  const total = TOPICS.reduce((sum, t) => sum + (counts[t] || 0), 0);
  if (!Number.isInteger(length) || length < 20 || length > total) {
    throw new Error(`paper length must be an integer from 20 to ${total}`);
  }
  const raw = TOPICS.map((topic, index) => {
    const exact = ((counts[topic] || 0) / total) * length;
    const floor = Math.floor(exact);
    return { topic, index, floor, remainder: exact - floor };
  });
  let left = length - raw.reduce((sum, r) => sum + r.floor, 0);
  const order = raw.slice().sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    return a.index - b.index;
  });
  const result = Object.fromEntries(raw.map((r) => [r.topic, r.floor]));
  for (const r of order) {
    if (left <= 0) break;
    result[r.topic] += 1;
    left -= 1;
  }
  return result;
}

/**
 * Draw a paper from items. Only items whose IDs are in `drawable` are eligible.
 * Each topic pool is shuffled on its own stream; the merged selection is
 * shuffled on the `paper` stream so topics interleave.
 */
function drawPaper(items, { seed, length, drawable }) {
  const allowed = drawable || new Set(items.map((i) => i.id));
  const byTopic = new Map(TOPICS.map((t) => [t, []]));
  for (const item of items) {
    if (!allowed.has(item.id)) continue;
    if (!byTopic.has(item.topic)) throw new Error(`unknown topic ${item.topic}`);
    byTopic.get(item.topic).push(item);
  }
  const counts = Object.fromEntries(TOPICS.map((t) => [t, byTopic.get(t).length]));
  const q = quotas(counts, length);
  const streams = streamFactory(seed);

  let paper = [];
  for (const topic of TOPICS) {
    if (q[topic] > byTopic.get(topic).length) {
      throw new Error(`quota for ${topic} exceeds its drawable pool`);
    }
    const pool = streams.shuffle(byTopic.get(topic).map((i) => i.id), `topic:${topic}`);
    paper = paper.concat(pool.slice(0, q[topic]));
  }
  paper = streams.shuffle(paper, 'paper');
  if (new Set(paper).size !== paper.length) throw new Error('duplicate item in paper');
  return paper;
}

/**
 * Option order for one item. Referential options keep source order.
 * Returns { order, displayAnswer } where order[d] = bank index shown at d.
 */
function optionOrder(item, seed) {
  const n = item.options.length;
  let order = Array.from({ length: n }, (_, i) => i);
  if (item.option_shuffle) {
    order = streamFactory(seed).shuffle(order, `opt:${item.id}`);
  }
  const displayAnswer = order.indexOf(item.answer);
  if (displayAnswer < 0) throw new Error(`${item.id}: answer is outside the option list`);
  return { order, displayAnswer };
}

function reference() {
  // Ambiguous glyphs (I, O, 0, 1) are excluded so a reference can be read aloud.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(5);
  let out = '';
  for (let i = 0; i < 5; i += 1) out += alphabet[bytes[i] % alphabet.length];
  return `CH101-${out}`;
}

module.exports = {
  TOPICS,
  newSeed,
  streamFactory,
  quotas,
  drawPaper,
  optionOrder,
  reference,
};
