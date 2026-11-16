# Platform Component Inventory

**Project:** Chemistry 101
**Brand:** CCF NIFES
**Companions:** `01-ux-blueprint.md`, `02-visual-ui-spec.md`, `03-result-pdf-spec.md`
**Scope:** The reusable components the CBT platform needs beyond the exam screen — course hub, exam entry, result archive, and administration. Design only.
**Status:** v2.0 — synced to the "Registry" visual system. Components marked **provisional** have no confirmed screen yet and should not be built until one exists.

---

## 1. Purpose

The exam screen is not a one-off. It establishes a visual language — one warm sheet, near-black ink, hairline structure, pine used only for state and focus, ink used for action, mono numerals — and the rest of the platform must inherit it without inventing a second one.

This document does three things:

1. **Locks** the components already specified for the exam screen. They are not re-opened here.
2. **Specifies** the components the surrounding platform needs, with anatomy, sizes, and states.
3. **Refuses** the components that have no confirmed use yet. A component library built ahead of screens becomes speculative weight.

The platform surfaces assumed here:

| Surface | What it needs |
|---|---|
| Course hub | Course list, exam list, status, result archive |
| Exam entry | Instructions, eligibility, start confirmation |
| Result archive | Past exams, download rows, verification reference |
| Administration | Exam list, question authoring shell, scheduling, publish, candidate results |
| Account | Profile, session, theme preference |

---

## 2. Inheritance rules

Every component below obeys the exam screen's rules. If a component needs to break one, the rule is wrong, not the component — propose the change explicitly.

1. **Hairlines, not shadows.** Shadows exist for overlays only.
2. **Pine is state; ink is action.** Pine marks selected, current, answered, and focus. It never fills a primary button and never decorates a heading, icon, or card edge. The forward action is ink-filled.
3. **No gradients, glass, blur, or glow.**
4. **No pill shapes.** Radius 0 on every platform panel, button, row, input, and dialog; 2 px only on a sheet's top corners; full circles only for dots and avatars. Status badges are rectangles.
5. **No pure black or white surfaces.** Sheet and ink are warm in light, warm-grey in dark.
6. **Two weights per block.** 400 for content, 700 for emphasis. Atkinson Hyperlegible has no 500 — never request it, never synthesise bold. Crimson Pro may use 400/500/600.
7. **Mono for every number that can change.** Timer, counts, references, table numerics.
8. **Every state is designed.** Rest, hover, focus-visible, pressed, selected, disabled, loading, error. A component without all eight is not finished.
9. **No icon without a name.** Icon-only controls carry an accessible name and a tooltip.
10. **No new colour.** If a state cannot be expressed with the existing tokens, the state is probably doing too much.

---

## 3. Token additions

Everything in `02-visual-ui-spec.md` applies. The platform needs five semantic additions.

### 3.1 Surfaces and lines

| Token | Light | Dark | Use |
|---|---|---|---|
| `surface.sunken` | `#F3F1EA` | `#191D1B` | Table headers, input wells, disabled fills |
| `surface.overlay` | `rgba(12,15,13,0.44)` | `rgba(0,0,0,0.56)` | Dialog and sheet backdrop |
| `line.hairline-strong` | `#918C80` | `#5E665F` | Emphasised dividers, control boundaries (3.2:1) |
| `line.control` | `#918C80` | `#5E665F` | Input, select, checkbox, and radio boundaries (3:1 minimum) |
| `state.disabled` | 40% opacity | 40% opacity | Applied to the whole control, not just text |
| `state.readonly` | `surface.sunken` | `surface.paper-2` | Read-only fields |

### 3.2 Status semantics

The platform needs more statuses than the exam screen. They all use the same four hues; only the label and tint change.

| Status | Text | Background | Border | Used for |
|---|---|---|---|---|
| `status.neutral` | `ink.muted` | `paper-2` | `hairline` | Draft, archived, not started |
| `status.info` | `accent.pine` | `pine-tint` | `pine` at 30% | Scheduled, ready |
| `status.live` | `accent.pine` | `pine-tint` | `pine` | Live now, published |
| `status.warning` | `signal.amber` | `amber-tint` | `amber-line` | Grading, pending sync, action needed |
| `status.danger` | `signal.brick` | `brick-tint` | `brick` at 30% | Failed, overdue, locked |

