#!/usr/bin/env python3
"""Render the two Chemistry 101 result documents from one submission snapshot.

The documents are HTML laid out in millimetres and printed by Chromium through
Playwright. Chromium supplies the running header/footer, real text, embedded
font subsets, and a tagged PDF. Nothing here reads live exam state.
"""

from __future__ import annotations

import argparse
import base64
import html
import io
import json
import math
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader
from playwright.sync_api import sync_playwright

MONTHS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")

INK = "#171A18"
MUTED = "#616A63"
PINE = "#1D4B3B"
AMBER = "#8A5A12"
BRICK = "#8E3B31"
HAIRLINE = "#DDD9CF"
PAPER = "#FFFFFF"


def parse_iso(value: str) -> datetime:
    text = str(value).replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(text)
    except ValueError:
        parsed = datetime.now(timezone.utc)
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc)
    return parsed


def display_date(value: str) -> str:
    dt = parse_iso(value)
    return f"{dt.day} {MONTHS[dt.month - 1]} {dt.year}"


def display_time(value: str) -> str:
    dt = parse_iso(value)
    return f"{dt.hour:02d}:{dt.minute:02d}"


def display_datetime(value: str) -> str:
    return f"{display_date(value)}, {display_time(value)}"


def plain(value: str) -> str:
    text = re.sub(r"<br\s*/?>", "\n", value or "")
    text = re.sub(r"<[^>]+>", "", text)
    return html.unescape(text)


def esc(value: str) -> str:
    return html.escape(value or "", quote=True)


def font_face(family: str, weight: int, filename: str, fonts_dir: Path) -> str:
    data = base64.b64encode((fonts_dir / filename).read_bytes()).decode("ascii")
    return (
        "@font-face{font-family:'%s';font-style:normal;font-weight:%d;font-display:block;"
        "src:url(data:font/woff2;base64,%s) format('woff2');}" % (family, weight, data)
    )


def embedded_font_css(fonts_dir: Path) -> str:
    pieces = [
        font_face("Crimson Pro", 400, "crimson-pro-400.woff2", fonts_dir),
        font_face("Crimson Pro", 500, "crimson-pro-500.woff2", fonts_dir),
        font_face("Crimson Pro", 600, "crimson-pro-600.woff2", fonts_dir),
        font_face("Atkinson Hyperlegible", 400, "atkinson-400.woff2", fonts_dir),
        font_face("Atkinson Hyperlegible", 700, "atkinson-700.woff2", fonts_dir),
        font_face("IBM Plex Mono", 400, "plex-mono-400.woff2", fonts_dir),
        font_face("IBM Plex Mono", 500, "plex-mono-500.woff2", fonts_dir),
    ]
    return "".join(pieces)


def base_css(fonts_dir: Path) -> str:
    return f"""
{embedded_font_css(fonts_dir)}
* {{ box-sizing: border-box; }}
html, body {{ margin: 0; padding: 0; background: {PAPER}; }}
body {{
  font-family: 'Atkinson Hyperlegible', system-ui, sans-serif;
  font-size: 10pt; line-height: 1.5; color: {INK};
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}}
h1, h2, h3 {{ margin: 0; font-weight: 400; }}
p {{ margin: 0; }}
.mono {{ font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }}
.label {{ font-family: 'IBM Plex Mono', monospace; font-size: 7.5pt; line-height: 10pt; font-weight: 500;
         letter-spacing: .08em; text-transform: uppercase; color: {MUTED}; }}
.muted {{ color: {MUTED}; }}
.pine {{ color: {PINE}; }}
.amber {{ color: {AMBER}; }}
.brick {{ color: {BRICK}; }}
.rule {{ border: 0; border-top: .5pt solid {HAIRLINE}; margin: 0; }}
.nowrap {{ white-space: nowrap; }}
.sr {{ position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }}
.pb {{ break-after: page; page-break-after: always; }}
.avoid {{ break-inside: avoid; page-break-inside: avoid; }}
"""


