import { fmt, coef, sgn } from '../core/util.js';

/** Vrcholy množiny přípustných řešení pro omezení a·x + b·y ≤ c a x,y ≥ 0. */
function feasible(cons) {
  const cand = [{ x: 0, y: 0 }];
  for (const c of cons) {
    if (c.a) cand.push({ x: c.c / c.a, y: 0 });
    if (c.b) cand.push({ x: 0, y: c.c / c.b });
  }
  for (let i = 0; i < cons.length; i++) {
    for (let j = i + 1; j < cons.length; j++) {
      const [p, q] = [cons[i], cons[j]];
      const d = p.a * q.b - q.a * p.b;
      if (Math.abs(d) < 1e-9) continue;
      cand.push({ x: (p.c * q.b - q.c * p.b) / d, y: (p.a * q.c - q.a * p.c) / d });
    }
  }
  const okPt = (p) => p.x >= -1e-9 && p.y >= -1e-9 && cons.every((c) => c.a * p.x + c.b * p.y <= c.c + 1e-9);
  const pts = cand.filter(okPt);
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const uniq = [];
  for (const p of pts.sort((u, v) => Math.atan2(u.y - cy, u.x - cx) - Math.atan2(v.y - cy, v.x - cx))) {
    if (!uniq.some((q) => Math.abs(q.x - p.x) < 1e-6 && Math.abs(q.y - p.y) < 1e-6)) uniq.push(p);
  }
  return uniq;
}

export default {
  id: 'linearni-programovani',
  name: 'Lineární programování',
  category: 'Business',
  icon: '◺',
  description: 'Maximalizace zisku při omezených zdrojích – grafické řešení o dvou proměnných.',
  levels: 3,

  generate(level, rng) {
    // Úlohu stavíme od výsledku: zvolíme optimální vrchol a dopočítáme omezení.
    const x0 = rng.int(2, 12), y0 = rng.int(2, 12);
    const a1 = rng.int(1, 5), b1 = rng.int(1, 5);
    let a2 = rng.int(1, 5), b2 = rng.int(1, 5);
    if (a1 * b2 - a2 * b1 === 0) { a2 = a1 + 1; b2 = Math.max(1, b1 - 1); }
    const c1 = a1 * x0 + b1 * y0, c2 = a2 * x0 + b2 * y0;
    const cons = [{ a: a1, b: b1, c: c1 }, { a: a2, b: b2, c: c2 }];

    if (level === 1) {
      return {
        prompt: `Najdi průsečík hraničních přímek dvou omezení:\n$$\\begin{aligned}${coef(a1)} ${sgn(b1, { hideOne: true })}y &= ${c1}\\\\ ${coef(a2)} ${sgn(b2, { hideOne: true })}y &= ${c2}\\end{aligned}$$\nZapiš $x; y$.`,
        answer: { type: 'numberList', value: [x0, y0], tol: 1e-6 },
        answerLabel: 'x; y =',
        hints: ['Je to obyčejná soustava dvou rovnic.', 'Sčítací metoda bývá nejrychlejší.', `Determinant $= ${fmt(a1 * b2 - a2 * b1)}$.`],
        solution: [`$x = ${fmt(x0)}$`, `$y = ${fmt(y0)}$`, 'V grafickém řešení je tenhle bod jedním z vrcholů množiny přípustných řešení.'],
        viz: {
          type: 'function', xRange: [0, Math.max(c1 / a1, c2 / a2) * 1.15], yRange: [0, Math.max(c1 / b1, c2 / b2) * 1.15],
          polygon: feasible(cons),
          fns: [{ f: (t) => (c1 - a1 * t) / b1, label: '1. omezení' }, { f: (t) => (c2 - a2 * t) / b2, label: '2. omezení' }],
          points: [{ x: x0, y: y0, label: 'průsečík' }],
        },
      };
    }

    // účelová funkce volená tak, aby optimum padlo právě do vrcholu (x0, y0)
    const l1 = rng.int(1, 4), l2 = rng.int(1, 4);
    const p = l1 * a1 + l2 * a2, q = l1 * b1 + l2 * b2;
    const verts = feasible(cons);
    const zAt = (v) => p * v.x + q * v.y;
    const best = verts.reduce((m, v) => (zAt(v) > zAt(m) ? v : m), verts[0]);
    const viz = {
      type: 'function', xRange: [0, Math.max(c1 / a1, c2 / a2) * 1.15], yRange: [0, Math.max(c1 / b1, c2 / b2) * 1.15],
      polygon: verts,
      fns: [{ f: (t) => (c1 - a1 * t) / b1, label: 'omezení 1' }, { f: (t) => (c2 - a2 * t) / b2, label: 'omezení 2' }],
      points: verts.map((v) => ({ x: v.x, y: v.y, color: v === best ? 'var(--c2)' : 'var(--c5)', label: v === best ? 'optimum' : '' })),
      xLabel: 'x', yLabel: 'y',
    };
    const zadani = `Dílna vyrábí výrobky **A** ($x$ kusů) a **B** ($y$ kusů). Omezují ji zdroje:
$$\\begin{aligned}${coef(a1)} ${sgn(b1, { hideOne: true })}y &\\le ${c1}\\\\ ${coef(a2)} ${sgn(b2, { hideOne: true })}y &\\le ${c2}\\\\ x, y &\\ge 0\\end{aligned}$$
Zisk je $Z = ${coef(p)} ${sgn(q, { hideOne: true })}y$.`;

    if (level === 2) {
      return {
        prompt: `${zadani}\n\nVe kterém bodě je zisk **největší**? Zapiš $x; y$.`,
        answer: { type: 'numberList', value: [best.x, best.y], tol: 1e-4 },
        answerLabel: 'x; y =',
        placeholder: 'např. 4; 6',
        hints: [
          'Maximum lineární funkce na mnohoúhelníku je vždy v některém **vrcholu** – stačí je projít.',
          `Vrcholy jsou: ${verts.map((v) => `[${fmt(v.x, 2)}; ${fmt(v.y, 2)}]`).join(', ')}.`,
          'V každém spočítej $Z$ a vyber největší.',
        ],
        solution: [
          ...verts.map((v) => `$Z[${fmt(v.x, 2)}; ${fmt(v.y, 2)}] = ${fmt(zAt(v), 2)}$`),
          `Největší je $Z = ${fmt(zAt(best), 2)}$ v bodě $[${fmt(best.x, 2)}; ${fmt(best.y, 2)}]$.`,
        ],
        viz,
      };
    }
    return {
      prompt: `${zadani}\n\nJaká je **maximální hodnota zisku** $Z$? (na 4 des. místa)`,
      answer: { type: 'number', value: zAt(best), decimals: 4 },
      answerLabel: 'Z_max =',
      hints: [
        'Projdi vrcholy množiny přípustných řešení a v každém spočítej $Z$.',
        `Vrcholy: ${verts.map((v) => `[${fmt(v.x, 2)}; ${fmt(v.y, 2)}]`).join(', ')}`,
        `Optimum vychází v $[${fmt(best.x, 2)}; ${fmt(best.y, 2)}]$.`,
      ],
      solution: [
        `Optimální vrchol $[${fmt(best.x, 2)}; ${fmt(best.y, 2)}]$`,
        `$Z = ${fmt(p)}\\cdot${fmt(best.x, 2)} + ${fmt(q)}\\cdot${fmt(best.y, 2)} = ${fmt(zAt(best), 4)}$`,
      ],
      viz,
    };
  },
};
