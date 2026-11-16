# Engineering Redline

**Project:** Chemistry 101
**Brand:** CCF NIFES
**Derived from:** `01-ux-blueprint.md`, `02-visual-ui-spec.md`, `03-result-pdf-spec.md`, `04-platform-component-inventory.md`, `06-question-bank-and-randomisation.md`
**Purpose:** Exact measurements, breakpoints, transitions, and acceptance criteria. This document adds no visual decisions. Where it conflicts with an earlier document, the earlier document wins only where it is marked **locked**; otherwise the value here is authoritative.
**Status:** v1.1 — synced to the v2.0 "Registry" visual system. Ready for implementation.

---

## 1. Precedence and scope

| Rank | Document | Authority |
|---|---|---|
| 1 | `02-visual-ui-spec.md` | Exam-screen components marked **locked** |
| 2 | `03-result-pdf-spec.md` | PDF content and structure |
| 3 | `04-platform-component-inventory.md` | Platform components |
| 4 | This redline | Exact values, derived |

- All values are CSS pixels at 100% zoom unless marked `pt` (print) or `mm` (print).
- Hairlines are 1 px on screen and 0.5 pt in print.
- No component may introduce a value not listed here without a documented decision.
- No score, percentage, grade, or correctness value may be rendered in the exam interface or sent to it.

---

## 2. Tokens

**v2.0 "Registry".** These replace the v1.0 warm-paper tokens. The exam screen uses one sheet, hairlines, and three state marks; there are no card surfaces.

### 2.1 Colour — light

| Token | Value | Role |
|---|---|---|
| `surface.paper` | `#FBF9F4` | Sheet: page, header, rail, answer bar |
| `surface.paper-2` | `#F3F1EA` | Hover, pressed, wells |
| `surface.sunken` | `#F3F1EA` | Disabled fill, read-only |
| `surface.raised` | `#FFFDF9` | Dialog, receipt, map sheet |
| `surface.desk` | `#E9E6DE` | Outside the product sheet (mockups, platform framing) |
| `ink.primary` | `#171A18` | Content, monogram, filled action |
| `ink.secondary` | `#3C433E` | Emphasised body |
| `ink.muted` | `#616A63` | Labels, secondary |
| `ink.faint` | `#8E958F` | Disabled, non-text only |
| `line.hairline` | `#DDD9CF` | Decorative rules, option rules, index rows |
| `line.hairline-strong` | `#918C80` | Control boundaries, dialog and receipt edges |
| `line.control` | `#918C80` | Input and control boundaries (3.2:1) |
| `accent.pine` | `#1D4B3B` | **State only:** selected, current, answered, focus |
| `accent.pine-hover` | `#14382C` | Hover on accent text/rules |
| `accent.pine-tint` | `#E7EDE8` | Selected row fill |
| `signal.amber` | `#8A5A12` | Flag, warning, pending |
| `signal.amber-tint` | `#F6EBD6` | Warning banner |
| `signal.amber-line` | `#E3CDA4` | Warning border |
| `signal.brick` | `#8E3B31` | Failure |
| `signal.brick-tint` | `#F7E9E6` | Failure background |
| `focus.ring` | `#1D4B3B` | Focus |
| `surface.overlay` | `rgba(12,15,13,0.44)` | Dialog / sheet backdrop |

### 2.2 Colour — dark

| Token | Value |
|---|---|
| `surface.paper` | `#121514` |
| `surface.paper-2` | `#191D1B` |
| `surface.sunken` | `#191D1B` |
| `surface.raised` | `#1C211E` |
| `ink.primary` | `#EDEBE4` |
| `ink.secondary` | `#CFD4CE` |
| `ink.muted` | `#A7AFA9` |
| `ink.faint` | `#7C837D` |
| `line.hairline` | `#2A302C` |
| `line.hairline-strong` | `#5E665F` |
| `line.control` | `#5E665F` |
| `accent.pine` | `#86C6AA` |
| `accent.pine-hover` | `#9ED4BC` |
| `accent.pine-tint` | `#1E3029` |
| `signal.amber` | `#D9A85C` |
| `signal.amber-tint` | `#2A2418` |
| `signal.amber-line` | `#4A3B22` |
| `signal.brick` | `#E09A8F` |
| `signal.brick-tint` | `#2C1D1B` |
| `focus.ring` | `#86C6AA` |
| `surface.overlay` | `rgba(0,0,0,0.56)` |

