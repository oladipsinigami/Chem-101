# Chemistry 101 CBT — CCF NIFES

A zero-npm-dependency computer-based testing (CBT) examination platform for **Chemistry 101 (CHE 101)**, branded for **CCF NIFES**.

Designed with a strict security boundary, deterministic question quotas, an accessible modern interface ("Registry" design system), and dual-artifact PDF generation.

---

## Live Deployment

- **Production URL**: [https://chem-101.vercel.app](https://chem-101.vercel.app)
- **Deployment Platform**: Vercel (Edge CDN + Node.js Serverless Functions)
- **GitHub Repository**: [https://github.com/oladipsinigami/Chem-101](https://github.com/oladipsinigami/Chem-101)

---

## Highlights

- **Zero Runtime Dependencies**: The core exam service runs purely on Node.js built-ins (`node:http`, `node:fs`, `node:crypto`, `node:child_process`).
- **Strict Client/Server Isolation**: The browser client receives only questions and options. Correct answers, seeds, bank hashes, and scores never touch client memory or DOM.
- **Configurable Paper & Timing**:
  - Default: **40 questions** in **20 minutes** (configurable via `CHEM_PAPER_LENGTH` and `CHEM_DURATION_MINUTES`).
  - Proportional quota allocation across 5 core chemistry topics (Atomic Structure, Electronic Structure, Stoichiometry, Equilibrium, and Kinetics) using largest-remainder sampling.
  - Deterministic per-candidate randomization: option order is shuffled while referential options ("All of the above", "Both A and B") remain fixed in place.
- **Accessible, Resilient UI**:
  - Keyboard-first navigation (`A`–`F` select, `C` clear, `F` flag, `M` map, `S` submit, `←`/`→` navigation).
  - High-contrast light and dark themes with WCAG AA compliance.
  - Question map (right rail on desktop, slide-up sheet on mobile) with distinct states for Answered, Unanswered, Flagged, and Current questions.
  - Server-synchronized countdown timer with automatic graceful submission at time expiry.
- **Dual PDF Artifacts**:
  - **Official Examination Record**: Strictly 1 page A4 document with overall score, percentage, grade, topic performance breakdown, and verification QR code. Contains no question answers.
  - **Detailed Candidate Review**: Comprehensive multi-page breakdown comparing candidate choices with correct answers, marked with security warnings on every page.

---

## Repository Structure

```text
├── app/
│   ├── server.js            # HTTP server, routing, security headers & API endpoints
│   ├── lib/
│   │   ├── bank.js          # Question bank loader & display overrides validator
│   │   ├── chem.js          # Chemistry formula & notation typography formatter
│   │   ├── random.js        # Deterministic SHA-256 counter stream & Fisher-Yates shuffler
│   │   ├── scoring.js       # Server-side grading & topic score aggregator
│   │   └── store.js         # Atomic JSON persistence & snapshot manager
│   └── public/              # Vanilla HTML/CSS/JS frontend ("Registry" design system)
├── assets/
│   └── fonts/               # Self-hosted woff2 webfonts
├── bank/                    # Ingestion pipeline, transcribed questions & display manifests
├── data/                    # Attempt records and generated PDF results
├── design/                  # Comprehensive design specifications and redlines
├── pdf/
│   └── render.py            # Playwright + PyPDF A4 PDF rendering engine
├── tests/                   # Node.js and Python test suites
├── Chem 101 question.pdf    # Source examination question paper
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **Python** 3.10+ (for PDF rendering) with:
  ```bash
  pip install playwright pypdf qrcode
  playwright install chromium
  ```

### Running the Exam Service

Start the local CBT service on `http://127.0.0.1:5173`:

```bash
npm start
```

Custom port and duration options can be passed via environment variables:

```bash
PORT=8080 CHEM_PAPER_LENGTH=40 CHEM_DURATION_MINUTES=20 npm start
```

---

## Testing

Run the test suite using Node's built-in test runner:

```bash
# Unit & integration tests (bank, randomizer, store, client, server)
npm test

# End-to-end PDF rendering verification
npm run test:pdf
```

---

## License

Private / CCF NIFES Examinations Committee.
