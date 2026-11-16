# Result Documents — PDF Specification

**Project:** Chemistry 101
**Brand:** CCF NIFES
**Companion to:** `01-ux-blueprint.md`, `02-visual-ui-spec.md`
**Scope:** Two downloadable result documents produced at submission — an **Official Examination Record** (one page) and a **Detailed Review** (multi-page). Neither is ever rendered inside the exam interface.
**Status:** v1.1 — palette and type synced to the v2.0 "Registry" system. Structure and content unchanged.

---

## 1. The two documents

| | Official Examination Record | Detailed Review |
|---|---|---|
| Purpose | Verifiable proof of result | Diagnostic record of every answer |
| Length | 1 page, fixed | 1 summary page + question pages |
| Audience | Student, institution, third party | Student |
| Contains score / grade | Yes | Yes |
| Contains correct answers | **No** | **Yes** |
| Contains explanations | No | No |
| Reference | Shared | Shared |
| File name suffix | `-official-record-` | `-review-` |

They are generated from the same immutable submission snapshot, share one reference number and one generation timestamp, and are delivered as two separate files. They are never merged, bundled, or zipped.

**Why two:** the official record must be safe to forward and archive; the review contains the answer key and must not leave the student's hands by accident. Combining them would make every shared result a leak of the item bank.

---

## 2. Shared document system

### 2.1 Page

