import { fmt, polyTex, sgn } from '../core/util.js';

/** Hornerovo schéma: vrátí mezivýsledky a hodnotu (resp. zbytek po dělení). */
function horner(coefs, c) {
  const row = [coefs[0]];
  for (let i = 1; i < coefs.length; i++) row.push(row[i - 1] * c + coefs[i]);
  return { row, value: row[row.length - 1], quotient: row.slice(0, -1) };
}

export default {
  id: 'polynomy',
  name: 'Polynomy',
  category: 'Algebra',
  icon: 'P(x)',
  description: 'Hornerovo schéma, dělení kořenovým činitelem a hledání celočíselných kořenů.',
  levels: 3,

  generate(level, rng) {
    if (level === 1) {
      const coefs = [rng.nz(1, 3), rng.nz(-6, 6), rng.nz(-8, 8), rng.int(-9, 9)];
      const c = rng.nz(-4, 4);
      const h = horner(coefs, c);
      return {
        prompt: `Pomocí **Hornerova schématu** urči hodnotu polynomu v bodě $x = ${c}$:\n$$P(x) = ${polyTex(coefs)}$$`,
        answer: { type: 'number', value: h.value, tol: 1e-9 },
        answerLabel: `P(${c}) =`,
        hints: [
          'Horner: vezmi první koeficient, vynásob ho $x$ a přičti další koeficient. Opakuj.',
          `Koeficienty: ${coefs.join(', ')}`,
          `Postupně: ${h.row.slice(0, 3).join(' → ')} → …`,
        ],
        solution: [
          `Schéma pro $x = ${c}$: $${h.row.join(' \\mid ')}$`,
          `$P(${c}) = ${fmt(h.value)}$`,
          'Horner je rychlejší i přesnější než dosazovat mocniny zvlášť.',
        ],
        viz: { type: 'function', xRange: [c - 4, c + 4], fns: [{ f: (x) => coefs.reduce((s, k) => s * x + k, 0) }], points: [{ x: c, y: h.value }] },
      };
    }
    if (level === 2) {
      const r = rng.nz(-4, 4);
      const q = [rng.nz(1, 3), rng.nz(-6, 6), rng.int(-8, 8)];
      const rest = rng.int(-9, 9);
      // P(x) = (x - r)·Q(x) + rest
      const coefs = [q[0], q[1] - r * q[0], q[2] - r * q[1], -r * q[2] + rest];
      const h = horner(coefs, r);
      return {
        prompt: `Vyděl polynom $P(x) = ${polyTex(coefs)}$ výrazem $(x ${sgn(-r)})$.\nJaký vyjde **zbytek**?`,
        answer: { type: 'number', value: rest, tol: 1e-9 },
        answerLabel: 'zbytek =',
        hints: [
          'Zbytek po dělení $(x - c)$ je podle věty o zbytku roven $P(c)$ – dělit ani nemusíš.',
          `Stačí spočítat $P(${r})$.`,
          `Hornerovo schéma: $${h.row.join(' \\mid ')}$`,
        ],
        solution: [
          `Podle věty o zbytku je zbytek $= P(${r})$.`,
          `Horner: $${h.row.join(' \\mid ')}$`,
          `Zbytek $= ${fmt(rest)}$, podíl $= ${polyTex(h.quotient)}$`,
          rest === 0 ? `Zbytek je nula, takže $${fmt(r)}$ je kořen polynomu.` : `Zbytek není nula, takže $${fmt(r)}$ kořen není.`,
        ],
      };
    }
    // level 3 – celočíselné kořeny kubického polynomu
    const r1 = rng.int(-5, 5), r2 = rng.int(-5, 5), r3 = rng.int(-5, 5);
    const roots = [...new Set([r1, r2, r3])].sort((a, b) => a - b);
    const coefs = [
      1,
      -(r1 + r2 + r3),
      r1 * r2 + r1 * r3 + r2 * r3,
      -r1 * r2 * r3,
    ];
    return {
      prompt: `Najdi **všechny reálné kořeny**:\n$$${polyTex(coefs)} = 0$$\nZapiš je oddělené středníkem (každý jen jednou).`,
      answer: { type: 'numberSet', value: roots, tol: 1e-6 },
      answerLabel: 'x =',
      placeholder: 'např. -2; 1; 3',
      hints: [
        `Celočíselné kořeny musí dělit absolutní člen ${fmt(coefs[3])} – zkoušej jeho dělitele.`,
        `Jeden kořen je $${roots[0]}$. Vyděl jím polynom (Hornerem) a zbude kvadratická rovnice.`,
        `Po vydělení: $${polyTex(horner(coefs, roots[0]).quotient)} = 0$`,
      ],
      solution: [
        `Zkoušením dělitelů najdeme kořen $x = ${roots[0]}$.`,
        `Horner dá podíl $${polyTex(horner(coefs, roots[0]).quotient)}$.`,
        `Zbylou kvadratickou rovnici vyřešíme diskriminantem.`,
        `Kořeny: $${roots.join(';\\ ')}$`,
      ],
      viz: {
        type: 'function',
        xRange: [Math.min(...roots) - 2, Math.max(...roots) + 2],
        fns: [{ f: (x) => coefs.reduce((s, k) => s * x + k, 0) }],
        points: roots.map((r) => ({ x: r, y: 0 })),
        hlines: [0],
      },
    };
  },
};