`accent.pine-fill` is retired. A filled action is `ink.primary` with `surface.paper` text in both themes.

### 2.3 Measured contrast

| Pair | Ratio | Minimum | Result |
|---|---|---|---|
| Ink / paper | 16.7 | 4.5 | Pass |
| Muted / paper | 5.3 | 4.5 | Pass |
| Pine / paper | 9.4 | 4.5 | Pass |
| Paper / pine | 9.4 | 4.5 | Pass |
| Pine / pine-tint | 8.3 | 4.5 | Pass |
| Muted / pine-tint | 4.7 | 4.5 | Pass |
| Amber / paper | 5.6 | 4.5 | Pass |
| Amber / amber-tint | 5.0 | 4.5 | Pass |
| Brick / paper | 7.1 | 4.5 | Pass |
| Control border / paper | 3.2 | 3.0 | Pass |
| Dark ink / paper | 15.4 | 4.5 | Pass |
| Dark muted / paper | 8.2 | 4.5 | Pass |
| Dark pine / paper | 9.3 | 4.5 | Pass |
| Dark pine / pine-tint | 7.1 | 4.5 | Pass |
| Dark control border / paper | 3.1 | 3.0 | Pass |
| `ink.faint` / paper | 2.9 | — | Decorative only |

### 2.4 Spacing

4 px grid. Permitted values:

`4, 8, 10, 12, 14, 16, 18, 20, 24, 26, 32, 34, 40, 44, 48, 56, 64, 72, 104`

10, 14, 18, 26, 34, and 104 exist for optical alignment with type (option rows, folio gutter, answer bar). The component measurements below are exact and override any rounded token name.

### 2.5 Radius and borders

| Token | Value |
|---|---|
| `radius.0` | 0 — every panel, button, row, dialog, receipt |
| `radius.2` | 2 px — map sheet top corners only |
| `radius.full` | 50% — radio dot, flag dot, save dot only |
| `border.hairline` | 1 px `line.hairline` |
| `border.control` | 1 px `line.control` |
| `border.selected` | 2 px `accent.pine`, inset left |
| `border.focus` | 2 px `focus.ring`, offset 2 |

No 3, 4, or 6 px radii on the exam screen. No pills. Platform surfaces remain governed by `04`.

### 2.6 Elevation

| Token | Value | Use |
|---|---|---|
| `shadow.dialog` | `0 32px 80px rgba(12,15,13,0.22)` | Submit dialog |
| `shadow.sheet` | `0 -24px 64px rgba(12,15,13,0.24)` | Mobile map sheet |
| No other shadow | — | Rows, buttons, receipts, rail |

### 2.7 Z-index

| Layer | Value |
|---|---|
| Base content | 0 |
| Answer bar | 4 |
| Sticky map rail | 10 |
| Sticky exam header / top bar | 20 |
| Banner (in flow) | 15 |
| Dialog / sheet backdrop | 40 |
| Dialog / sheet panel | 50 |
| Toast | 60 |
| Tooltip | 70 |

---

## 3. Typography

### 3.1 Families

| Role | Family | Fallback |
|---|---|---|
| Serif | Crimson Pro | `Georgia, "Times New Roman", serif` |
| Sans | Atkinson Hyperlegible | `system-ui, "Segoe UI", Arial, sans-serif` |
| Mono | IBM Plex Mono | `"Cascadia Mono", Consolas, monospace` |

- Self-hosted WOFF2, `font-display: swap`.
- Subset to Latin, punctuation, superscripts, subscripts, arrows, and the chemistry glyphs actually used.
- Weights: Serif 400/500/600; Sans 400/700 only (Atkinson has no 500); Mono 400/500.
- Never request sans 500. Never synthesise bold or italic.

### 3.2 Screen scale

