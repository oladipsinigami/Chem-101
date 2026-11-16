'use strict';

/* ==========================================================================
   Chemistry 101 — CBT client.
   The client never receives a correct answer, a seed, a bank hash, or a score.
   It renders the paper it is given, records answers, and hands off two PDFs.
   ========================================================================== */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LETTERS = 'ABCDEF';

const $ = (id) => document.getElementById(id);

const state = {
  view: 'entry',
  attempt: null,
  questions: [],
  total: 0,
  index: 0,
  answers: {},
  flags: {},
  deadline: 0,
  offset: 0,
  clock: null,
  submitted: false,
  submitting: false,
  saveQueue: new Map(),
  flushing: false,
  lastSaveAt: null,
  warnings: { five: false, one: false },
  receipt: null,
  poll: null,
  overlay: null,
  closing: false,
};

/* ------------------------------------------------------------------ utils */

function pad2(value) {
  return String(value).padStart(2, '0');
}

function plural(count, one, many) {
  return count === 1 ? one : many;
}

function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function announce(text) {
  const el = $('announcer');
  if (!el) return;
  el.textContent = '';
  window.setTimeout(() => {
    el.textContent = text;
  }, 30);
}

async function api(path, { method = 'GET', body = null } = {}) {
  const options = { method, headers: { Accept: 'application/json' } };
  if (body !== null) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(path, options);
  } catch (error) {
    const wrapped = new Error('Network unavailable. Check your connection.');
    wrapped.offline = true;
    throw wrapped;
  }
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  if (!response.ok) {
    const error = new Error(payload.error || 'The service could not complete that request.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

function setView(name) {
  state.view = name;
  $('view-entry').hidden = name !== 'entry';
  $('view-exam').hidden = name !== 'exam';
  $('view-receipt').hidden = name !== 'receipt';
}

/* ------------------------------------------------------------------ theme */

function preferredTheme() {
  const stored = (() => {
    try {
      return localStorage.getItem('chem101-theme');
    } catch {
      return null;
    }
  })();
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const button = $('theme-btn');
  if (!button) return;
  const dark = theme === 'dark';
  $('icon-moon').hidden = dark;
  $('icon-sun').hidden = !dark;
  button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem('chem101-theme', next);
  } catch {
    /* private mode: the theme simply does not persist */
  }
  applyTheme(next);
}

/* ------------------------------------------------------------------ boot */

async function boot() {
  applyTheme(preferredTheme());
  wireEntry();
  wireExam();
  wireReceipt();
  await applyExamFacts();

  try {
    const payload = await api('/api/attempt');
    if (payload.status === 'submitted') {
      await showReceipt();
      return;
    }
    if (payload.status === 'active' && payload.attempt) {
      startExam(payload.attempt);
      return;
    }
  } catch (error) {
    if (error.status && error.status !== 401 && error.status !== 404) {
      // A live but broken session should not silently drop to the entry form.
      $('entry-error').textContent = error.message;
      $('entry-error').hidden = false;
    }
  }
  showEntry();
}

function showEntry() {
  stopClock();
  stopPolling();
  state.submitted = false;
  closeOverlay({ restoreFocus: false });
  setView('entry');
  const id = $('candidate-id');
  if (id && !id.value) id.focus({ preventScroll: true });
}

/* The entry sheet states the configured paper length and duration. */
async function applyExamFacts() {
  try {
    const exam = await api('/api/exam');
    if (!exam || !exam.paperLength) return;
    $('fact-questions').textContent = `${exam.paperLength} questions`;
    $('fact-duration').textContent = `${exam.durationMinutes} minutes`;
    $('bar-course').textContent = exam.courseCode;
    $('bar-title').textContent = exam.courseTitle;
    document.title = `${exam.courseCode} — Computer-based examination`;
  } catch {
    /* the static figures in the markup are the documented default */
  }
}

/* ------------------------------------------------------------------ entry */

function wireEntry() {
  $('entry-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const errorBox = $('entry-error');
    errorBox.hidden = true;

    const candidateId = $('candidate-id').value.trim();
    const name = $('candidate-name').value.trim();
    const programme = $('candidate-programme').value.trim();
    const cohort = $('candidate-cohort').value.trim();

    if (!candidateId) return entryError('Enter your candidate ID.', $('candidate-id'));
    if (!name) return entryError('Enter the name on your examination card.', $('candidate-name'));

    const button = $('entry-submit');
    button.disabled = true;
    button.textContent = 'Opening…';
    try {
      const payload = await api('/api/entry', {
        method: 'POST',
        body: { candidateId, name, programme, cohort },
      });
      if (payload.status === 'submitted') {
        await showReceipt();
        return;
      }
      startExam(payload.attempt);
    } catch (error) {
      entryError(error.message);
    } finally {
      button.disabled = false;
      button.textContent = 'Begin examination';
    }
  });
}

