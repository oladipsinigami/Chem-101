"""Assertions for the two result documents.

Renders a real 60-question snapshot through pdf/render.py and checks the
properties the design fixes: A4, tagged, language, metadata, page counts, the
answer-key warning, and the absence of review content in the official record.

Run: python tests/pdf_test.py
"""

import json
import os
import pathlib
import subprocess
import sys
import tempfile

from pypdf import PdfReader

ROOT = pathlib.Path(__file__).resolve().parent.parent
FORBIDDEN_IN_OFFICIAL = [
    "CORRECT ANSWER",
    "YOUR ANSWER",
    "UNANSWERED",
    "CONTAINS THE ANSWER KEY",
]
SCORE_WORDS = ("score", "percentage", "grade", "pass", "fail")


def main() -> int:
    out = pathlib.Path(tempfile.mkdtemp(prefix="chem101-pdf-test-"))

    made = subprocess.run(
        ["node", str(ROOT / "tests" / "make_snapshot.js")],
        capture_output=True, text=True, check=True,
    )
    meta = json.loads(made.stdout.strip().splitlines()[-1])
    snapshot_path = meta["snapshot"]
    reference = meta["reference"]
    length = int(os.environ.get("CHEM_TEST_PAPER", "40"))

    rendered = subprocess.run(
        [
            sys.executable, str(ROOT / "pdf" / "render.py"),
            "--snapshot", snapshot_path,
            "--out-dir", str(out),
            "--fonts", str(ROOT / "assets" / "fonts"),
        ],
        capture_output=True, text=True,
    )
    if rendered.returncode != 0:
        print(rendered.stdout[-3000:])
        print(rendered.stderr[-3000:])
        raise SystemExit("render.py failed")

    report = json.loads(rendered.stdout.strip().splitlines()[-1])
    assert report["ok"], report
    official = pathlib.Path(report["documents"]["official"]["path"])
    review = pathlib.Path(report["documents"]["review"]["path"])

    # --- file names
    assert reference in official.name and reference in review.name
    assert official.name == f"CHE101-mid-semester-official-record-{reference}.pdf"
    assert review.name == f"CHE101-mid-semester-review-{reference}.pdf"
    for word in SCORE_WORDS:
        assert word not in official.name.lower()
        assert word not in review.name.lower()

    # --- page counts
    o = PdfReader(str(official))
    r = PdfReader(str(review))
    assert len(o.pages) == 1, f"official is {len(o.pages)} pages"
    assert len(r.pages) >= 2, f"review is {len(r.pages)} pages"
    assert report["documents"]["official"]["pages"] == 1
    assert report["documents"]["review"]["pages"] == len(r.pages)

    # --- A4 portrait
    for page in (o.pages[0], r.pages[0]):
        width = float(page.mediabox.width)
        height = float(page.mediabox.height)
        assert abs(width - 595.28) < 1.5 and abs(height - 841.89) < 1.5, (width, height)

    # --- tagged, language, metadata
    for reader, kind in ((o, "official"), (r, "review")):
        root = reader.trailer["/Root"]
        assert "/StructTreeRoot" in root, f"{kind}: not tagged"
        assert str(root.get("/Lang")) == "en", f"{kind}: language"
        md = {k: str(v) for k, v in (reader.metadata or {}).items()}
        assert md["/Author"] == "CCF NIFES"
        assert md["/Title"].startswith("CHE 101 Mid-semester Examination")
        assert reference in md["/Subject"]
        assert ("Official Record" in md["/Title"]) if kind == "official" else ("Detailed Review" in md["/Title"])
        joined = " ".join(md.values()).lower()
        for word in SCORE_WORDS:
            assert word not in joined, f"{kind}: metadata leaks {word}"
        # No structural score is stored in the document info dictionary.
        assert "48" not in md.get("/Subject", "")

    # --- official contains no review content
    official_text = "\n".join((p.extract_text() or "") for p in o.pages)
    for phrase in FORBIDDEN_IN_OFFICIAL:
        assert phrase not in official_text, f"official leaks {phrase!r}"
    assert reference in official_text
    assert "Examination Result" in official_text
    assert "\ufffd" not in official_text

    # --- review covers every question, warns on every page, real text
    review_pages = [(p.extract_text() or "") for p in r.pages]
    joined = "\n".join(review_pages)
    for n in range(1, length + 1):
        assert f"Q{n:02d}" in joined, f"review missing Q{n:02d}"
    assert "CORRECT ANSWER" in joined
    assert "\ufffd" not in joined
    for index, text in enumerate(review_pages, start=1):
        assert "CONTAINS THE ANSWER KEY" in text, f"review page {index} lost the warning"
        assert f"Page {index} of {len(r.pages)}" in text, f"review page {index} footer"

    assert f"Page 1 of 1" in official_text
    print(json.dumps({
        "ok": True,
        "official_pages": len(o.pages),
        "review_pages": len(r.pages),
        "reference": reference,
        "questions": length,
        "bytes": {"official": official.stat().st_size, "review": review.stat().st_size},
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
