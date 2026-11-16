# Question Bank and Randomisation

**Project:** Chemistry 101
**Brand:** CCF NIFES
**Source:** `Chem 101 question.pdf` — the only question source permitted for this product.
**Purpose:** Define what is in the bank, how a paper is drawn, how per-candidate order is produced and replayed, and how that order reaches the two result PDFs.
**Status:** v1.0. Authoritative for question content and ordering. Where it disagrees with an earlier document, this document wins for bank and ordering rules only.

---

## 1. Source rule

**One file, nothing else.** Every item in the bank is transcribed from `C:\Users\oladips\Downloads\Chem 101\Chem 101 question.pdf`. No item from the Chem-102 reference repository, the old prototype, a web source, or an author's memory may enter the bank. There is no manual authoring surface in this product.

**Transcription is mechanical.** `bank/extract.py` reads the PDF in reading order and strips the publisher's ad furniture (the "Polymer concept", "BALOTOPST/BALOTOPSY", phone number, and campaign lines). `bank/build.py` parses the eight question sets, merges answer keys, and writes:

| File | Contents |
|---|---|
| `bank/extract.py` | `pdftotext -raw` in reading order, ad furniture stripped |
| `bank/chem101.txt` | The cleaned intermediate text, kept for audit |
| `bank/chem101-bank.json` | Every usable item, with topic, answer index, option-order permission, and typesetting flag |
| `bank/needs-review.json` | Items the parser could not read with confidence — must be empty before release |
| `bank/manifest.json` | `bank_version`, item and topic counts, fixed-order and typesetting lists |

**Text is preserved, not rewritten.** Stems and options keep the source wording, including its own spelling ("equilibirum", "statment", "dempester's") and its shorthand for arrows and subscripts. The only permitted corrections are OCR damage that cannot be read as text at all. Those fixes are enumerated in `OCR_FIXES` in `build.py`; today there is exactly one (`ms = + �` → `ms = +1/2`). No fix may change the chemistry or the intended answer.

**Nothing is inferred.** Where a set answers in prose rather than a letter, the letter is read off that prose and recorded with its reason in `answer_note`. There are four such items, all quantum-number questions. Where the PDF's own key is ambiguous, the item does not ship.

**Reload after any change.** `python bank/extract.py && python bank/build.py` must end with `review: 0`. A non-empty review file is a release blocker, not a warning.

### 1.1 Known transcription limits

Plain-text extraction cannot carry three things the page shows, and the bank does not pretend otherwise:

- **Superscripts and subscripts.** `10-6` is the page's 10⁻⁶ and `H2O` is H₂O. The bank stores the flat text; the exam renderer applies chemistry typography at display time.
- **Reaction arrows.** The PDF draws every arrow as vector art, so no text layer contains it. Equations therefore read `2SO2(g) + O2(g) 2SO3(g)` in the bank. Eighteen items depend on an arrow; `bank/manifest.json` lists them under `typeset_required`, and they must be typeset against the PDF before a live paper can use them. No arrow is inferred, because the direction is chemistry, not formatting.
- **Publisher furniture.** Set headers, ads, and page numbers are removed, not hidden.

None of these affects a stem's wording or its answer. The arrow items are a content task with a visible list, not a silent defect.

---

## 2. Bank composition

**119 items**, no duplicates by stem, across five topics. The PDF's own sets are not topics — several sets split across topics and one topic is split across the page — so the topic is assigned by set and item number, never by page position. Of the 119, 101 render as extracted and 18 await reaction-arrow typesetting (§1.1).

| Topic | Items | Where it comes from |
|---|---:|---|
| Atomic structure | 34 | Set 1 items 5–14; set 2 items 1–18; set 4 items 1–6 |
| Electronic structure & quantum numbers | 27 | Set 4 items 7–20; the four prose-answer quantum items; the nine-item quantum set |
| Stoichiometry | 9 | Set 3 items 1–3 and 19–24 |
| Equilibrium | 24 | Set 1 items 1–4; the twenty-item equilibrium set |
| Kinetics | 25 | The twenty-five-item kinetics set |
| **Total** | **119** | |

Item shape:

| Property | Value |
|---|---|
| Options per item | 4 (45 items) or 5 (74 items) |
| Correct-answer spread | A 28 · B 36 · C 21 · D 20 · E 14 |
| Longest stem | 511 characters (a multi-step mechanism item) |
| Longest option | 143 characters |
| Items with a fixed option order | 9 (see §4.4) |
| Items pending arrow typesetting | 18 (see §1.1) |