| Role | Family | Size / line | Weight | Tracking |
|---|---|---|---|---|
| Folio | Serif | 58 / 56 | 400 | −0.03em |
| Folio ≤ 560 | Serif | 40 / 40 | 400 | −0.03em |
| Receipt title | Serif | 36 / 44 | 400 | −0.012em |
| Stem ≥ 561 | Serif | 27 / 38 | 400 | −0.004em |
| Stem ≤ 560 | Serif | 22 / 32 | 400 | 0 |
| Dialog title | Serif | 25 / 32 | 400 | −0.004em |
| Sheet title | Serif | 23 / 28 | 400 | 0 |
| State title | Serif | 24 / 32 | 400 | 0 |
| Option | Sans | 17 / 26 | 400 | 0 |
| Option ≤ 560 | Sans | 16 / 24 | 400 | 0 |
| Option ≤ 380 | Sans | 15 / 23 | 400 | 0 |
| Body copy | Sans | 15 / 23 | 400 | 0 |
| Body small | Sans | 14 / 22 | 400 | 0 |
| UI label | Sans | 13 / 18 | 400 | 0 |
| UI label bold | Sans | 13 / 18 | 700 | 0.01em |
| UI note | Sans | 12 / 17 | 400 | 0 |
| Eyebrow | Mono | 10 / 14 | 500 | 0.14em, uppercase |
| Code | Mono | 11 / 16 | 500 | 0.10em, uppercase |
| Timer | Mono | 21 / 24 | 500 | 0.01em |
| Timer ≤ 560 | Mono | 18 / 22 | 500 | 0.01em |
| Index number | Mono | 12 / 16 | 400 | 0 |
| Count | Mono | 12 / 16 | 500 | 0 |

### 3.3 Print scale

| Role | Family | Size / line | Weight |
|---|---|---|---|
| Document title | Serif | 24 / 28 pt | 400 |
| Section heading | Serif | 14 / 18 pt | 400 |
| Question stem | Serif | 10.5 / 14.5 pt | 400 |
| Body | Sans | 10 / 15 pt | 400 |
| Table body | Sans | 9 / 13 pt | 400 |
| Table header | Mono | 7.5 / 10 pt | 500, uppercase, 0.08em |
| Label | Mono | 7.5 / 10 pt | 500, uppercase, 0.08em |
| Score | Mono | 30 / 32 pt | 500 |
| Reference / footer | Mono | 7.5 / 10 pt | 400 |

Minimum print text: 7.5 pt. Body measure 90–105 characters. Superscript/subscript 65% size, line height ≥ 1.4.

### 3.4 Numerals

- `font-variant-numeric: tabular-nums` on the timer, counts, index numbers, table numerics, references, percentages, and scores.
- Timer fixed min-width 66 px; mobile 56 px.
- No proportional numerals in any changing value.

---

## 4. Layout and component measurements

### 4.1 Exam page frame

| Property | ≥ 1200 | 921–1199 | 561–920 | 381–560 | ≤ 380 |
|---|---|---|---|---|---|
| Page max | 1440 | 1200 | 100% | 100% | 100% |
| Content max | 1360 | 100% | 100% | 100% | 100% |
| Gutter | 40 | 40 | 40 | 16 | 16 |
| Folio column | 104 | 88 | 88 | stacked | stacked |
| Rail | 292 | 240 | — | — | — |
| Gap | 48 | 40 | 32 | — | — |
| Content top | 44 | 40 | 48 | 26 | 26 |
| Header height | 68 | 68 | 68 | 58 | 58 |
| Progress rule | 2 | 2 | 2 | 2 | 2 |
| Stem size | 27 | 27 | 27 | 22 | 22 |
| Answer measure | 660 | 600 | flexible | full | full |

Sticky offsets:
- Header: top 0, height as above.
- Rail: top 100 desktop and compact desktop.
- Answer bar: bottom 0, height 72 desktop/tablet, 68 + `env(safe-area-inset-bottom)` mobile.
- Scroll padding: top 100, bottom 110.

The exam frame is 1360 wide because of the folio and the map rail. The surrounding platform shell uses a 1200 content maximum (`04` §7.1); that difference is intentional.

### 4.2 Exam bar

| Property | Desktop ≥ 1200 | Tablet 561–1199 | Mobile ≤ 560 |
|---|---|---|---|
| Height | 68 | 68 | 58 |
| Padding X | 40 | 40 | 16 |
| Inner max | 1360 | 100% | 100% |
| Monogram | 28 × 28, radius 0, ink fill | same | same |
| Wordmark | 14 / 20, 700 | same | hidden |
| Gap monogram→wordmark | 12 | 12 | — |
| Divider | 1 × 18, 16 each side | same | hidden |
| Course code | 11 / 16 mono 500, 0.10em | same | same, 12 left margin |
| Course title | 14 / 20 muted, max 40 ch | hidden < 1100 | hidden |
| Save status | 11 mono, reserved 132 | same | hidden |
| Timer | 21 / 24, min 66 | 21 / 24, min 66 | 18 / 22, min 56 |
| Right gaps | 18, 18, 4 | 18, 18, 4 | 12, 4, 8 |
| Map button | 44 × 44 | 44 h, labelled "Map" | 44 × 44 |
| Theme button | 44 × 44, visible | hidden | hidden |
| Submit | 40 h, padding 0 16 | same | 36 h, padding 0 12 |