def header_template(doc_type: str, fonts_dir: Path, warning: bool = False) -> str:
    font_css = embedded_font_css(fonts_dir)
    warn_html = (
        f'<div style="font-family:\'IBM Plex Mono\',monospace;font-size:6.5pt;line-height:10pt;'
        f'letter-spacing:.08em;text-transform:uppercase;color:{AMBER};margin-top:1.6mm;white-space:nowrap;">'
        "Personal — contains the answer key</div>"
        if warning
        else ""
    )
    return f"""
<style>
{font_css}
* {{ box-sizing: border-box; }}
body {{ margin: 0; padding: 0; width: 210mm; }}
.h {{ width: 210mm; padding: 6mm 20mm 0; height: 42mm; }}
.row {{ width: 170mm; display: flex; justify-content: space-between; align-items: flex-start; gap: 8mm; }}
.brand {{ display: flex; align-items: flex-start; gap: 3mm; flex: 0 1 auto; }}
.mark {{ width: 10mm; height: 10mm; background: {INK}; color: {PAPER};
         font-family: 'Crimson Pro', Georgia, serif; font-weight: 600; font-size: 17pt;
         line-height: 10mm; text-align: center; }}
.name {{ font-family: 'Atkinson Hyperlegible', sans-serif; font-size: 11pt; line-height: 13pt; font-weight: 700; }}
.office {{ font-family: 'Atkinson Hyperlegible', sans-serif; font-size: 8pt; line-height: 11pt; color: {MUTED}; margin-top: 1.2mm; }}
.type {{ font-family: 'IBM Plex Mono', monospace; font-size: 7.5pt; line-height: 10pt; font-weight: 500;
         letter-spacing: .08em; text-transform: uppercase; color: {MUTED}; padding-top: 1mm;
         flex: 0 0 auto; text-align: right; white-space: nowrap; }}
.rule {{ margin-top: 6mm; border-top: .5pt solid {HAIRLINE}; }}
</style>
<div class="h">
  <div class="row">
    <div class="brand">
      <svg width="10mm" height="10mm" viewBox="0 0 40 40" role="img" aria-label="CCF NIFES">
        <title>CCF NIFES</title>
        <rect width="40" height="40" fill="#171A18"/>
        <text x="20" y="29" text-anchor="middle" font-family="Crimson Pro, Georgia, serif"
              font-size="26" font-weight="600" fill="#FFFFFF">C</text>
      </svg>
      <div>
        <div class="name">CCF NIFES</div>
        <div class="office">Examinations Committee</div>
      </div>
    </div>
    <div class="type">{esc(doc_type)}{warn_html}</div>
  </div>
  <div class="rule"></div>
</div>
"""


def footer_template(reference: str, generated: str, review: bool, fonts_dir: Path) -> str:
    font_css = font_face("IBM Plex Mono", 400, "plex-mono-400.woff2", fonts_dir) + font_face(
        "IBM Plex Mono", 500, "plex-mono-500.woff2", fonts_dir
    )
    centre = (
        f'<div style="flex:1;text-align:center;color:{AMBER};font-size:7.5pt;white-space:nowrap;">'
        "PERSONAL — CONTAINS THE ANSWER KEY</div>"
        if review
        else '<div style="flex:1;"></div>'
    )
    return f"""
<style>
{font_css}
* {{ box-sizing: border-box; }}
body {{ margin: 0; padding: 0; width: 210mm; }}
.f {{ width: 210mm; padding: 0 20mm; height: 24mm; }}
.rule {{ border-top: .5pt solid {HAIRLINE}; }}
.row {{ width: 170mm; padding-top: 4mm; display: flex; align-items: baseline;
        font-family: 'IBM Plex Mono', monospace; font-size: 7.5pt; line-height: 10pt; color: {MUTED}; }}
.left {{ flex: 0 0 auto; }}
.right {{ flex: 0 0 auto; text-align: right; color: {INK}; }}
</style>
<div class="f">
  <div class="rule"></div>
  <div class="row">
    <div class="left">{esc(reference)} · Generated {esc(generated)}</div>
    {centre}
    <div class="right">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
  </div>
</div>
"""


def result_band(result: dict) -> str:
    return f"""
<table class="band" style="width:170mm;border-collapse:collapse;border-top:.5pt solid {HAIRLINE};
       border-bottom:.5pt solid {HAIRLINE};margin:0;">
  <tr>
    <td style="width:50mm;padding:3mm 0 3mm 0;vertical-align:bottom;">
      <div class="label">Score</div>
      <div class="mono" style="font-size:30pt;line-height:32pt;font-weight:500;">{result['score']} / {result['total']}</div>
    </td>
    <td style="padding:3mm 0;vertical-align:bottom;">
      <div class="label">Percentage</div>
      <div class="mono" style="font-size:14pt;line-height:18pt;">{result['percentage']:.1f}%</div>
    </td>
    <td style="padding:3mm 0;vertical-align:bottom;">
      <div class="label">Grade</div>
      <div class="mono" style="font-size:14pt;line-height:18pt;">{esc(result['grade'])}</div>
    </td>
    <td style="padding:3mm 0;vertical-align:bottom;">
      <div class="label">Outcome</div>
      <div style="font-size:14pt;line-height:18pt;">{esc(result['outcome'])}</div>
    </td>
  </tr>
</table>
"""


