'use strict';

/**
 * Local filesystem backend.
 *
 * This is the original behaviour: one JSON file per attempt, written
 * atomically. It is correct for the single-process Node service and for
 * tests. It is *not* correct on a serverless host, where every instance gets
 * its own throwaway disk — that is what the Redis backend exists for.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function writeJsonAtomic(file, value) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(file)}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`);
  fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(tmp, file);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

class FileBackend {
  constructor({ root }) {
    this.kind = 'file';
    this.remote = false;
    this.dataDir = path.join(root, 'data');
    this.attemptsDir = path.join(this.dataDir, 'attempts');
    this.resultsDir = path.join(this.dataDir, 'results');
    this.references = new Set();
    this.corrupt = [];
  }

  init() {
    fs.mkdirSync(this.attemptsDir, { recursive: true });
    fs.mkdirSync(this.resultsDir, { recursive: true });
    for (const attempt of this.list()) {
      if (attempt.reference) this.references.add(attempt.reference);
    }
    return this;
  }

  _file(id) {
    if (!/^att_[a-f0-9]{16}$/.test(String(id))) throw new Error('invalid attempt id');
    return path.join(this.attemptsDir, `${id}.json`);
  }

  read(id) {
    try {
      return readJson(this._file(id));
    } catch (error) {
      this.corrupt.push({ file: this._file(id), error: error.message });
      return null;
    }
  }

  write(attempt) {
    writeJsonAtomic(this._file(attempt.id), attempt);
    if (attempt.reference) this.references.add(attempt.reference);
    return attempt;
  }

  list() {
    const out = [];
    let names = [];
    try {
      names = fs.readdirSync(this.attemptsDir);
    } catch {
      return out;
    }
    for (const name of names) {
      if (!name.endsWith('.json')) continue;
      const file = path.join(this.attemptsDir, name);
      try {
        out.push(readJson(file));
      } catch (error) {
        this.corrupt.push({ file, error: error.message });
      }
    }
    return out.filter(Boolean);
  }

  findIdByCandidate(candidateKey) {
    const matches = this.list()
      .filter((a) => a.candidateKey === candidateKey)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return matches.length ? matches[0].id : null;
  }

  claimReference(reference) {
    if (this.references.has(reference)) return false;
    this.references.add(reference);
    return true;
  }

  writeSnapshot(reference, snapshot) {
    writeJsonAtomic(path.join(this.resultsDir, `${reference}-snapshot.json`), snapshot);
  }

  readSnapshot(reference) {
    return readJson(path.join(this.resultsDir, `${reference}-snapshot.json`));
  }

  stats() {
    const all = this.list();
    return {
      attempts: all.length,
      submitted: all.filter((a) => a.submitted).length,
      active: all.filter((a) => !a.submitted).length,
      corrupt: this.corrupt.length,
    };
  }
}

module.exports = { FileBackend, writeJsonAtomic, readJson };