- No separate success green. Pine is the positive state colour; the label distinguishes "Live" from "Published" from "Ready".
- No status is colour-only. Every badge carries a word.
- Status is never a filled solid block except `status.live`, which may use a solid ink badge with sheet text when it appears in a table where scanning matters. Use that sparingly. Never a pine-filled badge — pine is a state tint, not a surface.

### 3.3 Control heights

| Size | Height | Use |
|---|---|---|
| `control.xs` | 28 | Table inline actions, pagination |
| `control.sm` | 32 | Dense admin toolbars |
| `control.md` | 40 | Default: buttons, inputs, selects |
| `control.lg` | 48 | Touch-first forms, primary page actions |
| `control.xl` | 52 | Reserved — not used by the exam receipt |

The exam bar's Submit is 40 px (36 px on mobile) and its answer bar is 44 px. Both are locked by `02-visual-ui-spec.md`. Do not generalise them.

---

## 4. Component index

| Component | Status | Surface | Spec |
|---|---|---|---|
| Exam bar, option row, map, timer, receipt, artifact row | **Locked** | Exam | `02` |
| Button — primary, secondary, ghost, destructive, link | Specified | All | §5.1 |
| Icon button | Specified | All | §5.2 |
| Text field, textarea, select, search | Specified | Forms, admin | §6.1–6.4 |
| Checkbox, radio, switch | Specified | Forms, settings | §6.5–6.7 |
| File upload | Specified | Admin | §6.8 |
| Form field wrapper, validation | Specified | Forms | §6.9 |
| App shell, sidebar, top bar | Specified | Platform | §7.1–7.2 |
| Tabs, breadcrumbs, pagination, stepper | Specified | Platform | §7.3–7.6 |
| Page header | Specified | All | §8.1 |
| Card | Specified | Hub, admin | §8.2 |
| List row | Specified | Hub, archive | §8.3 |
| Table | Specified | Admin, results | §8.4 |
| Definition list | Specified | Results, detail | §8.5 |
| Badge / status | Specified | All | §8.6 |
| Progress bar | Specified | Admin, grading | §8.7 |
| Avatar | Specified | Account, admin | §8.8 |
| Empty state | Specified | All | §8.9 |
| Banner | Specified (extends `02`) | All | §9.1 |
| Toast | Specified | Admin only | §9.2 |
| Tooltip | Provisional | All | §9.3 |
| Dialog, confirm dialog, sheet | Specified | All | §9.4–9.6 |
| Date picker | **Not specified** — use the native control | Forms | — |
| Rich text editor | **Out of scope** | Authoring | — |
| Charts and analytics | **Out of scope** | Admin | — |
| Command palette | **Not included** | — | — |
| Data grid with inline editing | **Not included** | — | — |

---

## 5. Actions

### 5.1 Button

**Anatomy:** label only; optional leading icon 18 px with 8 px gap; optional trailing icon. No icon-only buttons in this component (see §5.2).

| Variant | Rest | Hover | Pressed | Disabled |
|---|---|---|---|---|
| Primary | `ink.primary` fill, `surface.paper` text | 90% ink | one step darker | 40% opacity |
| Secondary | transparent, 1 px `line.hairline-strong`, `ink.primary` | `surface.paper-2` | `surface.sunken` | 40% opacity |
| Ghost | transparent, no border, `ink.muted` | `surface.paper-2`, `ink.primary` | `surface.sunken` | 40% opacity |
| Destructive | `signal.brick` fill, `surface.paper` text | darkened brick | darker still | 40% opacity |
| Link | `ink.primary` text, 1 px underline offset 3, underline `line.hairline-strong` | underline thickens to 2 px | — | 40% opacity |

**Sizes:**

| Size | Height | Padding X | Label | Gap |
|---|---|---|---|---|
| sm | 32 | 12 | 13 / 18, 700 | 6 |
| md | 40 | 16 | 13 / 18, 700 | 8 |
| lg | 48 | 24 | 15 / 20, 700 | 8 |