def topic_rows(topics: list[dict], half: int) -> str:
    rows = []
    for topic in topics:
        rows.append(
            "<tr>"
            f'<td style="padding:1.4mm 0;border-top:.5pt solid {HAIRLINE};">{esc(topic["label"])}</td>'
            f'<td class="mono" style="padding:1.4mm 0;border-top:.5pt solid {HAIRLINE};text-align:right;">{topic["questions"]}</td>'
            f'<td class="mono" style="padding:1.4mm 0;border-top:.5pt solid {HAIRLINE};text-align:right;">{topic["correct"]}</td>'
            f'<td class="mono" style="padding:1.4mm 0;border-top:.5pt solid {HAIRLINE};text-align:right;">{topic["percentage"]:.1f}</td>'
            "</tr>"
        )
    return "".join(rows)


def topic_table_official(topics: list[dict], result: dict) -> str:
    if len(topics) > 12:
        strongest = sorted(topics, key=lambda t: t["questions"], reverse=True)[:11]
        shown = strongest + [
            {
                "label": "Other topics",
                "questions": sum(t["questions"] for t in topics) - sum(t["questions"] for t in strongest),
                "correct": sum(t["correct"] for t in topics) - sum(t["correct"] for t in strongest),
                "percentage": 0,
            }
        ]
        other = shown[-1]
        if other["questions"]:
            other["percentage"] = round(other["correct"] / other["questions"] * 100, 1)
    else:
        shown = topics

    split = min(6, math.ceil(len(shown) / 2)) if shown else 0
    left = shown[:split]
    right = shown[split : split + 6]

    def half(items: list[dict], nrows: int) -> str:
        body = topic_rows(items, 6)
        if len(items) < nrows:
            body += "".join(
                f'<tr><td colspan="4" style="height:5.5mm;border-top:.5pt solid {HAIRLINE};"></td></tr>'
                for _ in range(nrows - len(items))
            )
        return f"""
<table style="width:80mm;border-collapse:collapse;">
  <thead>
    <tr>
      <th scope="col" class="label" style="width:44mm;text-align:left;padding-bottom:1.4mm;border-bottom:.5pt solid {HAIRLINE};">Topic</th>
      <th scope="col" class="label" style="width:12mm;text-align:right;padding-bottom:1.4mm;border-bottom:.5pt solid {HAIRLINE};">Q</th>
      <th scope="col" class="label" style="width:12mm;text-align:right;padding-bottom:1.4mm;border-bottom:.5pt solid {HAIRLINE};">C</th>
      <th scope="col" class="label" style="width:12mm;text-align:right;padding-bottom:1.4mm;border-bottom:.5pt solid {HAIRLINE};">%</th>
    </tr>
  </thead>
  <tbody>{body}</tbody>
</table>
"""

    rows_needed = max(len(left), len(right))
    return f"""
<h2 style="font-family:'Crimson Pro',serif;font-size:14pt;line-height:18pt;margin-bottom:3mm;">Performance by topic</h2>
<table style="width:170mm;border-collapse:collapse;"><tr>
  <td style="width:80mm;vertical-align:top;padding:0;">{half(left, rows_needed)}</td>
  <td style="width:10mm;"></td>
  <td style="width:80mm;vertical-align:top;padding:0;">{half(right, rows_needed)}</td>
</tr></table>
<table style="width:170mm;border-collapse:collapse;margin-top:0;">
  <tr>
    <td style="padding:2mm 0;border-top:.75pt solid {INK};font-weight:700;">Total</td>
    <td class="mono" style="width:24mm;padding:2mm 0;border-top:.75pt solid {INK};text-align:right;">{result['total']}</td>
    <td class="mono" style="width:24mm;padding:2mm 0;border-top:.75pt solid {INK};text-align:right;">{result['score']}</td>
    <td class="mono" style="width:28mm;padding:2mm 0;border-top:.75pt solid {INK};text-align:right;">{result['percentage']:.1f}</td>
  </tr>
</table>
"""