Each item carries these fields (`answer_note` appears only on the four prose-answer quantum items):

```json
{
  "id": "CHE101-025",
  "section": "atomic-structure-2",
  "number": 11,
  "topic": "atomic-structure",
  "stem": "Mass number is equal to the_________.",
  "options": [
    "number of protons + number of electrons",
    "number of protons + number of neutrons",
    "number of neutrons + number of electrons",
    "number of electrons"
  ],
  "answer": 1,
  "answer_raw": "2",
  "option_shuffle": true,
  "typeset_required": false,
  "source": "Chem 101 question.pdf"
}
```

`answer` is the zero-based index into the **bank** order. It is never sent to the exam client.

---

## 3. Paper assembly

**Length is configuration, not content.** The default paper is 60 questions; any length from 20 to 100 is allowed, and the theoretical maximum is 119. The interface copy, the map, and both PDFs read the length from the attempt record — no screen or document hardcodes "60" as a fact about the product.

**Quotas, then sampling.** A paper is drawn per topic in proportion to the bank, using largest-remainder rounding. This keeps papers comparable between candidates without letting a nine-item topic dominate.

| Paper length | Atomic | Electronic | Stoichiometry | Equilibrium | Kinetics |
|---:|---:|---:|---:|---:|---:|
| 20 | 6 | 5 | 1 | 4 | 4 |
| 30 | 9 | 7 | 2 | 6 | 6 |
| 40 | 12 | 9 | 3 | 8 | 8 |
| 50 | 14 | 11 | 4 | 10 | 11 |
| **60 (default)** | **17** | **14** | **4** | **12** | **13** |
| 80 | 23 | 18 | 6 | 16 | 17 |
| 100 | 29 | 23 | 7 | 20 | 21 |
| 119 (full bank) | 34 | 27 | 9 | 24 | 25 |

Assembly is deterministic and server-side:

1. Read `paper_length` and `bank_version` from the exam configuration. Reject a length below 20 or above the number of drawable items.
2. For each topic, shuffle that topic's drawable pool with Fisher–Yates using the stream `topic:<name>` (§4.2).
3. Take the first *quota* items from each shuffled pool.
4. Concatenate the five selections and shuffle that list with the `"paper"` stream. The result is the candidate's question order — topics interleaved, no runs by source set.
5. Write the ordered item IDs to `attempt.paper` before the first question is served.

Sampling is without replacement within a paper, so no candidate can see the same item twice. Across candidates items repeat, which is expected for a 119-item bank. The quotas assume the full bank; an item flagged `typeset_required` cannot be drawn, and a length whose quotas cannot be met without it is rejected at setup rather than served with a broken equation.

---

## 4. Per-candidate order

### 4.1 Seed

- 128 bits from the platform's CSPRNG, rendered as 32 lowercase hex characters.
- Generated once, when the attempt is created — never in the browser.
- Stored on the attempt as `seed`, alongside `bank_version` and `paper_length`.
- Never reused between attempts and never derived from the candidate's identity, e-mail, or start time. A guessable seed is a leaked paper.

### 4.2 Deterministic shuffle

Replay must not depend on a language runtime's `shuffle`, which differs by version. The definition is fixed:

```
next64(name):
    counter[name] += 1
    h = SHA-256(seed_hex || "|" || name || "|" || decimal(counter[name]))
    return first 8 bytes of h as an unsigned 64-bit integer

range(name, n):                     // uniform integer in [0, n)
    limit = floor(2^64 / n) * n
    do r = next64(name) while r >= limit
    return r mod n

shuffle(list, name):
    for i from len(list)-1 down to 1:
        j = range(name, i + 1)
        swap list[i], list[j]
    return list
```

Each stream keeps its own counter, starting at 0, for the life of one attempt. Rejection sampling removes modulo bias. With a 64-bit draw a redraw is vanishingly rare, but the rule is stated so two implementations cannot diverge.

Streams:

| Purpose | Stream name |
|---|---|
| Topic pool | `topic:atomic-structure`, `topic:electronic-structure`, `topic:stoichiometry`, `topic:equilibrium`, `topic:kinetics` |
| Final paper order | `paper` |
| Options of one item | `opt:CHE101-025` |

All streams derive from the same 128-bit seed, so one stored value reproduces the entire attempt.

### 4.3 Option order and answer remap

Options are shuffled per item, independently of every other item:

```
order = [0, 1, 2, ... n-1]            // bank indices
if item.option_shuffle:
    order = shuffle(order, "opt:" + item.id)

display option d  = item.options[order[d]]
display letter     = "ABCDE"[d]
display answer     = position of item.answer within order
```

The correct answer is stored as `display_answer` on the attempt at generation time. It is never recalculated in the browser and never sent before submission.

### 4.4 Items that keep their option order

Nine items contain options that point at other options, so moving them would break their meaning:

`CHE101-002`, `003`, `009` (set 1: "all of above", "both A and B"), `CHE101-058` ("None of these"), `CHE101-064` ("none of the above"), `CHE101-076`, `084`, `087` ("none of these", "All of the above"), `CHE101-098` ("None of the above").

These items are still shuffled within the paper; only their options stay in source order, and their letters therefore stay in source order too. `option_shuffle` is computed by the builder from the option text, not maintained by hand. A new item that gains a referential option will be flagged automatically.

### 4.5 What the client receives

Per item, in display order: the item reference, the stem, the display options with letters A–E, and any formatting metadata. The payload contains **no** correct answer, no answer key, no topic score, and no `option_shuffle` flag. The full paper, with keys and seeds, exists only on the server.

---

## 5. Determinism and replay

| Situation | Behaviour |
|---|---|
| Refresh, network drop, tab close | The attempt is reloaded from the server. `attempt.paper` is authoritative; the browser never reshuffles. The clock continues. |
| Same candidate reopens the link | Same paper, same letters, same answers. |
| Different candidate, same exam window | Different seed, different paper and option order. |
| Dispute or audit | Regenerate from `seed` + `bank_version`; the paper must match the stored attempt byte for byte. |
| Bank edited during a window | Old attempts stay pinned to the archived `bank_version`. New attempts use the new version. An attempt is never re-rendered against a changed bank. |
| Paper generation fails mid-write | No questions are served until `attempt.paper` is committed. A half-written paper is not recoverable and must be discarded, not repaired. |

`bank_version` is the first 8 hex characters of the SHA-256 of the canonical bank JSON, computed at build time and stored in `bank/manifest.json`. Any edit to the bank changes the version, which is the point.

---

## 6. Order in the result PDFs

Both documents follow the candidate's paper, never the bank.

- **Official Examination Record** — items appear in paper order, numbered 1…N as the candidate saw them. Correct answers and topic scores do not appear at all.
- **Detailed Review** — items appear in the same paper order, with the stem, the candidate's letter, the correct letter, and the option text for both. The letters are the candidate's display letters, not the bank's.
- A question's identity in both PDFs is its paper position plus `CHE101-###` in small metadata type. The metadata is for the examiner, not the student, and does not reveal bank order.
- The topic line in the Detailed Review uses the five topic names in §2, aggregated. It never lists source sets or section names.

---

## 7. Failure modes

| Failure | Required response |
|---|---|
| `needs-review.json` is non-empty | Build fails; no bank is published. |
| Requested length exceeds the bank | Exam configuration is rejected at setup, not at start. |
| A topic quota exceeds its pool | Configuration is rejected; the quota table is recomputed, never clamped silently. |
| Seed missing or malformed on load | Attempt refuses to start and is escalated; it is never regenerated, because regeneration would change the paper mid-exam. |
| Browser sends an order or letter map | Ignored. The server renders from `attempt.paper` only. |
| Duplicate item in a generated paper | Generation aborts and is retried with a new seed; the bad paper is not served. |

---

## 8. Acceptance criteria

- [ ] `bank/needs-review.json` is `[]`.
- [ ] `bank/chem101-bank.json` contains 119 items, all with `source: "Chem 101 question.pdf"`.
- [ ] No stem appears twice; no item has more than 5 options; no option exceeds 200 characters.
- [ ] Every item's `answer` is a valid index into its own `options`.
- [ ] The nine referential items have `option_shuffle: false`; every other item has `true`.
- [ ] `manifest.json` lists exactly 18 `typeset_required` items, and none is drawable until cleared.
- [ ] Two attempts with the same seed and `bank_version` produce identical question order, option order, and answer letters.
- [ ] Two attempts with different seeds produce different question order; with 60 items from 119, the probability of an identical order is effectively zero.
- [ ] Refresh mid-exam returns the same paper and the same selected answers; the timer does not reset.
- [ ] The exam client payload contains no correct answer, key, or score field.
- [ ] Both PDFs list questions in attempt order and use display letters.
- [ ] A 60-item paper respects the quotas 17 / 14 / 4 / 12 / 13.
