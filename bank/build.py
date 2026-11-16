"""Build the Chemistry 101 question bank from the extracted PDF text.

One source only: "Chem 101 question.pdf". Anything this script cannot read with
confidence is written to needs-review.json instead of being guessed at.
"""
import json, re, sys, pathlib, hashlib
from collections import Counter

sys.stdout.reconfigure(encoding="utf-8")
HERE = pathlib.Path(__file__).parent
SRC = HERE / "chem101.txt"
BANK = HERE / "chem101-bank.json"
REVIEW = HERE / "needs-review.json"
MANIFEST = HERE / "manifest.json"

lines = [l for l in SRC.read_text(encoding="utf-8").splitlines() if l.strip()]

SECTIONS = [
    ("atomic-structure-1", "A–D options, inline answer", r"^CHE 101 POSSIBLE QUESTION$"),
    ("atomic-structure-2", "1–4 options, inline answer", r"^1\. Electron was discovered by_+\.$"),
    ("stoichiometry", "(a)–(e) options, inline key", r"^1\. The formula weight of the compound,$"),
    ("atomic-structure-3", "(a)–(e) options, key lines", r"^1\. Which of the following has a positive$"),
    ("stoichiometry", "q19–24 continuation, key line", r"^19\. The mass \(in grams\) of FeSO4"),
    ("quantum-numbers-explanations", "A–D options, prose answers", r"^1\) Which of the following statements is$"),
    ("quantum-numbers", "A–D options, inline answer", r"^1\. Quantum numbers are$"),
    ("equilibrium", "(a)–(e) options, key block", r"^1\. When the system A \+ B C \+ D is at$"),
    ("kinetics", "(a)–(e) options, key block", r"^1\. The combustion of ethane \(C2H6\) is$"),
]

idx = []
for name, note, pat in SECTIONS:
    rx = re.compile(pat)
    found = next((i for i, l in enumerate(lines) if rx.search(l)), None)
    if found is None:
        raise SystemExit(f"anchor not found for {name}: {pat}")
    idx.append((name, note, found))

bounds = []
for k, (name, note, start) in enumerate(idx):
    end = idx[k + 1][2] if k + 1 < len(idx) else len(lines)
    bounds.append((name, note, start, end))

QSTART = re.compile(r"^(\d{1,2})\s*[.)]\s*(.*)$")
KEYL = re.compile(r"^Answer[s]?:\s*(.*)$", re.I)
KEYPAIR = re.compile(r"(\d{1,2})\s*\.\s*\(([a-e])\)", re.I)
ALPHA_OPT = re.compile(r"^\(?([a-eA-E])[.)]\s+(.+)$")
PAREN_OPT = re.compile(r"\(([a-e])\)\s*", re.I)
BARE_NUM = re.compile(r"^([1-6])[.)]$")

# The four quantum-number items are answered in the source with prose, not a
# letter. Each letter below is read off that prose ("the orbitals are d
# orbitals" -> B, "seven f orbitals" -> D, "none of these answers are
# correct" -> D, "therefore 3d seems right" -> A).
ANSWER_OVERRIDES = {
    ("quantum-numbers-explanations", 1): ("B", "ml = -2 implies five d orbitals"),
    ("quantum-numbers-explanations", 2): ("D", "l = 3 implies one of seven f orbitals"),
    ("quantum-numbers-explanations", 3): ("D", "ml = -4 needs nine orbitals, so none of the above"),
    ("quantum-numbers-explanations", 4): ("A", "n = 3, l = 2 is 3d"),
}

# OCR damage that cannot be recovered automatically but is unambiguous.
OCR_FIXES = {"ms = + \ufffd": "ms = +1/2"}

# The PDF carries no topic labels. Topics are derived from where each set sits
# in the paper: the first four items of set 1 are equilibrium, the rest of that
# set and sets 2 and the top of set 4 are atomic structure, and so on.
def topic_of(section, number):
    if section == "atomic-structure-1":
        return "equilibrium" if number <= 4 else "atomic-structure"
    if section == "atomic-structure-2":
        return "atomic-structure"
    if section == "atomic-structure-3":
        return "atomic-structure" if number <= 6 else "electronic-structure"
    if section in ("quantum-numbers", "quantum-numbers-explanations"):
        return "electronic-structure"
    if section == "stoichiometry":
        return "stoichiometry"
    if section == "equilibrium":
        return "equilibrium"
    if section == "kinetics":
        return "kinetics"
    raise ValueError(section)