- Radius 0. No shadow. No transform on press; the background changes.
- Focus: 2 px `focus.ring`, 2 px offset.
- **One primary per view.** In a dialog, the confirming action is primary; everywhere else, the page's main action is.
- **Primary is ink, never pine.** Pine is reserved for selected, current, answered, and focus. A pine-filled button would make the accent compete with the action colour.
- **Destructive fill is reserved for confirmation dialogs.** A delete button in a table is a ghost icon or a text button, never a filled brick block.
- **Links are ink, not pine.** Underline carries the affordance; the accent stays on state.
- **Pending state:** label changes to a verb phrase ("Publishing…"), control disabled, width locked to prevent layout shift. Under 1 s, no spinner. Above 1 s, a 14 px, 1.5 px arc appears before the label. Under reduced motion, the arc becomes three static dots.
- **Success state:** do not turn the button green or into a checkmark. Close the dialog, update the row, and confirm with a toast.
- Labels are verb-first and sentence case: "Start exam", "Publish results", "Download". Never "OK", "Yes", "Submit" alone.

### 5.2 Icon button

- 44 × 44, radius 0, ghost by default.
- Icon 18 or 20, 1.5 px stroke, `ink.muted`; hover `ink.primary` + `paper-2`.
- Must have an accessible name; a tooltip is required when the icon is not universally understood.
- Never the only way to perform a destructive action.

---

## 6. Forms

### 6.1 Text field

| Property | Value |
|---|---|
| Height | 40 (md), 48 (lg on touch) |
| Padding | 10 × 12 |
| Border | 1 px `line.control` |
| Radius | 0 |
| Background | `surface.paper` |
| Text | 15 / 22 `ink.primary` |
| Placeholder | `ink.muted`, never the only label |
| Focus | 2 px accent ring, 2 px offset; border becomes `accent.pine` |
| Error | 1 px `signal.brick` border + 16 px alert icon inside the right edge |
| Disabled | 40% opacity, `surface.sunken` |
| Read-only | `surface.sunken`, full-opacity text, no focus ring |

- Labels sit above the field, never inside as the only label.
- No floating labels.
- Max width 560 in a form; a field wider than its likely content looks unfinished.
- Inputs never resize the layout when an error appears; the message occupies reserved space.

### 6.2 Textarea

- Same border, radius, and type as the text field.
- Minimum height 96; resize vertical only; no auto-grow.
- Character count in 12 px mono, right-aligned below, `ink.muted`; turns amber at 90% of the limit, brick at 100%.
- No rich text. Plain text only.

### 6.3 Select

- Use the native select. It is reliable on mobile, keyboard-accessible, and does not need a custom listbox.
- Height 40, same border and focus as the text field.
- Chevron 16 px, `ink.muted`, 12 px from the right edge.
- Placeholder "Select…" is `ink.muted` and is not a valid value.
- For more than 40 options, use a searchable field that filters a list, not a 200-item native menu.

### 6.4 Search

- Height 40, search icon 16 px at the left, 10 px gap, placeholder "Search…".
- Clear button 24 × 24 at the right, appears only when there is text; accessible name "Clear search".
- Debounce 250 ms. Show a thin 2 px indeterminate line under the field while a query is in flight; no spinner.
- Results announce the count: "12 results for 'organic'".

### 6.5 Checkbox

- 18 × 18, radius 0, 1 px `line.control`; checked: `accent.pine` fill, `surface.paper` check 12 px; indeterminate: `accent.pine` fill, 8 px horizontal bar.
- Label 14 / 20, 8 px gap; the whole row is the target, minimum 32 px tall (44 on touch).
- Group label above, 13 px 700; helper 12 px muted.
- Focus ring on the box, not the label.
- Never use a checkbox for an immediate setting; that is a switch.

### 6.6 Radio

- 18 × 18 circle, 1 px `line.control`; selected: `accent.pine` border 2 px with a 6 px `accent.pine` dot.
- Same label and target rules as the checkbox.
- Always in a group with a visible legend. Never a single radio.
- Arrow keys move within the group; this is a form, not an exam, so the exam's no-arrow rule does not apply.

### 6.7 Switch

- 36 × 20 track, 16 × 16 thumb, radius 0. The squared track is deliberate: the platform has no pills.
- Off: `line.control` track, `surface.paper` thumb. On: `accent.pine` track, `surface.paper` thumb.
- Label to the left, 14 / 20; state text "On"/"Off" is not repeated visually.
- Use only for settings that apply immediately (theme, notifications). Never inside a form that requires Save.
- The thumb moves 120 ms; reduced motion makes it instant.

### 6.8 File upload

