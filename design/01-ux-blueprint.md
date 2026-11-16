# CBT Exam Screen — UX Blueprint

**Project:** Chemistry 101
**Brand:** CCF NIFES
**Scope:** One screen — a timed, single-answer MCQ exam, from the first question to the submission receipt and the two result document downloads.
**Status:** v0.3 for review. Structure only, with two-PDF result delivery folded in. Visual styling is in `02-visual-ui-spec.md`.

---

## 1. The job of this screen

A student is under time pressure and cannot afford a mistake in the interface. The screen has one dominant job and two supporting ones:

1. **Answer the current question** with full attention.
2. **Know where they stand** — time left, questions done, anything flagged.
3. **Move and review** without losing work or getting lost.

Everything else is noise. The screen succeeds when a student never has to think about the interface, only the chemistry.

**What this screen is not:** a learning surface, a dashboard, or a place where correctness is revealed. Feedback belongs to practice mode. During the exam, the interface confirms *what you chose*, never *whether you are right*.

**Results never appear on screen.** On submission the student receives two downloadable PDFs — an official record and a detailed review. The interface never renders a score, percentage, grade, pass/fail, topic breakdown, or correct answer — not on the receipt, not in a dialog, not in a hidden panel. The PDFs are the only result artifacts, and they are handed off as files rather than opened inside the app.

---

## 2. UX principles

**One dominant object.** The question and its options occupy the visual centre and the majority of the width. Chrome is quiet, fixed, and secondary.

**No accidental commitment.** Selecting an answer never advances the question. Submitting is never the default action. Nothing irreversible happens on a single stray tap.

**State is always legible.** Answered, unanswered, flagged, and current are distinguishable without colour alone. The student can answer "what have I done, what is left?" in under two seconds.

**Calm under pressure.** The timer informs at three levels and never nags. Warnings are announced once. No countdown animation, no red flashing, no sound.

**Every state has a next action.** Loading, save failure, time expiry, zero answers, submission failure — none of them dead-end. The student always knows the next tap.

**One paper per candidate.** Every attempt is drawn from the Chemistry 101 bank — 119 items transcribed from `Chem 101 question.pdf` and nothing else. The default paper is 60 questions, configurable from 20 to 100. Question order and option order are shuffled per candidate and pinned to the attempt, so a refresh resumes the same paper in the same order. The full rules are in `06-question-bank-and-randomisation.md`.

---

## 3. Session flow

```
Enter from course hub (exam already started on the server)
        │
        ▼
┌───────────────────────────────────────────────┐
│  EXAM SHELL                                   │
│                                               │
│  answer ──▶ next / prev ──▶ map jump          │
│     │            │              │             │
│     └────────────┴──────────────┘             │
│                    │                          │
│              flag for review                  │
│                    │                          │
│         last question → "Review answers"      │
└────────────────────┬──────────────────────────┘
                     ▼
        ┌──────────────────────────┐
        │  SUBMIT REVIEW DIALOG    │
        │  counts + flagged list   │
        │  Keep working / Submit   │
        └────────────┬─────────────┘
                     ▼
        ┌──────────────────────────┐
        │  SUBMISSION RECEIPT      │
        │  submitted / time expired│
        │  no score on screen      │
        │  [ Official record PDF ] │
        │  [ Detailed review PDF ] │
        └────────────┬─────────────┘
                     ▼
            Two result PDFs (files)
            never rendered in-app

Side exits:
  • time reaches 00:00 → auto-submit → receipt marked "Time expired"
  • either PDF not ready → its row shows "Preparing…", the other stays usable
  • save fails → non-blocking banner, answers still accepted
  • question fails to load → retry state in the question column
```

Entry assumption: the exam has already been started and is being timed server-side. This screen does not design the instructions or "start exam" confirmation.

---

## 4. Information hierarchy

| Priority | Content | Treatment |
|---|---|---|
| 1 | Question stem + options | Largest type, most space, centre-left |
| 2 | Time remaining | Persistent, monospaced, top right |
| 3 | Question position + answered count | Persistent, small, monospaced |
| 4 | Question map / flags | Available in one action, never competing |
| 5 | Submit | Always present, visually restrained until the end |
| 6 | Exam identity | Read-only context, small |
| 7 | Autosave status | Ambient; only becomes visible when it changes |

