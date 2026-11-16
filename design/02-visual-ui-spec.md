# CBT Exam Screen — Visual UI Specification

**Project:** Chemistry 101
**Brand:** CCF NIFES
**Companion to:** `01-ux-blueprint.md` (v0.3)
**Scope:** Visual system and component styling for the exam shell, submission receipt, and the two result document downloads — exactly the structure in the blueprint. No new flows.
**Status:** **v2.0 — "Registry". Supersedes v1.0.** Every value in this document is implemented in `ui/mockups.html` and screenshotted at 2× in `ui/shots/01…07`.

---

## 1. Direction

**The idea: an examination registry sheet, set in type.**

A registry page does not put a box around every entry. It rules a line, sets a number in the margin, and trusts the type to carry the structure. The exam screen borrows that discipline: one sheet, hairlines, a large marginal folio, ruled answer rows, and a typographic index instead of a grid of buttons.

Three qualities, in order:

1. **Exact.** Alignment, spacing, and numerals are disciplined. The folio aligns to the header monogram; the flag aligns to the option rule; the answer bar aligns to the answer column. Nothing floats.
2. **Quiet.** The chrome recedes. There is one accent, no gradients, no glow, no illustration, and almost no motion.
3. **Legible under stress.** Type is large, contrast is high, and every state survives greyscale.

### 1.1 What changed from v1.0

| Element | v1.0 | v2.0 |
|---|---|---|
| Metaphor | Paper booklet on a desk | Registry sheet, ruled and indexed |
| Serif | Source Serif 4 | **Crimson Pro** |
| Sans | IBM Plex Sans | **Atkinson Hyperlegible** |
| Question position | `QUESTION 06 OF 60` eyebrow | **Marginal folio numeral**, 58 px |
| Options | 4 bordered cards with keycap chips | **Ruled rows**, no boxes, trailing radio dot |
| Question map | 60 bordered cells | **Typographic index**, numbered 01–60, no cells |
| Primary action | Pine fill | **Ink fill**; pine is reserved for state and focus |
| Navigation | In flow above the fold | **Persistent answer bar** at the bottom edge |
| Rails and panels | Card-like surfaces | One sheet, hairlines only |

### 1.2 Why this pairing

- **Crimson Pro** carries the stem, the folio, and receipt titles. It has a large x-height for a serif and stays calm at 27 px.
- **Atkinson Hyperlegible** carries every reading and UI string. Its glyphs are deliberately disambiguated (`I / l / 1`, `O / 0`, `rn / m`), which matters when a candidate is reading ions, units, and exponents under time pressure.
- **IBM Plex Mono** carries numerals, codes, and state words. Tabular figures keep the timer and counts from shifting.

The pairing is the database's *Academic/Research* entry, chosen for legibility rather than novelty.

---

## 2. Typography

### 2.1 Families

| Token | Family | Fallback stack | Role |
|---|---|---|---|
| `font.serif` | Crimson Pro | `Georgia, "Times New Roman", serif` | Folio, stem, titles, receipt heading |
| `font.sans` | Atkinson Hyperlegible | `system-ui, "Segoe UI", Arial, sans-serif` | Options, labels, body, buttons |
| `font.mono` | IBM Plex Mono | `"Cascadia Mono", Consolas, monospace` | Timer, counts, codes, eyebrows, map index |

Load only `400` and `700` for Atkinson, `400`/`500`/`600` for Crimson Pro, `400`/`500` for Plex Mono. Self-host in production; the mockups use Google Fonts for convenience.

Atkinson has no true 500. Never request it; use 700 for emphasis or colour for hierarchy. No synthetic bold.

### 2.2 Scale

| Token | Family | Size / line | Weight | Tracking | Use |
|---|---|---|---|---|---|
| `display.folio` | Serif | 58 / 56 | 400 | −0.03em | Marginal question numeral |
| `display.receipt` | Serif | 36 / 44 | 400 | −0.012em | "Exam submitted" |
| `display.stem` | Serif | 27 / 38 | 400 | −0.004em | Question stem, ≥ 561 px |
| `display.stem-sm` | Serif | 22 / 32 | 400 | 0 | Question stem, ≤ 560 px |
| `display.folio-sm` | Serif | 40 / 40 | 400 | −0.03em | Folio, ≤ 560 px |
| `title.dialog` | Serif | 25 / 32 | 400 | −0.004em | "Submit this exam?" |
| `title.sheet` | Serif | 23 / 28 | 400 | 0 | "Question map" sheet |
| `title.state` | Serif | 24 / 32 | 400 | 0 | Session conflict, question error |
| `body.option` | Sans | 17 / 26 | 400 | 0 | Option text |
| `body.option-sm` | Sans | 16 / 24 | 400 | 0 | Option text, ≤ 560 px |
| `body.copy` | Sans | 15 / 23 | 400 | 0 | Receipt copy, dialog body |
| `body.sm` | Sans | 14 / 22 | 400 | 0 | Secondary copy |
| `ui.label` | Sans | 13 / 18 | 400 | 0 | Buttons, flag, counts, topics |
| `ui.label-bold` | Sans | 13 / 18 | 700 | 0.01em | Primary buttons, selected labels |
| `ui.note` | Sans | 12 / 17 | 400 | 0 | Rail footnote, receipt notes |
| `meta.eyebrow` | Mono | 10 / 14 | 500 | 0.14em | "QUESTION MAP", "CHE 101 · SUBMISSION COMPLETE" |
| `meta.code` | Mono | 11 / 16 | 500 | 0.10em | Course code, save status, artifact meta |
| `num.timer` | Mono | 21 / 24 | 500 | 0.01em | Countdown, tabular |
| `num.timer-sm` | Mono | 18 / 22 | 500 | 0.01em | Countdown, ≤ 560 px |
| `num.map` | Mono | 12 / 16 | 400 | 0 | Index numbers, tabular |
| `num.count` | Mono | 12 / 16 | 500 | 0 | Counts and references, tabular |