function entryError(message, field) {
  const box = $('entry-error');
  box.textContent = message;
  box.hidden = false;
  box.scrollIntoView({ block: 'nearest' });
  if (field) field.focus({ preventScroll: true });
}

/* ------------------------------------------------------------------ exam */

function startExam(attempt) {
  state.attempt = attempt;
  state.questions = attempt.questions;
  state.total = attempt.questions.length;
  state.answers = { ...attempt.answers };
  state.flags = { ...attempt.flags };
  state.index = Math.min(Math.max((attempt.position || 1) - 1, 0), state.total - 1);
  state.deadline = Date.parse(attempt.deadline);
  state.offset = Date.parse(attempt.serverTime || new Date().toISOString()) - Date.now();
  state.submitted = false;
  state.warnings = { five: false, one: false };
  $('timer').dataset.state = 'normal';
  $('timer-label').textContent = 'remaining';
  unlockExam();

  $('bar-course').textContent = attempt.exam.courseCode;
  $('bar-title').textContent = attempt.exam.courseTitle;
  $('folio-of').textContent = `of ${state.total}`;
  $('rail-count').textContent = `0 of ${state.total}`;
  $('rail').classList.toggle('wide', state.total > 72);

  buildRail();
  setView('exam');
  renderQuestion({ focusStem: false });
  startClock();
  announce(`Question ${current().n} of ${state.total}`);
}

function current() {
  return state.questions[state.index];
}

function answeredCount() {
  return Object.keys(state.answers).length;
}

function flaggedCount() {
  return Object.keys(state.flags).length;
}

/* -- question rendering */