Submit label: "Submit exam" ≥ 561, "Submit" ≤ 560. **Submit is never filled.** The only filled action is Next / Download official record.

### 4.3 Question column

| Property | ≥ 561 | ≤ 560 |
|---|---|---|
| Meta row min-height | 44 | 44 |
| Meta → stem | 10 | 14 |
| Stem → options | 34 | 26 |
| Option list border | 1 px top and bottom | same |
| Option divider | 1 px between rows | same |
| Option min-height | 62 | 56 |
| Option padding | 17 × 14 | 15 × 10 |
| Option grid | 30 / 1fr / 14, gap 16 | 26 / 1fr / 12, gap 12 |
| Letter | 13 mono 500 | 13 mono 500 |
| Trailing dot | 9 px, 1 px ring | 9 px |
| Stem measure | 660 (600 at 921–1199) | full width |
| Content bottom padding | 104 | 96 + inset |

Selected row: `accent.pine-tint` fill, 2 px inset left `accent.pine` bar, letter `accent.pine` 500, 9 px dot filled `accent.pine`. Text weight unchanged. No "Selected" word.

Long option (> 2 lines): top-align the row; letter and dot offset 4 px from the first line's cap; dot stays at the trailing edge.

### 4.4 Answer bar

| Property | Desktop / tablet | Mobile |
|---|---|---|
| Height | 72 | 68 + safe area |
| Border top | 1 px `line.hairline` | same |
| Inner grid | 104 / 1fr / 292, gap 48 | flex, gap 8 |
| Clear | left, 44 h, 13 sans | above bar, 44 h, underlined |
| Previous | 44 h, padding 0 18, 1 px `line.control` | flex 1 |
| Next | 44 h, padding 0 18, ink fill + paper text | flex 1.4 |
| Focus | 2 px `focus.ring`, offset 2 | same |

- On desktop/tablet the inner grid repeats the shell, so Next ends at the option rule.
- Previous disabled at Q1; Next becomes "Review answers" at the last question.
- No wrap-around. No icon-only navigation.
- The bar is `position: fixed`, z 4; content padding-bottom clears it.

### 4.5 Map rail

| Property | ≥ 1200 | 921–1199 |
|---|---|---|
| Width | 292 | 240 |
| Padding left | 40 | 32 |
| Border left | 1 px `line.hairline` | same |
| Sticky top | 100 | 100 |
| Max height | `calc(100vh - 172px)` | same |
| Grid | 6 columns, 34 px rows, no gap | 6 columns, 30 px rows |
| Content width | 252 | 208 |
| Number | 12 mono 400 | same |
| Answered mark | 2 px underline, inset 12 from right | same |
| Current mark | 2 px left bar, 4 px inset top/bottom | same |
| Flag dot | 5 px, top 5, right 9 | same |
| Counts row | 34 h | 34 h |

The index has no cell borders and no fills. `6 × 34` rows fit the 60-item paper in 10 rows; a 100-item paper uses 7 columns and the rail widens to 316.

### 4.6 Map sheet

- Width: 100% ≤ 560, 560 at 561–920; centred on tablet.
- Padding `10 20 24` plus safe area; radius 2 top; max height 92vh; `shadow.sheet`.
- Cells 44 px tall; 5 columns ≤ 560; 7 columns 561–920; row hairlines, no gaps.
- Header: eyebrow, 23 px serif title, 12 mono count.
- Submit button 48 h at the bottom, full width, ink fill.

### 4.7 Submit dialog

| Property | Value |
|---|---|
| Width | 500 |
| Padding | 34 / 36 / 30 |
| Border | 1 px `line.hairline-strong` |
| Radius | 0 |
| Top rule | 3 px `accent.pine`, full width, inset top |
| Title | 25 / 32 serif |
| Lead | 15 / 23 sans, `ink.muted` |
| Tally row | 42 h, 1 px hairline |
| Tally value | 14 mono 500, tabular |
| Actions | 44 h, gap 10, right-aligned |
| Max body height | 70vh |
| Close button | none |