### 2.3 Rules

- Serif never appears below 22 px on screen.
- Reading text never below 16 px; no UI string below 10 px, and 10 px only for tracked uppercase eyebrows.
- The stem's measure is 660 px maximum on desktop, 634 px at tablet, and the full column on mobile. Use `text-wrap: balance` on stems of one or two lines.
- Display numerals are always mono or the serif folio — never the sans.
- No italics except chemical state or a single word in a body sentence. No underlines except links and the focused/selected affordances defined here.
- Chemistry is typeset at display time: `K⁺`, `Cl⁻`, `CO₃²⁻`, `H₂O`, `6.02 × 10²³ mol⁻¹`. Superscripts and subscripts need a minimum 1.55 line height so they never clip.

---

## 3. Colour

### 3.1 Light

| Token | Value | Role |
|---|---|---|
| `sheet` | `#FBF9F4` | The page, header, rail, answer bar |
| `sheet-2` | `#F3F1EA` | Row hover, pressed, inset wells |
| `raised` | `#FFFDF9` | Dialog, map sheet, receipt |
| `desk` | `#E9E6DE` | Outside the product sheet (mockups only) |
| `ink` | `#171A18` | Primary text, monogram, filled buttons |
| `ink-2` | `#3C433E` | Emphasised body |
| `muted` | `#616A63` | Secondary text, labels, unanswered numbers |
| `faint` | `#8E958F` | Disabled text, non-essential marks |
| `rule` | `#DDD9CF` | Decorative hairlines, option rules, index rows |
| `rule-strong` | `#918C80` | Control boundaries: buttons, dialog, sheet top |
| `accent` | `#1D4B3B` | **State only:** selected, current, answered, focus |
| `accent-deep` | `#14382C` | Hover on accent text/underlines |
| `accent-tint` | `#E7EDE8` | Selected row fill |
| `amber` | `#8A5A12` | Flagged, timer warning |
| `amber-tint` | `#F6EBD6` | Save banner fill |
| `amber-line` | `#E3CDA4` | Banner border |
| `brick` | `#8E3B31` | Failure, submit failure |
| `brick-tint` | `#F7E9E6` | Failure inset |

### 3.2 Dark

| Token | Value |
|---|---|
| `sheet` | `#121514` |
| `sheet-2` | `#191D1B` |
| `raised` | `#1C211E` |
| `ink` | `#EDEBE4` |
| `ink-2` | `#CFD4CE` |
| `muted` | `#A7AFA9` |
| `faint` | `#7C837D` |
| `rule` | `#2A302C` |
| `rule-strong` | `#5E665F` |
| `accent` | `#86C6AA` |
| `accent-deep` | `#9ED4BC` |
| `accent-tint` | `#1E3029` |
| `amber` | `#D9A85C` |
| `amber-tint` | `#2A2418` |
| `amber-line` | `#4A3B22` |
| `brick` | `#E09A8F` |
| `brick-tint` | `#2C1D1B` |

Dark mode uses the same sheet, not a separate "night theme": no pure black, no blue cast, no coloured glow. `color-scheme: dark` is declared so native controls and scrollbars follow.

### 3.3 Contrast

Measured against `sheet`; all text pairs meet 4.5:1, all control boundaries meet 3:1.

| Pair | Ratio | Requirement | Result |
|---|---|---|---|
| Ink / sheet | 16.7 | 4.5 | Pass |
| Muted / sheet | 5.3 | 4.5 | Pass |
| Accent / sheet | 9.4 | 4.5 | Pass |
| Accent / accent-tint | 8.3 | 4.5 | Pass |
| Amber / sheet | 5.6 | 4.5 | Pass |
| Brick / sheet | 7.1 | 4.5 | Pass |
| Control boundary / sheet | 3.2 | 3.0 | Pass |
| Sheet / ink (filled button) | 16.7 | 4.5 | Pass |
| Dark ink / sheet | 15.4 | 4.5 | Pass |
| Dark muted / sheet | 8.2 | 4.5 | Pass |
| Dark accent / sheet | 9.3 | 4.5 | Pass |
| Dark accent / accent-tint | 7.1 | 4.5 | Pass |
| Dark control boundary / sheet | 3.1 | 3.0 | Pass |
| `faint` / sheet | 2.9 | — | Decorative only |

### 3.4 Colour rules

- **Pine is a state colour, not a brand wash.** It marks selected, current, answered, and focus. It never fills a primary button, never colours a heading, never appears decoratively.
- **Ink is the action colour.** The forward action (Next, Download official record) is ink-filled with sheet-coloured text.
- **Amber is a mark, not a message.** It appears as the flag dot, the "Flagged" label, and the timer warning. It never fills a large surface except the save banner.
- **Brick is failure only.** Never use it for unanswered or for destructive confirmation.
- **No colour alone carries meaning.** Every state also has a shape, a weight, a rule, or a word (§8.4).

---

## 4. Space, grid, and elevation

### 4.1 Spacing scale

4-based: `4, 8, 10, 12, 14, 16, 20, 24, 26, 32, 34, 40, 44, 48, 56, 64, 72, 104`.

### 4.2 Desktop (≥ 1200)

