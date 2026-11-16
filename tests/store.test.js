'use strict';

/** Attempt persistence, submission snapshot, and the score-free receipt. */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadBank } = require('../app/lib/bank');
const { Store } = require('../app/lib/store');

const ROOT = path.resolve(__dirname, '..');
const bank = loadBank({ root: ROOT });

function tempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'chem101-store-'));
}

function makeStore(root, overrides = {}) {
  return new Store({
    root,
    bank,
    config: {
      paperLength: 20,
      durationMinutes: 60,
      courseCode: 'CHE 101',
      courseTitle: 'Chemistry 101',
      paperTitle: 'Mid-semester CBT',
      institution: 'CCF NIFES',
      office: 'Examinations Committee',
      verifyBase: 'https://ccfnifes.example/verify',
      ...overrides,
    },
  }).init();
}

function keysDeep(value, out = []) {
  if (Array.isArray(value)) value.forEach((v) => keysDeep(v, out));
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      out.push(key);
      keysDeep(child, out);
    }
  }
  return out;
}

test('an attempt is drawn once and resumed by the same candidate ID', () => {
  const root = tempRoot();
  const store = makeStore(root);
  const { attempt, resumed } = store.createAttempt({
    candidateId: 'NIF/CHE/20481',
    name: 'Adaeze Okafor',
    programme: 'BSc Chemistry',
    cohort: '2024',
  });
  assert.equal(resumed, false);
  assert.equal(attempt.paper.length, 20);
  assert.equal(new Set(attempt.paper).size, 20);
  assert.match(attempt.seed, /^[0-9a-f]{32}$/);
  assert.equal(Date.parse(attempt.deadline) - Date.parse(attempt.startedAt), 60 * 60_000);

  const again = store.createAttempt({ candidateId: '  nif/che/20481 ', name: 'Someone Else' });
  assert.equal(again.resumed, true);
  assert.equal(again.attempt.id, attempt.id);
  assert.equal(again.attempt.candidate.name, 'Adaeze Okafor');
});

test('answers and flags survive a restart and stay keyed to the paper', () => {
  const root = tempRoot();
  const first = makeStore(root);
  const { attempt } = first.createAttempt({ candidateId: 'C-1', name: 'Candidate One' });
  first.saveAnswer(attempt.id, 3, 1);
  first.saveFlag(attempt.id, 3, true);
  first.savePosition(attempt.id, 7);

  const second = makeStore(root);
  const reloaded = second.get(attempt.id);
  assert.equal(reloaded.answers['3'], 1);
  assert.equal(reloaded.flags['3'], true);
  assert.equal(reloaded.position, 7);
});

test('out-of-range answers and flags are rejected', () => {
  const store = makeStore(tempRoot());
  const { attempt } = store.createAttempt({ candidateId: 'C-2', name: 'Candidate Two' });
  assert.throws(() => store.saveAnswer(attempt.id, 0, 0), /outside this paper/);
  assert.throws(() => store.saveAnswer(attempt.id, 21, 0), /outside this paper/);
  assert.throws(() => store.saveAnswer(attempt.id, 1, 99), /does not exist/);
  assert.throws(() => store.saveAnswer(attempt.id, 1, -1), /does not exist/);
  assert.throws(() => store.saveFlag(attempt.id, 0, true), /outside this paper/);
});

test('submission writes a snapshot, returns a reference, and closes the paper', () => {
  const store = makeStore(tempRoot());
  const { attempt } = store.createAttempt({ candidateId: 'C-3', name: 'Candidate Three' });
  store.saveAnswer(attempt.id, 1, 0);
  const { snapshot, alreadySubmitted } = store.submit(attempt.id);
  assert.equal(alreadySubmitted, false);
  assert.match(snapshot.reference, /^CH101-[A-Z2-9]{5}$/);
  assert.equal(snapshot.result.total, 20);
  assert.equal(snapshot.result.answered, 1);
  assert.equal(snapshot.questions.length, 20);
  assert.equal(snapshot.questions[0].options.length, snapshot.questions[0].optionCount);
  assert.ok(snapshot.questions.every((q) => q.correctLetter && q.options.some((o) => o.correct)));
  assert.equal(snapshot.exam.mode, 'Computer-based examination');

  const file = store.get(attempt.id).snapshotPath;
  assert.ok(fs.existsSync(file));
  const onDisk = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(onDisk.result, snapshot.result);

  assert.throws(() => store.saveAnswer(attempt.id, 2, 0), /already been submitted/);
  assert.throws(() => store.saveFlag(attempt.id, 2, true), /already been submitted/);
  const repeat = store.submit(attempt.id);
  assert.equal(repeat.alreadySubmitted, true);
  assert.equal(store.get(attempt.id).reference, snapshot.reference);
  assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).reference, snapshot.reference);
});