- Mobile ≤ 560: full-width sheet at the bottom, 2 px top radius, padding 24, actions stacked secondary-first.
- Backdrop `surface.overlay`; no blur.
- Enter 180 ms fade + 8 px rise; exit 120 ms fade.
- Platform dialogs (sm/md/lg) remain as specified in `04`; this table covers the exam submit dialog only.

### 4.8 Receipt

| Property | Desktop | Mobile |
|---|---|---|
| Width | 620 | 100% − 40 |
| Vertical alignment | centred in the viewport | top 40 |
| Padding | 44 / 48 / 36 | 28 / 24 |
| Border | 1 px `line.hairline-strong` | same |
| Radius | 0 | 0 |
| Brand row | 24 monogram + 12 sans 700, 26 above eyebrow | same |
| Accent rule | 36 × 2, top edge, inset 48 | inset 24 |
| Title | 36 / 44 | 30 / 38 |
| Title gap | 12 | 12 |
| Metadata gap | 26 | 22 |
| Metadata row | 44 h, 1 px hairline | same |
| Handoff gap | 22 | 18 |
| Artifact row | 76 h, 1 px hairline, no fill | stacked, button full width |
| Artifact button | 40 h | 44 h |
| Re-download gap | 16 | 16 |
| Close | 44 h, 22 above, underlined | same |

Artifact row content: name 14 / 20 sans 700; meta 11 / 16 mono `ink.muted`; official record ink fill, detailed review outline `line.hairline-strong`.

### 4.9 Platform controls

Platform controls are governed by `04-platform-component-inventory.md` and are outside the exam screen's v2.0 token set. Do not reuse the platform radii or the 500 sans weight inside the exam shell.

| Control | Height | Padding X | Radius | Type |
|---|---|---|---|---|
| Button sm | 32 | 12 | 4 | 13 / 18 500 |
| Button md | 40 | 16 | 4 | 14 / 20 500 |
| Button lg | 48 | 24 | 4 | 15 / 20 500 |
| Input / select | 40 | 12 | 4 | 15 / 22 |
| Input touch | 48 | 12 | 4 | 15 / 22 |
| Textarea | min 96 | 12 | 4 | 15 / 22 |
| Search | 40 | 36 left, 36 right | 4 | 15 / 22 |
| Checkbox / radio | 18 | — | 3 / circle | — |
| Switch | 36 × 20 | — | 10 | — |
| File dropzone | min 96 | 24 | 6 | 14 / 20 |
| Pagination cell | 32 | — | 3 | 13 mono |
| Table row | 44 | 12 × 16 | — | 14 / 20 |
| Table header | 36 | 12 × 16 | — | 12 mono uppercase |
| Sidebar | 240 wide | — | — | — |
| Sidebar item | 40 | 12 | 0 | 13 / 18 500 |
| Top bar | 56 | 32 | — | — |
| Tab | 44 | 16 | 0 | 14 / 20 500 |
| Badge | 20 | 6 | 3 | 11 mono 500 |
| Toast | auto | 12 | 4 | 13 / 18 |
| Tooltip | auto | 6 | 4 | 12 / 16 |

---

## 5. State transitions

### 5.1 Durations

| Event | Duration | Easing | Properties |
|---|---|---|---|
| Hover / pressed | 120 ms | ease-out | background, colour |
| Selection change | 120 ms | ease-out | background, box-shadow, dot fill |
| Progress update | 240 ms | `cubic-bezier(0.2,0,0,1)` | width |
| Switch thumb | 120 ms | ease-out | transform |
| Dialog enter | 180 ms | ease-out | opacity, transform |
| Dialog exit | 120 ms | ease-in | opacity, transform |
| Sheet enter/exit | 180 / 120 ms | ease-out / ease-in | transform |
| Toast enter/exit | 180 / 120 ms | ease-out / ease-in | opacity, translateY |
| Timer dot pulse | 2000 ms loop | ease-in-out | opacity 1 → 0.45 |
| Focus ring | 0 ms | — | instant |