```
┌──────────────────────────────────────────────────────────────────────┐
│ 68  header: [C] CCF NIFES │ CHE 101  Chemistry 101 …   Saved 24:55 ▦ ☾ [Submit exam] │
│ 2   progress: 8.33% answered                                          │
├──────────────────────────────────────────────────────────────────────┤
│ 44                                                                    │
│ 104  ┌─ folio ─┐   660 measure                        48   292       │
│      │   06    │   Atomic structure ──────────  ⚑ Flagged             │
│      │  OF 60  │   Which ion is isoelectronic with neon?             │
│      │         │   ─────────────────────────────────────             │
│      │         │   A   K⁺                                       ○     │
│      │         │   ─────────────────────────────────────             │
│      │         │   B   Cl⁻                                      ○     │
│      │         │   ─────────────────────────────────────             │
│      │         │   C   Na⁺                                      ●     │
│      │         │   ─────────────────────────────────────             │
│      │         │   D   Ar                                       ○     │
│      │         │   ─────────────────────────────────────             │
│      │         │                                                      │
├──────┴─────────┴──────────────────────────────────────────────────────┤
│ 72  Clear answer                          [ ‹ Previous ] [ Next › ]    │
└──────────────────────────────────────────────────────────────────────┘
```

- Shell: `max-width: 1360`, padding `44 40 0`, grid `104 / minmax(0,1fr) / 292`, column-gap `48`.
- Answer measure: `660`. The meta row, stem, options, and answer bar all respect it.
- The answer bar's inner grid repeats the shell grid, so Previous/Next end exactly at the option rule and "Clear answer" starts at the measure's left edge.
- 921–1199: grid `88 / 1fr / 240`, gap `40`, padding `40`; rail index drops to 6 × 30 px columns; answer measure `600`.

### 4.3 Tablet (561–920)

- No rail. Grid `88 / minmax(0,1fr)`, gap `32`, padding `48 40 0`.
- The folio remains in the margin; the map lives behind the header's labelled **Map** button.
- Answer bar repeats the same two columns.

### 4.4 Mobile (≤ 560)

- Header 58, padding `0 16`; shell padding `26 16 0`.
- Folio stacks above the question: 40 px numeral, `OF 60`, a short rule, then the topic row.
- Answer bar 68 plus `env(safe-area-inset-bottom)`; Previous and Next split the width.
- Content receives 96 px of bottom padding so nothing hides behind the bar.

### 4.5 Radius and borders

| Token | Value |
|---|---|
| `radius.0` | 0 — every panel, button, row, dialog, receipt |
| `radius.2` | 2 px — map sheet top corners only |
| `radius.full` | 50% — radio dot, flag dot, save dot only |
| `border.hairline` | 1 px `rule` |
| `border.control` | 1 px `rule-strong` |
| `border.selected` | 2 px inset `accent` (left edge of a selected row) |
| `border.focus` | 2 px `accent`, 2 px offset |

There are no 4 px or 6 px corners. Sharp is the point: it reads as printed, not as an app card.

### 4.6 Elevation

Only overlays lift. Everything else is separated by hairlines and space.

| Token | Value | Use |
|---|---|---|
| `shadow.dialog` | `0 32px 80px rgba(12,15,13,.22)` | Submit dialog |
| `shadow.sheet` | `0 -24px 64px rgba(12,15,13,.24)` | Mobile map sheet |
| No other shadow | — | Rows, buttons, receipts, rail |

---

## 5. Components

### 5.1 Exam bar

| Property | Desktop / tablet | Mobile |
|---|---|---|
| Height | 68 | 58 |
| Inner max width | 1360 | 100% |
| Horizontal padding | 40 | 16 |
| Background | `sheet` | same |
| Border bottom | 1 px `rule` (full-bleed) | same |
| Position | sticky, top 0, z 20 | same |

**Left cluster:** monogram 28 × 28, 0 radius, `ink` fill, "C" in Crimson Pro 600 15 px, `sheet` text. 12 px gap, wordmark 14 / 20 sans 700, 0.02em. 16 px gap, 1 px × 18 px `rule` divider, 16 px gap, course code 11 px mono 500, 0.10em, `muted`, then course title 14 px `muted`.

- Below 1200 px the theme toggle is dropped.
- Below 1100 px the course title is dropped.
- Below 561 px the wordmark, divider, and save status are dropped; monogram, code, timer, map, submit remain. The code gains a 12 px left margin.
- Below 380 px the course code is dropped; monogram, timer, map, submit remain.

**Right cluster:** save status (≥ 561), 18 px gap, timer, 18 px gap, map button, theme button (≥ 1200), 4 px gap, submit.

- Save status: 5 px accent dot + `Saved 14:12` in 11 px mono `muted`. Reserved width 132 px.
- Map button: 44 × 44, ghost, 18 px icon, no border. From 561–1199 it is a labelled button (`icon + "Map"`, 44 high, padding 0 12) to advertise the sheet.
- Theme button: 44 × 44, moon in light, sun in dark. Accessible name only.
- Submit: 40 high (36 on mobile), padding 0 16, 1 px `rule-strong`, transparent, 13 px sans 700. Hover `sheet-2`. Never filled, never disabled.

### 5.2 Progress rule

- 2 px tall, full-bleed, directly under the header. Track `rule`; fill `accent`, width = answered / total.
- 240 ms width transition; removed under reduced motion.
- It reports **answered**, not position, and never becomes the only progress indicator: the map header and counts repeat it.
- Accessible name: "5 of 60 questions answered". `role="progressbar"` with `aria-valuenow/max`; the value is never a score.

### 5.3 Folio

The marginal number is the screen's signature element and its position indicator.

- Numeral 58 / 56 Crimson Pro, `ink`, `−0.03em`, tabular.
- Below: `OF 60` in 10 px mono 500, 0.14em, `muted`, 12 px below the numeral.
- Below: a 24 × 1 px `rule-strong` line, 14 px further down. It anchors the column and is purely structural.
- Numbers are zero-padded to the paper length: `06`, `60`. For a 100-question paper, the numeral is 3 digits and the column widens to 120 px.
- Mobile: 40 px numeral, `OF 60` 8 px below, 18 px rule 10 px below. The folio stacks above the question.
- The folio is `aria-hidden`. The screen reader gets the position from the live region and the map, never from a decorative numeral.