function renderQuestion({ focusStem = false } = {}) {
  const q = current();
  $('folio-n').textContent = pad2(q.n);
  $('topic').textContent = q.topicLabel;
  $('stem').innerHTML = q.stem;
  $('opts').innerHTML = q.options
    .map(
      (option, index) => `
      <button class="opt" type="button" role="radio" aria-checked="false"
              data-index="${index}" tabindex="-1">
        <span class="key" aria-hidden="true">${option.letter}</span>
        <span class="olt">${option.text}</span>
        <span class="mark" aria-hidden="true"></span>
      </button>`,
    )
    .join('');
  $('opts').setAttribute('aria-label', `Question ${q.n}. Choose one answer.`);

  paintSelection();
  paintFlag();
  paintBar();
  paintMap();
  paintCounts();
  paintProgress();

  if (focusStem) $('stem').focus({ preventScroll: true });
  if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function paintSelection() {
  const q = current();
  const chosen = state.answers[q.n];
  for (const button of $('opts').querySelectorAll('.opt')) {
    const index = Number(button.dataset.index);
    const on = chosen === index;
    button.classList.toggle('on', on);
    button.setAttribute('aria-checked', String(on));
    button.tabIndex = on || (chosen === undefined && index === 0) ? 0 : -1;
  }
  $('clear-btn').disabled = chosen === undefined;
  $('clear-inline').disabled = chosen === undefined;
}

function paintFlag() {
  const q = current();
  const on = Boolean(state.flags[q.n]);
  const button = $('flag-btn');
  button.classList.toggle('on', on);
  button.setAttribute('aria-pressed', String(on));
  $('flag-on').hidden = !on;
  $('flag-off').hidden = on;
  $('flag-text').textContent = on ? 'Flagged' : 'Flag for review';
  button.setAttribute('aria-label', on ? 'Question flagged. Remove flag' : 'Flag question for review');
}

function paintBar() {
  const last = state.index === state.total - 1;
  $('prev-btn').disabled = state.index === 0;
  $('next-label').textContent = last ? 'Review answers' : 'Next';
  $('next-btn').setAttribute('aria-label', last ? 'Review answers' : `Next question, question ${current().n + 1}`);
}

function paintProgress() {
  const pct = state.total ? (answeredCount() / state.total) * 100 : 0;
  $('progress-fill').style.width = `${pct}%`;
}

function paintCounts() {
  const answered = answeredCount();
  $('count-answered').textContent = pad2(answered);
  $('count-unanswered').textContent = pad2(state.total - answered);
  $('count-flagged').textContent = pad2(flaggedCount());
  $('rail-count').textContent = `${answered} of ${state.total}`;
}

/* -- map */

function buildRail() {
  const grid = $('rail-grid');
  grid.innerHTML = '';
  for (const q of state.questions) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cell';
    button.dataset.n = String(q.n);
    button.innerHTML = `<span>${pad2(q.n)}</span><i class="fd" aria-hidden="true" hidden></i>`;
    button.addEventListener('click', () => goTo(q.n - 1));
    grid.appendChild(button);
  }
}

function paintMap() {
  const grid = $('rail-grid');
  if (!grid) return;
  const answered = state.answers;
  for (const button of grid.querySelectorAll('.cell')) {
    const n = Number(button.dataset.n);
    const isAnswered = answered[n] !== undefined;
    const isFlagged = Boolean(state.flags[n]);
    const isCurrent = n === current().n;
    button.classList.toggle('ans', isAnswered);
    button.classList.toggle('cur', isCurrent);
    const dot = button.querySelector('.fd');
    if (dot) dot.hidden = !isFlagged;
    const parts = [`Question ${n}`];
    parts.push(isAnswered ? 'answered' : 'unanswered');
    if (isFlagged) parts.push('flagged');
    if (isCurrent) parts.push('current');
    button.setAttribute('aria-label', parts.join(', '));
    if (isCurrent) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
    button.tabIndex = isCurrent ? 0 : -1;
  }
}

/* -- answering */

async function choose(index) {
  if (state.submitted || state.view !== 'exam') return;
  const q = current();
  if (!Number.isInteger(index) || index < 0 || index >= q.options.length) return;
  if (state.answers[q.n] === index) return;

  state.answers[q.n] = index;
  paintSelection();
  paintMap();
  paintCounts();
  paintProgress();
  announce(`Question ${q.n}, answer ${q.options[index].letter} selected`);
  queueSave(q.n, index);
  try {
    await api('/api/position', { method: 'POST', body: { n: q.n } });
  } catch {
    /* position is a convenience; the answer is what matters */
  }
}

function clearAnswer() {
  if (state.submitted) return;
  const q = current();
  if (state.answers[q.n] === undefined) return;
  delete state.answers[q.n];
  paintSelection();
  paintMap();
  paintCounts();
  paintProgress();
  announce(`Question ${q.n}, answer cleared`);
  queueSave(q.n, null);
}

function toggleFlag() {
  if (state.submitted) return;
  const q = current();
  if (state.flags[q.n]) delete state.flags[q.n];
  else state.flags[q.n] = true;
  paintFlag();
  paintMap();
  paintCounts();
  announce(state.flags[q.n] ? `Question ${q.n} flagged for review` : `Flag removed from question ${q.n}`);
  api('/api/flag', { method: 'POST', body: { n: q.n, flagged: Boolean(state.flags[q.n]) } }).catch(() => {
    setSaveState('failed');
    showBanner('Your flag was saved on this page but may not have reached the server. Retry.');
  });
}

