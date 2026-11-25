'use strict';

/**
 * Chemistry 101 CBT service.
 *
 * Zero runtime dependencies: Node's http, fs, crypto and child_process are
 * sufficient for one exam screen, one attempt per candidate, and two PDFs.
 * The client never receives a correct answer, a seed, a bank hash, or a score.
 */

const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { loadBank, publicQuestion } = require('./lib/bank');
const { optionOrder } = require('./lib/random');
const { Store, HttpError, ARTIFACT_KINDS } = require('./lib/store');

const ROOT = path.resolve(__dirname, '..');
const DATA_ROOT = process.env.CHEM_DATA_ROOT
  ? path.resolve(process.env.CHEM_DATA_ROOT)
  : (process.env.VERCEL ? path.join(os.tmpdir(), 'chem101') : ROOT);
const PUBLIC_DIR = path.join(__dirname, 'public');
const FONTS_DIR = path.join(ROOT, 'assets', 'fonts');
const PDF_SCRIPT = path.join(ROOT, 'pdf', 'render.py');

const CONFIG = {
  paperLength: clampInt(process.env.CHEM_PAPER_LENGTH, 40, 20, 100),
  durationMinutes: clampInt(process.env.CHEM_DURATION_MINUTES, 15, 1, 300),
  courseCode: 'CHE 101',
  courseTitle: 'Chemistry 101',
  paperTitle: 'Mid-semester CBT',
  institution: 'CCF NIFES',
  office: 'Examinations Committee',
  verifyBase: process.env.CHEM_VERIFY_BASE || 'https://ccfnifes.example/verify',
};

function clampInt(raw, fallback, min, max) {
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`configuration value ${raw} must be an integer from ${min} to ${max}`);
  }
  return value;
}

const bank = loadBank({ root: ROOT });
const store = new Store({ root: DATA_ROOT, bank, config: CONFIG });
let storageError = null;
const storeReady = store.init().catch((error) => {
  storageError = error;
  console.error('Storage initialisation failed:', error.message);
});
const rendering = new Set();

// On a serverless host the local filesystem is private to one instance and
// disappears with it. Running examinations there without a shared store would
// silently lose answers, so those endpoints refuse instead.
const STORAGE_REQUIRED = Boolean(process.env.VERCEL) && !store.remote;
const SERVERLESS_PDF = Boolean(process.env.VERCEL) && !process.env.CHEM_ENABLE_PDF;
const SERVERLESS_PDF_MESSAGE =
  'Your record is stored and is prepared by the Examinations Office; it is not downloadable from this deployment.';
const STATE_ROUTES = new Set([
  '/api/entry',
  '/api/attempt',
  '/api/answer',
  '/api/flag',
  '/api/position',
  '/api/submit',
  '/api/receipt',
  '/api/review',
]);
const STORAGE_HELP =
  'This deployment has no shared storage, so an attempt would be lost between requests. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN on the project, then redeploy.';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
};

const STATIC_FILES = {
  '/': path.join(PUBLIC_DIR, 'index.html'),
  '/index.html': path.join(PUBLIC_DIR, 'index.html'),
  '/app.css': path.join(PUBLIC_DIR, 'app.css'),
  '/app.js': path.join(PUBLIC_DIR, 'app.js'),
  '/seal.png': path.join(PUBLIC_DIR, 'seal.png'),
  '/favicon.svg': path.join(PUBLIC_DIR, 'favicon.svg'),
};

const FONT_FILES = {
  '/assets/fonts/crimson-pro-400.woff2': 'crimson-pro-400.woff2',
  '/assets/fonts/crimson-pro-500.woff2': 'crimson-pro-500.woff2',
  '/assets/fonts/crimson-pro-600.woff2': 'crimson-pro-600.woff2',
  '/assets/fonts/atkinson-400.woff2': 'atkinson-400.woff2',
  '/assets/fonts/atkinson-700.woff2': 'atkinson-700.woff2',
  '/assets/fonts/plex-mono-400.woff2': 'plex-mono-400.woff2',
  '/assets/fonts/plex-mono-500.woff2': 'plex-mono-500.woff2',
};

function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; " +
      "img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  );
}

function sendJson(res, status, payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8');
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function sendError(res, error) {
  const status = Number(error && error.status) || 500;
  if (status >= 500) console.error(error);
  sendJson(res, status, {
    error:
      status >= 500 && status !== 503
        ? 'The examination service could not complete that request.'
        : error.message,
  });
}

function readBody(req) {
  if (req.body) {
    if (typeof req.body === 'object') return Promise.resolve(req.body);
    if (typeof req.body === 'string') {
      try {
        return Promise.resolve(JSON.parse(req.body));
      } catch {
        return Promise.reject(new HttpError(400, 'Invalid JSON body.'));
      }
    }
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new HttpError(413, 'Request is too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'Request body must be JSON.'));
      }
    });
    req.on('error', reject);
  });
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