### 5.4 Topic and flag

- Row min-height 44, width 660, `space-between`.
- Left: topic in 13 px sans `muted` (max 28 characters, ellipsis only as a last resort), then a 1 px `rule` line up to 120 px long. The line is a separator, not a fill.
- Right: flag control — 17 px outline flag, 8 px gap, "Flag for review" in 13 px sans `muted`. Entire control 44 px tall.
- Flagged: flag fills `amber`, label reads "Flagged" in `amber`.
- Hover: label goes `ink`. Focus: 2 px accent ring, 2 px offset.
- The flag is independent of the answer and survives clearing it.
- Accessible name toggles: "Flag question for review" / "Question flagged. Remove flag".

### 5.5 Question stem

- `display.stem` (27 / 38) at ≥ 561, `display.stem-sm` (22 / 32) below.
- `ink`, 660 measure, 10 px below the topic row.
- Long stems scroll as one block with the page. No inner scroll, no collapse, no "read more".
- Tables, formulas, and figures sit inside the same measure and keep the 34 px gap before the options.
- No question number inside the stem; the folio carries it.

### 5.6 Option row

The most important component on the screen. In v2 it is a **ruled row**, not a card.

| Property | Desktop / tablet | Mobile |
|---|---|---|
| List border | 1 px `rule` top and bottom | same |
| Row divider | 1 px `rule` between rows | same |
| Min height | 62 | 56 |
| Padding | 17 × 14 | 15 × 10 |
| Grid | `30 / 1fr / 14`, gap 16 | `26 / 1fr / 12`, gap 12 |
| Radius | 0 | 0 |
| Background rest | transparent | same |
| Background hover | `sheet-2` | none |
| Text | 17 / 26 `body.option` | 16 / 24 `body.option-sm` |
| Letter | 13 px mono 500, `muted` | same |
| Trailing mark | 9 px circle, 1 px `rule-strong` | same |
| Full row is the target | yes | yes |

**Selected:**
- Background `accent-tint`, spanning the full row.
- 2 px `accent` bar inset on the left edge.
- Letter becomes `accent` at 500.
- Trailing mark fills `accent` and loses its ring.
- Text weight does **not** change; weight shifts reflow and make the row jump.
- No "Selected" word: the filled mark, the bar, and the tint are the state. Screen readers hear `aria-checked="true"`.

**Other states:**
- Hover: `sheet-2`, no border change, no lift.
- Pressed: `sheet-2`, no transform.
- Focus-visible: 2 px `accent` ring, inset −4 px so the ring is not clipped by the list rules.
- Locked after submission: 60% opacity, pointer events off.
- Long option (> 2 lines): `.opt.long` switches to top alignment; letter and mark sit 4 px below the first line's cap; the mark stays at the trailing edge.
- Selected + flagged is allowed; the flag never changes the row.

**Semantics:** `role="radiogroup"` with `role="radio"` children. One tab stop for the group; `A`–`F` selects, `Enter`/`Space` commits the focused row. Arrow keys do not change a committed answer — the deliberate exam trade-off from the blueprint.

### 5.7 Answer bar

The bar is the one persistent control surface. It replaces the in-flow footer and the mobile-only nav bar of v1.0.

| Property | Desktop / tablet | Mobile |
|---|---|---|
| Height | 72 | 68 + safe area |
| Background | `sheet` | same |
| Border top | 1 px `rule` | same |
| Position | fixed, bottom 0, z 4 | same |
| Inner grid | 104 / 1fr / 292, gap 48 | flex, padding 0 16 |
| Clear | left, at the measure's left edge | above the bar, in the column |
| Previous | ghost, 44 high, 1 px `rule-strong` | flex 1 |
| Next | ink fill, sheet text, 44 high | flex 1.4 |

- On desktop and tablet the bar's inner grid repeats the shell, so "Clear answer" aligns under the option letter and Next ends under the option mark.
- Previous is 1 px `rule-strong`, transparent, `ink`. Hover `sheet-2`.
- Next is `ink` fill with `sheet` text — the single filled button in the viewport. In dark mode it inverts: `ink` (light) fill, `#121514` text.
- On mobile the bar holds only Previous and Next, splitting the width; "Clear answer" is a 44 px underlined text button directly under the options, within thumb reach of the last row.
- The bar never hides a focused control; content padding-bottom is 104 px (96 + safe-area inset on mobile).
- Last question: Next becomes **Review answers** and opens the map sheet (mobile) or moves focus to the rail's current cell (desktop). It never submits.

### 5.8 Question map (rail)

**The index is typographic: no cells, no borders, no fills.**

| Property | Value |
|---|---|
| Width | 292 (≥ 1200), 240 (921–1199) |
| Padding left | 40 (≥ 1200), 32 (921–1199) |
| Left border | 1 px `rule`, full height of the shell |
| Position | sticky, top 100 |
| Grid | 6 columns, 34 px rows, no gap |
| Number | 12 px mono 400, tabular, `01`–`60` |
| Hover | number goes `ink` |
| Focus-visible | 2 px `accent` outline, inset −4 |

**Cell states:**

| State | Mark |
|---|---|
| Unanswered | `muted` number, no mark |
| Answered | `accent` number + 2 px `accent` underline, 12 px inset from the number's right |
| Current | `ink` number at 500 + 2 px `ink` bar on the cell's left edge |
| Flagged | 5 px `amber` dot at the top-right; independent of answered |
| Current + answered | Both the underline and the side bar |
| Current + flagged | Side bar + dot |