def topic_table_review(topics: list[dict], result: dict) -> str:
    rows = "".join(
        f"""
        <tr>
          <td style="padding:1.7mm 0;border-top:.5pt solid {HAIRLINE};">{esc(t['label'])}</td>
          <td class="mono" style="padding:1.7mm 0;border-top:.5pt solid {HAIRLINE};text-align:right;">{t['questions']}</td>
          <td class="mono" style="padding:1.7mm 0;border-top:.5pt solid {HAIRLINE};text-align:right;">{t['correct']}</td>
          <td class="mono" style="padding:1.7mm 0;border-top:.5pt solid {HAIRLINE};text-align:right;">{t['percentage']:.1f}</td>
        </tr>
        """
        for t in topics
    )
    return f"""
<h2 style="font-family:'Crimson Pro',serif;font-size:14pt;line-height:18pt;margin-bottom:3mm;">Performance by topic</h2>
<table style="width:170mm;border-collapse:collapse;">
  <thead>
    <tr>
      <th scope="col" class="label" style="text-align:left;padding-bottom:1.4mm;border-bottom:.5pt solid {HAIRLINE};">Topic</th>
      <th scope="col" class="label" style="width:24mm;text-align:right;padding-bottom:1.4mm;border-bottom:.5pt solid {HAIRLINE};">Questions</th>
      <th scope="col" class="label" style="width:24mm;text-align:right;padding-bottom:1.4mm;border-bottom:.5pt solid {HAIRLINE};">Correct</th>
      <th scope="col" class="label" style="width:24mm;text-align:right;padding-bottom:1.4mm;border-bottom:.5pt solid {HAIRLINE};">%</th>
    </tr>
  </thead>
  <tbody>{rows}</tbody>
  <tfoot>
    <tr>
      <td style="padding:2mm 0;border-top:.75pt solid {INK};font-weight:700;">Total</td>
      <td class="mono" style="padding:2mm 0;border-top:.75pt solid {INK};text-align:right;">{result['total']}</td>
      <td class="mono" style="padding:2mm 0;border-top:.75pt solid {INK};text-align:right;">{result['score']}</td>
      <td class="mono" style="padding:2mm 0;border-top:.75pt solid {INK};text-align:right;">{result['percentage']:.1f}</td>
    </tr>
  </tfoot>
</table>
"""


def qr_svg(url: str) -> str:
    import qrcode
    import qrcode.image.svg

    qr = qrcode.QRCode(version=None, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=0)
    qr.add_data(url)
    qr.make(fit=True)
    image = qr.make_image(image_factory=qrcode.image.svg.SvgPathImage)
    raw = image.to_string().decode("utf-8")
    inner = re.search(r"<svg[^>]*>(.*)</svg>", raw, re.S)
    viewbox = re.search(r'viewBox="([^"]+)"', raw)
    box = viewbox.group(1) if viewbox else "0 0 33 33"
    body = inner.group(1) if inner else raw
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}" width="22mm" height="22mm" '
        f'role="img" aria-label="QR code to verify this result at {esc(url)}">'
        f"<title>QR code to verify this result at {esc(url)}</title>"
        f'<rect x="0" y="0" width="100%" height="100%" fill="{PAPER}"/>'
        f'<g fill="{INK}">{body}</g></svg>'
    )


def meta_fields(snapshot: dict) -> tuple[dict, dict]:
    candidate = snapshot["candidate"]
    exam = snapshot["exam"]
    cand = [
        ("Name", candidate.get("name") or "—"),
        ("ID", candidate.get("id") or "—"),
        ("Programme", candidate.get("programme") or "—"),
        ("Cohort", candidate.get("cohort") or "—"),
    ]
    exam_rows = [
        ("Course", exam.get("courseCode") or "—"),
        ("Paper", exam.get("paperTitle") or "—"),
        ("Date", display_date(exam.get("date"))),
        ("Start time", display_time(exam.get("startedAt"))),
        ("Duration", f"{exam.get('durationMinutes')} minutes"),
        ("Questions", str(exam.get("questions"))),
        ("Total marks", str(exam.get("totalMarks"))),
    ]
    return dict(cand), dict(exam_rows)


def meta_table(rows: dict) -> str:
    body = "".join(
        f"""
        <tr>
          <th scope="row" class="label" style="width:26mm;text-align:left;padding:1.1mm 0;font-weight:500;">{esc(k)}</th>
          <td style="padding:1.1mm 0;vertical-align:top;">{esc(v)}</td>
        </tr>
        """
        for k, v in rows.items()
    )
    return f'<table style="width:80mm;border-collapse:collapse;">{body}</table>'


