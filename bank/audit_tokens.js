'use strict';
const fs = require('node:fs');
const { loadBank } = require('../app/lib/bank');

const bank = loadBank();
const pairs = new Map();

function unesc(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
function annotate(html) {
  return unesc(
    html
      .replace(/<sub>(.*?)<\/sub>/g, '_{$1}')
      .replace(/<sup>(.*?)<\/sup>/g, '^{$1}')
      .replace(/<br>/g, '\n')
  );
}
function tokens(s) {
  return s.match(/\S+/g) || [];
}

for (const item of bank.items) {
  const over = bank.overrides[item.id] || {};
  const fields = [];
  if (over.stem === undefined && over.stem_html === undefined) fields.push(['stem', item.stem, item.stemHtml]);
  item.options.forEach((base, i) => {
    if (!over.options || over.options[i] === undefined) fields.push([`opt${'ABCDE'[i]}`, base, item.optionsHtml[i]]);
  });
  for (const [where, raw, html] of fields) {
    const out = annotate(html);
    const a = tokens(raw);
    const b = tokens(out);
    if (a.length !== b.length) {
      pairs.set(`TOKENCOUNT ${item.id} ${where}`, `${raw}\n  => ${out}`);
      continue;
    }
    for (let i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) pairs.set(`${a[i]} => ${b[i]}`, `${item.id} ${where}`);
    }
  }
}

const lines = [];
for (const [pair, where] of pairs) lines.push(`${pair}\n    (${where})`);
fs.writeFileSync('bank/token-audit.txt', lines.join('\n\n'), 'utf8');
console.log(`${pairs.size} unique token changes`);