function attemptIdFrom(req) {
  const cookie = req.cookies?.chem_attempt || parseCookies(req).chem_attempt;
  if (cookie && /^att_[a-f0-9]{16}$/.test(cookie)) return cookie;
  return null;
}

function setAttemptCookie(res, id) {
  res.setHeader(
    'Set-Cookie',
    `chem_attempt=${encodeURIComponent(id)}; Path=/; HttpOnly; SameSite=Lax`,
  );
}

function clientAttempt(attempt) {
  const letters = 'ABCDEF';
  const questions = attempt.paper.map((itemId, index) => {
    const item = bank.byId.get(itemId);
    const order = optionOrder(item, attempt.seed).order;
    return publicQuestion(item, order, index + 1);
  });
  return {
    attemptId: attempt.id,
    candidate: { id: attempt.candidate.id, name: attempt.candidate.name },
    exam: {
      courseCode: CONFIG.courseCode,
      courseTitle: CONFIG.courseTitle,
      paperTitle: CONFIG.paperTitle,
    },
    paperLength: attempt.paper.length,
    durationMinutes: attempt.durationMinutes,
    startedAt: attempt.startedAt,
    deadline: attempt.deadline,
    serverTime: new Date().toISOString(),
    position: attempt.position,
    answers: attempt.answers,
    flags: attempt.flags,
    questions,
    optionLetters: letters,
  };
}

async function requireAttempt(req) {
  const id = attemptIdFrom(req);
  if (!id) throw new HttpError(401, 'No examination attempt is open in this browser.');
  const attempt = await store.hydrate(id);
  if (!attempt) throw new HttpError(404, 'This examination attempt was not found.');
  return { id, attempt };
}

/**
 * Rendering is slow, so a normal server returns the response first. On a
 * serverless host the renderer does not exist, so the failure is recorded
 * before responding — otherwise the receipt would poll "Preparing…" forever.
 */
async function offerArtifacts(id, kinds = ARTIFACT_KINDS) {
  if (SERVERLESS_PDF) await generateArtifacts(id, kinds);
  else void generateArtifacts(id, kinds);
}

async function generateArtifacts(id, kinds = ARTIFACT_KINDS, { retryFailed = false } = {}) {
  const attempt = await store.hydrate(id);
  if (!attempt || !attempt.submitted) return;
  const eligible = kinds.filter((kind) => {
    const state = attempt.artifacts[kind]?.state;
    const open = state === 'queued' || state === 'rendering' || (retryFailed && state === 'failed');
    return open && !rendering.has(`${id}:${kind}`);
  });
  if (!eligible.length) return;

  for (const kind of eligible) {
    rendering.add(`${id}:${kind}`);
    store.setArtifact(id, kind, { state: 'rendering', error: null });
  }
  const wanted = eligible;

  if (SERVERLESS_PDF) {
    for (const kind of wanted) {
      rendering.delete(`${id}:${kind}`);
      store.setArtifact(id, kind, {
        state: 'failed',
        error: SERVERLESS_PDF_MESSAGE,
      });
    }
    await store.flush();
    return;
  }

  const env = { ...process.env, PYTHONIOENCODING: 'utf-8' };
  const python = process.env.CHEM_PYTHON || 'python';
  const args = [
    PDF_SCRIPT,
    '--snapshot',
    attempt.snapshotPath,
    '--out-dir',
    store.resultsDir,
    '--fonts',
    FONTS_DIR,
    '--kinds',
    wanted.join(','),
  ];

  await new Promise((resolve) => {
    const child = spawn(python, args, { cwd: ROOT, env, windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', (error) => {
      stderr += error.message;
    });
    child.on('close', async (code) => {
      for (const kind of wanted) rendering.delete(`${id}:${kind}`);
      let report = null;
      const lines = stdout.trim().split(/\r?\n/);
      for (let i = lines.length - 1; i >= 0; i -= 1) {
        try {
          report = JSON.parse(lines[i]);
          break;
        } catch {
          /* keep looking */
        }
      }
      if (code === 0 && report && report.ok) {
        for (const kind of wanted) {
          const row = report.documents?.[kind];
          if (row && row.path) {
            store.setArtifact(id, kind, {
              state: 'ready',
              pages: row.pages || 0,
              filename: path.basename(row.path),
              bytes: row.bytes || 0,
              error: null,
            });
          } else {
            store.setArtifact(id, kind, {
              state: 'failed',
              error: 'The renderer did not report this document.',
            });
          }
        }
      } else {
        const message =
          (report && report.error) ||
          stderr.trim().split(/\r?\n/).filter(Boolean).slice(-3).join(' · ') ||
          `Renderer exited with code ${code}.`;
        for (const kind of wanted) {
          store.setArtifact(id, kind, { state: 'failed', error: message.slice(0, 500) });
        }
      }
      await store.flush();
      resolve();
    });
  });
}