Reduced motion: all durations 0 ms; timer dot static at full opacity; indeterminate rule static at 50%; no dialog rise; switch instant; no sheet rise; no progress transition.

### 5.2 Component transitions

| Component | Rest → hover | Rest → selected / focus | Rest → disabled |
|---|---|---|---|
| Ink action (Next, Download) | ink → 90% ink | 2 px accent ring on focus | 40% opacity |
| Outline action (Previous, Submit) | transparent → paper-2 | 2 px accent ring on focus | 40% opacity |
| Option row | paper-2 | accent tint + 2 px inset left bar + filled dot | 60% opacity, locked |
| Index number | number → ink | underline + accent number; current gets left bar | — |
| Input | border control → accent border on focus | 2 px accent ring; no selected state | 40% opacity + sunken |
| Table row | paper-2 | accent tint | — |
| Sidebar item | paper-2 | accent tint + 2 px inset left accent | — |
| Tab | ink.primary | 2 px accent underline | — |

No transform on press. No scale. No shadow change except overlays. Weight never changes in an option row.

---

## 6. Responsive behaviour

### 6.1 What changes

| Width | Layout | Navigation | Visible exam context |
|---|---|---|---|
| ≥ 1200 | Rail 292, gap 48, folio 104 | Sidebar 240, top bar 56 | Brand, code + title, saved, timer, map, theme, submit |
| 921–1199 | Rail 240, gap 40, folio 88 | Sidebar 240 | Brand, code + title, saved, timer, map, submit |
| 561–920 | Single column, folio 88, gap 32 | Sidebar becomes sheet < 1024; top bar 56 | Brand, code, saved, timer, labelled Map, submit; no theme |
| 381–560 | Single column, gutters 16, folio stacked | Fixed answer bar | Monogram, code, timer, map, submit |
| ≤ 380 | Single column, gutters 16 | Fixed answer bar | Monogram, timer, map, submit; no code |

### 6.2 Tables

- ≥ 921: full table.
- 721–920: reduce columns; hide non-essential metadata first.
- ≤ 720: stacked label/value rows, or horizontal scroll with a sticky first column. Choose per screen, never both.
- Table horizontal scroll is allowed in admin; page-level horizontal scroll is never allowed.
- Exam screen: no horizontal scroll at any width, including 320 with 6 options.

### 6.3 Touch and keyboard

- Touch targets 44 × 44 minimum; option rows 56 h on mobile; index rows 44 h in the sheet; the rail rows are 34 h but the rail is pointer-only ≥ 921 and each number has a 44 px hit area via padding.
- Desktop minimum 32 × 32.
- Sticky elements must not obscure focused controls; scroll padding 100 top / 110 bottom.
- Landscape height ≤ 420: drop the course code and timer label; keep the header, folio, and answer bar; the sheet scrolls internally.
- `A`–`F` selects the next answer; arrows never change a committed answer.

---

## 7. Accessibility specifications

| Requirement | Exact value |
|---|---|
| Focus ring | 2 px `focus.ring`, offset 2, radius 0; inset −4 on rows and index numbers |
| Focus visibility | Never removed; never colour-only |
| Body contrast | ≥ 4.5:1 |
| Large text contrast | ≥ 3:1 (≥ 24 px regular or ≥ 19 px bold) |
| Control boundary | ≥ 3:1 (`line.control`) |
| Touch target | ≥ 44 × 44 |
| Desktop target | ≥ 32 × 32 |
| Text zoom | 200% without loss; 400% reflow |
| Scroll padding | 100 top, 110 bottom |
| Motion | `prefers-reduced-motion` zeroes all durations |
| Forced colours | System Canvas/CanvasText; borders 1 px; focus `Highlight`; flag dot becomes text |
| Screen reader | Question change, selection, flag, 5/1-minute warnings, save failure, submission, receipt |
| Timer | Not announced per second |
| Index item name | "Question 12, answered, flagged, current" |
| Receipt | Announced once; both download rows reachable by Tab |
| PDFs | Tagged, titled, language `en`, real text, header cells, alt text, no encryption blocking AT |

Order of focus on the exam screen:
skip link → exam bar → topic → flag → options → clear → answer bar (previous/next) → index (single composite, roving tabindex).

Dialogs: focus trapped, initial focus on the first non-destructive control, restored to the trigger. Exam submit dialog initial focus: "Keep working".

---

## 8. PDF measurements

### 8.1 Page