/* -- saves */

function queueSave(n, value) {
  state.saveQueue.set(n, value);
  void flushSaves();
}

async function flushSaves() {
  if (state.flushing || state.saveQueue.size === 0) return;
  state.flushing = true;
  setSaveState('saving');
  let failed = false;
  while (state.saveQueue.size) {
    const [n, value] = state.saveQueue.entries().next().value;
    state.saveQueue.delete(n);
    try {
      await api('/api/answer', { method: 'POST', body: { n, index: value } });
    } catch (error) {
      if (error.status === 409) {
        state.flushing = false;
        await showReceipt();
        return;
      }
      state.saveQueue.set(n, value);
      failed = true;
      break;
    }
  }
  state.flushing = false;
  if (failed) {
    setSaveState('failed');
    showBanner('Answers are not saving. Retry.');
  } else {
    state.lastSaveAt = new Date();
    setSaveState('saved');
    hideBanner();
  }
}

function setSaveState(kind) {
  const el = $('save-status');
  if (!el) return;
  el.dataset.state = kind;
  if (kind === 'saving') $('save-text').textContent = 'Saving…';
  else if (kind === 'failed') $('save-text').textContent = 'Not saved';
  else $('save-text').textContent = state.lastSaveAt ? `Saved ${formatTime(state.lastSaveAt.toISOString())}` : 'Saved';
}

function showBanner(message) {
  const banner = $('banner');
  $('banner-text').textContent = message;
  banner.dataset.tone = 'amber';
  banner.hidden = false;
}

function hideBanner() {
  $('banner').hidden = true;
}

function retrySaves() {
  if (state.saveQueue.size === 0) {
    hideBanner();
    setSaveState('saved');
    return;
  }
  void flushSaves();
}

/* -- navigation */

function goTo(index) {
  if (state.submitted) return;
  if (index < 0 || index >= state.total) return;
  const changed = index !== state.index;
  state.index = index;
  if (changed) {
    renderQuestion({ focusStem: true });
    announce(`Question ${current().n} of ${state.total}, ${current().topicLabel}`);
  } else {
    paintMap();
  }
  api('/api/position', { method: 'POST', body: { n: current().n } }).catch(() => {});
}

function go(delta) {
  goTo(state.index + delta);
}

/* -- clock */

function startClock() {
  stopClock();
  tick();
  state.clock = window.setInterval(tick, 500);
  document.addEventListener('visibilitychange', tick);
}

function stopClock() {
  if (state.clock) window.clearInterval(state.clock);
  state.clock = null;
  document.removeEventListener('visibilitychange', tick);
}

