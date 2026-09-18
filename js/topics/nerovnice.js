import { fmt, coef, sgn, fracTex } from '../core/util.js';

export default {
  id: 'nerovnice',
  name: 'Nerovnice a intervaly',
  category: 'Algebra',
  icon: '<',
  description: 'Lineární i kvadratické nerovnice. Výsledek zapisuješ jako interval.',
  levels: 4,

  generate(level, rng) {
    if (level <= 2) {
      const a = rng.nz(level === 1 ? 1 : -7, 7), b = rng.nz(-10, 10), c = rng.int(-10, 10);
      const rel = rng.pick(['<', '>', '\\le', '\\ge']);
      const bound = (c - b) / a;
      const flipped = a < 0;
      const plain = { '<': '<', '>': '>', '\\le': '≤', '\\ge': '≥' }[rel];
      // po dělení a: pokud a<0, otočí se znaménko
      const finalRel = flipped ? { '<': '>', '>': '<', '≤': '≥', '≥': '≤' }[plain] : plain;
      const lower = finalRel === '>' || finalRel === '≥';
      const closed = finalRel === '≥' || finalRel === '≤';
      const bTex = fracTex(c - b, a);
      const iv = lower
        ? `(${bTex};\\infty)`.replace('(', closed ? '\\langle ' : '(')
        : `(-\\infty;${bTex})`.replace(/\)$/, closed ? '\\rangle' : ')');
      const plainIv = lower ? `${closed ? '<' : '('}${fmt(bound)};inf)` : `(-inf;${fmt(bound)}${closed ? '>' : ')'}`;
      return {
        prompt: `Vyřeš nerovnici a zapiš výsledek jako interval:\n$$${coef(a)} ${sgn(b)} ${rel} ${c}$$\n*Zápis: `+'`(2;inf)`'+`, `+'`<-3;5)`'+`, `+'`(-inf;4>`'+`*`,
        answer: {
          type: 'text',
          value: intervalVariants(lower ? bound : -Infinity, lower ? Infinity : bound, lower ? !closed : true, lower ? true : !closed),
          display: `$${iv}$`,
        },
        answerLabel: 'x ∈',
        placeholder: plainIv,
        hints: [
          'Postupuj jako u rovnice – čísla na jednu stranu, x na druhou.',
          flipped ? `Pozor: dělíš záporným číslem (${fmt(a)}), takže se **otočí znaménko nerovnosti**!` : `Děl číslem ${fmt(a)} (kladné → znaménko zůstává).`,
          `Vyjde $x ${finalRel} ${fmt(bound)}$.`,
        ],
        solution: [
          `$${coef(a)} ${rel} ${fmt(c - b)}$`,
          flipped ? `Dělíme ${fmt(a)} < 0 → obracíme znaménko.` : `Dělíme ${fmt(a)} > 0.`,
          `$x ${finalRel} ${fmt(bound)}$, tedy $x \\in ${iv}$`,
        ],
        viz: {
          type: 'numberline',
          range: [bound - 6, bound + 6],
          intervals: [{ from: lower ? bound : bound - 6, to: lower ? bound + 6 : bound, openL: lower ? !closed : false, openR: lower ? false : !closed, label: 'řešení' }],
          points: [{ x: bound, open: !closed, label: fmt(bound) }],
        },
      };
    }
    // level 3–4: kvadratická nerovnice s celočíselnými kořeny
    const x1 = rng.int(-6, 3); const x2 = x1 + rng.int(1, 6);
    const a = level === 4 ? rng.pick([1, -1, 2, -2]) : 1;
    const b = -a * (x1 + x2), c = a * x1 * x2;
    const rel = rng.pick(['<', '>', '\\le', '\\ge']);
    const plain = { '<': '<', '>': '>', '\\le': '≤', '\\ge': '≥' }[rel];
    const closed = plain === '≥' || plain === '≤';
    // znaménko a(x-x1)(x-x2): mezi kořeny má znaménko -a
    const wantPositive = plain === '>' || plain === '≥';
    const insideSign = -Math.sign(a); // znaménko uvnitř intervalu
    const solutionInside = (insideSign > 0) === wantPositive;
    const tex = solutionInside
      ? `${closed ? '\\langle ' : '('}${x1};${x2}${closed ? '\\rangle' : ')'}`
      : `(-\\infty;${x1}${closed ? '\\rangle' : ')'} \\cup ${closed ? '\\langle ' : '('}${x2};\\infty)`;
    const variants = solutionInside
      ? intervalVariants(x1, x2, !closed, !closed)
      : unionVariants(x1, x2, !closed);
    return {
      prompt: `Vyřeš kvadratickou nerovnici:\n$$${a === 1 ? '' : a === -1 ? '-' : a}x^2 ${sgn(b, { hideOne: true })}x ${sgn(c)} ${rel} 0$$\n*Zápis: `+'`(1;4)`'+` nebo `+'`(-inf;1) u (4;inf)`'+`*`,
      answer: { type: 'text', value: variants, display: `$${tex}$` },
      answerLabel: 'x ∈',
      placeholder: solutionInside ? '(1;4)' : '(-inf;1) u (4;inf)',
      hints: [
        'Nejdřív najdi kořeny – tam nerovnice mění znaménko.',
        `Kořeny jsou $x_1 = ${x1}$, $x_2 = ${x2}$.`,
        a > 0 ? 'Parabola je otevřená nahoru → mezi kořeny je záporná, vně kladná.' : 'Parabola je otevřená dolů → mezi kořeny je kladná, vně záporná.',
      ],
      solution: [
        `Kořeny: $x_1 = ${x1}$, $x_2 = ${x2}$`,
        `Rozklad: $${a === 1 ? '' : a}(x ${sgn(-x1)})(x ${sgn(-x2)}) ${rel} 0$`,
        `Ze znaménkového schématu: $x \\in ${tex}$`,
      ],
      viz: {
        type: 'function',
        xRange: [x1 - 3, x2 + 3],
        fns: [{ f: (x) => a * x * x + b * x + c }],
        points: [{ x: x1, y: 0 }, { x: x2, y: 0 }],
        hlines: [0],
      },
    };
  },
};

/** Tolerantní varianty zápisu jednoho intervalu. */
function intervalVariants(lo, hi, openL, openR) {
  const L = isFinite(lo) ? String(lo) : '-inf';
  const R = isFinite(hi) ? String(hi) : 'inf';
  const ls = isFinite(lo) ? (openL ? ['('] : ['<', '⟨', '[']) : ['('];
  const rs = isFinite(hi) ? (openR ? [')'] : ['>', '⟩', ']']) : [')'];
  const out = [];
  for (const a of ls) for (const b of rs) for (const sep of [';', ',']) out.push(`${a}${L}${sep}${R}${b}`);
  return out;
}
function unionVariants(x1, x2, open) {
  const left = intervalVariants(-Infinity, x1, true, open);
  const right = intervalVariants(x2, Infinity, open, true);
  const out = [];
  for (const l of left) for (const r of right) for (const u of ['u', '∪', 'v']) out.push(`${l}${u}${r}`);
  return out;
}
