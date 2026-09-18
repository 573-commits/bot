// Kontrola všech témat: vygeneruje spoustu úloh a ověří, že jsou kompletní a platné.
// Spusť: node tools/check-topics.mjs
import { TOPICS, CATEGORIES } from '../js/topics/index.js';
import { makeRng } from '../js/core/util.js';
import { check } from '../js/core/checker.js';

const RUNS = Number(process.argv[2] || 40);
let tasks = 0, problems = 0;
const seen = new Set();

const fail = (msg) => { console.error('  ✗ ' + msg); problems++; };

for (const t of TOPICS) {
  for (const key of ['id', 'name', 'category', 'icon', 'description', 'levels', 'generate']) {
    if (t[key] == null) fail(`${t.id || '?'}: chybí "${key}"`);
  }
  if (seen.has(t.id)) fail(`duplicitní id "${t.id}"`);
  seen.add(t.id);
  if (!CATEGORIES.includes(t.category)) fail(`${t.id}: kategorie "${t.category}" není v CATEGORIES`);

  let bad = 0;
  for (let level = 1; level <= t.levels; level++) {
    for (let s = 0; s < RUNS; s++) {
      let q;
      try { q = t.generate(level, makeRng(s * 7919 + level * 131 + t.id.length)); }
      catch (e) { fail(`${t.id} L${level}: generate() spadlo – ${e.message}`); bad++; continue; }
      tasks++;
      if (!q?.prompt) { fail(`${t.id} L${level}: prázdné zadání`); bad++; continue; }
      if (!q.answer?.type) { fail(`${t.id} L${level}: chybí answer.type`); bad++; continue; }
      const v = q.answer.value;
      const nums = Array.isArray(v) ? v : [v];
      if (q.answer.type !== 'custom' && nums.some((x) => typeof x === 'number' && !Number.isFinite(x))) {
        fail(`${t.id} L${level}: odpověď není konečné číslo (${JSON.stringify(v)})`); bad++;
      }
      if (!q.hints?.length) fail(`${t.id} L${level}: žádná nápověda`);
      if (!q.solution?.length) fail(`${t.id} L${level}: žádný postup`);
      // správná odpověď musí projít vlastním kontrolorem
      if (['number', 'integer', 'fraction'].includes(q.answer.type)) {
        const d = q.answer.decimals;
        const typed = d != null ? v.toFixed(d) : String(v);
        if (!check(typed, q.answer).ok) { fail(`${t.id} L${level}: vlastní správná odpověď "${typed}" neprojde kontrolou`); bad++; }
      }
      if (['numberSet', 'numberList'].includes(q.answer.type)) {
        const d = q.answer.decimals;
        const typed = v.map((x) => (d != null ? x.toFixed(d) : String(x))).join('; ');
        if (!check(typed, q.answer).ok) { fail(`${t.id} L${level}: "${typed}" neprojde kontrolou`); bad++; }
      }
      if (q.answer.type === 'text') {
        const first = Array.isArray(q.answer.value) ? q.answer.value[0] : q.answer.value;
        if (!check(first, q.answer).ok) { fail(`${t.id} L${level}: "${first}" neprojde kontrolou`); bad++; }
      }
    }
  }
  console.log(`${bad ? '✗' : '✓'} ${t.id.padEnd(24)} ${t.levels} úrovní × ${RUNS} vzorků`);
}

console.log(`\nTémat: ${TOPICS.length} · vygenerovaných úloh: ${tasks} · problémů: ${problems}`);
process.exit(problems ? 1 : 0);