| Property | Value |
|---|---|
| Size | 210 × 297 mm (A4) |
| Margins | 20 left, 20 right, 18 top, 20 bottom |
| Type area | 170 × 259 mm |
| Header | 24 mm |
| Body | 231 mm |
| Footer | 4 mm |
| Background | `#FFFFFF` |

### 8.2 Grid

| Property | Value |
|---|---|
| Content width | 170 mm |
| Two-column split | 80 + 10 gutter + 80 |
| Label / value | 26 / 54 mm |
| Topic halves | 80 + 10 gutter + 80; each 44 / 12 / 12 / 12 |
| Review header | Number 14, Topic 100, Outcome 56 |
| Rule weight | 0.5 pt; total rule 0.75 pt |

### 8.3 Header and footer

- Mark 10 × 10 mm at x 20, y 18.
- Institution name 11 pt sans 600, baseline aligned to mark top + 4 mm.
- Office line 8 pt muted, 4 mm below.
- Document type 7.5 pt mono uppercase, right-aligned at x 190.
- Rule at y 34, width 170, 0.5 pt.
- Body starts y 42.
- Footer rule at y 273; footer baseline 277.
- Left footer: reference + generated timestamp, 7.5 pt mono muted.
- Right footer: `Page x of y`, 7.5 pt mono.
- Review centre footer: "Personal — contains the answer key", 7.5 pt amber.

### 8.4 Official record

- Title 24 pt serif, y 46; subtitle 10 pt sans, 4 mm below; pine rule 40 × 1.5 mm, 4 mm below.
- Metadata blocks start 10 mm below the rule.
- Metadata rows 6 mm apart.
- Result band: hairlines above and below, 4 mm padding; score 30 pt mono, other fields 14 pt.
- Topic table: two 80 mm halves, 10 mm gutter; header 5 mm, six body rows per half at 5.5 mm, total row 5.5 mm spanning 170 mm.
- Up to 12 topic rows; 13+ triggers "Other topics".
- Declaration: maximum two lines at 8.5 / 12 pt.
- Verification QR 22 × 22 mm at the right; reference and URL 9 / 8.5 pt mono.
- Exactly one page. Overflow reduces the topic table, never the type.

### 8.5 Detailed review

- Summary page mirrors the official record, with the reading key replacing the verification block.
- Question block: 8 mm top and bottom padding, 0.5 pt separator.
- Stem 10.5 / 14.5 pt serif, 5 mm below header; options start 4 mm below.
- Option baseline gap 4.5 mm; option letter column 6 mm wide; option text 9.5 / 13.5 pt.
- Answer labels 6.5 pt mono uppercase, right-aligned, 4 mm inset.
- Minimum block 38 mm; 4 per page maximum, 3 when a stem exceeds 4 lines.
- Blocks never split. If < 38 mm remains, break.
- Page 1 summary, questions from page 2, "End of review" at the end.
- Running header on every page; `Page x of y` computed after layout.

### 8.6 PDF type and colour

- Body 10 pt, table 9 pt, header/label 7.5 pt, score 30 pt.
- Colours: ink `#171A18`, muted `#616A63`, pine `#1D4B3B`, amber `#8A5A12`, brick `#8E3B31`, hairline `#DDD9CF`, paper `#FFFFFF`.
- No gradients, images of text, or full-page tints.
- Greyscale print must preserve every state through words and rules.

---

## 9. Data and privacy contract

| Data | Exam screen | Receipt | PDFs |
|---|---|---|---|
| Answers, flags, index | Yes | No | No |
| Deadline | Yes | No | No |
| Answered count | Yes | Yes | Yes |
| Reference | Yes | Yes | Yes |
| File readiness | No | Yes | — |
| Score, percentage, grade | **No** | **No** | Official + review |
| Correct answers | **No** | **No** | Review only |
| Candidate email | No | No | No |

- The exam screen's submission payload contains no result values.
- File downloads require the authenticated student session; URLs are not public.
- File names and metadata contain no outcome.
- The review is marked personal on every page and carries no verification QR.

### 9.1 Paper and bank fields