# Options that point at other options ("all of the above", "both A and B")
# cannot be reordered, because their meaning depends on position.
REFERENTIAL = re.compile(
    r"^(all|none)\s+(of\s+)?(the\s+)?(above|these)\.?$|^both\s+a\s+and\s+b\.?$",
    re.I,
)

# The PDF draws reaction arrows as vector art, so text extraction cannot see
# them. Items whose chemistry depends on an arrow are listed for typesetting
# instead of being guessed at.
STATE_MARK = re.compile(r"\((g|aq|s|l)\)", re.I)
ARROW = re.compile(r"[\u2190\u2192\u2194\u21cc\u21cb]")

def norm(s):
    s = " ".join(s.split())
    return s.replace(" ,", ",").replace(" .", ".").strip()

def parse_section(name, note, start, end):
    questions, key = [], {}
    cur, expect, last_opt, opt_style, pending_key = None, None, None, None, False
    stop = 0

    def close():
        nonlocal cur, last_opt, opt_style
        if cur:
            questions.append(cur)
        cur, last_opt, opt_style = None, None, None

    def add_opt(text, num=None):
        nonlocal last_opt
        cur["options"].append(norm(text))
        if num is not None:
            last_opt = num

    body = lines[start:end]

    def absorb(i):
        """Read a key block starting at body[i], including wrapped lines.

        Key pairs can break across lines ("... 8." / "(c) 9. ..."), so the
        lines are joined before the pairs are read.
        """
        chunk = []
        for line2 in body[i:i + 60]:
            if not KEYPAIR.findall(line2):
                # "... 20." on one line, "(c)" on the next.
                if chunk and re.match(r"^\([a-e]\)", line2) and re.search(r"\d+\.\s*$", chunk[-1]):
                    chunk.append(line2)
                break
            chunk.append(line2)
        for n, letter in KEYPAIR.findall(" ".join(chunk)):
            key[int(n)] = "ABCDE".index(letter.upper())

    for pos, line in enumerate(body):
        km = KEYL.match(line)
        if km:
            payload = km.group(1).strip()
            pairs = KEYPAIR.findall(payload)
            if pairs:
                absorb(pos)
                close()
                # A key block closes the section; everything after it is the
                # rest of the key or the page footer, never question content.
                break
            if not payload:
                pending_key = True
                continue
            if cur is not None:
                if re.fullmatch(r"[A-E]", payload.upper()):
                    cur["answer"] = "ABCDE".index(payload.upper())
                    cur["answer_raw"] = payload.upper()
                elif re.fullmatch(r"[1-5]", payload):
                    cur["answer"] = int(payload) - 1
                    cur["answer_raw"] = payload
                else:
                    cur["answer_raw"] = payload
                    cur["prose_answer"] = True
                close()
            continue

        if pending_key:
            if KEYPAIR.findall(line):
                absorb(pos)
                pending_key = False
                close()
                break

        m = QSTART.match(line)
        if m:
            n = int(m.group(1))
            is_option = (cur is not None and opt_style == "num" and last_opt is not None
                         and n == last_opt + 1 and len(cur["options"]) < 5)
            if is_option:
                add_opt(m.group(2), n)
                continue
            if expect is None or n == expect:
                close()
                cur = {"section": name, "number": n, "stem": m.group(2) or "",
                       "options": [], "answer": None, "answer_raw": None}
                expect = n + 1
                continue

        if cur is None:
            continue

        # "1." alone on a line, with the option text on the lines below.
        bn = BARE_NUM.match(line)
        if bn and len(cur["options"]) < 5:
            n = int(bn.group(1))
            start_opt = (last_opt is not None and n == last_opt + 1) or (
                last_opt is None and not cur["options"] and cur["stem"])
            if start_opt:
                opt_style = "num"
                add_opt("", n)
                continue

        if len(cur["options"]) < 5 and PAREN_OPT.search(line):
            parts = re.split(r"\(([a-e])\)\s*", line, flags=re.I)
            lead = parts[0].strip()
            if lead:
                if cur["options"]:
                    cur["options"][-1] = norm(cur["options"][-1] + " " + lead)
                else:
                    cur["stem"] = norm(cur["stem"] + " " + lead)
            for j in range(1, len(parts) - 1, 2):
                add_opt(parts[j + 1])
            opt_style = "alpha"
            continue

        am = ALPHA_OPT.match(line)
        if am and len(cur["options"]) < 5:
            add_opt(am.group(2))
            opt_style = "alpha"
            continue

        nm = re.match(r"^([1-6])[.)]\s*(.+)$", line)
        if nm and opt_style in (None, "num") and len(cur["options"]) < 5:
            opt_style = "num"
            add_opt(nm.group(2), int(nm.group(1)))
            continue

        if cur["options"]:
            cur["options"][-1] = norm(cur["options"][-1] + " " + line)
        else:
            cur["stem"] = norm(cur["stem"] + " " + line)

    close()

    for q in questions:
        if q["answer"] is None and q["number"] in key:
            q["answer"] = key[q["number"]]
            q["answer_raw"] = chr(65 + key[q["number"]])
        ov = ANSWER_OVERRIDES.get((q["section"], q["number"]))
        if ov:
            letter, note = ov
            q["answer"] = "ABCDE".index(letter)
            q["answer_raw"] = letter
            q["answer_note"] = note
        q.pop("prose_answer", None)
    return questions

