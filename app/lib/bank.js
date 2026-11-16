'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { render } = require('./chem');

const TOPIC_LABELS = {
  'atomic-structure': 'Atomic structure',
  'electronic-structure': 'Electronic structure',
  stoichiometry: 'Stoichiometry',
  equilibrium: 'Equilibrium',
  kinetics: 'Kinetics',
};

function canonicalHash(bank, overrides) {
  const canonical = JSON.stringify({ bank, overrides });
  return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
}

function loadBank(options = {}) {
  const root = options.root || path.resolve(__dirname, '..', '..');
  const bankPath = options.bankPath || path.join(root, 'bank', 'chem101-bank.json');
  const overridesPath = options.overridesPath || path.join(root, 'bank', 'display-overrides.json');
  const manifestPath = options.manifestPath || path.join(root, 'bank', 'manifest.json');
  const displayPath = options.displayManifestPath || path.join(root, 'bank', 'display-manifest.json');
  const reviewPath = options.reviewPath || path.join(root, 'bank', 'needs-review.json');

  const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
  const overridesDoc = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const displayManifest = JSON.parse(fs.readFileSync(displayPath, 'utf8'));
  const review = JSON.parse(fs.readFileSync(reviewPath, 'utf8'));
  const overrides = overridesDoc.items || {};

  if (!Array.isArray(review) || review.length !== 0) {
    throw new Error('bank/needs-review.json must be empty before release');
  }

  if (!Array.isArray(bank)) throw new Error('bank must be a list of items');
  if (bank.length !== 119) throw new Error(`bank must contain 119 items, found ${bank.length}`);
  if (manifest.items !== bank.length) throw new Error('manifest item count does not match bank');

  const byId = new Map();
  const seenStems = new Set();
  for (const item of bank) {
    if (!item.id || byId.has(item.id)) throw new Error(`duplicate or missing id ${item.id}`);
    if (item.source !== 'Chem 101 question.pdf') {
      throw new Error(`${item.id}: source must be the Chemistry 101 PDF`);
    }
    if (!Array.isArray(item.options) || item.options.length < 2 || item.options.length > 6) {
      throw new Error(`${item.id}: option count out of range`);
    }
    if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= item.options.length) {
      throw new Error(`${item.id}: answer index out of range`);
    }
    const stemKey = item.stem.trim().toLowerCase();
    if (seenStems.has(stemKey)) throw new Error(`${item.id}: duplicate stem`);
    seenStems.add(stemKey);
    byId.set(item.id, item);
  }

  for (const [id, over] of Object.entries(overrides)) {
    const item = byId.get(id);
    if (!item) throw new Error(`display override for unknown item ${id}`);
    if (over.options) {
      if (!Array.isArray(over.options) || over.options.length !== item.options.length) {
        throw new Error(`${id}: override must keep the option count`);
      }
    }
    if (!over.stem && !over.stem_html && !over.options) {
      throw new Error(`${id}: empty display override`);
    }
  }

  const cleared = manifest.typeset_required || [];
  const unresolved = cleared.filter((id) => !overrides[id]);
  if (unresolved.length) {
    throw new Error(`unresolved typeset items: ${unresolved.join(', ')}`);
  }

  const version = canonicalHash(bank, overrides).slice(0, 8);
  const overridesHash = crypto.createHash('sha256').update(JSON.stringify(overrides), 'utf8').digest('hex');
  if (displayManifest.source !== 'Chem 101 question.pdf') {
    throw new Error('display manifest source does not match');
  }
  if (displayManifest.items !== bank.length || displayManifest.drawable !== bank.length) {
    throw new Error('display manifest item count does not match bank');
  }
  if (displayManifest.bank_version !== version) {
    throw new Error(
      `display manifest is stale: ${displayManifest.bank_version} != ${version}. Run node bank/build_display_manifest.js`,
    );
  }
  if (displayManifest.overrides.count !== Object.keys(overrides).length) {
    throw new Error('display manifest override count does not match');
  }
  if (displayManifest.overrides.sha256 !== overridesHash) {
    throw new Error('display manifest override hash does not match');
  }
  if (!Array.isArray(displayManifest.typeset_required) || displayManifest.typeset_required.length !== 0) {
    throw new Error('display manifest still lists typeset items as drawable blockers');
  }

  const drawable = new Set(bank.map((i) => i.id));

  const enriched = bank.map((item) => {
    const over = overrides[item.id] || {};
    const stemHtml = over.stem_html
      ? over.stem_html
      : render(over.stem !== undefined ? over.stem : item.stem, {
          marked: over.stem !== undefined,
        });
    const optionsHtml = item.options.map((base, index) => {
      if (over.options && over.options[index] !== undefined) {
        return render(over.options[index], { marked: true });
      }
      return render(base, { marked: false });
    });
    return {
      ...item,
      topicLabel: TOPIC_LABELS[item.topic] || item.topic,
      stemHtml,
      optionsHtml,
      displayOverridden: hasOverride(over),
      optionShuffle: Boolean(item.option_shuffle),
    };
  });

  return {
    items: enriched,
    byId: new Map(enriched.map((i) => [i.id, i])),
    manifest,
    displayManifest,
    overrides,
    cleared,
    drawable,
    version,
    generatedAt: new Date().toISOString(),
  };
}

function hasOverride(over) {
  return over.stem !== undefined || over.stem_html !== undefined || over.options !== undefined;
}

function publicQuestion(bankItem, order, n) {
  const letters = 'ABCDEF';
  return {
    n,
    ref: bankItem.id,
    topic: bankItem.topic,
    topicLabel: bankItem.topicLabel,
    stem: bankItem.stemHtml,
    options: order.map((bankIndex, displayIndex) => ({
      letter: letters[displayIndex],
      text: bankItem.optionsHtml[bankIndex],
    })),
    optionCount: order.length,
  };
}

module.exports = {
  TOPIC_LABELS,
  loadBank,
  publicQuestion,
  canonicalHash,
};