- Dropzone: 1.5 px dashed `line.control`, radius 0, min-height 96, centered icon 20, "Drop a file or browse" 14 / 20, accepted types 12 muted.
- Hover/dragover: border `accent.pine`, background `accent.pine-tint` at 40%.
- Uploaded file row: 48 px, 1 px hairline, file icon, name 14 (truncated at 40 ch), size 12 mono muted, remove icon button 44.
- Error: brick border, message below, retry.
- No progress ring; a 2 px progress bar under the row, `accent.pine` fill.

### 6.9 Form field wrapper

Every field shares one anatomy, in this order:

1. **Label** — 13 / 18, 700, `ink.primary`. Required fields marked "(required)" in 12 px `ink.muted`; if most fields are optional, mark "(optional)" instead. Never an asterisk alone.
2. **Control** — 4 px below the label.
3. **Help** — 12 / 16, `ink.muted`, 6 px below the control.
4. **Error** — replaces help, 12 / 16, `signal.brick`, with a 14 px alert icon. One message, one sentence, says how to fix it.

Validation:
- Validate on blur, not on every keystroke.
- On submit failure, show an error summary above the form with links to each invalid field, and move focus to the summary.
- Never clear a user's input on error.
- Errors are announced; the field gets `aria-invalid` and a described-by relationship.

---

## 7. Navigation

### 7.1 App shell

```
┌──────────────┬───────────────────────────────────────────────┐
│ CCF NIFES    │  Courses / CHE 101              Adaeze Okafor │ 56
│              ├───────────────────────────────────────────────┤
│ COURSES      │                                               │
│  Overview    │  Page content, max 1200, 32 px gutters        │
│  CHE 101   ◀ │                                               │
│  Results     │                                               │
│              │                                               │
│ ADMIN        │                                               │
│  Exams       │                                               │
│  Questions   │                                               │
│              │                                               │
│ [theme]      │                                               │
└──────────────┴───────────────────────────────────────────────┘
   240
```

- Sidebar 240 fixed, `surface.paper`, 1 px right hairline, full height, own scroll.
- Top bar 56, paper, 1 px bottom hairline, sticky.
- Content max 1200, gutters 32 (24 tablet, 20 mobile).
- Below 1024 the sidebar becomes a sheet opened from a 40 px menu button in the top bar. It is not a permanent icon rail.

### 7.2 Sidebar

- Section label: 11 px mono 500 uppercase, 0.08em, `ink.muted`, 24 px top margin, 8 px bottom.
- Item: 40 px, 12 px horizontal padding, 13 / 18 700, icon 18 `ink.muted`, 10 px gap.
- Rest: transparent. Hover: `surface.paper-2`. Active: `accent.pine-tint` fill + 2 px inset left `accent.pine` rule + `ink.primary`. The left rule is the only place a vertical accent bar is allowed beside the exam's index.
- No rounded active pills. No radius anywhere on the item.
- Account block at the bottom: avatar 28, name 13, role 12 muted, theme icon button.

### 7.3 Tabs

- Height 44, 1 px bottom hairline across the group.
- Tab label 14 / 20 700, `ink.muted`; active `ink.primary` with a 2 px `accent.pine` underline sitting on the group rule.
- Hover: `ink.primary`, no background.
- Badge counts use `num.count` and sit 8 px after the label.
- Arrow keys move between tabs; only the active tab is in the tab order.

### 7.4 Breadcrumbs

- 13 / 18, `ink.muted`; separators "/" at 8 px each side, `ink.faint`.
- Current page `ink.primary`, not a link.
- Collapse the middle to "…" below 560; keep first and last.

### 7.5 Pagination

- 32 × 32 cells, radius 0, 1 px hairline, mono 13.
- Current: `accent.pine-tint` fill, `accent.pine` border, `accent.pine` number.
- Hover: `surface.paper-2`.
- Previous/next as 44 px icon buttons, disabled at the ends.
- Range label "1–20 of 358" in 12 px mono muted, left of the controls.
- No infinite scroll in administration; results lists paginate.

### 7.6 Stepper

For exam creation and scheduling.

- 24 × 24 square, radius 0, 1 px hairline, mono 12 number.
- Upcoming: muted. Current: `accent.pine` fill, `surface.paper` number, 2 px `accent.pine` ring at 4 px offset. Complete: `accent.pine` outline, `accent.pine` number, no fill.
- Label 12 / 16 below, 8 px gap; current label 700.
- Connector 1 px hairline, 24 px minimum, centered on the squares.
- Horizontal above 720; vertical below, with the connector on the left.
- Completed steps are clickable; future steps are not.

