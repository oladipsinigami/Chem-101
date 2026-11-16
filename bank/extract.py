"""Extract the question text from Chem 101 question.pdf in reading order."""
import subprocess, sys, re, pathlib

SRC = pathlib.Path(__file__).with_name("..") / "Chem 101 question.pdf"
OUT = pathlib.Path(__file__).with_name("chem101.txt")

raw = subprocess.run(["pdftotext", "-raw", str(SRC), "-"], capture_output=True).stdout.decode("utf-8", "replace")

AD = re.compile(r"(Polymer concept|BALOTOPST|BALOTOPSY|powered by|08169051017|Financial STABILTY|^PC\S* 0816)", re.I)
keep = []
for line in raw.splitlines():
    t = " ".join(line.split())
    if not t or AD.search(t):
        continue
    keep.append(t)

OUT.write_text("\n".join(keep), encoding="utf-8")
print("lines", len(keep))
