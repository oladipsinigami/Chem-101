'use strict';

/**
 * Attempt persistence and the immutable submission snapshot.
 *
 * Every attempt is one JSON file written atomically. There is no database:
 * the exam is a single-process Node service and the file set is small enough
 * that a full load on boot is cheaper and easier to audit than an index.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { drawPaper, optionOrder, newSeed, reference: makeReference } = require('./random');
const { scoreAttempt } = require('./scoring');

const ARTIFACT_KINDS = ['official', 'review'];
const ARTIFACT_SUFFIX = {
  official: 'official-record',
  review: 'review',
};

function nowIso() {
  return new Date().toISOString();
}

function writeJsonAtomic(file, value) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(file)}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`);
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, file);
}

function normaliseKey(candidateId) {
  return String(candidateId).trim().toUpperCase();
}

class Store {
  constructor({ root, bank, config }) {
    this.root = root;
    this.bank = bank;
    this.config = {
      paperLength: config.paperLength,
      durationMinutes: config.durationMinutes,
      courseCode: config.courseCode || 'CHE 101',
      courseTitle: config.courseTitle || 'Chemistry 101',
      paperTitle: config.paperTitle || 'Mid-semester CBT',
      institution: config.institution || 'CCF NIFES',
      office: config.office || 'Examinations Committee',
      verifyBase: config.verifyBase || 'https://ccfnifes.example/verify',
    };
    this.dataDir = path.join(root, 'data');
    this.attemptsDir = path.join(this.dataDir, 'attempts');
    this.resultsDir = path.join(this.dataDir, 'results');
    this.attempts = new Map();
    this.references = new Set();
    this.ready = false;
  }

  init() {
    fs.mkdirSync(this.attemptsDir, { recursive: true });
    fs.mkdirSync(this.resultsDir, { recursive: true });
    for (const name of fs.readdirSync(this.attemptsDir)) {
      if (!name.endsWith('.json')) continue;
      const file = path.join(this.attemptsDir, name);
      try {
        const attempt = JSON.parse(fs.readFileSync(file, 'utf8'));
        this.attempts.set(attempt.id, attempt);
        if (attempt.reference) this.references.add(attempt.reference);
      } catch (error) {
        // A corrupt attempt must not take the service down. It is left on disk
        // for inspection and reported through stats().
        this.corrupt = this.corrupt || [];
        this.corrupt.push({ file, error: error.message });
      }
    }
    this.ready = true;
    return this;
  }

  stats() {
    const all = Array.from(this.attempts.values());
    return {
      attempts: all.length,
      submitted: all.filter((a) => a.submitted).length,
      active: all.filter((a) => !a.submitted).length,
      corrupt: (this.corrupt || []).length,
    };
  }

  _file(id) {
    if (!/^att_[a-f0-9]{16}$/.test(String(id))) throw new Error('invalid attempt id');
    return path.join(this.attemptsDir, `${id}.json`);
  }

  _persist(attempt) {
    writeJsonAtomic(this._file(attempt.id), attempt);
    this.attempts.set(attempt.id, attempt);
    return attempt;
  }

  get(id) {
    if (!this.attempts.has(id)) return null;
    return structuredClone(this.attempts.get(id));
  }

  findByCandidate(candidateId) {
    const key = normaliseKey(candidateId);
    const matches = Array.from(this.attempts.values())
      .filter((a) => a.candidateKey === key)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return matches.length ? structuredClone(matches[0]) : null;
  }

  createAttempt(input) {
    const candidateId = String(input.candidateId || '').trim();
    const name = String(input.name || '').trim();
    const programme = String(input.programme || '').trim();
    const cohort = String(input.cohort || '').trim();
    if (!candidateId) throw new HttpError(400, 'Enter your candidate ID.');
    if (candidateId.length > 64) throw new HttpError(400, 'Candidate ID is too long.');
    if (!name) throw new HttpError(400, 'Enter the name on your examination card.');
    if (name.length > 120) throw new HttpError(400, 'Name is too long.');
    if (programme.length > 120 || cohort.length > 40) throw new HttpError(400, 'Programme or cohort is too long.');

    const existing = this.findByCandidate(candidateId);
    if (existing) return { attempt: existing, resumed: true };

    const seed = newSeed();
    const paper = drawPaper(this.bank.items, {
      seed,
      length: this.config.paperLength,
      drawable: this.bank.drawable,
    });
    const displayAnswers = paper.map((id) => {
      const item = this.bank.byId.get(id);
      return optionOrder(item, seed).displayAnswer;
    });

    const startedAt = new Date();
    const deadline = new Date(startedAt.getTime() + this.config.durationMinutes * 60_000);
    const attempt = {
      id: `att_${crypto.randomBytes(8).toString('hex')}`,
      candidateKey: normaliseKey(candidateId),
      candidate: { id: candidateId, name, programme, cohort },
      seed,
      bankVersion: this.bank.version,
      paperLength: paper.length,
      durationMinutes: this.config.durationMinutes,
      createdAt: startedAt.toISOString(),
      startedAt: startedAt.toISOString(),
      deadline: deadline.toISOString(),
      paper,
      displayAnswers,
      answers: {},
      flags: {},
      position: 1,
      submitted: false,
      submittedAt: null,
      timeExpired: false,
      reference: null,
      snapshotPath: null,
      artifacts: {
        official: { state: 'queued', pages: 0, filename: null, bytes: 0, error: null },
        review: { state: 'queued', pages: 0, filename: null, bytes: 0, error: null },
      },
    };
    this._persist(attempt);
    return { attempt: structuredClone(attempt), resumed: false };
  }

  _mutable(id, { allowSubmitted = false } = {}) {
    const attempt = this.attempts.get(id);
    if (!attempt) throw new HttpError(404, 'This attempt was not found.');
    if (attempt.submitted && !allowSubmitted) {
      throw new HttpError(409, 'This examination has already been submitted.');
    }
    return attempt;
  }

  saveAnswer(id, n, displayIndex) {
    const attempt = this._mutable(id);
    const position = Number(n);
    if (!Number.isInteger(position) || position < 1 || position > attempt.paper.length) {
      throw new HttpError(400, 'Question number is outside this paper.');
    }
    if (displayIndex !== null) {
      const item = this.bank.byId.get(attempt.paper[position - 1]);
      if (!Number.isInteger(displayIndex) || displayIndex < 0 || displayIndex >= item.options.length) {
        throw new HttpError(400, 'That option does not exist on this question.');
      }
      attempt.answers[String(position)] = displayIndex;
    } else {
      delete attempt.answers[String(position)];
    }
    attempt.updatedAt = nowIso();
    this._persist(attempt);
    return { n: position, answer: attempt.answers[String(position)] ?? null };
  }

  saveFlag(id, n, flagged) {
    const attempt = this._mutable(id);
    const position = Number(n);
    if (!Number.isInteger(position) || position < 1 || position > attempt.paper.length) {
      throw new HttpError(400, 'Question number is outside this paper.');
    }
    if (flagged) attempt.flags[String(position)] = true;
    else delete attempt.flags[String(position)];
    attempt.updatedAt = nowIso();
    this._persist(attempt);
    return { n: position, flagged: Boolean(attempt.flags[String(position)]) };
  }

  savePosition(id, n) {
    const attempt = this._mutable(id);
    const position = Number(n);
    if (!Number.isInteger(position) || position < 1 || position > attempt.paper.length) {
      throw new HttpError(400, 'Question number is outside this paper.');
    }
    attempt.position = position;
    attempt.updatedAt = nowIso();
    this._persist(attempt);
    return { position };
  }

  ensureExpired(id) {
    const attempt = this.attempts.get(id);
    if (!attempt || attempt.submitted) return attempt || null;
    if (Date.now() < Date.parse(attempt.deadline)) return attempt;
    return this.submit(id, { auto: true }).attempt;
  }

  _newReference() {
    for (let i = 0; i < 100; i += 1) {
      const candidate = makeReference();
      if (!this.references.has(candidate)) return candidate;
    }
    throw new Error('could not allocate a unique reference');
  }

  submit(id, { auto = false } = {}) {
    const attempt = this._mutable(id, { allowSubmitted: true });
    if (attempt.submitted) {
      return { attempt: structuredClone(attempt), alreadySubmitted: true };
    }

    const result = scoreAttempt(attempt, this.bank);
    const reference = this._newReference();
    const submittedAt = new Date();
    const timeExpired = auto || submittedAt.getTime() >= Date.parse(attempt.deadline);

    const questions = result.questions.map((scored) => {
      const item = this.bank.byId.get(scored.ref);
      const order = optionOrder(item, attempt.seed).order;
      const letters = 'ABCDEF';
      return {
        n: scored.n,
        ref: scored.ref,
        topic: scored.topic,
        topicLabel: scored.topicLabel,
        stemHtml: item.stemHtml,
        optionCount: order.length,
        options: order.map((bankIndex, displayIndex) => ({
          letter: letters[displayIndex],
          html: item.optionsHtml[bankIndex],
          chosen: scored.chosen === displayIndex,
          correct: scored.correctIndex === displayIndex,
        })),
        chosenLetter: scored.chosen === null ? null : letters[scored.chosen],
        correctLetter: letters[scored.correctIndex],
        outcome: scored.unanswered ? 'unanswered' : scored.correct ? 'correct' : 'incorrect',
      };
    });

    const snapshot = {
      schema: 1,
      reference,
      generatedAt: submittedAt.toISOString(),
      bankVersion: attempt.bankVersion,
      candidate: attempt.candidate,
      exam: {
        institution: this.config.institution,
        office: this.config.office,
        courseCode: this.config.courseCode,
        courseTitle: this.config.courseTitle,
        paperTitle: this.config.paperTitle,
        date: submittedAt.toISOString(),
        startedAt: attempt.startedAt,
        durationMinutes: attempt.durationMinutes,
        questions: attempt.paper.length,
        totalMarks: attempt.paper.length,
        mode: 'Computer-based examination',
      },
      result: {
        score: result.score,
        total: result.total,
        percentage: result.percentage,
        grade: result.grade,
        outcome: result.outcome,
        answered: result.answered,
        unanswered: result.total - result.answered,
      },
      topics: result.topics,
      questions,
      flags: Object.keys(attempt.flags).map(Number).sort((a, b) => a - b),
      verification: {
        url: `${this.config.verifyBase}/${reference}`,
      },
      timeExpired,
    };

    attempt.reference = reference;
    attempt.submitted = true;
    attempt.submittedAt = submittedAt.toISOString();
    attempt.timeExpired = timeExpired;
    attempt.snapshotPath = path.join(this.resultsDir, `${reference}-snapshot.json`);
    attempt.artifacts = {
      official: { state: 'queued', pages: 0, filename: null, bytes: 0, error: null },
      review: { state: 'queued', pages: 0, filename: null, bytes: 0, error: null },
    };
    attempt.result = {
      score: result.score,
      total: result.total,
      percentage: result.percentage,
      grade: result.grade,
      outcome: result.outcome,
    };
    writeJsonAtomic(attempt.snapshotPath, snapshot);
    this.references.add(reference);
    this._persist(attempt);
    return { attempt: structuredClone(attempt), snapshot, alreadySubmitted: false };
  }

  setArtifact(id, kind, patch) {
    if (!ARTIFACT_KINDS.includes(kind)) throw new HttpError(400, 'Unknown document.');
    const attempt = this._mutable(id, { allowSubmitted: true });
    attempt.artifacts[kind] = { ...attempt.artifacts[kind], ...patch };
    attempt.updatedAt = nowIso();
    this._persist(attempt);
    return structuredClone(attempt.artifacts[kind]);
  }

  artifactFile(id, kind) {
    if (!ARTIFACT_KINDS.includes(kind)) throw new HttpError(400, 'Unknown document.');
    const attempt = this.attempts.get(id);
    if (!attempt || !attempt.submitted || !attempt.reference) throw new HttpError(404, 'No result for this attempt.');
    return {
      attempt,
      file: path.join(this.resultsDir, this.filenameFor(attempt.reference, kind)),
      filename: this.filenameFor(attempt.reference, kind),
    };
  }

  filenameFor(reference, kind) {
    return `CHE101-mid-semester-${ARTIFACT_SUFFIX[kind]}-${reference}.pdf`;
  }

  receipt(id) {
    const attempt = this.attempts.get(id);
    if (!attempt) throw new HttpError(404, 'This attempt was not found.');
    if (!attempt.submitted) throw new HttpError(409, 'This examination has not been submitted.');
    return {
      reference: attempt.reference,
      submittedAt: attempt.submittedAt,
      timeExpired: attempt.timeExpired,
      candidate: { id: attempt.candidate.id, name: attempt.candidate.name },
      exam: {
        courseCode: this.config.courseCode,
        courseTitle: this.config.courseTitle,
        paperTitle: this.config.paperTitle,
        questions: attempt.paper.length,
      },
      answered: Object.keys(attempt.answers).length,
      artifacts: {
        official: this._artifactView(attempt, 'official'),
        review: this._artifactView(attempt, 'review'),
      },
    };
  }

  _artifactView(attempt, kind) {
    const row = attempt.artifacts[kind] || { state: 'queued' };
    return {
      state: row.state,
      pages: row.pages || 0,
      filename: row.filename || null,
      bytes: row.bytes || 0,
      error: row.error || null,
      url: `/api/artifacts/${kind}`,
      downloadedAt: row.downloadedAt || null,
    };
  }

  markDownloaded(id, kind) {
    const attempt = this.attempts.get(id);
    if (!attempt || !attempt.submitted) return;
    if (!attempt.artifacts[kind]) return;
    attempt.artifacts[kind].downloadedAt = nowIso();
    this._persist(attempt);
  }

  /**
   * Attempts that were submitted but whose files are queued/rendering when the
   * process restarts. The server offers them back for a fresh render.
   */
  incompleteArtifacts() {
    const out = [];
    for (const attempt of this.attempts.values()) {
      if (!attempt.submitted || !attempt.snapshotPath) continue;
      for (const kind of ARTIFACT_KINDS) {
        const state = attempt.artifacts[kind]?.state;
        // A failed render is retried once per process start, so a renderer that
        // was missing at submission time heals without the candidate acting.
        if (state === 'queued' || state === 'rendering' || state === 'failed') {
          out.push({ id: attempt.id, kind });
        }
      }
    }
    return out;
  }

  pendingSubmissions() {
    return Array.from(this.attempts.values())
      .filter((a) => !a.submitted)
      .map((a) => structuredClone(a));
  }
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = { Store, HttpError, ARTIFACT_KINDS, writeJsonAtomic, normaliseKey };
