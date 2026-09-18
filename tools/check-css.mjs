// Kontrola stylů: hlídá zanořené @media a duplicitní pravidla.
// Vzniklo poté, co se opakované automatické úpravy souboru zacyklily
// a zabalily pravidla pro mobil dovnitř media query pro širokou obrazovku.
// Spusť: node tools/check-css.mjs
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/clay.css', import.meta.url), 'utf8');
let fails = 0;
const ok = (cond, label, detail = '') => {
  console.log(`${cond ? '✓' : '✗'} ${label}${cond ? '' : '  → ' + detail}`);
  if (!cond) fails++;
};

/* ---------- struktura ---------- */
let depth = 0, minDepth = 0;
const nested = [];
css.split('\n').forEach((line, i) => {
  if (line.includes('@media') && depth > 0) nested.push(i + 1);
  depth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
  minDepth = Math.min(minDepth, depth);
});
ok(depth === 0, 'závorky jsou vyvážené', `konečná hloubka ${depth}`);
ok(minDepth >= 0, 'nikde se nezavírá víc, než je otevřeno');
ok(nested.length === 0, 'žádné zanořené @media', `řádky: ${nested.join(', ')}`);

/* ---------- duplicity na nejvyšší úrovni ---------- */
// varianty uvnitř @media a @supports jsou v pořádku, ty nás nezajímají
const top = css.replace(/@(?:media|supports)[^{]*\{(?:[^{}]|\{[^{}]*\})*\}/g, '');
const counts = {};
for (const m of top.matchAll(/^\s*([^@{}\n][^{\n]*?)\s*\{/gm)) {
  const sel = m[1].trim();
  if (sel.startsWith('/*') || /^(from|to|\d+%)$/.test(sel)) continue;
  counts[sel] = (counts[sel] || 0) + 1;
}
const dupes = Object.entries(counts).filter(([, n]) => n > 1);
ok(dupes.length === 0, 'žádný selektor není mimo @media definovaný dvakrát',
  dupes.map(([s, n]) => `${s} (${n}×)`).join(', '));

/* ---------- pravidla pro mobil nesmí uvíznout v desktopové media query ---------- */
const desktopBlocks = [];
for (const m of css.matchAll(/@media \(min-width: 860px\)[^{]*\{/g)) {
  let d = 0;
  for (let i = m.index; i < css.length; i++) {
    if (css[i] === '{') d++;
    else if (css[i] === '}') { d--; if (!d) { desktopBlocks.push([m.index, i]); break; } }
  }
}
const insideDesktop = (at) => desktopBlocks.some(([a, b]) => at > a && at < b);
for (const need of ['pointer: coarse', '.toast {', '.badge {', 'max-width: 400px', 'body::after']) {
  const all = [...css.matchAll(new RegExp(need.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))].map((m) => m.index);
  ok(all.length > 0 && all.some((at) => !insideDesktop(at)),
    `„${need}“ platí i mimo širokou obrazovku`, all.length ? 'je jen uvnitř' : 'chybí úplně');
}

console.log(`\nProblémů: ${fails}`);
process.exit(fails ? 1 : 0);