def official_html(snapshot: dict, fonts_dir: Path) -> str:
    result = snapshot["result"]
    cand, exam = meta_fields(snapshot)
    reference = snapshot["reference"]
    verify_url = snapshot["verification"]["url"]
    generated = display_datetime(snapshot["generatedAt"])
    topics = snapshot["topics"]

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>CHE 101 Mid-semester Examination — Official Record</title>
<meta name="author" content="CCF NIFES">
<meta name="description" content="Official examination result, reference {esc(reference)}">
<meta name="keywords" content="examination, result, CHE 101">
<style>
{base_css(fonts_dir)}
.page {{ padding-top: 2mm; }}
.title {{ font-family:'Crimson Pro',serif; font-size:24pt; line-height:28pt; }}
.subtitle {{ font-size:10pt; line-height:15pt; color:{MUTED}; margin-top:1.2mm; }}
.pine-rule {{ width:40mm; border-top:1.5mm solid {PINE}; margin-top:4mm; }}
.meta {{ margin-top:7mm; }}
.section {{ margin-top:6mm; }}
.declaration {{ margin-top:6mm; font-size:8.5pt; line-height:12pt; color:{MUTED}; max-width:150mm; }}
.verify {{ margin-top:6mm; width:170mm; border-collapse:collapse; }}
.verify td {{ vertical-align:top; }}
.verify .ref {{ font-family:'IBM Plex Mono',monospace; font-size:9pt; line-height:13pt; font-weight:500; }}
.verify .url {{ font-family:'IBM Plex Mono',monospace; font-size:8.5pt; line-height:12pt; color:{INK}; }}
.verify a {{ color:{INK}; text-decoration:none; }}
.verify .stamp {{ font-family:'IBM Plex Mono',monospace; font-size:8.5pt; line-height:12pt; color:{MUTED}; }}
</style>
</head>
<body>
<main class="page">
  <h1 class="title">Examination Result</h1>
  <div class="subtitle">{esc(snapshot['exam']['courseCode'])} · {esc(snapshot['exam']['courseTitle'])}</div>
  <div class="pine-rule"></div>

  <table class="meta" style="width:170mm;border-collapse:collapse;"><tr>
    <td style="width:80mm;vertical-align:top;padding:0;">
      <div class="label" style="padding-bottom:2mm;">Candidate</div>
      {meta_table(cand)}
    </td>
    <td style="width:10mm;"></td>
    <td style="width:80mm;vertical-align:top;padding:0;">
      <div class="label" style="padding-bottom:2mm;">Examination</div>
      {meta_table(exam)}
    </td>
  </tr></table>

  <div class="section">{result_band(result)}</div>
  <div class="section">{topic_table_official(topics, result)}</div>

  <p class="declaration">This record is generated from the examination system and is valid when verified at the address below.</p>

  <table class="verify"><tr>
    <td style="width:120mm;">
      <div class="label">Reference</div>
      <div class="ref">{esc(reference)}</div>
      <div style="height:3mm;"></div>
      <div class="label">Verify</div>
      <div class="url"><a href="{esc(verify_url)}">{esc(verify_url)}</a></div>
      <div style="height:3mm;"></div>
      <div class="label">Generated</div>
      <div class="stamp">{esc(generated)}</div>
    </td>
    <td style="width:50mm;text-align:right;">
      <figure style="margin:0;display:inline-block;">{qr_svg(verify_url)}</figure>
    </td>
  </tr></table>
