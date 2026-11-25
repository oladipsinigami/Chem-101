'use strict';

/**
 * Shared Redis backend (Upstash / Vercel KV REST API).
 *
 * Vercel runs many copies of the service and gives each one a private,
 * throwaway /tmp. Attempt state must therefore live outside the process.
 * This backend speaks the Upstash REST protocol with the built-in fetch, so
 * the project keeps its zero-dependency promise.
 *
 * Keys (prefix configurable, default "chem101"):
 *   chem101:attempt:<id>        JSON attempt
 *   chem101:candidate:<KEY>     attempt id for a normalised candidate id
 *   chem101:attempts            set of attempt ids
 *   chem101:submitted           set of submitted attempt ids
 *   chem101:references          set of issued references
 *   chem101:snapshot:<ref>      JSON submission snapshot (for PDF export)
 */

const REQUEST_TIMEOUT_MS = 8000;

function unreachable(detail) {
  const error = new Error(
    'The shared examination store is unreachable, so answers cannot be saved right now. Retry in a moment.',
  );
  error.status = 503;
  error.detail = detail;
  return error;
}

function parseJson(raw) {
  if (raw === null || raw === undefined) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

class RedisBackend {
  constructor({ url, token, prefix = 'chem101' }) {
    this.kind = 'redis';
    this.remote = true;
    this.resultsDir = null;
    this.url = String(url).replace(/\/+$/, '');
    this.token = token;
    this.prefix = prefix;
  }

  key(...parts) {
    return [this.prefix, ...parts].join(':');
  }

  async _post(path, body) {
    if (typeof fetch !== 'function') {
      throw unreachable('global fetch is unavailable; Node 20 or newer is required');
    }
    let response;
    try {
      response = await fetch(`${this.url}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      throw unreachable(error.message);
    }
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw unreachable(`store returned ${response.status} ${text.slice(0, 120)}`);
    }
    if (!response.ok || payload.error) {
      throw unreachable(payload.error || `store returned ${response.status}`);
    }
    return payload;
  }

  async command(args) {
    const payload = await this._post('', args);
    return payload.result;
  }

  async pipeline(commands) {
    const payload = await this._post('/pipeline', commands);
    if (!Array.isArray(payload)) throw unreachable('store returned an unexpected pipeline response');
    for (const row of payload) {
      if (row && row.error) throw unreachable(row.error);
    }
    return payload.map((row) => row?.result);
  }

  init() {
    // No network call at boot: a cold start must not fail because the store is
    // briefly busy. The first real request surfaces any problem as a 503.
    return this;
  }

  async read(id) {
    return parseJson(await this.command(['GET', this.key('attempt', id)]));
  }

  async write(attempt) {
    const commands = [
      ['SET', this.key('attempt', attempt.id), JSON.stringify(attempt)],
      ['SADD', this.key('attempts'), attempt.id],
    ];
    if (attempt.submitted) commands.push(['SADD', this.key('submitted'), attempt.id]);
    if (attempt.reference) commands.push(['SADD', this.key('references'), attempt.reference]);
    if (attempt.candidateKey) {
      commands.push(['SET', this.key('candidate', attempt.candidateKey), attempt.id]);
    }
    await this.pipeline(commands);
    return attempt;
  }

  async list() {
    const ids = (await this.command(['SMEMBERS', this.key('attempts')])) || [];
    if (!ids.length) return [];
    const raws = await this.command([
      'MGET',
      ...ids.map((id) => this.key('attempt', id)),
    ]);
    return (raws || []).map(parseJson).filter(Boolean);
  }

  async findIdByCandidate(candidateKey) {
    return this.command(['GET', this.key('candidate', candidateKey)]);
  }

  async claimReference(reference) {
    const added = await this.command(['SADD', this.key('references'), reference]);
    return Number(added) === 1;
  }

  async writeSnapshot(reference, snapshot) {
    await this.command([
      'SET',
      this.key('snapshot', reference),
      JSON.stringify(snapshot),
    ]);
  }

  async readSnapshot(reference) {
    return parseJson(await this.command(['GET', this.key('snapshot', reference)]));
  }

  async stats() {
    const [attempts, submitted] = await this.pipeline([
      ['SCARD', this.key('attempts')],
      ['SCARD', this.key('submitted')],
    ]);
    const total = Number(attempts) || 0;
    const done = Number(submitted) || 0;
    return {
      attempts: total,
      submitted: done,
      active: Math.max(0, total - done),
      corrupt: 0,
    };
  }
}

module.exports = { RedisBackend };
