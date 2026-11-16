'use strict';

/**
 * Chemistry typography for display and print.
 *
 * The bank is flat OCR text: H2O, 10-6, 400 oC. This module applies the
 * display typography the design requires (subscripts, superscripts, degree
 * signs, scientific notation) without altering the stored wording.
 *
 * Two paths:
 *  - renderPlain(): heuristic formatting for transcribed bank text.
 *  - renderMarked(): explicit `_{...}` / `^{...}` authoring used by the
 *    auditable overrides in bank/display-overrides.json.
 *
 * Output is escaped HTML. The client and the PDF renderer share it.
 */

const ELEMENTS = new Set([
  'H', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne',
  'Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar', 'K', 'Ca',
  'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
  'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr', 'Rb', 'Sr', 'Y', 'Zr',
  'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn',
  'Sb', 'Te', 'I', 'Xe', 'Cs', 'Ba', 'La', 'Ce', 'Pr', 'Nd',
  'Pm', 'Sm', 'Eu', 'Gd', 'Tb', 'Dy', 'Ho', 'Er', 'Tm', 'Yb',
  'Lu', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg',
  'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn', 'Fr', 'Ra', 'Ac', 'Th',
  'Pa', 'U', 'Np', 'Pu', 'Am', 'Cm', 'Bk', 'Cf', 'Es', 'Fm',
  'Md', 'No', 'Lr', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds',
  'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og',
]);

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseFormula(token) {
  let s = token;
  let charge = '';
  if (/[+-]$/.test(s)) {
    charge = s.slice(-1);
    s = s.slice(0, -1);
  }
  let lead = '';
  const leadMatch = /^\d+/.exec(s);
  if (leadMatch) {
    lead = leadMatch[0];
    s = s.slice(lead.length);
  }
  if (!s) return null;

  let i = 0;
  let out = '';
  let elements = 0;
  let digits = false;

  while (i < s.length) {
    const c = s[i];
    if (c === '(') {
      out += '(';
      i += 1;
      continue;
    }
    if (c === ')') {
      out += ')';
      i += 1;
      const d = /^\d+/.exec(s.slice(i));
      if (d) {
        out += `<sub>${d[0]}</sub>`;
        i += d[0].length;
        digits = true;
      }
      continue;
    }
    const em = /^[A-Z][a-z]?/.exec(s.slice(i));
    if (!em || !ELEMENTS.has(em[0])) return null;
    out += em[0];
    i += em[0].length;
    elements += 1;
    const d = /^\d+/.exec(s.slice(i));
    if (d) {
      out += `<sub>${d[0]}</sub>`;
      i += d[0].length;
      digits = true;
    }
  }
  if (elements === 0) return null;
  if (!digits && !charge) return null;
  if (charge) out += `<sup>${charge === '-' ? '−' : '+'}</sup>`;
  return lead + out;
}

function formatPlain(text) {
  let s = esc(text);

  // Scientific notation: 6.02 x 10-23, 1.4 x 105.
  s = s.replace(/(\d)\s*[x×]\s*10\s*(-)?\s*(\d+)/gi, (_, a, minus, exp) => {
    return `${a} × 10<sup>${minus ? '−' : ''}${exp}</sup>`;
  });
  s = s.replace(/<\/sup>(?=[A-Za-z])/g, '</sup> ');

  // Temperatures.
  s = s.replace(/(\d)\s*oC\b/g, '$1 °C');

  // Negative powers in units: s-1, mol-2, dm-3.
  s = s.replace(/\b(mol|s|cm|dm|kg|L)\s*-\s*(\d+)\b/g, '$1<sup>−$2</sup>');
  // Litre squared in rate-constant units.
  s = s.replace(/\bL2\b(?=\s*(?:mol|s)\b)/g, 'L<sup>2</sup>');

  // Electron configurations: 1s2 2s2 2p6, and ns2np4.
  s = s.replace(/\bns(\d+)np(\d+)\b/g, 'ns<sup>$1</sup>np<sup>$2</sup>');
  s = s.replace(/\b([1-7])([spdf])(\d+)\b/g, '$1$2<sup>$3</sup>');

  // Orbital labels.
  s = s.replace(/\bdx2\s*-\s*y2\b/g, 'd<sub>x²−y²</sub>');
  s = s.replace(/\bdz2\b/g, 'd<sub>z²</sub>');
  s = s.replace(/\bdxy\b/g, 'd<sub>xy</sub>');
  s = s.replace(/\bdyz\b/g, 'd<sub>yz</sub>');
  s = s.replace(/\bdxz\b/g, 'd<sub>xz</sub>');
  s = s.replace(/\bpx\b/g, 'p<sub>x</sub>');
  s = s.replace(/\bpy\b/g, 'p<sub>y</sub>');
  s = s.replace(/\bpz\b/g, 'p<sub>z</sub>');

  // Named quantities.
  s = s.replace(/\b([KQ])([cp])\b/g, '$1<sub>$2</sub>');
  s = s.replace(/\bEa\b/g, 'E<sub>a</sub>');
  s = s.replace(/\bGo\b/g, 'ΔG°');
  s = s.replace(/\bn0\b/g, 'n<sup>0</sup>');

  // Chemical formulas. Tokens are validated against the element table, so
  // ordinary words are left alone.
  s = s.replace(/\d*[A-Za-z][A-Za-z0-9()]*[+-]?/g, (token) => {
    const parsed = parseFormula(token);
    return parsed === null ? token : parsed;
  });

  // Concentration terms: [SO2]2 is concentration squared, not SO2 subscript 2.
  s = s.replace(/\](\d+)/g, ']<sup>$1</sup>');

  // Charged species without a digit: K+, Cl-, OH-.
  s = s.replace(/\b(K|Na|Cl|H|OH|Li|Ca|Mg|Al|Fe|Cu|Zn|Ag)([+-])\b/g, (_, ion, sign) => {
    return `${ion}<sup>${sign === '-' ? '−' : '+'}</sup>`;
  });
  s = s.replace(/\be-(?=[\s),.;:])/g, 'e<sup>−</sup>');
  s = s.replace(/\bp\+(?=[\s),.;:])/g, 'p<sup>+</sup>');

  // Remaining variable subscripts: A2, A3, T1, k1, AB2.
  s = s.replace(/\b(?!CH\d)([A-Za-z]{1,3})(\d+)\b/g, '$1<sub>$2</sub>');

  return s.replace(/\n/g, '<br>');
}

function formatMarked(text) {
  let out = '';
  let last = 0;
  const re = /_\{([^}]*)\}|\^\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    out += esc(text.slice(last, m.index));
    if (m[1] !== undefined) out += `<sub>${esc(m[1])}</sub>`;
    else out += `<sup>${esc(m[2])}</sup>`;
    last = re.lastIndex;
  }
  out += esc(text.slice(last));
  return out.replace(/\n/g, '<br>');
}

function render(text, { marked = false } = {}) {
  return marked ? formatMarked(text) : formatPlain(text);
}

module.exports = { render, formatPlain, formatMarked, parseFormula, ELEMENTS };
