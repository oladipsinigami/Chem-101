# CCF NIFES — CBT examination screen

A standalone prototype of a quiet, professional computer-based-test screen for a
generic multi-course assessment platform. It borrows the exam *mechanics* of the
Chem-102 portal — timer, question map, flagging, keyboard-first answering — not its
obsidian-and-gold styling.

*Chemistry 101* is the project; *CCF NIFES* is the brand. It is one file, no build step, no dependencies.

## View it

Open `index.html` directly, or serve the folder:

```bash
python -m http.server 4321
# http://localhost:4321
```

Append `?theme=light` or `?theme=dark` to force a theme.

## What the prototype does

- 60-question demo bank across 10 chemistry topics
- Single-question focus with answered / unanswered / flagged / current states
- Question map in the right rail (desktop) and in a sheet (mobile)
- 25-minute timer with 5-minute and 1-minute warnings; time-up forces submission
- Submit summary (answered / unanswered / flagged), score, and restart
- Keyboard: `A`–`D` answer, `←` `→` navigate, `F` flag, `M` map
- Answers persist in `localStorage` and clear on submit
- Light and dark themes, reduced-motion support, no horizontal scroll from 320px up
- Screen-reader announcements for question changes and timer warnings
- Audit: zero axe-core violations on the screen, confirm dialog, and map sheet

## Design decisions

- **One accent.** Deep pine (`#16594d`) is reserved for selection, primary actions,
  and progress. Amber appears only for flags. Nothing else competes.
- **Borders over shadows.** Surfaces are separated by 1px rules; a single soft
  shadow marks the question paper.
- **Type.** Inter for UI, IBM Plex Mono for indices, timer, counts, and scores.
  The question stem is the page `h1`.
- **Exam-first hierarchy.** The timer, question, and submit action are always
  visible. The question map is the only navigation chrome.
- **No costume.** No gradients, no glow, no all-caps labels, no emoji.

## Out of scope (for now)

Practice hub, post-exam report screen, real question ingestion, auth, backend.
The demo questions are written for the prototype; the Chem-102 PDF-derived text
was too OCR-damaged to use.
