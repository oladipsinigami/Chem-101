'use strict';

/**
 * HTTP contract. The renderer is replaced by a process that fails fast, so no
 * PDF is produced here; the two documents are covered by tests/pdf.test.js.
 */

process.env.PORT = '0';
process.env.HOST = '127.0.0.1';
process.env.CHEM_PYTHON = 'node';
process.env.CHEM_DATA_ROOT = require('node:fs').mkdtempSync(
  require('node:path').join(require('node:os').tmpdir(), 'chem101-http-'),
);

const test = require('node:test');
const assert = require('node:assert/strict');
const { server } = require('../app/server');

let base = '';
test.before(async () => {
  if (!server.listening) await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => new Promise((resolve) => server.close(resolve)));

function cookieFrom(response) {
  const raw = response.headers.get('set-cookie') || '';
  return raw.split(';')[0];
}

async function call(path, { method = 'GET', body, cookie } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (cookie) headers.Cookie = cookie;
  const response = await fetch(base + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  return { status: response.status, payload, headers: response.headers };
}

test('health reports the verified bank and an empty review queue', async () => {
  const { status, payload } = await call('/health');
  assert.equal(status, 200);
  assert.equal(payload.bankItems, 119);
  assert.equal(payload.drawable, 119);
  assert.equal(payload.needsReview, 0);
  assert.equal(payload.paperLength, 40);
  assert.equal(payload.durationMinutes, 15);
});

test('a first visit is not an error', async () => {
  const { status, payload } = await call('/api/attempt');
  assert.equal(status, 200);
  assert.equal(payload.status, 'none');
});

test('the entry sheet can state the configured paper', async () => {
  const { status, payload } = await call('/api/exam');
  assert.equal(status, 200);
  assert.equal(payload.courseCode, 'CHE 101');
  assert.equal(payload.paperLength, 40);
  assert.equal(payload.durationMinutes, 15);
  assert.equal(payload.institution, 'CCF NIFES');
});

test('entry draws a paper, sets a cookie, and leaks nothing', async () => {
  const response = await call('/api/entry', {
    method: 'POST',
    body: { candidateId: 'NIF/CHE/77001', name: 'Grace Adeyemi', programme: 'BSc Chemistry', cohort: '2024' },
  });
  assert.equal(response.status, 200);
  assert.equal(response.payload.status, 'active');
  const cookie = cookieFrom({ headers: response.headers });
  assert.match(cookie, /^chem_attempt=att_/);

  const attempt = response.payload.attempt;
  assert.equal(attempt.questions.length, 40);
  assert.equal(attempt.durationMinutes, 15);
  assert.equal(Date.parse(attempt.deadline) - Date.parse(attempt.startedAt), 15 * 60_000);
  assert.equal(new Set(attempt.questions.map((q) => q.n)).size, 40);
  assert.ok(attempt.deadline && attempt.startedAt);
  assert.ok(attempt.questions.every((q) => q.options.length >= 4));

  const json = JSON.stringify(attempt);
  for (const forbidden of ['displayAnswer', '"seed"', 'bankVersion', '"score"', '"grade"', '"percentage"']) {
    assert.ok(!json.includes(forbidden), `attempt payload leaked ${forbidden}`);
  }
  const keys = [];
  (function walk(value) {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        keys.push(key.toLowerCase());
        walk(child);
      }
    }
  })(attempt);
  for (const forbidden of ['answer', 'correct', 'correctletter', 'displayanswer', 'seed', 'score', 'grade']) {
    assert.ok(!keys.includes(forbidden), `attempt payload leaked the key ${forbidden}`);
  }

  const resumed = await call('/api/entry', {
    method: 'POST',
    body: { candidateId: 'nif/che/77001', name: 'Someone Else' },
    cookie,
  });
  assert.equal(resumed.payload.attempt.attemptId, attempt.attemptId);
  assert.equal(resumed.payload.attempt.deadline, attempt.deadline);
});

test('answers are validated and the deadline never moves on reload', async () => {
  const entry = await call('/api/entry', {
    method: 'POST',
    body: { candidateId: 'NIF/CHE/77002', name: 'Chidi Nwosu' },
  });
  const cookie = cookieFrom({ headers: entry.headers });
  const attempt = entry.payload.attempt;

  assert.equal((await call('/api/answer', { method: 'POST', body: { n: 1, index: 2 }, cookie })).status, 200);
  assert.equal((await call('/api/answer', { method: 'POST', body: { n: 41, index: 0 }, cookie })).status, 400);
  assert.equal((await call('/api/answer', { method: 'POST', body: { n: 1, index: 9 }, cookie })).status, 400);
  assert.equal((await call('/api/flag', { method: 'POST', body: { n: 1, flagged: true }, cookie })).status, 200);
  assert.equal((await call('/api/position', { method: 'POST', body: { n: 9 }, cookie })).status, 200);

  await new Promise((resolve) => setTimeout(resolve, 1200));
  const reload = await call('/api/attempt', { cookie });
  assert.equal(reload.payload.status, 'active');
  assert.equal(reload.payload.attempt.deadline, attempt.deadline);
  assert.equal(reload.payload.attempt.answers['1'], 2);
  assert.equal(reload.payload.attempt.flags['1'], true);
  assert.equal(reload.payload.attempt.position, 9);
  assert.ok(Date.parse(reload.payload.attempt.serverTime) >= Date.parse(attempt.serverTime));
});

test('the receipt is refused before submission and score-free after it', async () => {
  const entry = await call('/api/entry', {
    method: 'POST',
    body: { candidateId: 'NIF/CHE/77003', name: 'Halima Bello' },
  });
  const cookie = cookieFrom({ headers: entry.headers });
  assert.equal((await call('/api/receipt', { cookie })).status, 409);

  await call('/api/answer', { method: 'POST', body: { n: 1, index: 0 }, cookie });
  const submit = await call('/api/submit', { method: 'POST', cookie });
  assert.equal(submit.status, 200);
  const receipt = submit.payload.receipt;
  assert.match(receipt.reference, /^CH101-[A-Z2-9]{5}$/);
  assert.equal(receipt.answered, 1);
  assert.ok(['queued', 'rendering'].includes(receipt.artifacts.official.state));

  const json = JSON.stringify(receipt);
  assert.ok(!/"(score|percentage|grade|outcome|correct|pass|fail)"/i.test(json), json);

  const again = await call('/api/attempt', { cookie });
  assert.equal(again.payload.status, 'submitted');

  const answer = await call('/api/answer', { method: 'POST', body: { n: 2, index: 0 }, cookie });
  assert.equal(answer.status, 409);
});

test('close clears the cookie, and unknown routes are 404', async () => {
  const close = await call('/api/close', { method: 'POST' });
  assert.equal(close.status, 200);
  assert.match(close.headers.get('set-cookie') || '', /Max-Age=0/);
  assert.equal((await call('/api/nope')).status, 404);
  assert.equal((await call('/verify/CH101-ABCDE')).status, 404);
});

test('static assets are served with the right types and no traversal', async () => {
  const page = await fetch(base + '/');
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type') || '', /text\/html/);
  const css = await fetch(base + '/app.css');
  assert.match(css.headers.get('content-type') || '', /text\/css/);
  const js = await fetch(base + '/app.js');
  assert.match(js.headers.get('content-type') || '', /javascript/);
  assert.equal((await fetch(base + '/assets/fonts/plex-mono-400.woff2')).status, 200);
  assert.equal((await fetch(base + '/../app/server.js')).status, 404);
});