---

## 8. Content and data

### 8.1 Page header

| Element | Spec |
|---|---|
| Eyebrow | 10 px mono 500 uppercase, 0.14em, `ink.muted` |
| Title | 28 / 36 Crimson Pro, `ink.primary`, max 70 ch |
| Description | 15 / 23, `ink.muted`, max 70 ch, 8 px below |
| Actions | right-aligned, 8 px gap, vertically centered with the title |
| Divider | none; 24 px space below |

Below 720 the actions move under the description, left-aligned. Primary action first in DOM, last visually on desktop.

### 8.2 Card

- 1 px `line.hairline`, radius 0, `surface.paper`, padding 24. No shadow.
- Header: title 16 / 24 700; optional trailing action (ghost 32).
- Body: 15 / 23; 16 px below the header.
- Footer: 16 px above, 1 px top hairline, actions right, 8 px gap.
- Cards are for grouped admin content and hub summaries. The exam question is never a card.
- No nested cards. If a card needs a card, the hierarchy is wrong.

### 8.3 List row

- 56 px, 16 px horizontal padding, 1 px bottom hairline, full-row link.
- Leading icon 20 or avatar 32; 12 px gap; title 14 / 20 700; secondary 12 / 16 muted below.
- Trailing: status badge, date in 12 mono, or chevron 16.
- Hover `surface.paper-2`; selected `accent.pine-tint` + 2 px inset left `accent.pine` rule.
- Focus ring around the entire row.
- On mobile, 64 px with the trailing metadata under the title, not squeezed to the right.

### 8.4 Table

| Property | Value |
|---|---|
| Header height | 36 |
| Row height | 44 (48 on touch) |
| Cell padding | 12 × 16 |
| Header type | 12 px mono 500 uppercase, 0.08em, `ink.muted` |
| Body type | 14 / 20; first column 700 |
| Numeric columns | mono 13, right-aligned, tabular |
| Border | 1 px `line.hairline` between rows; 1 px under header |
| Header background | `surface.sunken`, sticky |
| Row hover | `surface.paper-2` |
| Row selected | `accent.pine-tint` |
| Sort indicator | 14 px chevron, only on the sorted column |

- No zebra striping. No vertical borders. No row shadows.
- Column widths are proportional and declared per screen; the first column never shrinks below 160.
- Empty state sits inside the table body at 160 px height.
- Bulk selection: 40 px checkbox column; a 48 px `accent.pine-tint` bar replaces the header when rows are selected, showing "3 selected" and actions. The bar is not a floating overlay.
- Below 720: either a stacked label/value layout, or horizontal scroll with a sticky first column. Choose per screen; never both. Horizontal scroll is acceptable in admin, never in the exam.

### 8.5 Definition list

- Used for result metadata and detail pages.
- Row 44, 1 px hairline between.
- Label 10 px mono 500 uppercase, 0.14em, `ink.muted`, width 160; value 15 / 23 `ink.primary`.
- On mobile the label sits above the value, 4 px gap, row auto-height.

### 8.6 Badge / status

- Height 20, padding 0 6, radius 0, 11 px mono 500 uppercase, 0.06em.
- Background and text from §3.2.
- No dot unless the badge appears outside a table and needs to catch the eye; the dot is 5 px, same colour as the text.
- Never interactive. For a filter, use a toggle button, not a badge.
- Maximum one badge per row. If two statuses matter, one is the row status and the other is metadata text.

### 8.7 Progress bar

- 2 px tall, `surface.sunken` track, `accent.pine` fill, 240 ms transition.
- No percentage inside. Label above: "18 of 60 graded" in 12 px mono muted.
- For uploads, 2 px under the file row; for grading, 2 px under the page header.
- Never a circular progress ring.

### 8.8 Avatar

- 32 square (40 in profile), radius 0, `surface.sunken` fill, `ink.primary` initials 12 px mono 500.
- Image if available; initials fallback. No coloured generated avatars, no pine tint — the accent is reserved for state.
- Status dot only when presence is real; otherwise omit.

### 8.9 Empty state

- Centered, max 360, 48 px vertical padding.
- Icon 24, `ink.faint`, 1.5 px stroke. No illustration.
- Title 22 / 30 serif `ink.primary`; body 14 / 22 `ink.muted`, 8 px below; one action 8 px below.
- Copy states the situation and the next action: "No exams scheduled. Create an exam." Never "Nothing to see here".