</main>
</body>
</html>
"""


def option_lines(text_plain: str, chars: int = 78) -> int:
    if not text_plain:
        return 1
    return sum(max(1, math.ceil(len(segment) / chars)) for segment in text_plain.split("\n"))


def block_height(question: dict) -> float:
    stem_lines = option_lines(plain(question["stemHtml"]), 90)
    height = 16 + 5 + stem_lines * 5.1 + 5
    for option in question["options"]:
        height += 4.5 + (option_lines(plain(option["html"]), 80) - 1) * 4.8
    return max(38.0, height)


def paginate_questions(questions: list[dict]) -> list[list[dict]]:
    pages: list[list[dict]] = []
    current: list[dict] = []
    used = 0.0
    for question in questions:
        height = block_height(question)
        stem_lines = option_lines(plain(question["stemHtml"]), 90)
        limit = 3 if any(option_lines(plain(q["stemHtml"]), 90) > 4 for q in current + [question]) else 4
        if current and (used + height > 229 or len(current) >= limit):
            pages.append(current)
            current = []
            used = 0.0
            limit = 3 if stem_lines > 4 else 4
        current.append(question)
        used += height
        if len(current) >= limit:
            pages.append(current)
            current = []
            used = 0.0
    if current:
        pages.append(current)
    return pages


def question_block(question: dict) -> str:
    outcome = question["outcome"]
    if outcome == "correct":
        outcome_html = f'<span class="mono" style="font-size:7.5pt;letter-spacing:.08em;color:{PINE};">CORRECT</span>'
    elif outcome == "unanswered":
        outcome_html = f'<span class="mono" style="font-size:7.5pt;letter-spacing:.08em;color:{AMBER};">UNANSWERED</span>'
    else:
        outcome_html = f'<span class="mono" style="font-size:7.5pt;letter-spacing:.08em;color:{BRICK};">INCORRECT</span>'

    rows = []
    for option in question["options"]:
        chosen = option["chosen"]
        correct = option["correct"]
        if chosen and correct:
            label = "YOUR ANSWER · CORRECT"
            colour = PINE
        elif chosen:
            label = "YOUR ANSWER"
            colour = BRICK
        elif correct:
            label = "CORRECT ANSWER"
            colour = PINE
        else:
            label = ""
            colour = MUTED
        marker = (
            f"border-left:1mm solid {PINE if correct and chosen else BRICK};padding-left:2mm;"
            if chosen
            else "border-left:1mm solid transparent;padding-left:2mm;"
        )
        rows.append(
            f"""
            <li style="display:flex;align-items:baseline;margin-top:1.6mm;{marker}">
              <span class="mono" style="flex:0 0 6mm;font-size:9.5pt;color:{MUTED};">{esc(option['letter'])}</span>
              <span style="flex:1;font-size:9.5pt;line-height:13.5pt;">{option['html']}</span>
              <span class="mono" style="flex:0 0 54mm;text-align:right;font-size:6.5pt;line-height:10pt;
                    letter-spacing:.06em;color:{colour};">{label}</span>
            </li>
            """
        )

    return f"""
    <section class="avoid" style="padding:8mm 0;border-bottom:.5pt solid {HAIRLINE};">
      <div style="display:flex;align-items:baseline;justify-content:space-between;">
        <div>
          <span class="mono pine" style="font-size:9pt;font-weight:500;">Q{question['n']:02d}</span>
          <span style="font-size:8pt;color:{MUTED};margin-left:4mm;">{esc(question['topicLabel'])}</span>
        </div>
        {outcome_html}
      </div>
      <div class="stem" style="font-family:'Crimson Pro',serif;font-size:10.5pt;line-height:14.5pt;margin-top:5mm;">
        {question['stemHtml']}
      </div>
      <ol style="list-style:none;margin:4mm 0 0;padding:0;">
        {''.join(rows)}
      </ol>
    </section>
    """


def review_html(snapshot: dict, fonts_dir: Path) -> str:
    result = snapshot["result"]
    exam = snapshot["exam"]
    candidate = snapshot["candidate"]
    reference = snapshot["reference"]
    date = display_date(exam.get("date"))
    blocks = "".join(question_block(q) for q in snapshot["questions"])

    summary = f"""
    <div class="pb" style="padding-top:2mm;">
      <h1 style="font-family:'Crimson Pro',serif;font-size:24pt;line-height:28pt;">Detailed Review</h1>
      <div style="font-size:10pt;line-height:15pt;color:{MUTED};margin-top:1.2mm;">
        {esc(exam['courseCode'])} · {esc(exam['courseTitle'])} · {esc(exam['paperTitle'])}
      </div>
      <div style="font-size:10pt;line-height:15pt;margin-top:1mm;">
        {esc(candidate.get('name'))} · {esc(candidate.get('id'))} · {esc(date)}
      </div>
      <div style="width:40mm;border-top:1.5mm solid {PINE};margin-top:4mm;"></div>

      <div style="margin-top:7mm;">{result_band(result)}</div>
      <div style="margin-top:6mm;">{topic_table_review(snapshot['topics'], result)}</div>

      <div style="margin-top:11mm;">
        <div style="border-top:.5pt solid {HAIRLINE};padding-top:4mm;"></div>
        <div class="label" style="margin-bottom:2mm;">How to read this document</div>
        <p style="font-size:8.5pt;line-height:12pt;color:{MUTED};margin-top:0;max-width:150mm;">
          Each question shows your answer and the correct answer. A question you left blank is marked Unanswered.
          This document contains the answer key. Do not share it.
        </p>
      </div>
    </div>
    """

    end = f"""
    <div id="end-of-review" style="break-inside:avoid;padding-top:12mm;">
      <div style="width:20mm;border-top:.75pt solid {INK};"></div>
      <div class="mono" style="font-size:8pt;color:{MUTED};margin-top:3mm;">End of review · {esc(reference)}</div>
    </div>
    """

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>CHE 101 Mid-semester Examination — Detailed Review</title>
<meta name="author" content="CCF NIFES">
<meta name="description" content="Detailed answer review, reference {esc(reference)}">
<meta name="keywords" content="examination, review, CHE 101">
<style>
{base_css(fonts_dir)}
body {{ width: 170mm; }}
.stem {{ font-family:'Crimson Pro',serif;font-size:10.5pt;line-height:14.5pt;margin-top:5mm; }}
</style>
</head>
<body>
<main id="review-main">
{summary}
<div id="review-flow">{blocks}</div>
{end}
</main>
</body>
</html>
"""


