import { fmt, fracTex } from '../core/util.js';

export default {
  id: 'logaritmy',
  name: 'Logaritmy a exponenciály',
  category: 'Funkce',
  icon: 'log',
  description: 'Definice logaritmu, pravidla, exponenciální rovnice a růst.',
  levels: 5,

  generate(level, rng) {
    if (level === 1) {
      const a = rng.pick([2, 3, 5, 10]);
      const n = rng.int(1, 6);
      return {
        prompt: `Vyčísli:\n$$\\log_{${a}} ${a ** n}$$`,
        answer: { type: 'number', value: n, tol: 1e-9 },
        answerLabel: 'výsledek =',
        hints: [`Logaritmus se ptá: „na kolikátou umocnit ${a}, abych dostal ${a ** n}?“`, `$${a}^{?} = ${a ** n}$`],
        solution: [`$${a}^{${n}} = ${a ** n}$, tedy $\\log_{${a}} ${a ** n} = ${n}$`],
      };
    }
    if (level === 2) {
      const a = rng.pick([2, 3, 10]);
      const m = rng.int(2, 5), n = rng.int(2, 5);
      const op = rng.pick(['+', '-']);
      const val = op === '+' ? m + n : m - n;
      return {
        prompt: `Použij pravidla pro logaritmy a vyčísli:\n$$\\log_{${a}} ${a ** m} ${op} \\log_{${a}} ${a ** n}$$`,
        answer: { type: 'number', value: val, tol: 1e-9 },
        answerLabel: 'výsledek =',
        hints: [
          op === '+' ? '$\\log a + \\log b = \\log(ab)$' : '$\\log a - \\log b = \\log\\frac{a}{b}$',
          `Nebo si obě hodnoty vyčísli zvlášť: ${m} a ${n}.`,
        ],
        solution: [`$= ${m} ${op} ${n} = ${fmt(val)}$`],
      };
    }
    if (level === 3) {
      const a = rng.pick([2, 3, 5]);
      const n = rng.int(2, 6);
      const b = rng.nz(-5, 5);
      // a^(x+b) = a^n  ->  x = n - b
      return {
        prompt: `Vyřeš exponenciální rovnici:\n$$${a}^{\\,x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}} = ${a ** n}$$`,
        answer: { type: 'number', value: n - b, tol: 1e-9 },
        answerLabel: 'x =',
        hints: [`Zapiš pravou stranu jako mocninu ${a}: $${a ** n} = ${a}^{${n}}$.`, 'Stejné základy → porovnej exponenty.'],
        solution: [`$${a}^{x ${b >= 0 ? '+' : '-'} ${Math.abs(b)}} = ${a}^{${n}}$`, `$x ${b >= 0 ? '+' : '-'} ${Math.abs(b)} = ${n}$`, `$x = ${fmt(n - b)}$`],
      };
    }
    if (level === 4) {
      const a = rng.pick([2, 3, 5, 7]);
      const target = rng.int(20, 400);
      const x = Math.log(target) / Math.log(a);
      return {
        prompt: `Vyřeš (na 3 desetinná místa):\n$$${a}^{x} = ${target}$$`,
        answer: { type: 'number', value: x, decimals: 3 },
        answerLabel: 'x =',
        hints: [
          'Zlogaritmuj obě strany.',
          `$x = \\log_{${a}} ${target} = \\frac{\\ln ${target}}{\\ln ${a}}$`,
        ],
        solution: [
          `$x \\ln ${a} = \\ln ${target}$`,
          `$x = \\frac{\\ln ${target}}{\\ln ${a}} = \\frac{${fmt(Math.log(target), 4)}}{${fmt(Math.log(a), 4)}} \\approx ${fmt(x, 3)}$`,
        ],
        viz: { type: 'function', xRange: [0, Math.max(3, x + 1)], yRange: [0, target * 1.3], fns: [{ f: (t) => a ** t, label: `y = ${a}^x` }], hlines: [{ y: target, label: String(target) }], points: [{ x, y: target }] },
      };
    }
    // level 5 – doba zdvojnásobení / spojitý růst (business)
    const rate = rng.int(2, 18);
    const factor = rng.pick([2, 3]);
    const t = Math.log(factor) / Math.log(1 + rate / 100);
    return {
      prompt: `Investice roste o **${rate} % ročně**. Za kolik let se ${factor === 2 ? 'zdvojnásobí' : 'ztrojnásobí'}?\n(na 2 desetinná místa)`,
      answer: { type: 'number', value: t, decimals: 2 },
      answerLabel: 'počet let =',
      hints: [
        `Hledáš $n$ z rovnice $(1 + ${fmt(rate / 100)})^n = ${factor}$.`,
        `$n = \\frac{\\ln ${factor}}{\\ln(1 + ${fmt(rate / 100)})}$`,
        `Rychlý odhad („pravidlo 72“): $72 / ${rate} \\approx ${fmt(72 / rate, 1)}$ let.`,
      ],
      solution: [
        `$(1{,}${String(rate).padStart(2, '0')})^n = ${factor}$`,
        `$n = \\frac{\\ln ${factor}}{\\ln ${fmt(1 + rate / 100)}} = \\frac{${fmt(Math.log(factor), 4)}}{${fmt(Math.log(1 + rate / 100), 4)}} \\approx ${fmt(t, 2)}$ let`,
      ],
      viz: { type: 'function', xRange: [0, t * 1.6], yRange: [0, factor * 1.4], fns: [{ f: (n) => (1 + rate / 100) ** n, label: 'růst' }], hlines: [{ y: factor, label: `${factor}×` }], points: [{ x: t, y: factor }] },
    };
  },
};