---

## 9. Feedback and overlays

### 9.1 Banner

Extends the exam screen's save banner.

- 40 px min height, full content width, 1 px bottom border, 12 px alert/info icon, 13 / 20 text.
- Variants: `info` (`accent.pine-tint`), `warning` (`amber-tint`), `danger` (`brick-tint`). Neutral uses `surface.sunken`.
- One action maximum, as an underlined text button in `ink.primary`.
- Dismissible unless the condition still applies. A persistent failure has no close button.
- Not a toast. Banners belong to the page; toasts belong to an action.

### 9.2 Toast

- Bottom-left, 24 px from the edge, 320 wide, `surface.raised`, 1 px hairline, radius 0, `shadow.dialog`, 1 px left rule in the status colour.
- Title 13 / 18 700, body 12 / 16 muted, close icon 24.
- Auto-dismiss 4 s; pause on hover and focus. Maximum three stacked, 8 px gap.
- Announced politely. Never used for form errors, save failures, or anything that must persist.
- **Never used in the exam screen.** Autosave is an ambient label there, not a toast.

### 9.3 Tooltip — provisional

- 240 max width, 12 / 16, `surface.raised`, 1 px hairline, `shadow.dialog`, 6 px padding, 4 px offset, radius 0.
- Appears after 400 ms hover or immediately on focus; hides on Escape.
- Never contains essential information or an interactive control.
- Do not build until a screen needs one. The accessible name should usually be enough.

### 9.4 Dialog

| Size | Width | Use |
|---|---|---|
| sm | 400 | Confirmation, short prompt |
| md | 480 | Standard form or detail |
| lg | 640 | Multi-field form, preview |

- Padding 24; header title 22 / 30 serif; optional description 14 / 22 muted, 8 px below.
- Radius 0. Close icon 32 visual inside a 44 px target at the top-right, 12 px inset; not shown for blocking states (time expiry, session conflict).
- Body scrolls if it exceeds 70vh; header and footer stay fixed.
- Footer 24 px above, actions right, 8 px gap, secondary then primary.
- Backdrop `surface.overlay`; `shadow.dialog`; no blur.
- Enters 180 ms fade + 8 px rise; reduced motion instant.
- Focus trapped, initial focus on the title or the first non-destructive control, restored to the trigger on close.
- Escape closes unless the action is irreversible and in progress.

### 9.5 Confirm dialog

- Title is a verb and an object: "Delete this exam?" / "Publish 60 results?"
- Body states the consequence, not the question: "This removes 60 questions and cannot be undone."
- Primary is `signal.brick` for destructive actions, **ink** otherwise. Never pine.
- Cancel is secondary and comes first in DOM.
- For irreversible bulk actions (> 10 items, or deleting an exam), require typing the exam code to enable the primary. The input is a standard text field; the primary stays disabled until it matches.
- Focus starts on Cancel, never on the destructive action.

### 9.6 Sheet

- Desktop: right-side panel 400 wide, full height, 1 px left hairline, `shadow.sheet`, slides 180 ms, radius 0.
- Mobile: bottom sheet, max 90vh, radius 2 top corners, drag handle 32 × 3 (decorative), close button 44.
- Same focus trap and Escape behaviour as a dialog.
- Used for filters, question detail, and mobile navigation. Not for confirmation.

---

## 10. Patterns

### 10.1 Form layout

- One column, max 560, 20 px between fields, 32 px before actions.
- Two columns only for pairs that are genuinely read together (start date / end date), collapsing below 720.
- Actions right-aligned, primary last. On mobile, full-width primary first in DOM.
- Labels above controls, never beside, except in dense admin filters.

### 10.2 Destructive action

1. Trigger is a ghost or text button, never a filled brick block.
2. Confirm dialog states the exact consequence and the item count.
3. Irreversible bulk actions require typing the exam code.
4. On success, close, remove the row, toast "Exam deleted."
5. On failure, keep the dialog open, show the error in the dialog, do not clear input.

### 10.3 Loading, empty, error

| State | Treatment |
|---|---|
| Loading | Static 13 px mono label + 2 px indeterminate line at the top of the region. No shimmer, no skeleton cards. |
| Empty | §8.9. One action. |
| Error | Inline banner or full-region state with a retry. Never a raw error code alone; include a short sentence and a reference. |
| Partial | Show what loaded, mark the failed region inline, keep the rest usable. |