test('the receipt carries progress and artifacts, never a score', () => {
  const store = makeStore(tempRoot());
  const { attempt } = store.createAttempt({ candidateId: 'C-4', name: 'Candidate Four' });
  store.saveAnswer(attempt.id, 1, 0);
  store.saveAnswer(attempt.id, 2, 1);
  store.saveFlag(attempt.id, 2, true);
  const { snapshot } = store.submit(attempt.id);

  const receipt = store.receipt(attempt.id);
  assert.equal(receipt.answered, 2);
  assert.equal(receipt.reference, snapshot.reference);
  assert.equal(receipt.exam.questions, 20);
  assert.equal(receipt.artifacts.official.state, 'queued');
  assert.equal(receipt.artifacts.official.url, '/api/artifacts/official');

  const json = JSON.stringify(receipt);
  assert.ok(!/"(score|percentage|grade|outcome|correct|pass|fail)"/i.test(json), json);
  const keys = keysDeep(receipt).map((k) => k.toLowerCase());
  for (const forbidden of ['score', 'percentage', 'grade', 'outcome', 'result']) {
    assert.ok(!keys.includes(forbidden), `receipt leaked ${forbidden}`);
  }
});

test('an expired attempt submits itself when it is next touched', () => {
  const store = makeStore(tempRoot());
  const { attempt } = store.createAttempt({ candidateId: 'C-5', name: 'Candidate Five' });
  store.saveAnswer(attempt.id, 1, 2);
  const stored = store.get(attempt.id);
  stored.deadline = new Date(Date.now() - 1000).toISOString();
  store.attempts.set(attempt.id, stored);

  const expired = store.ensureExpired(attempt.id);
  assert.equal(expired.submitted, true);
  assert.equal(expired.timeExpired, true);
  assert.equal(store.receipt(attempt.id).timeExpired, true);
});

test('candidate IDs are normalised, not truncated', () => {
  const store = makeStore(tempRoot());
  const a = store.createAttempt({ candidateId: 'NIF/CHE/1', name: 'A' }).attempt;
  const b = store.createAttempt({ candidateId: '  nif/che/1  ', name: 'B' }).attempt;
  assert.equal(a.id, b.id);
  assert.throws(() => store.createAttempt({ candidateId: '', name: 'C' }), /candidate ID/i);
  assert.throws(() => store.createAttempt({ candidateId: 'x', name: '' }), /name/i);
});

test('artifact state is tracked per document and downloads are recorded', () => {
  const store = makeStore(tempRoot());
  const { attempt } = store.createAttempt({ candidateId: 'C-6', name: 'Candidate Six' });
  const { snapshot } = store.submit(attempt.id);
  store.setArtifact(attempt.id, 'official', {
    state: 'ready',
    pages: 1,
    filename: store.filenameFor(snapshot.reference, 'official'),
    bytes: 1234,
  });
  assert.equal(store.receipt(attempt.id).artifacts.official.pages, 1);
  assert.equal(store.receipt(attempt.id).artifacts.review.state, 'queued');

  const file = store.artifactFile(attempt.id, 'official');
  assert.equal(file.filename, `CHE101-mid-semester-official-record-${snapshot.reference}.pdf`);

  store.markDownloaded(attempt.id, 'official');
  assert.ok(store.receipt(attempt.id).artifacts.official.downloadedAt);
});