No filled rectangles, no boxes around numbers, no pills. The three marks — underline, side bar, dot — are distinguishable in greyscale and by shape.

**Header:** `QUESTION MAP` in 10 px mono 500, 0.14em, `muted`; `5 / 60` in 12 px mono `ink` at the right. 12 px gap, 1 px `rule`.

**Legend:** 2 × 2, 12 px sans, 7 px row gap. Swatches reproduce the marks exactly: a 12 px underline for answered, a hairline for unanswered, a vertical bar for current, a dot for flagged. Labels are always present.

**Counts:** three rows, 34 px, 1 px `rule` between. Label 13 px `muted`; value 12 px mono `ink`, zero-padded (`05`, `55`, `02`). No percentage.

**Footnote:** "Answers save as you go. Refreshing returns you to the clock, still running." 12 / 17 `muted`, 30 ch measure, 20 px below the counts.

**Submit is not duplicated in the rail.**

### 5.9 Question map sheet (≤ 920)

- Mobile: bottom sheet, full width, `raised`, 1 px `rule-strong` top, 2 px top radius, padding `10 20 24` plus safe area, `shadow.sheet`. A 36 × 3 `rule-strong` grab handle is centred 14 px above the title.
- Tablet: the same sheet constrained to 560 px and centred.
- Header: `EXAM NAVIGATION` eyebrow; "Question map" in `title.sheet`; count `5 / 60 answered` in 12 px mono at the baseline right.
- Index: 5 columns on mobile, 7 on tablet; 44 px rows; numbers 13 px mono; row hairlines `rule`. The same state marks as the rail.
- Legend: identical to the rail, 2 × 2, 16 px gap.
- **Submit exam**: full width, 48 px, ink fill, sheet text. It is last in the tab order, never first.
- Backdrop `rgba(12,15,13,.44)`; 180 ms fade + 8 px rise (removed under reduced motion).
- Traps focus, closes on Escape and backdrop, returns focus to the Map button. Choosing a question closes the sheet and focuses the stem.

### 5.10 Submit control

- Lives in the exam bar at every width.
- 40 px tall (36 on mobile), transparent, 1 px `rule-strong`, 13 px sans 700, label "Submit exam" / "Submit".
- **It never fills.** The filled button is the forward action; making submit filled would put two competing primaries in view. Completion is signalled by the counts and the dialog, not by colour.
- Hover `sheet-2`; focus 2 px accent ring.
- It never disables. It opens the review dialog and never submits directly.

### 5.11 Timer

| State | Text | Colour | Extra |
|---|---|---|---|
| Normal | `24:55` | `ink` | Label `REMAINING` in 10 px mono 500, 0.12em, `muted`, below |
| Warning (≤ 5:00) | `04:59` | `amber` | 6 px amber dot 8 px left of the digits; label "5 min remaining" |
| Critical (≤ 1:00) | `00:59` | `amber` | Dot pulses 2 s, 1 → 0.45; label "1 min remaining" |
| Expired | `00:00` | `amber` | "Time expired"; exam locks, receipt replaces it |

- 21 / 24 mono 500, tabular, fixed min-width 66 px so the header never moves.
- Mobile: 18 / 22, label hidden; the digits keep an accessible name that states the remaining time.
- No animated digits, no flashing, no sound. The pulse is on the dot only.
- Reduced motion: the dot is solid amber.
- Announce at 5:00 and 1:00 only, never every second.

### 5.12 Save status and banner

**Save status** (bar, left of the timer):
- `<dot> Saved 14:12` — 11 px mono `muted`, 5 px `accent` dot.
- "Saving…" replaces "Saved 14:12" in place; width is reserved (132 px) so nothing shifts.
- Failure: "Not saved" in `brick`, dot `brick`, and the banner appears.

**Banner** (full width under the header, pushes content):
- Min height 40, `amber-tint` fill, 1 px bottom `amber` at 40% opacity, 13 px `ink` text.
- 16 px alert icon, 8 px gap, message, 16 px gap, "Retry" as an underlined text button.
- Messages: "Answers are not saving. Retry." and "You are offline. Answers are queued and will sync."
- Persistent, dismissible only by resolution. Never a toast, never blocking.

### 5.13 Submit dialog

- 500 wide, `raised`, 1 px `rule-strong`, 0 radius, padding `34 36 30`, `shadow.dialog`.
- 3 px `accent` rule across the top edge, inset 0.
- Title: `title.dialog` (25 / 32), `ink`.
- Lead: 15 / 23 `muted`, 10 px below: "19 questions are unanswered. They score zero."
- Tally: 22 px below, three rows 42 px, 1 px `rule` between. Label 13 px `muted`; value 14 px mono 500 `ink`, tabular, zero-padded.
  - Answered · Unanswered · Flagged for review
- Note: "Once submitted, the exam cannot be reopened." 13 / 20 `muted`, 16 px below.
- Actions: 26 px below, right-aligned, 10 px gap.
  - "Keep working": ghost 44, 1 px `rule-strong`.
  - "Submit anyway" / "Submit exam": ink fill, 44, sheet text.
- Mobile: actions stack full width, secondary first.
- No close X. Escape and backdrop dismiss; at expiry both are blocked and the receipt replaces the dialog.
- Initial focus lands on "Keep working", not the destructive action. Focus is trapped.

### 5.14 Submission receipt

The receipt confirms; it does not evaluate.

| Property | Desktop | Mobile |
|---|---|---|
| Width | 620 | 100% − 40 |
| Surface | `raised` | same |
| Border | 1 px `rule-strong` | same |
| Radius | 0 | 0 |
| Padding | 44 48 36 | 28 24 |
| Alignment | left | left |

**Anatomy, top to bottom:**