all_q, review = [], []
for name, note, s, e in bounds:
    for q in parse_section(name, note, s, e):
        q["source"] = "Chem 101 question.pdf"
        q["stem"] = norm(q["stem"]).rstrip("_").strip()
        q["options"] = [o for o in q["options"] if o]
        for bad, good in OCR_FIXES.items():
            q["stem"] = q["stem"].replace(bad, good)
            q["options"] = [o.replace(bad, good) for o in q["options"]]
        problems = []
        if len(q["options"]) < 2:
            problems.append(f"{len(q['options'])} options")
        if len(q["options"]) > 5:
            problems.append(f"{len(q['options'])} options (too many)")
        if q["answer"] is None:
            problems.append("no answer")
        elif q["answer"] >= len(q["options"]):
            problems.append("answer out of range")
        if len(q["stem"]) < 8:
            problems.append("stem too short")
        if "\ufffd" in q["stem"] or any("\ufffd" in o for o in q["options"]):
            problems.append("unreadable character")
        q["topic"] = topic_of(q["section"], q["number"])
        q["option_shuffle"] = not any(REFERENTIAL.match(o) for o in q["options"])
        text = q["stem"] + " " + " ".join(q["options"])
        q["typeset_required"] = bool(STATE_MARK.search(text)) and not ARROW.search(text)
        if problems:
            q["problems"] = problems
            review.append(q)
        else:
            all_q.append(q)

for i, q in enumerate(all_q, 1):
    q["id"] = f"CHE101-{i:03d}"

BANK.write_text(json.dumps(all_q, ensure_ascii=False, indent=1), encoding="utf-8")
REVIEW.write_text(json.dumps(review, ensure_ascii=False, indent=1), encoding="utf-8")

canonical = json.dumps(all_q, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
digest = hashlib.sha256(canonical).hexdigest()
manifest = {
    "bank_version": digest[:8],
    "sha256": digest,
    "items": len(all_q),
    "source": "Chem 101 question.pdf",
    "topics": dict(Counter(q["topic"] for q in all_q)),
    "option_counts": {str(k): v for k, v in sorted(Counter(len(q["options"]) for q in all_q).items())},
    "fixed_option_order": [q["id"] for q in all_q if not q["option_shuffle"]],
    "typeset_required": [q["id"] for q in all_q if q["typeset_required"]],
}
MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")

print("usable:", len(all_q), " review:", len(review))
print("per section:", dict(Counter(q["section"] for q in all_q)))
print("option counts:", dict(Counter(len(q["options"]) for q in all_q)))
print("answers:", dict(Counter("ABCDE"[q["answer"]] for q in all_q)))
for q in review:
    print("  REVIEW", q["section"], q["number"], q.get("problems"), "|", q["stem"][:60])