PREPARE_REVIEW_JS = r"""
() => {
  const main = document.getElementById('review-main');
  const flow = document.getElementById('review-flow');
  const end = document.getElementById('end-of-review');
  const sections = Array.from(flow.children);
  const MAX = (227 / 25.4) * 96;
  const stemLine = (14.5 / 72) * 96;
  const isLong = (section) => {
    const stem = section.querySelector('.stem');
    return Boolean(stem) && stem.getBoundingClientRect().height > 4 * stemLine;
  };
  const limitFor = (blocks) => (blocks.some(isLong) ? 3 : 4);

  const pages = [];
  let current = [];
  let used = 0;
  for (const section of sections) {
    const height = section.getBoundingClientRect().height;
    const limit = limitFor(current.concat([section]));
    if (current.length && (used + height > MAX || current.length >= limit)) {
      pages.push(current);
      current = [];
      used = 0;
    }
    current.push(section);
    used += height;
    const nextLimit = limitFor(current);
    if (current.length >= nextLimit) {
      pages.push(current);
      current = [];
      used = 0;
    }
  }
  if (current.length) pages.push(current);

  flow.remove();
  pages.forEach((blocks, index) => {
    const page = document.createElement('div');
    page.className = index < pages.length - 1 ? 'review-page pb' : 'review-page';
    page.style.paddingTop = '2mm';
    for (const block of blocks) page.appendChild(block);
    if (index === pages.length - 1 && end) page.appendChild(end);
    main.appendChild(page);
  });
  if (end) end.style.display = 'block';
  return pages.map((blocks) => blocks.length);
}
"""


def render_pdf(html_text: str, out_path: Path, header: str, footer: str, playwright, prepare=None) -> int:
    browser = None
    try:
        browser = playwright.chromium.launch()
    except Exception:
        browser = playwright.chromium.launch(channel="chrome")
    try:
        page = browser.new_page(viewport={"width": 643, "height": 1000})
        page.set_content(html_text, wait_until="load")
        page.evaluate("document.fonts.ready")
        page.emulate_media(media="print")
        if prepare is not None:
            page.evaluate(prepare)
        page.pdf(
            path=str(out_path),
            format="A4",
            print_background=True,
            display_header_footer=True,
            header_template=header,
            footer_template=footer,
            margin={"top": "42mm", "bottom": "24mm", "left": "20mm", "right": "20mm"},
            prefer_css_page_size=False,
            tagged=True,
        )
        return len(PdfReader(str(out_path)).pages)
    finally:
        if browser is not None:
            browser.close()


def assert_review_text(path: Path, snapshot: dict) -> None:
    reader = PdfReader(str(path))
    text = "\n".join((page.extract_text() or "") for page in reader.pages)
    missing = [
        q["n"] for q in snapshot["questions"] if f"Q{q['n']:02d}" not in text
    ]
    if missing:
        raise RuntimeError(f"review is missing question numbers: {missing[:10]}")
    if "contains the answer key" not in text:
        raise RuntimeError("review is missing the answer-key warning")
    if "CORRECT ANSWER" not in text and snapshot["result"]["score"] < snapshot["result"]["total"]:
        raise RuntimeError("review is missing correct-answer labels")