1. **Brand row** — 24 px monogram + "CCF NIFES" 12 px sans 700, 26 px above the eyebrow.
2. **Accent rule** — 36 × 2 px `accent` on the top edge, inset 48 px from the left. The only decorative mark on the screen.
3. **Eyebrow** — `CHE 101 · SUBMISSION COMPLETE` in 10 px mono 500, 0.14em, `muted`.
4. **Title** — "Exam submitted" in `display.receipt` (36 / 44), 12 px below.
5. **Sub** — "Your answers are recorded. Results are issued as PDFs and are never shown on screen." 15 / 23 `muted`, 46 ch.
6. **Metadata list** — 26 px below, four rows, 44 px each, 1 px `rule` between:
   - Submitted — "14:32 · 12 Nov 2026"
   - Answered — "60 of 60" (mono)
   - Reference — "CH101-8F3K2" (mono, 0.02em)
   - Candidate — "NIF/CHE/20481" (mono)
   Label 10 px mono 500, 0.14em, uppercase, `muted`; value 15 px sans `ink`, right-aligned, mono where noted.
7. **Handoff copy** — "Two documents are available to download." 14 / 22 `muted`, 22 px below.
8. **Artifact list** — two rows, 76 px, 1 px `rule` between, no cards, no fills. Left: document name 14 px sans 700; meta 11 px mono `muted` 4 px below. Right: a 40 px download button.
   - **Official Examination Record** — ink fill, sheet text. Meta: "1 page · PDF".
   - **Detailed Review** — outline `rule-strong`, `ink` text. Meta: "18 pages · PDF · includes answer key". Never looks like the default action.
   - Mobile: rows stack, the button goes full width, 44 high.
9. **Re-download note** — 16 px below, 12 / 18 `muted`, 46 ch.
10. **Close** — 22 px below, 44 px target, 13 px `muted`, underlined (`rule-strong`), offset 3. Returns to the course hub.

**Hard rule:** no score, percentage, grade, pass/fail, correct answer, topic breakdown, chart, ring, badge, or "View answers". The payload does not carry them.

### 5.15 Artifact rows and PDF states

Each document is its own row with its own state. One failing never disables the other.

| State | Row control | Note |
|---|---|---|
| Preparing | Disabled: `sheet-2` fill, `muted` text, no border; label "Preparing…" | 2 px indeterminate rule under the row: `rule` track, 30% accent segment, 1.6 s linear loop; static 50% under reduced motion |
| Ready | Official: ink fill. Review: outline. | "1 page · PDF" / "18 pages · PDF" |
| Downloaded | Control unchanged, label "Download again" | "Downloaded 14:33" in `muted` |
| Failed | Outline "Retry" in `brick`, 1 px brick border | "We could not prepare this file." in `brick`; optional "Email it to me" text link when an address is on file |
| Pending sync | Disabled as preparing | "Submitted. Waiting to confirm." in `amber`; no spinner |
| Download blocked | Control unchanged | "Your browser blocked the download. Allow downloads for this site and retry." in `brick` |

- Forced download. No inline viewer, preview, new tab, thumbnail, or ZIP.
- File names: `CHE101-mid-semester-official-record-CH101-8F3K2.pdf` and `CHE101-mid-semester-review-CH101-8F3K2.pdf`. No outcome in either name.
- Each control is a real download link whose accessible name includes the document, format, and size.
- Progress and failure are announced politely; failure moves focus to that row's message.
- The documents are specified in `03-result-pdf-spec.md`; §8.6 states the shared accessibility floor.

### 5.16 Focus

- 2 px `accent`, 2 px offset, 0 radius. On list rows and index cells the ring is inset (−4 px) so it is never clipped.
- Dark mode uses `#86C6AA`, ratio 8.8:1 on the sheet.
- Forced colours: `Highlight`, 2 px, still visible.
- Never removed, never replaced by colour alone, never hidden behind the answer bar.
- Skip link on focus: 44 px tall, `sheet`, 1 px `accent`, 13 px "Skip to question".

### 5.17 Non-exam states

**Question loading:** centred mono "Loading question…" 13 px `muted`, min-height 320, 2 px indeterminate accent rule at the top of the question column. No skeletons, no shimmer.

**Question failed:** 20 px alert icon `brick`, "This question could not load." in `title.state`, "Your timer is still running." 15 px `muted`, 16 px gap, outline Retry. If the paper allows skipping, a secondary "Skip question" text button follows. The column keeps its height.

**Session conflict:** centred column max 480, 36 × 2 accent rule, serif title "This exam was submitted in another tab.", "Open the receipt to download your results." 16 px, ink "View receipt" button. No exam content behind it.

---

## 6. State matrix

### 6.1 Exam controls

| State | Option row | Index mark | Answer bar | Submit | Timer |
|---|---|---|---|---|---|
| Default | Ruled row, transparent | Muted number | Previous ghost, Next ink | Outline | Ink, normal |
| Hover | `sheet-2` | Number `ink` | `sheet-2` | `sheet-2` | — |
| Focus-visible | 2 px accent ring, inset | 2 px accent ring, inset | 2 px accent ring | 2 px accent ring | — |
| Pressed | `sheet-2`, no transform | `sheet-2` | `sheet-2` | one step darker | — |
| Selected | Accent tint + 2 px left bar + filled dot + accent letter | — | — | — | — |
| Answered | — | Accent + 2 px underline | — | — | — |
| Current | — | Ink 500 + 2 px left bar | — | — | — |
| Flagged | — | 5 px amber dot | — | — | — |
| Disabled | 60% opacity, no pointer | — | Previous 40% at ends | Never disabled | — |
| Warning | — | — | — | — | Amber + dot + label |
| Critical | — | — | — | — | Amber + pulsing dot |
| Expired | 60% opacity, locked | Locked | Locked | Replaced by receipt | `00:00`, "Time expired" |