function tick() {
  if (!state.deadline || state.submitted) return;
  const remaining = state.deadline - (Date.now() + state.offset);
  const seconds = remaining <= 0 ? 0 : Math.ceil(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  $('timer-digits').textContent = `${pad2(minutes)}:${pad2(seconds % 60)}`;

  const timer = $('timer');
  if (seconds <= 60) timer.dataset.state = 'critical';
  else if (seconds <= 300) timer.dataset.state = 'warning';
  else timer.dataset.state = 'normal';

  if (seconds <= 300 && !state.warnings.five) {
    state.warnings.five = true;
    $('timer-label').textContent = 'five minutes';
    announce('Five minutes remaining');
  }
  if (seconds <= 60 && !state.warnings.one) {
    state.warnings.one = true;
    $('timer-label').textContent = 'one minute';
    announce('One minute remaining');
  }
  if (seconds <= 0) {
    stopClock();
    void expire();
  }
}

async function expire() {
  if (state.submitted) return;
  state.submitted = true;
  closeOverlay({ restoreFocus: false });
  $('timer-digits').textContent = '00:00';
  $('timer').dataset.state = 'expired';
  $('timer-label').textContent = 'time is up';
  lockExam();
  announce('Time is up. Your answers were submitted automatically.');
  await submitAttempt({ auto: true });
}

function lockExam() {
  $('opts').setAttribute('aria-disabled', 'true');
  for (const button of $('opts').querySelectorAll('.opt')) button.disabled = true;
  for (const id of ['prev-btn', 'next-btn', 'clear-btn', 'clear-inline', 'flag-btn', 'submit-btn', 'map-btn']) {
    const el = $(id);
    if (el) el.disabled = true;
  }
}

function unlockExam() {
  $('opts').removeAttribute('aria-disabled');
  for (const id of ['prev-btn', 'next-btn', 'clear-btn', 'clear-inline', 'flag-btn', 'submit-btn', 'map-btn']) {
    const el = $(id);
    if (el) el.disabled = false;
  }
}

/* -- submit */

function openSubmitDialog() {
  if (state.submitted) return;
  const answered = answeredCount();
  const flagged = flaggedCount();
  const unanswered = state.total - answered;
  const lead =
    unanswered > 0
      ? `<b>${unanswered}</b> ${plural(unanswered, 'question is', 'questions are')} unanswered. Unanswered questions score zero.`
      : `All ${state.total} questions are answered.`;
  const flagLine =
    flagged > 0
      ? ` ${flagged} ${plural(flagged, 'question is', 'questions are')} flagged for review. <button class="link-btn" type="button" data-action="flags">Review flagged</button>`
      : '';
  const action = unanswered > 0 ? 'Submit anyway' : 'Submit exam';

  const node = document.createElement('div');
  node.className = 'dialog';
  node.setAttribute('role', 'dialog');
  node.setAttribute('aria-modal', 'true');
  node.setAttribute('aria-labelledby', 'dlg-title');
  node.innerHTML = `
    <h2 id="dlg-title">Submit this exam?</h2>
    <p class="lead">${lead}${flagLine}</p>
    <div class="tally">
      <div class="trow"><span class="tk">Answered</span><span class="tv">${pad2(answered)}</span></div>
      <div class="trow"><span class="tk">Unanswered</span><span class="tv">${pad2(unanswered)}</span></div>
      <div class="trow"><span class="tk">Flagged for review</span><span class="tv ${flagged ? 'flag' : ''}">${pad2(flagged)}</span></div>
    </div>
    <p class="note">Once submitted, the exam cannot be reopened.</p>
    <div class="dact">
      <button class="btn btn-ghost" type="button" data-action="keep">Keep working</button>
      <button class="btn btn-ink" type="button" data-action="submit">${action}</button>
    </div>`;

  node.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'keep') closeOverlay();
    if (action === 'flags') {
      closeOverlay({ restoreFocus: false });
      const first = Object.keys(state.flags).map(Number).sort((a, b) => a - b)[0];
      if (first) goTo(first - 1);
    }
    if (action === 'submit') void submitAttempt({ auto: false });
  });

  openOverlay(node, { initialFocus: node.querySelector('[data-action="keep"]') });
}

async function submitAttempt({ auto }) {
  if (state.submitting) return;
  if (state.view === 'receipt') return;
  state.submitting = true;
  if (!auto) {
    const button = state.overlay?.node.querySelector('[data-action="submit"]');
    if (button) {
      button.disabled = true;
      button.textContent = 'Submitting…';
    }
  }
  try {
    const payload = await api('/api/submit', { method: 'POST' });
    state.submitted = true;
    stopClock();
    await showReceipt(payload.receipt);
    announce('Exam submitted.');
  } catch (error) {
    if (auto) {
      window.setTimeout(() => {
        state.submitting = false;
        void submitAttempt({ auto: true });
      }, 5000);
      return;
    }
    showSubmitFailure(error.message);
  } finally {
    state.submitting = false;
  }
}