| Field | Home | Screen | Receipt | PDFs |
|---|---|---|---|---|
| `attempt.seed` | attempt record | **No** | No | No |
| `attempt.paper` (item IDs in order) | attempt record | Rendered order | No | Rendered order |
| `attempt.display_answer` | attempt record | **No** | No | Review only |
| `bank_version` | `bank/manifest.json` | **No** | No | No |
| `paper_length` | exam config | Yes, as `N` | Yes, as `N` | Yes, as `N` |
| `option_shuffle` | bank item | **No** | No | No |

- The bank and the seed are server-side. The client receives stems and display options only, never `answer`, `answer_raw`, `option_shuffle`, `seed`, or topic scores.
- `attempt.paper` is committed before question 1 is served; a refresh renders from it rather than reshuffling.
- `bank_version` is the first 8 hex characters of the canonical bank hash. Attempts pin it; a mid-window edit never changes a live paper.
- Ordering rules, stream names, and the Fisher–Yates definition are in `06-question-bank-and-randomisation.md` and are normative.

---

## 10. Acceptance criteria

### Exam screen
- [ ] No horizontal scroll at 320, 360, 390, 560, 768, 920, 1024, 1280, 1920.
- [ ] 6 options + 60-character topic fit without collision.
- [ ] Timer width stable 59:59 → 00:00.
- [ ] Selected, answered, current, flagged distinguishable in greyscale.
- [ ] Focus ring visible on every control; keyboard-only run completes an exam.
- [ ] Last question shows "Review answers"; no dead end.
- [ ] Flag survives clearing an answer.
- [ ] Autosave failure leaves answers editable and retry available.
- [ ] Time expiry auto-submits; receipt marked "Time expired".

### Receipt
- [ ] No score/grade/correctness in UI or DOM.
- [ ] Two independent artifact rows; one failure never blocks the other.
- [ ] No preview, embed, new tab, ZIP, or auto-open.
- [ ] Preparing/ready/downloaded/failed/pending-sync states render.
- [ ] Both filenames contain no outcome.
- [ ] Focus moves to the title; both rows reachable by Tab.

### PDFs
- [ ] Official record exactly one page at A4.
- [ ] 12 topics fit; 13 triggers "Other topics" without shrinking type.
- [ ] Review includes every question, including unanswered.
- [ ] No block splits across pages; `Page x of y` correct.
- [ ] Correct/incorrect/unanswered legible in greyscale.
- [ ] Tagged, titled, language-declared, embedded fonts.
- [ ] Reading order matches visual order; tables have header cells.
- [ ] No candidate contact details; no score in filename or metadata.

### Platform
- [ ] All eight states exist for every interactive component.
- [ ] 44 px touch targets; 32 px desktop minimum.
- [ ] Light and dark pass contrast.
- [ ] 200% zoom and 400% reflow preserve function.
- [ ] Reduced motion honoured.
- [ ] No new shadow, gradient, pill, or accent use.

### Bank and ordering
- [ ] `bank/needs-review.json` is `[]`; `bank/manifest.json` reports 119 items.
- [ ] All 18 `typeset_required` items are cleared before a 60-item paper is configured.
- [ ] No paper contains a duplicate item or exceeds its topic quota.
- [ ] Same seed + same `bank_version` reproduces question order, option order, and display letters exactly.
- [ ] Refresh returns the same paper; the client payload has no key or seed field.
- [ ] The nine referential items keep source option order; all others shuffle.
- [ ] A 60-item paper draws 17 / 14 / 4 / 12 / 13 across the five topics.
- [ ] Both PDFs list questions in attempt order with the candidate's display letters.

---

## 11. Build order

1. Tokens, type loading, focus ring.
2. Exam shell: bar, progress, meta, stem, options, footer.
3. Exam states: selection, flag, map, timer, save failure, dialog, expiry.
4. Receipt: metadata, two artifact rows, independent states.
5. PDFs: official record, then review; shared header/footer system.
6. Platform: actions, forms, navigation, tables, feedback, overlays.

Do not build the platform components before the exam screen is accepted; the exam screen is the reference implementation of the language.

---

## 12. Known gaps

These are unresolved product decisions, not redline omissions:

1. Single vs multiple sections with independent timers.
2. Question types beyond single-answer MCQ.
3. Whether flags are student-only.
4. Institution grade scale and outcome vocabulary.
5. Email fallback behaviour and link lifetime.
6. Verification service URL and token policy.
7. Tooltips are provisional; do not build until a screen needs one.

Charts, rich text editing, command palette, inline-editable data grids, and a custom date picker remain out of scope.