def assert_official_text(path: Path, snapshot: dict) -> None:
    reader = PdfReader(str(path))
    text = "\n".join((page.extract_text() or "") for page in reader.pages)
    forbidden = ["CORRECT ANSWER", "YOUR ANSWER", "UNANSWERED", "contains the answer key"]
    for word in forbidden:
        if word in text:
            raise RuntimeError(f"official record contains review-only content: {word}")
    if snapshot["reference"] not in text:
        raise RuntimeError("official record is missing its reference")
    if "Examination Result" not in text:
        raise RuntimeError("official record is missing its title")


DOC_META = {
    "official": {
        "title": "CHE 101 Mid-semester Examination — Official Record",
        "subject": "Official examination result, reference {reference}",
        "keywords": "examination, result, CHE 101",
    },
    "review": {
        "title": "CHE 101 Mid-semester Examination — Detailed Review",
        "subject": "Detailed answer review, reference {reference}",
        "keywords": "examination, review, CHE 101",
    },
}


def apply_metadata(path: Path, kind: str, reference: str) -> None:
    """Chromium sets only Title/Creator/Producer; the rest is written here.

    No score, percentage, grade, or outcome is ever placed in the metadata.
    """
    from pypdf import PdfWriter
    from pypdf.generic import NameObject, TextStringObject

    meta = DOC_META[kind]
    reader = PdfReader(str(path))
    pages_before = len(reader.pages)
    writer = PdfWriter(clone_from=reader)
    writer.add_metadata(
        {
            "/Title": meta["title"],
            "/Author": "CCF NIFES",
            "/Subject": meta["subject"].format(reference=reference),
            "/Keywords": meta["keywords"],
            "/Creator": "CCF NIFES Examination System",
        }
    )
    writer._root_object.update({NameObject("/Lang"): TextStringObject("en")})
    tmp = path.with_name(path.stem + ".meta.pdf")
    with open(tmp, "wb") as handle:
        writer.write(handle)
    writer.close()
    check = PdfReader(str(tmp))
    if len(check.pages) != pages_before:
        raise RuntimeError(f"metadata pass changed page count for {path.name}")
    if "/StructTreeRoot" not in check.trailer["/Root"]:
        raise RuntimeError(f"metadata pass dropped the tag tree for {path.name}")
    tmp.replace(path)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--snapshot", required=True)
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--fonts", required=True)
    parser.add_argument("--kinds", default="official,review")
    args = parser.parse_args()

    snapshot_path = Path(args.snapshot)
    out_dir = Path(args.out_dir)
    fonts_dir = Path(args.fonts)
    out_dir.mkdir(parents=True, exist_ok=True)
    snapshot = json.loads(snapshot_path.read_text(encoding="utf-8"))
    kinds = [kind.strip() for kind in args.kinds.split(",") if kind.strip()]
    reference = snapshot["reference"]
    generated = display_datetime(snapshot["generatedAt"])

    documents: dict[str, dict] = {}
    with sync_playwright() as playwright:
        if "official" in kinds:
            out_path = out_dir / f"CHE101-mid-semester-official-record-{reference}.pdf"
            html_text = official_html(snapshot, fonts_dir)
            pages = render_pdf(
                html_text,
                out_path,
                header_template("OFFICIAL EXAMINATION RECORD", fonts_dir),
                footer_template(reference, generated, False, fonts_dir),
                playwright,
            )
            if pages != 1:
                raise RuntimeError(f"official record must be exactly one page, rendered {pages}")
            apply_metadata(out_path, "official", reference)
            assert_official_text(out_path, snapshot)
            documents["official"] = {
                "path": str(out_path),
                "pages": pages,
                "bytes": out_path.stat().st_size,
            }

        if "review" in kinds:
            out_path = out_dir / f"CHE101-mid-semester-review-{reference}.pdf"
            html_text = review_html(snapshot, fonts_dir)
            pages = render_pdf(
                html_text,
                out_path,
                header_template("DETAILED REVIEW", fonts_dir, warning=True),
                footer_template(reference, generated, True, fonts_dir),
                playwright,
                prepare=PREPARE_REVIEW_JS,
            )
            if pages < 2:
                raise RuntimeError(f"detailed review must include question pages, rendered {pages}")
            apply_metadata(out_path, "review", reference)
            assert_review_text(out_path, snapshot)
            documents["review"] = {
                "path": str(out_path),
                "pages": pages,
                "bytes": out_path.stat().st_size,
            }

    print(json.dumps({"ok": True, "documents": documents}))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as error:  # noqa: BLE001 - the parent process surfaces this
        print(json.dumps({"ok": False, "error": str(error)}))
        raise