### 10.4 Permissions

- Hide modules the user cannot access; do not show a disabled sidebar item.
- Disable an individual action with a visible reason on hover/focus only when hiding it would be confusing.
- Never rely on a disabled control to explain a permission rule.

### 10.5 Dates and numbers

- Absolute dates: `12 Nov 2026, 14:33`, timezone shown once per screen, not per row.
- Relative time only for activity feeds, with the absolute value in the title attribute.
- Numbers: mono, tabular, thousands separated, one decimal for percentages.
- Never a bare "12/11/26".

### 10.6 Keyboard

- Tab moves through controls in DOM order; Enter submits a form; Escape closes overlays.
- Arrow keys move within tabs, radio groups, and menus. They do not move within exam options — that rule is locked by `02`.
- Every focusable element has a visible focus ring. No `outline: none` without a replacement.

---

## 11. Accessibility contract

Every component in this inventory must satisfy all of the following before it is considered complete.

| Requirement | Detail |
|---|---|
| Contrast | Body text 4.5:1; large text 3:1; borders and icons 3:1 where they carry meaning |
| Target size | 44 × 44 on touch; 32 × 32 minimum on desktop |
| Focus | 2 px `accent` ring, 2 px offset, radius 0, never clipped by overflow |
| Name | Every control has a programmatic name; icon-only controls have a visible tooltip |
| State | Selected, expanded, invalid, busy, and disabled are exposed to assistive technology |
| Errors | Announced, linked to the field, and paired with a visible message |
| Tables | Header cells with scope; caption or preceding heading; sort state announced |
| Dialogs | Modal semantics, labelled by title, focus trapped and restored |
| Tabs | Tablist/tab/tabpanel semantics; arrow-key navigation; one tab in the tab order |
| Motion | All transitions respect reduced motion |
| Zoom | Usable at 200% and reflows at 400% without loss of function |
| Forced colours | Borders remain visible; focus uses `Highlight`; no meaning is lost |

---

## 12. Governance

### 12.1 Adding a component

A new component is justified only by a real screen that needs it. The proposal must include:

1. The screen and the user task.
2. Why an existing component cannot do the job.
3. Anatomy, all eight states, responsive behaviour, and accessibility notes.
4. The tokens used — no raw values.
5. What it replaces or deprecates, if anything.

### 12.2 Rules

- **Tokens only.** No component defines its own hex, spacing, or radius.
- **No variants without a use.** A "subtle" and "quiet" and "soft" button is three names for one missing decision.
- **No component forks per surface.** The exam screen's button is the platform button, not a copy.
- **Deprecate explicitly.** A replaced component is marked deprecated with the replacement and a removal date.
- **States are part of the contract.** A component shipped with rest and hover only is incomplete.

### 12.3 Review checklist

- [ ] Uses only existing tokens.
- [ ] All eight interaction states designed.
- [ ] Focus ring visible on every interactive part.
- [ ] Touch target meets 44 px where relevant.
- [ ] Works in light and dark.
- [ ] Works at 200% zoom and 400% reflow.
- [ ] Works in forced-colours mode.
- [ ] Reduced motion honoured.
- [ ] Accessible name and state exposed.
- [ ] Copy follows the platform tone: plain, factual, no encouragement.
- [ ] No new shadow, gradient, pill, or accent use.
- [ ] Responsive behaviour defined at 1200, 920, 560, and 380.

---

## 13. Handoff

**Locked:** the exam screen's components in `02-visual-ui-spec.md`. Do not restyle them through this inventory.

**Specified here:** actions, forms, navigation, content, data display, feedback, and overlays for the surrounding platform.

**Inherited from v2.0 "Registry":** Crimson Pro, Atkinson Hyperlegible, IBM Plex Mono; ink as the action colour and pine as the state colour; 0 radius; 400/700 sans weights only.

**Deliberately absent:** charts, rich text editing, a command palette, a data grid with inline editing, and a custom date picker. Each needs a screen and a reason before it earns a spec.

**Next artifact:** the engineering redline in `05-engineering-redline.md` (v1.1) carries the exact measurements, tokens, breakpoint behaviour, and state transitions across these four documents. It introduces no new visual decisions.
