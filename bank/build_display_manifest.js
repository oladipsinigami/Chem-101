'use strict';

/**
 * Emit bank/display-manifest.json.
 *
 * The transcribed bank is pinned by bank/manifest.json. This second manifest
 * records the display layer that sits on top of it: the auditable override
 * file, the version hash the application computes, and the fact that every
 * item is now drawable. It is verified by app/lib/bank.js at load time.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { canonicalHash } = require('../app/lib/bank');
const { quotas, TOPICS } = require('../app/lib/random');

const root = path.resolve(__dirname, '..');
const bank = JSON.parse(fs.readFileSync(path.join(root, 'bank', 'chem101-bank.json'), 'utf8'));
const overridesDoc = JSON.parse(fs.readFileSync(path.join(root, 'bank', 'display-overrides.json'), 'utf8'));
const pinned = JSON.parse(fs.readFileSync(path.join(root, 'bank', 'manifest.json'), 'utf8'));
const review = JSON.parse(fs.readFileSync(path.join(root, 'bank', 'needs-review.json'), 'utf8'));
const overrides = overridesDoc.items || {};

if (!Array.isArray(bank)) throw new Error('bank must be a list');
if (!Array.isArray(review) || review.length !== 0) throw new Error('needs-review.json must be empty');
if (pinned.items !== bank.length) throw new Error('pinned manifest item count does not match bank');

const topicCounts = Object.fromEntries(TOPICS.map((t) => [t, 0]));
const optionCounts = {};
for (const item of bank) {
  if (!(item.topic in topicCounts)) throw new Error(`${item.id}: unknown topic ${item.topic}`);
  topicCounts[item.topic] += 1;
  optionCounts[item.options.length] = (optionCounts[item.options.length] || 0) + 1;
}

const cleared = pinned.typeset_required || [];
for (const id of cleared) {
  if (!overrides[id]) throw new Error(`${id}: typeset item has no display override`);
}

const quotaTable = {};
for (const length of [20, 30, 40, 50, 60, 80, 100, 119]) {
  quotaTable[length] = quotas(topicCounts, length);
}

const manifest = {
  manifest_version: '2.0',
  source: 'Chem 101 question.pdf',
  bank_version: canonicalHash(bank, overrides).slice(0, 8),
  items: bank.length,
  drawable: bank.length,
  topics: topicCounts,
  option_counts: optionCounts,
  typeset_required: [],
  typeset_cleared: cleared,
  overrides: {
    count: Object.keys(overrides).length,
    sha256: crypto.createHash('sha256').update(JSON.stringify(overrides), 'utf8').digest('hex'),
  },
  quotas: quotaTable,
  note: 'Verified at load time. typeset_cleared items are drawable because display-overrides.json restores their equations.',
};

fs.writeFileSync(
  path.join(root, 'bank', 'display-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

console.log(
  `bank_version ${manifest.bank_version} · ${manifest.items} items · ${manifest.overrides.count} overrides · ` +
    `${manifest.typeset_cleared.length} typeset items cleared`,
);