### 6.2 Receipt and result rows

| State | Receipt | Official row | Review row | Note |
|---|---|---|---|---|
| Preparing | Visible | Disabled | Disabled | Indeterminate rule under each row |
| One ready | Visible | Enabled (ink) | Preparing | Rows are independent |
| Ready | Visible | Enabled (ink) | Enabled (outline) | "1 page" / "18 pages" |
| Downloaded | Visible | "Download again" | "Download again" | "Downloaded 14:33" |
| Failed | Visible | "Retry" outline, brick | Unaffected | Email fallback per file |
| Pending sync | Visible | Disabled | Disabled | Amber "Waiting to confirm." |
| Time expired | Title unchanged, row reads "Submitted — time expired" | Same states | Same states | No score on screen |

---

## 7. Responsive rules

| Width | Changes |
|---|---|
| ≥ 1200 | 292 rail, gap 48, folio 58, full course title, theme toggle |
| 921–1199 | 240 rail, gap 40, padding 40, measure 600, theme toggle hidden |
| 561–920 | Rail removed → labelled Map button + sheet; grid 88 / 1fr, gap 32, padding 40; theme hidden |
| 381–560 | 16 px gutters; folio stacks at 40 px; bottom bar 68; timer label hidden; submit reads "Submit"; stem 22 |
| ≤ 380 | Course code hidden; 16 px gutters; option text 15 / 23; folio 36 |

- **No horizontal scroll at any width**, including 320 px with a 6-option question and a 28-character topic.
- **Touch targets ≥ 44 × 44.** Option rows are 56 tall on mobile; index cells are 44 tall in the sheet.
- **Sticky elements:** header (all), answer bar (all), rail (≥ 921). Never more than two over the content at once.
- **Content padding-bottom** clears the answer bar plus the safe area: 104 px desktop and tablet, 96 px + inset on mobile.
- **200% zoom** must behave like the 561–920 layout, not overflow.
- **Landscape phones** (height ≤ 420) keep the header and bar; the folio stacks; the map sheet scrolls internally.
- **A 100-question paper** widens the folio column to 120 and the index to 7 columns; nothing else changes.

---

## 8. Accessibility

### 8.1 Contrast

Every text pair meets 4.5:1 and every control boundary 3:1 (§3.3). Decorative hairlines (`rule`) are exempt and never carry meaning alone.

### 8.2 Focus and order

- Visible 2 px accent ring on every interactive element.
- Tab order: skip link → exam bar → topic → flag → options → clear → previous/next → map index → answer bar.
- Dialogs and sheets trap focus and restore it to the trigger.
- Sticky elements must not cover a focused control; `scroll-padding` 100 px top and 110 px bottom.
- The answer bar's Next is reachable without tabbing through 60 index cells: the index is a single composite with roving tabindex.

### 8.3 Screen reader

- Question change announced: "Question 12 of 60, Acids and bases."
- Option selection through radio semantics: "C, Na⁺, selected, 3 of 4." The trailing dot is `aria-hidden`.
- Flag toggle announced as a state change.
- Timer never announced per second; warnings at 5:00 and 1:00.
- Index cells: "Question 12, answered, flagged, current."
- Save failure and submission result are `role="status"`.
- Receipt announced once: "Exam submitted. Your results are available as PDFs."

### 8.4 Non-colour signalling

| State | Colour | Additional signal |
|---|---|---|
| Selected answer | Accent tint | 2 px left bar + filled trailing dot + accent letter |
| Answered index | Accent | Underline under the number |
| Current index | Ink | 2 px left bar + weight 500 |
| Flagged | Amber | Dot + "Flagged" word |
| Timer warning | Amber | Text label "5 min remaining" |
| Failure | Brick | Alert icon + explicit message |
| Disabled | — | 40–60% opacity + `aria-disabled` |

Every one of these survives greyscale.

### 8.5 Motion, zoom, forced colours

- Reduced motion removes the 240 ms progress transition, the 120 ms row hover, the 180 ms sheet rise, the timer pulse, and the indeterminate rule.
- 200% zoom and 400% reflow must not clip the stem, options, dialog actions, or receipt rows.
- Forced colours: `Canvas` / `CanvasText`, 1 px borders kept, focus `Highlight`, the flag dot becomes a text marker.
- Fully operable by keyboard alone.

### 8.6 The result PDFs

- Tagged PDF with title, language, and logical reading order.
- Real text, never images of text. Embedded fonts. 10 pt body on A4, 1.5 line height.
- Headings in order; tables have header cells; no colour-only meaning.
- Usable with a screen reader without the app; readable in greyscale.
- The detailed review is marked personal on every page and contains the key; the official record does not.
- The app never renders either file. It only hands them over.

---

## 9. Content styling

### 9.1 Chemistry notation

- Real Unicode or MathML: `K⁺`, `Cl⁻`, `CO₃²⁻`, `H₂O`, `6.02 × 10²³ mol⁻¹`.
- Superscripts and subscripts never clip; minimum 1.55 line height in stems and options.
- Units use a non-breaking space: `24.5 g`, `0.10 mol dm⁻³`.
- Arrows and equilibrium signs (`→`, `⇌`) come from the serif fallback, not a glyph that breaks the line.
- Display equations sit on their own line, left-aligned, 1.6 line height, never horizontally scrolled. Wrap at operators.
- Never use an image for a formula. A diagram needs alt text that states the relationship.
- Tables in a stem: max 4 columns, 13 px, 1 px header rule, no zebra striping.

### 9.2 Numbers and time