| Property | Value |
|---|---|
| Size | A4, 210 × 297 mm (Letter supported as a variant, same margins in mm) |
| Orientation | Portrait |
| Margins | 20 mm left/right, 18 mm top, 20 mm bottom |
| Content width | 170 mm |
| Content height | 259 mm |
| Binding | None; no gutter |
| Background | `#FFFFFF` (print white, not the screen's warm paper) |

The screen's warm paper tone is a display choice. Printing it would waste toner and look dingy; the PDF uses white and keeps the ink, pine, and hairline palette.

### 2.2 Colour (print)

| Token | Value | Use |
|---|---|---|
| `ink` | `#171A18` | Body, headings, values |
| `ink.muted` | `#616A63` | Labels, footer, secondary copy |
| `pine` | `#1D4B3B` | Rules, correct-answer marker, verified stamp |
| `pine.tint` | `#E7EDE8` | Small fills only — never full-page blocks |
| `amber` | `#8A5A12` | Unanswered marker |
| `brick` | `#8E3B31` | Incorrect marker |
| `hairline` | `#DDD9CF` | Table rules, dividers |

- No gradients, no photographs, no background images.
- Colour is never the only signal. Every coloured marker has a text label beside it.
- Everything must remain readable in greyscale. The document is tested by printing in black and white.

### 2.3 Typography

Same three families as the interface, embedded as subsets.

| Role | Family | Size / line | Weight |
|---|---|---|---|
| Document title | Crimson Pro | 24 / 28 pt | 400 |
| Section heading | Crimson Pro | 14 / 18 pt | 400 |
| Question stem | Crimson Pro | 10.5 / 14.5 pt | 400 |
| Body | Atkinson Hyperlegible | 10 / 15 pt | 400 |
| Table body | Atkinson Hyperlegible | 9 / 13 pt | 400 |
| Table header | IBM Plex Mono | 7.5 / 10 pt | 500, uppercase, 0.08em |
| Label | IBM Plex Mono | 7.5 / 10 pt | 500, uppercase, 0.08em |
| Score | IBM Plex Mono | 30 / 32 pt | 500 |
| Reference / footer | IBM Plex Mono | 7.5 / 10 pt | 400 |

Rules:
- Never below 7.5 pt for any text that carries information.
- Body measure 90–105 characters at 10 pt across 170 mm.
- Superscripts and subscripts set at 65% size, baseline shifted, with line height never below 1.4.
- No faux bold, no synthetic italic, no outlined type.
- Fonts are embedded; no reliance on system fonts.

### 2.4 Header and footer

**Header (all pages):**
- Left: institution mark 10 × 10 mm, then institution name in 11 pt sans 700, and "Examinations Committee" in 8 pt `ink.muted` below.
- Right: document type in 7.5 pt mono uppercase, 0.08em: `OFFICIAL EXAMINATION RECORD` or `DETAILED REVIEW`.
- 0.5 pt `hairline` rule, full content width, 8 mm below the header block.
- Header occupies the top 24 mm of the content area.

**Footer (all pages):**
- 0.5 pt `hairline` rule, 6 mm above the footer baseline.
- Left: `CH101-8F3K2 · Generated 12 Nov 2026, 14:33` in 7.5 pt mono `ink.muted`.
- Right: `Page 1 of 1` or `Page 3 of 24` in 7.5 pt mono.
- The Detailed Review adds a centre item on every page: `Personal — contains the answer key` in 7.5 pt `amber`. It is absent from the official record.

### 2.5 Metadata and file naming

| Field | Official record | Detailed review |
|---|---|---|
| Title | `CHE 101 Mid-semester Examination — Official Record` | `CHE 101 Mid-semester Examination — Detailed Review` |
| Author | `CCF NIFES` | `CCF NIFES` |
| Subject | `Official examination result, reference CH101-8F3K2` | `Detailed answer review, reference CH101-8F3K2` |
| Keywords | `examination, result, CHE 101` | `examination, review, CHE 101` |
| Language | `en` | `en` |
| Score in metadata | **No** | **No** |

File names:
```
CHE101-mid-semester-official-record-CH101-8F3K2.pdf
CHE101-mid-semester-review-CH101-8F3K2.pdf
```

No score, percentage, grade, `pass`, or `fail` in the file name or metadata. A file name is often visible in a downloads folder, an email attachment list, or a shared drive before the document is opened.

### 2.6 Accessibility baseline

Both documents are tagged PDFs and target PDF/UA-1, with PDF/A-2b for the official record.

- Document title and language declared.
- Logical reading order: header → title → candidate → exam → result → topics → declaration → footer.
- Real text, never images of text. The institution mark is the only raster image, with alt text.
- Tables use header cells and scope; no layout tables.
- Links carry visible text and a full URL.
- Colour never carries meaning alone: "Correct answer", "Your answer", "Unanswered" are always written.
- Reading order and content survive at 200% zoom in a standard viewer.
- No encryption, no password, no permission flag that blocks assistive technology. If encryption is ever required, accessibility extraction must remain enabled.

---

## 3. Official Examination Record

**One page. Fixed. No continuation.**

### 3.1 Page anatomy

```
┌──────────────────────────────────────────────────────────────┐
│ [mark]  CCF NIFES              OFFICIAL RECORD               │ 24 mm
│         Examinations Committee                               │
│ ──────────────────────────────────────────────────────────── │
│                                                              │
│  Examination Result                                          │
│  CHE 101 · Chemistry 101                                     │
│  ▬▬▬▬▬▬▬▬                                                    │
│                                                              │
│  CANDIDATE                    EXAMINATION                    │
│  Name      Adaeze Okafor      Course      CHE 101            │
│  ID        CCF/2024/01842     Paper       Mid-semester CBT   │
│  Programme BSc Chemistry      Date        12 Nov 2026        │
│  Cohort    2024               Duration    60 minutes         │
│                               Questions   60                 │
│                                                              │
│ ──────────────────────────────────────────────────────────── │
│   SCORE          PERCENTAGE        GRADE          OUTCOME    │
│   48 / 60        80.0%             A              Pass       │
│ ──────────────────────────────────────────────────────────── │
│                                                              │
│  PERFORMANCE BY TOPIC                                        │
│  Topic            Q  C      %  Topic            Q  C      %  │
│  Atomic structure 6  5   83.3  Solutions        5  4   80.0  │
│  Chemical bonding 7  6   85.7  Kinetics         6  5   83.3  │
│  …                                                           │
│  Total                 60  48  80.0                          │
│                                                              │
│ ──────────────────────────────────────────────────────────── │
│  This record is generated from the examination system and    │
│  is valid when verified at the address below.                │
│                                                              │
│  Reference   CH101-8F3K2        [QR]                         │
│  Verify      ccfnifes.example/verify/CH101-8F3K2             │
│  Generated   12 Nov 2026, 14:33                              │
│                                                              │
│  CH101-8F3K2 · Generated 12 Nov 2026, 14:33      Page 1 of 1 │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Field rules

**Institution block**
- Mark 10 × 10 mm, monochrome, left-aligned. Alt text: institution name.
- Institution name 11 pt sans 600; office line 8 pt `ink.muted`.
- Right-aligned document type, 7.5 pt mono uppercase.
- The institution block is configurable; nothing about it is hard-coded into the layout beyond position.

**Title block**
- Title "Examination Result" in 24 pt serif.
- Subtitle: course code, middle dot, course title, in 10 pt sans `ink.muted`.
- Pine rule: 40 × 1.5 mm, 4 mm below the subtitle. The only decorative mark on the page.
- 10 mm gap before the metadata blocks.

**Candidate and examination blocks**
- Two columns, 80 mm each, 10 mm gutter.
- Labels 7.5 pt mono uppercase `ink.muted`; values 10 pt sans `ink`.
- Rows 6 mm apart. Label column 26 mm, value column the rest.
- Candidate: name, student ID, programme, cohort.
- Examination: course code, paper title, date, start time, duration, question count, total marks.
- Never print the candidate's email, phone, or address.

**Result band**
- 0.5 pt hairline above and below, 4 mm padding.
- Four fields: score, percentage, grade, outcome.
- Score is the largest element on the page: 30 pt mono, `48 / 60`.
- Percentage 14 pt mono, one decimal place. Grade 14 pt mono. Outcome 14 pt sans 500.
- Outcome language is institution-configured: "Pass" / "Fail", "Distinction" / "Merit" / "Pass", or a bare grade. The layout tolerates one word, maximum 12 characters.
- No colour in the band. The numbers carry it.
- If the institution does not publish a percentage, the field collapses and the remaining three columns widen evenly.

**Topic table**
- Two side-by-side halves, 80 mm each with a 10 mm gutter. Each half: Topic 44 mm, Questions 12 mm, Correct 12 mm, Percentage 12 mm. Numerics right-aligned.
- Up to six rows per half, twelve topics total, read left half first. An odd count leaves the final right-hand cell empty.
- Header 7.5 pt mono uppercase with a 0.5 pt rule below; rows 8.5 pt with 0.5 pt hairlines.
- Header row 5 mm; body rows 5.5 mm. A single total row spans the full 170 mm at the bottom, 500 weight with a 0.75 pt top rule.
- Above 12 topics, show the 11 strongest-weighted topics and one "Other topics" entry; the full breakdown belongs to the review. Never shrink type to fit.
- No bars, sparklines, or coloured cells.

**Declaration**
- "This record is generated from the examination system and is valid when verified at the address below." 8.5 pt `ink.muted`, 90 ch measure.
- No signature image, no scanned stamp. A fabricated signature is worse than none.
- If the institution requires a signature, a 30 mm ruled line labelled "Examinations Officer" is printed and signed physically after printing — but the digital record remains valid by verification.

**Verification block**
- Reference in 9 pt mono: `CH101-8F3K2`.
- Verification URL in 8.5 pt mono, full and visible: `ccfnifes.example/verify/CH101-8F3K2`. The URL is also a live link.
- QR code 22 × 22 mm, right-aligned, encoding only the verification URL. No score, name, or token payload visible in the QR. Alt text: "QR code to verify this result at ccfnifes.example".
- Generated timestamp in 8.5 pt mono.
- The verification page shows the result only to someone holding the reference; it never exposes the candidate's identity beyond what the record already prints.

**Footer**
- As §2.4. Page 1 of 1.

### 3.3 Official record rules

- Exactly one page. If content overflows, the topic table is truncated to "Other topics", not the type.
- No correct answers, no question text, no answer key, no per-question detail.
- No candidate photograph. No date of birth. No address.
- No watermark across the page. A watermark makes the document harder to read and easier to fake.
- No "CONFIDENTIAL" stamp; the document is a record, not a secret.
- No decorative borders, guilloches, or certificate styling. It should look like a registrar's document, not a diploma.
- The document is valid without a handwritten signature, and says so.

---

## 4. Detailed Review

**Page 1 is a summary. Pages 2+ are the question review.**

### 4.1 Page 1 — summary

```
┌──────────────────────────────────────────────────────────────┐
│ [mark]  CCF NIFES                 DETAILED REVIEW            │
│         Examinations Committee                               │
│ ──────────────────────────────────────────────────────────── │
│                                                              │
│  Detailed Review                                             │
│  CHE 101 · Chemistry 101 · Mid-semester CBT                  │
│  Adaeze Okafor · CCF/2024/01842 · 12 Nov 2026                │
│  ▬▬▬▬▬▬▬▬                                                    │
│                                                              │
│  SCORE        PERCENTAGE      GRADE        OUTCOME           │
│  48 / 60      80.0%           A            Pass              │
│                                                              │
│  PERFORMANCE BY TOPIC                                        │
│  Topic                          Questions  Correct    %      │
│  …                                                           │
│  Total                               60       48     80.0    │
│                                                              │
│  HOW TO READ THIS DOCUMENT                                   │
│  Each question shows your answer and the correct answer.     │
│  A question you left blank is marked Unanswered.             │
│  This document contains the answer key. Do not share it.     │
│                                                              │
│  CH101-8F3K2 · Generated 12 Nov 2026, 14:33      Page 1 of 24│
└──────────────────────────────────────────────────────────────┘
```

- Same header, title system, result band, and topic table as the official record, at slightly reduced spacing to leave room for the reading key.
- Candidate line is compressed to one line: name · ID · date.
- "How to read this document" is 8.5 pt `ink.muted`, 90 ch, three short lines. It is the only instructional copy in either document.

### 4.2 Page 2+ — question blocks

```
┌──────────────────────────────────────────────────────────────┐
│ [mark]  CCF NIFES                 DETAILED REVIEW            │
│         Examinations Committee                               │
│ ──────────────────────────────────────────────────────────── │
│                                                              │
│  Q06   Chemical bonding                        CORRECT       │
│                                                              │
│  Which ion is isoelectronic with neon?                       │
│                                                              │
│  A   K⁺                                       YOUR ANSWER    │
│  B   Cl⁻                                                     │
│  C   Na⁺                                      CORRECT ANSWER │
│  D   Ar                                                      │
│                                                              │
│ ──────────────────────────────────────────────────────────── │
│                                                              │
│  Q07   Atomic structure                       UNANSWERED     │
│  …                                                           │
│                                                              │
│  CH101-8F3K2 · Generated 12 Nov 2026, 14:33      Page 3 of 24│
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Question block anatomy

| Element | Spec |
|---|---|
| Block width | 170 mm |
| Top padding | 8 mm |
| Bottom padding | 8 mm |
| Separator | 0.5 pt `hairline`, full width, between blocks |
| Question header | Question number in 9 pt mono 500 `pine`; topic in 8 pt sans `ink.muted`; outcome right-aligned |
| Outcome | 7.5 pt mono uppercase, 0.08em: `CORRECT` `pine`, `INCORRECT` `brick`, `UNANSWERED` `amber` |
| Stem | 10.5 / 14.5 pt serif, max 95 ch, 5 mm below the header |
| Options start | 4 mm below the stem |
| Option row | 4.5 mm baseline gap; letter column 6 mm wide; text 9.5 / 13.5 pt sans |
| Answer labels | 6.5 pt mono uppercase, right-aligned, 4 mm from the right edge |
| Marks | Omitted unless the exam is weighted; if present, `1 mark` in 7.5 pt mono after the outcome |
| Minimum block height | 38 mm |
| Maximum blocks per page | 4, or 3 when any stem exceeds 4 lines |

**Answer marking rules:**

| Situation | Student's row | Correct row |
|---|---|---|
| Correct | `YOUR ANSWER · CORRECT` in `pine` | Same row; no second label |
| Incorrect | `YOUR ANSWER` in `brick` | `CORRECT ANSWER` in `pine` |
| Unanswered | No label; outcome `UNANSWERED` | `CORRECT ANSWER` in `pine` |
| Multi-select (future) | `YOUR ANSWER` on each selected row | `CORRECT ANSWER` on each correct row |

- The student's row gets a 1 mm pine or brick left rule, inset 2 mm from the text column. It is a quiet marker, not a highlight block.
- The correct row never gets a fill. A tint behind the correct answer makes the page look like a quiz app and prints as a grey block.
- The word "CORRECT" in the outcome is the primary signal. Colour is secondary.
- No checkmarks, crosses, or emoji. Words are unambiguous in print, greyscale, and screen readers.
- If the student's answer is correct, one label serves both; printing two labels on one row is noise.

### 4.4 Pagination

- A question block is atomic: it never splits across pages. If less than 38 mm remains, the block starts on the next page.
- The summary page is page 1. Question blocks begin on page 2.
- Running header repeats on every page; the footer's `Page x of y` is computed after layout.
- Widows and orphans: no heading at the bottom of a page without at least one following line.
- Topic does not restart the page. The review is one continuous sequence, because students review in question order, not topic order.
- The final page ends with a 20 mm rule and "End of review" in 8 pt mono `ink.muted`, plus the reference. No signature, no stamp.

### 4.5 Detailed review rules

- Every question appears, including unanswered ones.
- Every option appears, in the candidate's display order (A–E as they saw them). Options are never filtered, and never re-sorted into bank order.
- A referential option ("all of the above", "both A and B") is safe to print because items that contain one keep their source option order in the first place. See `06-question-bank-and-randomisation.md` §4.4.
- Correct answers are shown. Explanations are not.
- No score is hidden; the summary is explicit. This document is for the student.
- No candidate email or address. The name and ID are necessary to tie the review to the record.
- The answer key warning appears in the header of every page, not only page 1.
- No page-level "Pass"/"Fail" celebration or failure language beyond the outcome field.

---

## 5. Data contract

Both documents are rendered from one immutable snapshot taken at submission. Neither reads live exam state.

| Field | Official record | Detailed review |
|---|---|---|
| Institution name and mark | Yes | Yes |
| Candidate name | Yes | Yes |
| Student ID | Yes | Yes |
| Programme, cohort | Yes | Programme only |
| Course code and title | Yes | Yes |
| Paper title, mode | Yes | Yes |
| Date, start time, duration | Yes | Date; duration in the exam line |
| Question count, total marks | Yes | Yes |
| Score, percentage, grade, outcome | Yes | Yes |
| Topic breakdown | Yes (≤ 12 + Other) | Yes (full) |
| Per-question stem and options | No | Yes |
| Question order | Paper order | Paper order |
| Option order and letters | — | Candidate's display order |
| Student's answer | No | Yes |
| Correct answer | No | Yes |
| Explanations | No | No |
| Reference, verification URL, QR | Yes | Reference only; no QR |
| Generated timestamp | Yes | Yes |

**Privacy rules:**
- The official record is the only document with a verification surface.
- The review is marked personal on every page and carries no verification QR, so a forwarded page cannot be used as proof of result.
- Neither file contains the candidate's email, phone, address, or date of birth.
- Neither file name nor PDF metadata contains a score, percentage, grade, or outcome.
- Access to download either file requires the authenticated student session; the files are not public URLs.

---

## 6. Generation and delivery

### 6.1 States

Each file has its own state. They are generated independently and can finish at different times.

| State | Meaning | Receipt behaviour |
|---|---|---|
| Queued | Snapshot accepted, render not started | Row shows "Preparing…", download disabled |
| Rendering | Layout in progress | Same |
| Ready | File stored against the reference | Download enabled |
| Failed | Render or storage failed | Row shows "Retry"; the other file is unaffected |
| Expired link | Download token expired | "Request a new link" |

- Typical render: official record under 2 s; review under 8 s for 60 questions.
- A failure in one document never blocks the other. The receipt shows two independent rows.
- Retry re-renders only the failed document from the same snapshot; it never resubmits the exam.
- If both fail, the receipt offers the email fallback once, and support can regenerate later without the student resubmitting.

### 6.2 Size and performance

| Document | Target size | Hard ceiling |
|---|---|---|
| Official record | ≤ 250 KB | 1 MB |
| Detailed review | ≤ 4 MB | 10 MB |

- Fonts subset and embedded.
- Institution mark compressed to a monochrome PNG or SVG; no 300 dpi colour logo.
- QR generated as vector, not a raster image.
- The review is not optimised by removing questions; pagination is the only lever.

### 6.3 Email fallback

- Opt-in, sent to the address already on the account. The exam screen never asks for an address.
- The email contains expiring links, not attachments, so the answer key is not left in an inbox indefinitely.
- Link lifetime: 7 days, single student, authenticated.
- The email subject contains the course code and reference, never the score or outcome.

### 6.4 Never

- No inline preview, embed, iframe, or new-tab viewer in the app.
- No ZIP bundle. Two files, two actions.
- No auto-open on download.
- No public or guessable URL.
- No screenshot or thumbnail of either document in the receipt.
- No score rendered in the receipt, even after both PDFs are generated.

---

## 7. Accessibility

### 7.1 Document structure

- Tagged: `/Document`, `/H1` for the document title, `/H2` for sections, `/Table` with `/TH` and scope, `/L` for lists, `/Figure` for the mark and QR.
- Reading order matches visual order on every page.
- Artifacts (running header, footer, page numbers) are marked as artifacts so they are not read inline.
- The question block is a logical group; the outcome is read after the stem, before the options.

### 7.2 Text and colour

- All informational text ≥ 7.5 pt; body 10 pt.
- Contrast in print: ink on white 16.3:1, muted 5.9:1, pine 9.2:1, amber 5.7:1, brick 7.3:1.
- `pine.tint` is used only behind small elements and never under body text.
- Greyscale test: print both documents in black and white; every state must still be identifiable from words and rules.

### 7.3 Links and figures

- Every link has visible text and a full URL.
- QR alt text names the destination and purpose.
- Institution mark alt text is the institution name, not "logo".
- No text baked into images.

### 7.4 Assistive technology

- Both documents open and read in a standard viewer without the app.
- Tables announce column headers.
- Page numbers are artifacts, so a screen reader does not interrupt the content with "Page 3 of 24" mid-sentence.
- The review's "contains the answer key" warning is the first line of page 1 body content and repeats as a header, not as an artifact.

---

## 8. QA checklist

**Official record**
- [ ] Exactly one page at A4 and at Letter.
- [ ] 12 topics fit; 13 topics trigger the "Other topics" rule without shrinking type.
- [ ] Score, percentage, grade, and outcome align on one baseline.
- [ ] No correct answer or question text anywhere in the file.
- [ ] QR resolves to the verification URL; the URL is visible as text.
- [ ] Greyscale print keeps every field legible.
- [ ] No signature image, no watermark, no certificate border.
- [ ] File name and metadata contain no score or outcome.

**Detailed review**
- [ ] Summary page plus every question, including unanswered.
- [ ] No question block splits across pages.
- [ ] Correct, incorrect, and unanswered are distinguishable in greyscale.
- [ ] Student's answer and correct answer both labelled on wrong answers.
- [ ] One label only on correct answers.
- [ ] Header warning appears on every page.
- [ ] Page x of y is correct after layout.
- [ ] No explanations and no item-bank metadata.

**Both**
- [ ] Tagged, titled, language-declared, fonts embedded.
- [ ] Reading order matches visual order.
- [ ] Links have visible URLs; figures have alt text.
- [ ] No candidate contact details.
- [ ] No score in file name or metadata.
- [ ] Files open without the app and at 200% zoom.
- [ ] Sizes within budget.
- [ ] Independent generation states; one failure does not block the other.

---

## 9. Handoff

This closes the result-document design. The receipt now delivers two artifacts, so `01-ux-blueprint.md` and `02-visual-ui-spec.md` are updated to show two download rows with independent states.

**Still open:**
- The institution's grade scale and outcome vocabulary — the layout accepts one word, but the values are configured.
- Whether marks are weighted per question — the review has an optional marks field.
- The verification service's URL and token policy.

**Next artifacts:**
1. Platform component inventory — written as `04-platform-component-inventory.md`.
2. An engineering redline: exact PDF measurements, table column widths, and generation state transitions — written as `05-engineering-redline.md`.