function showSubmitFailure(message) {
  const node = document.createElement('div');
  node.className = 'dialog';
  node.setAttribute('role', 'dialog');
  node.setAttribute('aria-modal', 'true');
  node.setAttribute('aria-labelledby', 'dlg-title');
  node.innerHTML = `
    <h2 id="dlg-title">Submission failed</h2>
    <p class="lead">Your answers are saved. ${message || 'Check your connection and try again.'}</p>
    <div class="dact">
      <button class="btn btn-ghost" type="button" data-action="keep">Keep working</button>
      <button class="btn btn-ink" type="button" data-action="retry">Retry</button>
    </div>`;
  node.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'keep') closeOverlay();
    if (action === 'retry') void submitAttempt({ auto: false });
  });
  openOverlay(node, { initialFocus: node.querySelector('[data-action="retry"]') });
}

/* -- map sheet */

function openMapSheet() {
  const answered = answeredCount();
  const node = document.createElement('div');
  node.className = 'sheet';
  node.setAttribute('role', 'dialog');
  node.setAttribute('aria-modal', 'true');
  node.setAttribute('aria-labelledby', 'sheet-title');
  node.innerHTML = `
    <div class="grab" aria-hidden="true"></div>
    <div class="sheet-head">
      <div>
        <span class="label">Exam navigation</span>
        <h2 id="sheet-title" tabindex="-1">Question map</h2>
      </div>
      <span class="rail-count">${answered} of ${state.total} answered</span>
    </div>
    <div class="sheet-rule"></div>
    <div class="sheet-grid" role="group" aria-label="Jump to a question"></div>
    <div class="legend">
      <span class="lg"><span class="gl ans" aria-hidden="true"></span>Answered</span>
      <span class="lg"><span class="gl un" aria-hidden="true"></span>Unanswered</span>
      <span class="lg"><span class="gl fl" aria-hidden="true"></span>Flagged</span>
      <span class="lg"><span class="gl cur" aria-hidden="true"></span>Current</span>
    </div>
    <button class="btn btn-ink" type="button" data-action="submit">Submit exam</button>`;

  const grid = node.querySelector('.sheet-grid');
  for (const q of state.questions) {
    const isAnswered = state.answers[q.n] !== undefined;
    const isFlagged = Boolean(state.flags[q.n]);
    const isCurrent = q.n === current().n;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `scell${isAnswered ? ' ans' : ''}${isCurrent ? ' cur' : ''}`;
    button.dataset.n = String(q.n);
    button.innerHTML = `<span>${pad2(q.n)}</span>${isFlagged ? '<i class="fd" aria-hidden="true"></i>' : ''}`;
    const parts = [`Question ${q.n}`, isAnswered ? 'answered' : 'unanswered'];
    if (isFlagged) parts.push('flagged');
    if (isCurrent) parts.push('current');
    button.setAttribute('aria-label', parts.join(', '));
    if (isCurrent) button.setAttribute('aria-current', 'step');
    button.addEventListener('click', () => {
      closeOverlay({ restoreFocus: false });
      goTo(q.n - 1);
      $('stem').focus({ preventScroll: true });
    });
    grid.appendChild(button);
  }
  node.querySelector('[data-action="submit"]').addEventListener('click', () => {
    closeOverlay({ restoreFocus: false });
    openSubmitDialog();
  });

  openOverlay(node, { initialFocus: node.querySelector('#sheet-title') });
}

/* -- overlay */

function focusable(node) {
  return Array.from(
    node.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.getClientRects().length > 0);
}