The rule of thumb: if the student looks away and back, the first thing they should re-find is the question, not the chrome.

On the receipt the order changes: the submission confirmation is first, the download action second, and everything else — reference, timestamp, close — is supporting detail.

---

## 5. Layout blueprint

### 5.1 Desktop (≥ 921 px)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [C] CCF NIFES │ CHE 101 · Chemistry 101    Saved 24:55  ▦ ☾  [Submit exam] │
├──────────────────────────────────────────────────────────────────────────┤
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← D
├───────────────────────────────────────────────────┬──────────────────────┤
│          │                                        │  QUESTION MAP  5 / 60│  ← J
│   06     │  Atomic structure ─────────  ⚑ Flagged │  —— answered —— open │
│  OF 60   │                                        │  • flagged  ▏ current│
│  ───     │  Which ion is isoelectronic with neon? │                      │
│          │                                        │  01 02 03 04 05 06   │
│          │  ───────────────────────────────────   │  07 08 09 10 11 12   │
│          │  A   K⁺                            ○   │  13 14 15 16 17 18   │
│          │  ───────────────────────────────────   │  19 20 21 22 23 24   │
│          │  B   Cl⁻                           ○   │  …                   │
│          │  ───────────────────────────────────   │  Answered        05  │
│          │  C   Na⁺                           ●   │  Unanswered      55  │
│          │  ───────────────────────────────────   │  Flagged         02  │
│          │  D   Ar                            ○   │                      │
│          │  ───────────────────────────────────   │  Answers save as you │
│          │                                        │  go. Refreshing      │
├──────────┴────────────────────────────────────────┴──────────────────────┤
│  Clear answer                       [ ‹ Previous ]  [ Next › ]            │
└──────────────────────────────────────────────────────────────────────────┘
```

The answer bar is the persistent bottom edge: Clear at the measure's left, Previous and Next ending at the option rule. The marginal folio carries the position; the index is type, not a grid of boxes.

**Zone notes**

| Zone | Job | Contains | Must never |
|---|---|---|---|
| A — Exam bar | Orientation + time + exit | Brand, course, exam name, mode, timer, map, theme, submit | Scroll away; hide on small screens without a replacement |
| D — Progress rail | Ambient completion | Answered / total as a thin line | Be the only place progress is shown; use colour alone |
| E — Question meta | Position + topic + flag | Marginal folio "06 of 60", topic, flag control | Wrap into two lines unless space forces it |
| F — Stem | The task | One question, 1–3 sentences | Be truncated or scrolled behind a fixed element |
| G — Options | The answer | 2–6 ruled option rows, lettered A–F, full-row target | Reveal correctness; reorder after load |
| H — Clear | Escape hatch | "Clear answer", disabled until an answer exists | Sit next to Next where it can be hit by mistake |
| I — Navigation | Move | Previous, Next in the answer bar; becomes "Review answers" on the last question | Auto-advance on selection |
| J — Map | Review + jump | 60 index numbers, legend, counts; sticky | Consume more attention than the question |
| K — Shortcuts | Discoverability | Keyboard help | Be read aloud as body copy |

### 5.2 Tablet (561–920 px)

```
┌────────────────────────────────────────────┐
│ [C] CCF NIFES │ CHE 101 · Chemistry 101    │
│                   ⏱ 24:55  [map] [Submit]  │
├────────────────────────────────────────────┤
│ ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├────────────────────────────────────────────┤
│  06 OF 60 · Atomic structure         ⚑    │
│                                            │
│  Which ion is isoelectronic with neon?     │
│                                            │
│  A   K⁺                                    │
│  B   Cl⁻                                   │
│  C   Na⁺                                   │
│  D   Ar                                    │
│                                            │
│  Clear answer        [Prev]      [Next]    │
└────────────────────────────────────────────┘
Map lives in a sheet opened from [map].
```

The rail disappears; the map becomes an on-demand sheet. The question gains the freed width, up to a readable measure (660 px, roughly 68 characters).

### 5.3 Mobile (≤ 560 px)

```
┌──────────────────────────────────┐
│ [C] CHE 101 ⏱ 24:55 [▦] [Submit] │  ← compact bar
├──────────────────────────────────┤
│ ███░░░░░░░░░░░░░░░░░░░░░░░░░     │
├──────────────────────────────────┤
│ 06 OF 60 · Atomic structure    ⚑ │
│                                  │
│ Which ion is isoelectronic       │
│ with neon?                       │
│                                  │
│ A   K⁺                           │
│ B   Cl⁻                          │
│ C   Na⁺                          │
│ D   Ar                           │
│                                  │
│ Clear answer                     │
│ [ ← Previous ] [ Next → ]        │
└──────────────────────────────────┘
```

Rules:
- Answer rows are full-width, ruled, and at least 56 px tall.
- Previous and Next split the answer bar 1 : 1.4.
- The flag control is icon-only below 560 px but keeps an accessible name ("Flag question for review" / "Question flagged. Remove flag").
- The theme control is not part of the mobile exam bar. Theme follows the device; a switch can live in the map sheet if needed.
- No swipe gestures for navigation. Swipes conflict with text selection and cause accidental moves.

### 5.4 Question map sheet (mobile)

```
┌──────────────────────────────┐
│            ▁▁▁               │  ← grab handle
│ EXAM NAVIGATION              │
│ Question map        5 / 60   │
│ ──────────────────────────── │
│ 01 02 03 04 05               │
│ 06 07 08 09 10               │
│ 11 12 13 14 15               │
│ ── answered  ── unanswered   │
│ • flagged   ▏ current        │
│ ──────────────────────────── │
│ [       Submit exam        ] │
└──────────────────────────────┘
```

The sheet opens focused on its title, traps focus, closes on Escape and backdrop, and returns focus to the map button. Selecting a number closes the sheet and moves focus to the question stem. Submit is the last control, never the first.

### 5.5 Submission receipt (all widths)

```
┌────────────────────────────────────────────┐
│  [C] CCF NIFES                             │
│  ─────                                     │
│  CHE 101 · SUBMISSION COMPLETE             │
│                                            │
│  Exam submitted                            │
│  Your answers are recorded. Results are    │
│  issued as PDFs and never shown on screen. │
│                                            │
│  SUBMITTED   14:32 · 12 Nov 2026           │
│  ANSWERED    60 of 60                      │
│  REFERENCE   CH101-8F3K2                   │
│  CANDIDATE   NIF/CHE/20481                 │
│  ────────────────────────────────────────  │
│  Two documents are available to download.  │
│                                            │
│  Official Examination Record               │
│  1 page · PDF                      [Download] │
│  ────────────────────────────────────────  │
│  Detailed Review                           │
│  18 pages · PDF · includes answer key      │
│                                    [Download] │
│  ────────────────────────────────────────  │
│  Both files can be downloaded again from   │
│  this exam in your course hub.             │
│                                            │
│  Close                                     │
└────────────────────────────────────────────┘
```

Rules:
- The receipt confirms what the student did: submitted, when, how many questions were answered, and a reference number. It never describes performance.
- **Two files, two actions.** The official record is the primary action; the detailed review is secondary because it contains the answer key. Neither is bundled into a ZIP.
- The files are delivered as downloads — never an inline viewer, modal preview, or new tab. No thumbnail or page count preview of the content.
- Each file has its own state: preparing (download disabled, "Preparing…"), ready (download enabled), failed (retry, plus the email fallback when an address is on file). One failing never blocks the other.
- On mobile the receipt is full-width; each file saves to the device.
- Returning to the exam later shows this receipt again with both download actions, never a result view.
- The receipt never displays a score, percentage, grade, or outcome, even after the files exist.

---

## 6. State model

### 6.1 Question and map

| State | Map index | Answer row | Meaning |
|---|---|---|---|
| Unanswered | Muted number, no mark | No selection | Default |
| Answered | Accent number + 2 px underline | Selected row + filled dot | Stored locally and on the server |
| Flagged | Amber dot at top-right | Unchanged | Marker only; never implies an answer |
| Answered + flagged | Underline + dot | Selected | Both states shown independently |
| Current | Ink number at weight 500 + 2 px left bar | — | Exactly one at a time |
| Current + answered | Underline + left bar | Selected | Both marks remain visible together |

Rules:
- Flagging never clears or changes an answer.
- Clearing an answer never removes the flag.
- The map is the single source of truth for progress. The header rail mirrors it, never contradicts it.
- Answered count is by question, not by option.

### 6.2 Timer

| State | Threshold | Cue | Copy |
|---|---|---|---|
| Normal | > 5:00 | Neutral, monospaced | `24:55` + "remaining" |
| Warning | 5:00–1:01 | Amber tone, static | Announces "Five minutes remaining" once |
| Critical | 1:00–0:01 | Amber, slow 2 s pulse (disabled under reduced motion) | Announces "One minute remaining" once |
| Expired | 00:00 | Exam locks | Auto-submit; receipt marked "Time expired" |

Requirements:
- The timer is driven by an absolute deadline, not by decrementing a local counter. Background tabs, device sleep, and refreshes must not buy extra time.
- No pause. No per-second live announcement. No sound.
- Warnings are visible text changes, not only colour.

### 6.3 Submission

| Situation | Dialog title | Body | Actions |
|---|---|---|---|
| Some unanswered | Submit this exam? | "19 questions are unanswered. Unanswered questions score zero." | Keep working · **Submit anyway** |
| All answered | Submit this exam? | "All 60 questions are answered." | Keep working · **Submit exam** |
| Flagged present | (adds to either) | "2 questions are flagged for review." + link "Review flagged" | Review flagged closes the dialog and jumps to the first flag |
| Time expired | Time is up | "Your answers were submitted automatically." | **Download official record** · Download detailed review · Close |
| Submit request fails | Submission failed | "Your answers are saved. Check your connection and try again." | Retry · Keep working |

Rules:
- Submit is always available, but its label and emphasis change: secondary while unanswered remain, primary when all are answered or when the student opens the review dialog.
- "Submit anyway" is explicit. Never label an incomplete submission "Submit".
- The dialog shows counts, not a percentage, at this moment. Percentages invite score anxiety before submission.
- Time expiry does not ask for confirmation. It submits, then shows the receipt.
- No receipt state — including time expiry — shows a score, percentage, grade, pass/fail, or correct answer. The only result artifacts are the two PDFs (see §6.5).

### 6.4 System states

| State | Where | Behaviour |
|---|---|---|
| Saving | Header status | Quiet label, ≤ 600 ms; do not block |
| Saved | Header status | "Saved" replaces "Saving…"; fades after 2 s |
| Save failed | Persistent banner under the exam bar | "Answers are not saving. Retry." Answers remain editable |
| Offline | Same banner | "You are offline. Answers are queued and will sync." |
| Question failed to load | In the question column | "This question could not load." Retry · Skip (if allowed) |
| Session ended elsewhere | Full-screen state | "This exam was submitted in another tab." View receipt |

### 6.5 Result delivery (two PDFs)

The results are files, not screens. The exam interface produces and hands off the files; it is never responsible for displaying what is inside them.

Two artifacts are generated from the same submission snapshot and share one reference:

| Artifact | Length | Contents | Primary? |
|---|---|---|---|
| Official record | 1 page | Identity, score, grade, topic breakdown, verification | Yes |
| Detailed review | About 16–20 pages | The above plus every question, the student's answer, and the correct answer | No — contains the answer key |

Each file has its own state. One failing never blocks the other.

| State | Receipt row shows | Action |
|---|---|---|
| Preparing | "Preparing…" | Download disabled, quiet spinner-free label |
| Ready | "Ready · 1 page" / "Ready · 18 pages" | **Download** enabled |
| Failed | "We could not prepare this file." | Retry · email fallback when an address is on file |
| Pending sync (offline submit) | "Submitted. Waiting to confirm." | Both downloads disabled until the server confirms |
| Downloaded | "Downloaded 14:33" | **Download again** |

Rules:
- **Forced download, not preview.** Each file is delivered with a download disposition. No inline PDF viewer, no embedded `<object>`/`<iframe>`, no `target="_blank"` preview, no thumbnail of either document. The platform does not open the results for the student.
- **Two actions, no bundle.** Official record is primary; detailed review is secondary. They are never zipped or merged, because the review contains the answer key and the official record does not.
- **No score data in the interface layer.** The receipt payload carries submission metadata only (status, time, answered count, reference, per-file readiness). Score, marks, grade, and per-question correctness are never sent to the exam screen, so they cannot leak into the DOM, a tooltip, or a hidden panel.
- **No new tab.** Downloading happens in place; the receipt stays visible so the student can retry.
- **Filenames are meaningful and private.** `CHE101-mid-semester-official-record-CH101-8F3K2.pdf` and `CHE101-mid-semester-review-CH101-8F3K2.pdf`. No score, grade, or "pass"/"fail" in either filename.
- **Each PDF is an accessible artifact.** Tagged, titled, language-declared, real text, logical reading order. The interface cannot fix an inaccessible PDF, so the requirement is stated here and carried into §10.
- **Re-download is always possible** from the receipt and from the course hub's past-exam entry. Neither result is ever shown inside the exam screen.
- **Privacy on shared devices.** The receipt does not auto-open either file. The review is marked personal on every page. The student chooses when and where to open them.
- **If the email fallback is offered**, it is opt-in, uses the address already on the account, and never asks for an address inside the exam screen. Links expire; files are not attached.

---

## 7. Interaction rules

| Action | Pointer / touch | Keyboard | Result |
|---|---|---|---|
| Select answer | Tap a row | `A`–`F` or Tab + Space | Row becomes selected; no advance; saves |
| Change answer | Tap another row | `A`–`F` | Replaces selection; previous cleared |
| Clear answer | "Clear answer" | `C` (only when answer exists) | Unanswers the question; flag stays |
| Next / previous | Answer bar buttons | `→` / `←` | Move one question; no wrap at ends |
| Jump | Map index | `M` then arrows/Enter | Open map (mobile) or focus the current number (desktop); jump |
| Flag | Flag control | `F` | Toggle marker; announces new state |
| Last question | "Review answers" | `Enter` | Opens the map/summary rather than dead-ending |
| Submit | Exam bar | `S` only from the review dialog | Opens review; never submits directly |
| Close dialog | Close / backdrop | `Esc` | Returns focus to the trigger; blocked when time is up |

Deliberate choices:
- **Selecting does not advance.** Auto-advance causes skipped questions and panic corrections.
- **Arrow keys move between questions**, not between options. In an exam, arrow keys changing a committed answer is a hazard. Option selection is `A`–`F` or Tab + Space. This is stated in the on-screen shortcut hint and in the answer group's accessible description.
- **Clicking the selected option again does nothing.** Unanswering is a separate, deliberate action.
- **No swipe navigation.** It conflicts with text selection and long option rows.
- **Build resolution — the `C` collision.** `C` is both an option letter and the clear shortcut in the table above. The build resolves it in favour of selection: `C` selects option C; pressing `C` again while option C is the recorded answer clears it. Clearing any other answer is the "Clear answer" control (pointer or Tab + Space). `F` flags only when the question has no option F, which is every item in the current bank; on the rare six-option item, selecting F takes precedence and the flag control is pointer/Tab.
- **The map is the only review surface.** There is no scrolling list mode inside the exam; that belongs to practice.

---

## 8. Content and copy

Tone: plain, calm, factual. No encouragement, no exclamation marks, no "you've got this". The interface speaks like an invigilator, not a coach.

`60` in the strings below is the configured paper length `N`. Every position, count, and receipt string reads `N` from the attempt record; none of them assumes 60.

| Context | Copy |
|---|---|
| Position | `Question 06 of 60` |
| Unanswered submit | `19 questions are unanswered. Unanswered questions score zero.` |
| Incomplete submit button | `Submit anyway` |
| Complete submit button | `Submit exam` |
| Flag off / on | `Flag for review` / `Flagged` |
| Flag accessible name | `Flag question for review` / `Question flagged. Remove flag` |
| Clear | `Clear answer` |
| Nav | `Previous`, `Next` |
| Last question | `Review answers` |
| Map | `Question map` · `5 of 60 answered` |
| Autosave | `Saved` / `Saving…` / `Answers are not saving. Retry.` |
| Time | `24:55 remaining` · `Five minutes remaining` · `One minute remaining` |
| Expiry | `Time is up` / `Your answers were submitted automatically.` |
| Receipt | `Exam submitted` / `Submitted 14:32` / `60 of 60 answered` / `Reference CH101-8F3K2` |
| Result handoff | `Your results are available as PDFs. They are not displayed on screen.` |
| Official record row | `Official record (PDF)` · `Ready · 1 page` · `Download official record` |
| Detailed review row | `Detailed review (PDF)` · `Ready · 18 pages` · `Download detailed review` |
| File preparing | `Preparing…` |
| File failed | `We could not prepare this file.` / `Retry` |
| File pending sync | `Submitted. Waiting to confirm.` |
| Receipt close | `You can download it again from this exam in your course hub.` |

Length rules:
- Stem: aim for ≤ 40 words. Above 60 words, the stem keeps normal line length and the column scrolls as one block; no inner scroll areas.
- Options: aim for ≤ 14 words each. Options never truncate; they wrap.
- Topic label: ≤ 28 characters, one line, ellipsis only as a last resort.
- Never put instructions or scoring rules inside a question.

---

## 9. Responsive summary

| Width | Layout | Map | Header |
|---|---|---|---|
| ≥ 921 | Question + 292 px rail | Persistent, sticky | Full context + theme |
| 561–920 | Single column, 660 measure | Sheet | Context, no theme |
| ≤ 560 | Single column, edge-to-edge sheet | Sheet | Brand mark, course, timer, map, submit |
| ≤ 360 | Same as above, 12 px gutters | Sheet | Submit shortens to "Submit" |

No horizontal scroll at any width. Tap targets ≥ 44 px on touch. The answer bar is never below the fold on a 667 px-tall phone when the question is short; long questions scroll.

---

## 10. Accessibility requirements (UX level)

- **Focus order:** skip link → exam bar → question meta → options → clear → previous/next → map index. Dialogs trap focus and restore it.
- **Announcements:** question change ("Question 12 of 60, Acids and bases"), flag toggle, timer warnings at 5 and 1 minutes, save failure, submission result. Not the timer each second.
- **Map index:** every number's accessible name includes position and state, e.g. "Question 12, answered, flagged, current".
- **Not colour alone:** answered numbers use an accent underline; current uses a left bar plus weight; flags use a dot plus the word. The legend repeats each mark.
- **Contrast:** all body-size text meets 4.5:1; muted labels are treated as text, not decoration.
- **Motion:** the only animation is the last-minute pulse and the progress fill; both respect reduced motion. No parallax, no auto-scroll.
- **Touch:** 44 px minimum for options, map numbers, and icon buttons.
- **Dialogs:** native modal semantics, labelled by their title, dismissible except at time expiry.
- **Receipt:** announced once as a status region — "Exam submitted. Your results are available as PDFs." Each download control is a real download link whose accessible name includes the document and format, e.g. "Download official record, PDF, one page". Progress and failure states are announced politely; failure receives focus.
- **Result PDFs:** both delivered files meet PDF/UA basics — tagged structure, a document title, a declared language, real selectable text, headings in order, tables with header cells, and a logical reading order. Colour is never the only carrier of meaning. Both must be usable at 200% zoom and with a screen reader without the app. The detailed review contains the answer key and is marked personal on every page.
- **Zoom:** usable at 200% without loss of function.

---

## 11. Edge cases and recovery

| Case | Expected behaviour |
|---|---|
| Submit with zero answers | Allowed after explicit "Submit anyway"; never silently submit |
| Last question reached | Next becomes "Review answers"; no dead end |
| Refresh mid-exam | Answers, flags, index, and deadline restore; timer recalculates from the deadline |
| Timer expires while map sheet is open | Sheet closes, receipt replaces the exam; no confirmation |
| Timer expires while offline | Answers lock locally and submit on reconnect; receipt shows "Submitted. Waiting to confirm." and enables both downloads only after the server confirms |
| Save failure | Persistent banner, answers still accepted, retry without losing current selection |
| One result PDF still generating | Its row shows "Preparing…" with the download disabled; the other file stays downloadable; it enables in place when ready, no page reload |
| Result PDF generation fails | That row shows "We could not prepare this file." Retry; email fallback if an address is on file; the other file is unaffected; support can regenerate without the student resubmitting |
| Download blocked or interrupted | Receipt stays visible with the action unchanged; the message names the cause plainly ("Your browser blocked the download") and offers Retry |
| Student closes the receipt without downloading | No loss: the exam appears as submitted in the course hub with the same download action |
| Student reopens a submitted exam | Receipt state, not the exam. Never a read-only question view and never a result view |
| Screen reader or keyboard user on the receipt | Focus moves to the receipt title on arrival; the download is reachable by Tab and announced with format; status changes are announced |
| Exam service unavailable at submit | "Submission failed. Your answers are saved." Retry · Keep working; the timer state is shown truthfully and the student is never told they passed or failed |
| Rapid prev/next | Each question's answer is preserved; no flicker of another question's selection |
| Very long option | Wraps; row grows; letter stays top-aligned |
| 5–6 options | Letters continue `E`, `F`; shortcuts follow |
| Two tabs open | Second tab detects the active session and shows "Session active elsewhere" rather than allowing a split submission |
| Question cache miss | Inline retry state; the exam timer keeps running; student can move on if the exam allows skipping |

---

## 12. Decisions — resolved and open

### Resolved

1. **Results are PDF-only and never rendered on screen.** The receipt carries submission metadata and download actions; score, grade, and per-question correctness never reach the interface. See §6.5.
2. **No reference tools during the exam.** No calculator, periodic table, or formula sheet in the chrome.
3. **No pause.** Refresh restores answers, flags, index, and the deadline; closing the tab keeps the clock running.
4. **Incomplete submission is allowed** with an explicit "Submit anyway" and an unanswered count. Blocking submission strands students and creates support incidents.
5. **Results are two PDFs, not one.** An official one-page record (safe to share, verifiable, no answers) and a detailed multi-page review (contains the answer key, marked personal). Explanations are excluded. See `03-result-pdf-spec.md`.
6. **Questions come only from `Chem 101 question.pdf`.** The bank holds 119 transcribed items with no manual authoring; `bank/needs-review.json` must be empty before release.
7. **Order is shuffled per candidate and pinned to the attempt.** Question order and option order are generated server-side from a stored seed, and a refresh never reshuffles. See `06-question-bank-and-randomisation.md`.
8. **Paper length is configuration.** Default 60, allowed 20–100, drawn by fixed topic quotas. The UI reads `N` from the attempt rather than assuming 60.

### Open — these change the design materially

9. **Single section or multiple sections with their own timers?**
   *Recommend:* single section for v1. If sections exist, the map groups by section and the timer shows the section clock.
10. **Question types beyond single-answer MCQ?** Multi-select, numeric, short answer, essay.
    *Recommend:* design the shell for one type now, but leave the option region type-agnostic. Multi-select changes the "answered" definition and needs its own review.
11. **Who sees flags?**
    *Recommend:* the student only. Flags are a personal review tool, not an invigilation signal.
12. **What is the institution's grade scale and outcome vocabulary?**
    *Recommend:* configured per institution. The record layout accepts one word of up to 12 characters ("Pass", "Merit", "Distinction", or a bare grade) and collapses the percentage field if it is not published.
13. **Is there an email fallback when a PDF cannot be prepared?**
    *Recommend:* yes, opt-in and using the address already on the account, with expiring links rather than attachments.

---

## 13. Out of scope

- Course hub and exam selection
- Pre-exam instructions and the "start exam" confirmation
- On-screen results of any kind: score, percentage, grade, pass/fail, topic mastery, per-question correctness, or a rendered report
- The internal layout of the two result PDFs — covered by `03-result-pdf-spec.md`
- Practice mode and instant feedback
- Account, authentication, proctoring, and back-office authoring
- Final visual styling: colour values, typefaces, spacing scale, component skins — the next document

---

## 14. Next artifact

`02-visual-ui-spec.md` — tokens, type scale, colour roles, spacing, component anatomy, and high-fidelity layout rules for exactly this structure. It will not introduce new flows. It will cover the receipt and both download controls as first-class components, including preparing, ready, failed, and pending-sync states.

`03-result-pdf-spec.md` — the two result documents: the official record and the detailed review.

`04-platform-component-inventory.md` — actions, forms, navigation, tables, feedback, and overlays for the wider platform.

`05-engineering-redline.md` — exact measurements, breakpoints, transitions, and acceptance criteria. No new visual decisions.
