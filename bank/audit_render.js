'use strict';
const fs = require('node:fs');
const { loadBank } = require('../app/lib/bank');
const { render } = require('../app/lib/chem');

const bank = loadBank();
const lines = [];
const strip = (s) => s.replace(/<[^>]+>/g, '');

for (const item of bank.items) {
  const over = bank.overrides[item.id] || {};
  const fields = [];
  if (over.stem === undefined && over.stem_html === undefined) {
    fields.push(['stem', item.stem, item.stemHtml]);
  }
  item.options.forEach((base, i) => {
    if (!over.options || over.options[i] === undefined) {
      fields.push([`opt${'ABCDE'[i]}`, base, item.optionsHtml[i]]);
    }
  });
  for (const [where, raw, html] of fields) {
    const plain = strip(html);
    if (plain !== raw) {
      lines.push(`${item.id} ${where}\n  RAW: ${raw}\n  OUT: ${plain}\n`);
    }
  }
}
fs.writeFileSync('bank/render-audit.txt', lines.join('\n'), 'utf8');
console.log(`${lines.length} changed fields written to bank/render-audit.txt`);