- Timer `mm:ss`, zero-padded, mono, tabular: `09:05`, never `9:5`.
- Counts in prose: "5 of 60 answered"; in the rail header: `5 / 60`; in the counts and index: zero-padded `05`.
- Reference: uppercase mono, hyphenated, no spaces: `CH101-8F3K2`.
- No percentages anywhere on the exam screen or receipt.
- Never abbreviate "questions" to "Qs" in body copy.

### 9.3 Truncation

- Stems and options never truncate.
- Course title truncates at 40 ch; topic at 28 ch.
- Reference never truncates; it wraps if it must.
- Buttons never wrap; labels are short at every breakpoint.

### 9.4 Tone in type

- Labels are sentence case except the mono eyebrows.
- No exclamation marks, no encouragement, no "Good luck".
- The interface speaks in statements: "Answers save as you go." Not "Don't worry!"

---

## 10. Guardrails

These are failures, not preferences.

1. **No score, percentage, grade, pass/fail, or correctness anywhere.** Not in the receipt, not in a tooltip, not in the DOM.
2. **No checkmarks on selected answers.** A check reads as "correct". The selected mark is a filled dot.
3. **No red for unanswered questions.** Red means failure only.
4. **No disabled submit.** It always opens the review dialog.
5. **No auto-advance on selection.**
6. **No second filled button in view at rest.** Next is the only filled action; Submit stays outlined.
7. **No gradients, glass, blur, glow, or decorative shadows.** Only overlays lift.
8. **No card, box, or fill around the question or the option rows.** Hairlines and space do the work.
9. **No boxes around index numbers.** The index is type, not a grid of buttons.
10. **No radius above 2 px** except the radio dot, flag dot, and save dot.
11. **No icon-only control without an accessible name.**
12. **No uppercase body text, no synthetic bold, no sans weight 500** (Atkinson has none).
13. **No toast for autosave.** It is an ambient label, not a notification.
14. **No inline PDF preview, embed, or new tab.**
15. **No celebratory state after submission.** Confirmation, not congratulation.
16. **No pure black or pure white surfaces.**
17. **Accent never fills a primary button.** Pine marks state; ink marks action.

---

## 11. QA checklist

**Layout**
- [ ] No horizontal scroll at 320, 360, 390, 560, 768, 920, 1024, 1280, 1920.
- [ ] Folio, topic, stem, options, flag, and Next share the 660 measure at ≥ 921.
- [ ] Header monogram aligns to the folio's left edge.
- [ ] Six-option question and 28-character topic fit without collision.
- [ ] Long stem scrolls as one block; no inner scrollbar.
- [ ] Answer bar clears content and the safe area; no focus is ever behind it.

**Type**
- [ ] Atkinson never renders at a requested 500.
- [ ] Timer width is stable from 59:59 to 00:00.
- [ ] Superscripts and subscripts never clip.
- [ ] Serif never appears below 22 px.
- [ ] Two weights per block, maximum.

**Colour**
- [ ] Every pair in §3.3 passes at its size.
- [ ] Selected, answered, current, and flagged are distinguishable in greyscale.
- [ ] Accent appears only on state and focus; no accent-filled primary button.
- [ ] Dark mode passes every pair, including the inverted Next button.

**Interaction**
- [ ] Focus ring visible on every control, never clipped by a rule.
- [ ] Keyboard-only run: skip link to receipt download.
- [ ] `A`–`F` selects; arrows never change a committed answer.
- [ ] Escape closes dialog and sheet; focus returns.
- [ ] Last question shows "Review answers", not a dead end.
- [ ] Flag survives clearing an answer.

**Receipt**
- [ ] No score, grade, or correctness in the UI or payload.
- [ ] Two downloads, two files, no ZIP, no preview, no embed, no new tab.
- [ ] Preparing, ready, downloaded, failed, and pending sync render independently per file.
- [ ] One file failing never disables the other.
- [ ] Both filenames contain no outcome.
- [ ] Focus moves to the receipt title; both rows are reachable by Tab; status is announced.

**Accessibility**
- [ ] 200% zoom and 400% reflow preserve function.
- [ ] Reduced motion stops the pulse, the sheet rise, and the indeterminate rule.
- [ ] Forced colours keeps borders and focus visible.
- [ ] Screen reader announces question, selection, flag, warnings, and submission.
- [ ] Both PDFs are tagged, titled, language-declared, and readable without the app.
- [ ] The detailed review is marked personal on every page.

---

## 12. Handoff

This document is the visual contract for the exam shell and receipt. It introduces no flows: every component maps to a section in `01-ux-blueprint.md`, and the documents themselves are specified in `03-result-pdf-spec.md`.

`ui/mockups.html` implements this system in seven artboards — desktop light, desktop dark, tablet 834, mobile 390, submit dialog, mobile map sheet, submission receipt — and `ui/shots/` holds 2× captures of each. `05-engineering-redline.md` carries the same tokens as code-ready tables; if the two disagree, this document wins for visual intent and the redline wins for exact pixel values.

**Still open from the blueprint:** sections, additional question types, flag visibility in the PDFs, the grade scale, and the email fallback. None blocks the exam shell. Multi-section would add grouping to the index; multi-select would change the option row's trailing mark from a dot to a square.

**The document set is complete:**

1. `01-ux-blueprint.md` — flows, copy, states.
2. `02-visual-ui-spec.md` — this visual contract.
3. `03-result-pdf-spec.md` — the two documents.
4. `04-platform-component-inventory.md` — the surrounding platform.
5. `05-engineering-redline.md` — exact measurements and tokens.
6. `06-question-bank-and-randomisation.md` — seed, shuffle, and replay.

**Remaining work is implementation, not design:** build the shell to `05`, render the two PDFs to `03`, and run the bank's 18 `typeset_required` equations through the chemistry renderer before the first live paper.
