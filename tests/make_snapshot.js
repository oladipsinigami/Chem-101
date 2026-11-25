'use strict';

/**
 * Builds a real submission snapshot for the PDF tests and prints
 * { "snapshot": ..., "reference": ... } on the last stdout line.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadBank } = require('../app/lib/bank');
const { Store } = require('../app/lib/store');

const ROOT = path.resolve(__dirname, '..');
const bank = loadBank({ root: ROOT });
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'chem101-pdf-snapshot-'));
const paperLength = Number(process.env.CHEM_TEST_PAPER || 40);

async function main() {
  const store = await new Store({
    root,
    bank,
    config: {
      paperLength,
      durationMinutes: 15,
      courseCode: 'CHE 101',
      courseTitle: 'Chemistry 101',
      paperTitle: 'Mid-semester CBT',
      institution: 'CCF NIFES',
      office: 'Examinations Committee',
      verifyBase: 'https://ccfnifes.example/verify',
    },
  }).init();

  const { attempt } = await store.createAttempt({
    candidateId: 'NIF/CHE/20481',
    name: 'Adaeze Okafor',
    programme: 'BSc Chemistry',
    cohort: '2024',
  });

  // A mixed paper: right, wrong, and one left blank.
  attempt.paper.forEach((itemId, index) => {
    const n = index + 1;
    if (n === 13) return;
    const correct = attempt.displayAnswers[index];
    const count = bank.byId.get(itemId).options.length;
    const wrong = (correct + 1) % count;
    store.saveAnswer(attempt.id, n, n % 3 === 0 ? wrong : correct);
  });
  store.saveFlag(attempt.id, 4, true);
  store.saveFlag(attempt.id, 13, true);

  const { snapshot } = await store.submit(attempt.id);
  process.stdout.write(JSON.stringify({ snapshot: store.get(attempt.id).snapshotPath, reference: snapshot.reference }) + '\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