function onOverlayKeydown(event) {
  if (!state.overlay) return;
  const { node, opts } = state.overlay;
  if (event.key === 'Escape') {
    if (opts.dismissable === false) return;
    event.preventDefault();
    closeOverlay();
    return;
  }
  if (event.key !== 'Tab') return;
  const items = focusable(node);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && (document.activeElement === first || document.activeElement === node)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function openOverlay(node, opts = {}) {
  if (state.overlay) closeOverlay({ restoreFocus: false });
  const overlay = $('overlay');
  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  backdrop.addEventListener('click', () => {
    if (opts.dismissable !== false) closeOverlay();
  });
  overlay.innerHTML = '';
  overlay.append(backdrop, node);
  overlay.hidden = false;
  document.body.style.overflow = 'hidden';
  state.overlay = { node, opts, previous: document.activeElement, backdrop };
  overlay.addEventListener('keydown', onOverlayKeydown);
  const target = opts.initialFocus || focusable(node)[0] || node;
  window.setTimeout(() => target.focus({ preventScroll: true }), 0);
}

function closeOverlay({ restoreFocus = true } = {}) {
  const overlay = $('overlay');
  if (!overlay || overlay.hidden) return;
  const previous = state.overlay?.previous;
  overlay.removeEventListener('keydown', onOverlayKeydown);
  overlay.hidden = true;
  overlay.innerHTML = '';
  document.body.style.overflow = '';
  state.overlay = null;
  if (restoreFocus && previous && previous.isConnected) previous.focus({ preventScroll: true });
}

/* -- exam wiring */

function wireExam() {
  $('opts').addEventListener('click', (event) => {
    const button = event.target.closest('.opt');
    if (!button) return;
    void choose(Number(button.dataset.index));
  });

  $('prev-btn').addEventListener('click', () => go(-1));
  $('next-btn').addEventListener('click', () => {
    if (state.index === state.total - 1) openSubmitDialog();
    else go(1);
  });
  $('clear-btn').addEventListener('click', clearAnswer);
  $('clear-inline').addEventListener('click', clearAnswer);
  $('flag-btn').addEventListener('click', toggleFlag);
  $('submit-btn').addEventListener('click', openSubmitDialog);
  $('map-btn').addEventListener('click', openMapSheet);
  $('theme-btn').addEventListener('click', toggleTheme);
  $('banner-retry').addEventListener('click', retrySaves);

  document.addEventListener('keydown', (event) => {
    if (state.view !== 'exam' || state.submitted || state.overlay) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = event.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    // Option letters win over command shortcuts. A letter that is not an
    // option on this question falls through (so F still flags a 5-option item).
    // C is the one collision: it selects option C, and pressing C again on a
    // question already answered C clears it. See design/01 §7 resolution.
    const key = event.key.length === 1 ? event.key.toLowerCase() : '';
    const letter = key ? LETTERS.indexOf(key.toUpperCase()) : -1;
    if (letter >= 0 && letter < current().options.length) {
      event.preventDefault();
      if (key === 'c' && state.answers[current().n] === 2) clearAnswer();
      else void choose(letter);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
    } else if (key === 'c') {
      event.preventDefault();
      clearAnswer();
    } else if (key === 'f') {
      event.preventDefault();
      toggleFlag();
    } else if (key === 'm') {
      event.preventDefault();
      openMapSheet();
    } else if (key === 's') {
      event.preventDefault();
      openSubmitDialog();
    }
  });

  window.addEventListener('online', () => {
    if (state.saveQueue.size) retrySaves();
    else hideBanner();
  });
  window.addEventListener('offline', () => {
    if (state.view === 'exam' && !state.submitted) {
      showBanner('You are offline. Answers are queued and will sync.');
    }
  });
}

/* ------------------------------------------------------------------ receipt */

async function showReceipt(payload) {
  state.submitted = true;
  stopClock();
  stopPolling();
  closeOverlay({ restoreFocus: false });
  setView('receipt');

  let receipt = payload;
  if (!receipt) {
    try {
      receipt = await api('/api/receipt');
    } catch (error) {
      $('receipt-sub').textContent = error.message;
    }
  }
  if (receipt) {
    state.receipt = receipt;
    paintReceipt(receipt);
    startPolling();
  }
  $('receipt').focus({ preventScroll: true });
}

function paintReceipt(receipt) {
  const expired = Boolean(receipt.timeExpired);
  $('receipt-eyebrow').textContent = expired
    ? `${receipt.exam.courseCode} · Submitted automatically`
    : `${receipt.exam.courseCode} · Submission complete`;
  $('receipt-title').textContent = expired ? 'Time is up' : 'Exam submitted';
  $('receipt-sub').textContent = expired
    ? 'Your answers were submitted automatically. Results are issued as PDFs and are never shown on screen.'
    : 'Your answers are recorded. Results are issued as PDFs and are never shown on screen.';

  $('receipt-submitted').textContent = `${formatTime(receipt.submittedAt)} · ${formatDate(receipt.submittedAt)}`;
  $('receipt-answered').textContent = `${receipt.answered} of ${receipt.exam.questions}`;
  $('receipt-reference').textContent = receipt.reference;
  $('receipt-candidate').textContent = receipt.candidate.id;

  paintArtifact('official', receipt.artifacts.official);
  paintArtifact('review', receipt.artifacts.review);
}

function paintArtifact(kind, row) {
  const meta = $(`${kind}-meta`);
  const link = $(`${kind}-dl`);
  const text = $(`${kind}-dl-text`);
  const retry = $(`${kind}-retry`);
  const suffix = kind === 'review' ? ' · includes answer key' : '';
  const stateName = row.state;

  link.hidden = true;
  retry.hidden = true;
  meta.className = 'am';

  if (stateName === 'ready') {
    const pages = `${row.pages} ${plural(row.pages, 'page', 'pages')}`;
    if (row.downloadedAt) {
      meta.textContent = `Downloaded ${formatTime(row.downloadedAt)} · ${pages}${suffix}`;
      text.textContent = 'Download again';
    } else {
      meta.textContent = `Ready · ${pages}${suffix}`;
      text.textContent = 'Download';
    }
    meta.classList.add('st-ready');
    link.hidden = false;
    return;
  }
  if (stateName === 'failed') {
    meta.textContent = 'We could not prepare this file.';
    meta.classList.add('st-failed');
    retry.hidden = false;
    return;
  }
  meta.textContent = 'Preparing…';
  meta.classList.add('st-pending');
}

function startPolling() {
  stopPolling();
  const tickPoll = async () => {
    const receipt = state.receipt;
    if (!receipt) return;
    const pending = ['official', 'review'].some((kind) => {
      const stateName = receipt.artifacts[kind]?.state;
      return stateName === 'queued' || stateName === 'rendering';
    });
    if (!pending) {
      stopPolling();
      return;
    }
    try {
      const next = await api('/api/receipt');
      state.receipt = next;
      paintReceipt(next);
    } catch {
      /* keep polling quietly */
    }
  };
  state.poll = window.setInterval(tickPoll, 2000);
  window.setTimeout(tickPoll, 600);
}

function stopPolling() {
  if (state.poll) window.clearInterval(state.poll);
  state.poll = null;
}

function wireReceipt() {
  for (const kind of ['official', 'review']) {
    $(`${kind}-retry`).addEventListener('click', async () => {
      const button = $(`${kind}-retry`);
      button.disabled = true;
      try {
        await api(`/api/artifacts/${kind}/retry`, { method: 'POST' });
        if (state.receipt) {
          state.receipt.artifacts[kind] = { ...state.receipt.artifacts[kind], state: 'queued' };
          paintArtifact(kind, state.receipt.artifacts[kind]);
        }
        startPolling();
      } catch (error) {
        $(`${kind}-meta`).textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });
    $(`${kind}-dl`).addEventListener('click', () => {
      window.setTimeout(async () => {
        try {
          const next = await api('/api/receipt');
          state.receipt = next;
          paintReceipt(next);
        } catch {
          /* the download itself already happened */
        }
      }, 1200);
    });
  }

  $('receipt-close').addEventListener('click', async () => {
    if (state.closing) return;
    state.closing = true;
    try {
      await api('/api/close', { method: 'POST' });
    } catch {
      /* the local view still moves on */
    }
    state.closing = false;
    state.receipt = null;
    stopPolling();
    showEntry();
  });
}

/* ------------------------------------------------------------------ start */

boot();