function safeStatic(res, file) {
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) {
      sendJson(res, 404, { error: 'Not found.' });
      return;
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': ext === '.woff2' ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  });
}

async function handleRequest(req, res) {
  securityHeaders(res);
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const rawPath =
    req.query?.__path ||
    url.searchParams.get('__path') ||
    req.headers['x-matched-path'] ||
    req.headers['x-forwarded-uri'] ||
    url.pathname;
  const pathname = decodeURIComponent(rawPath.split('?')[0]);

  try {
    await storeReady;
    if (storageError) {
      throw new HttpError(503, 'The examination store is unavailable. Try again shortly.');
    }
    if (STORAGE_REQUIRED && (STATE_ROUTES.has(pathname) || pathname.startsWith('/api/artifacts/'))) {
      throw new HttpError(503, STORAGE_HELP);
    }

    if (req.method === 'GET' && STATIC_FILES[pathname]) {
      return safeStatic(res, STATIC_FILES[pathname]);
    }
    if (req.method === 'GET' && FONT_FILES[pathname]) {
      return safeStatic(res, path.join(FONTS_DIR, FONT_FILES[pathname]));
    }

    if (req.method === 'GET' && pathname === '/api') {
      return sendJson(res, 200, {
        ok: true,
        service: 'chem101-cbt',
        courseCode: CONFIG.courseCode,
        courseTitle: CONFIG.courseTitle,
        paperLength: CONFIG.paperLength,
        durationMinutes: CONFIG.durationMinutes,
      });
    }

    if (req.method === 'GET' && pathname === '/health') {
      return sendJson(res, 200, {
        ok: true,
        service: 'chem101-cbt',
        bankVersion: bank.version,
        bankItems: bank.items.length,
        drawable: bank.drawable.size,
        needsReview: bank.displayManifest.typeset_required.length,
        paperLength: CONFIG.paperLength,
        durationMinutes: CONFIG.durationMinutes,
        storage: store.remote ? 'redis' : 'file',
        attempts: await store.stats(),
        serverTime: new Date().toISOString(),
      });
    }

    if (req.method === 'GET' && pathname === '/api/exam') {
      return sendJson(res, 200, {
        courseCode: CONFIG.courseCode,
        courseTitle: CONFIG.courseTitle,
        paperTitle: CONFIG.paperTitle,
        institution: CONFIG.institution,
        paperLength: CONFIG.paperLength,
        durationMinutes: CONFIG.durationMinutes,
      });
    }

    if (req.method === 'POST' && pathname === '/api/entry') {
      const body = await readBody(req);
      const { attempt, resumed } = await store.createAttempt(body);
      await store.flush();
      setAttemptCookie(res, attempt.id);
      if (attempt.submitted) {
        return sendJson(res, 200, { status: 'submitted', attemptId: attempt.id, resumed });
      }
      return sendJson(res, 200, {
        status: 'active',
        resumed,
        attempt: clientAttempt(attempt),
      });
    }

    if (req.method === 'GET' && pathname === '/api/attempt') {
      // No cookie is the normal first visit, not an error.
      if (!attemptIdFrom(req)) return sendJson(res, 200, { status: 'none' });
      const { id } = await requireAttempt(req);
      const attempt = await store.ensureExpired(id);
      await store.flush();
      if (!attempt) throw new HttpError(404, 'This examination attempt was not found.');
      if (attempt.submitted) {
        await offerArtifacts(id);
        return sendJson(res, 200, {
          status: 'submitted',
          attemptId: attempt.id,
          timeExpired: attempt.timeExpired,
        });
      }
      return sendJson(res, 200, { status: 'active', attempt: clientAttempt(attempt) });
    }

    if (req.method === 'POST' && pathname === '/api/answer') {
      const { id } = await requireAttempt(req);
      const body = await readBody(req);
      await store.ensureExpired(id);
      await store.flush();
      const result = store.saveAnswer(id, body.n, body.index === null ? null : Number(body.index));
      const attempt = store.get(id);
      await store.flush();
      return sendJson(res, 200, {
        ok: true,
        ...result,
        answered: Object.keys(attempt.answers).length,
        savedAt: new Date().toISOString(),
      });
    }

    if (req.method === 'POST' && pathname === '/api/flag') {
      const { id } = await requireAttempt(req);
      const body = await readBody(req);
      await store.ensureExpired(id);
      await store.flush();
      const result = store.saveFlag(id, body.n, Boolean(body.flagged));
      await store.flush();
      return sendJson(res, 200, { ok: true, ...result, savedAt: new Date().toISOString() });
    }

    if (req.method === 'POST' && pathname === '/api/position') {
      const { id } = await requireAttempt(req);
      const body = await readBody(req);
      await store.ensureExpired(id);
      await store.flush();
      const result = store.savePosition(id, body.n);
      await store.flush();
      return sendJson(res, 200, { ok: true, ...result });
    }

    if (req.method === 'POST' && pathname === '/api/submit') {
      const { id } = await requireAttempt(req);
      await store.ensureExpired(id);
      const { attempt, snapshot, alreadySubmitted } = await store.submit(id);
      await store.flush();
      if (!alreadySubmitted) await offerArtifacts(id);
      const receiptSnapshot = snapshot || (await store.readSnapshot(attempt.id));
      return sendJson(res, 200, {
        status: 'submitted',
        alreadySubmitted,
        receipt: store.receipt(attempt.id, receiptSnapshot),
      });
    }

    if (req.method === 'GET' && pathname === '/api/receipt') {
      const { id } = await requireAttempt(req);
      await store.ensureExpired(id);
      await store.flush();
      await offerArtifacts(id);
      await store.flush();
      const snapshot = await store.readSnapshot(id);
      const receipt = store.receipt(id, snapshot);
      return sendJson(res, 200, receipt);
    }

    if (req.method === 'GET' && pathname === '/api/review') {
      const { id } = await requireAttempt(req);
      await store.ensureExpired(id);
      await store.flush();
      const snapshot = await store.readSnapshot(id);
      return sendJson(res, 200, store.review(id, snapshot));
    }

    const artifactMatch = /^\/api\/artifacts\/(official|review)(\/retry)?$/.exec(pathname);
    if (artifactMatch) {
      const { id } = await requireAttempt(req);
      const kind = artifactMatch[1];
      const retry = Boolean(artifactMatch[2]);
      const attempt = store.get(id);
      if (!attempt || !attempt.submitted) throw new HttpError(409, 'There is no submitted result in this browser.');

      if (retry && req.method === 'POST') {
        if (rendering.has(`${id}:${kind}`)) {
          return sendJson(res, 202, { ok: true, state: 'rendering' });
        }
        store.setArtifact(id, kind, { state: 'queued', error: null });
        await store.flush();
        await offerArtifacts(id, [kind]);
        return sendJson(res, 202, { ok: true, state: 'queued' });
      }

      if (req.method === 'GET') {
        const row = attempt.artifacts[kind];
        if (!row || row.state !== 'ready') {
          throw new HttpError(409, row?.error || 'This document is still being prepared.');
        }
        const { file, filename } = store.artifactFile(id, kind);
        if (!fs.existsSync(file)) {
          store.setArtifact(id, kind, { state: 'failed', error: 'The prepared file is missing. Retry.' });
          await store.flush();
          throw new HttpError(409, 'The prepared file is missing. Retry.');
        }
        const stat = fs.statSync(file);
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Length': stat.size,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-store',
        });
        fs.createReadStream(file).pipe(res);
        store.markDownloaded(id, kind);
        await store.flush();
        return;
      }
    }

    if (req.method === 'POST' && pathname === '/api/close') {
      res.setHeader('Set-Cookie', 'chem_attempt=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'GET' && pathname.startsWith('/verify/')) {
      const ref = pathname.slice('/verify/'.length);
      return sendJson(res, 404, {
        error: 'Verification is not configured in this build.',
        reference: ref,
      });
    }

    sendJson(res, 404, { error: 'Not found.' });
  } catch (error) {
    sendError(res, error);
  }
}

const server = http.createServer(handleRequest);

if (!process.env.VERCEL) {
  const PORT = Number(process.env.PORT || 5173);
  const HOST = process.env.HOST || '127.0.0.1';

  server.listen(PORT, HOST, () => {
    console.log(`Chemistry 101 CBT · bank ${bank.version} · ${bank.items.length} items · paper ${CONFIG.paperLength}`);
    console.log(`Storage: ${store.remote ? 'shared Redis' : 'local filesystem'}`);
    console.log(`Open http://${HOST}:${PORT}`);
    void (async () => {
      await storeReady;
      const recover = await store.incompleteArtifacts();
      if (!recover.length) return;
      const byAttempt = new Map();
      for (const row of recover) {
        if (!byAttempt.has(row.id)) byAttempt.set(row.id, []);
        byAttempt.get(row.id).push(row.kind);
      }
      for (const [id, kinds] of byAttempt) {
        console.log(`Re-rendering ${kinds.join(' + ')} for ${id}`);
        void generateArtifacts(id, kinds, { retryFailed: true });
      }
    })();
  });

  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

module.exports = { server, store, storeReady, CONFIG, generateArtifacts, handleRequest };
