import { fmt, polyTex, fracTex, sgn } from '../core/util.js';

export default {
  id: 'integraly',
  name: 'Integrály',
  category: 'Analýza',
  icon: '∫',
  description: 'Neurčitý i určitý integrál, obsah pod křivkou, substituce.',
  levels: 4,

  generate(level, rng) {
    if (level === 1) {
      const a = rng.nz(1, 6), b = rng.nz(-8, 8), x0 = rng.int(0, 2), x1 = x0 + rng.int(1, 4);
      const F = (x) => (a / 2) * x * x + b * x;
      const val = F(x1) - F(x0);
      return {
        prompt: `Spočítej určitý integrál:\n$$\\int_{${x0}}^{${x1}} (${polyTex([a, b])})\\,dx$$`,
        answer: { type: 'number', value: val, tol: 1e-6 },
        answerLabel: 'výsledek =',
        hints: [
          `$\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$`,
          `Primitivní funkce: $F(x) = ${fracTex(a, 2)}x^2 ${sgn(b, { hideOne: true })}x$`,
          `Newton–Leibniz: $F(${x1}) - F(${x0})$`,
        ],
        solution: [
          `$F(x) = ${fracTex(a, 2)}x^2 ${sgn(b, { hideOne: true })}x$`,
          `$F(${x1}) = ${fmt(F(x1))},\\quad F(${x0}) = ${fmt(F(x0))}$`,
          `$\\int = ${fmt(val)}$`,
        ],
        viz: { type: 'function', xRange: [x0 - 2, x1 + 2], fns: [{ f: (x) => a * x + b }], area: { f: (x) => a * x + b, from: x0, to: x1 } },
      };
    }
    if (level === 2) {
      const a = rng.nz(1, 4), b = rng.nz(-5, 5), c = rng.int(-6, 6);
      const x0 = rng.int(-2, 1), x1 = x0 + rng.int(1, 4);
      const F = (x) => (a / 3) * x ** 3 + (b / 2) * x ** 2 + c * x;
      const val = F(x1) - F(x0);
      return {
        prompt: `Spočítej (na 4 des. místa):\n$$\\int_{${x0}}^{${x1}} (${polyTex([a, b, c])})\\,dx$$`,
        answer: { type: 'number', value: val, decimals: 4 },
        answerLabel: 'výsledek =',
        hints: [
          'Integruj člen po členu.',
          `$F(x) = ${fracTex(a, 3)}x^3 + ${fracTex(b, 2)}x^2 ${sgn(c, { hideOne: true })}x$`,
        ],
        solution: [
          `$F(x) = ${fracTex(a, 3)}x^3 + ${fracTex(b, 2)}x^2 ${sgn(c, { hideOne: true })}x$`,
          `$F(${x1}) - F(${x0}) = ${fmt(F(x1), 4)} - (${fmt(F(x0), 4)}) = ${fmt(val, 4)}$`,
        ],
        viz: { type: 'function', xRange: [x0 - 2, x1 + 2], fns: [{ f: (x) => a * x * x + b * x + c }], area: { f: (x) => a * x * x + b * x + c, from: x0, to: x1 } },
      };
    }
    if (level === 3) {
      const kind = rng.pick(['exp', 'recip']);
      if (kind === 'exp') {
        const a = rng.nz(1, 3), x0 = 0, x1 = rng.int(1, 3);
        const F = (x) => Math.exp(a * x) / a;
        const val = F(x1) - F(x0);
        return {
          prompt: `Spočítej (na 4 des. místa):\n$$\\int_{0}^{${x1}} e^{${a === 1 ? '' : a}x}\\,dx$$`,
          answer: { type: 'number', value: val, decimals: 4 },
          answerLabel: 'výsledek =',
          hints: [`$\\int e^{ax}dx = \\frac{1}{a}e^{ax} + C$`, `$F(x) = ${fracTex(1, a)}e^{${a === 1 ? '' : a}x}$`],
          solution: [`$F(x) = ${fracTex(1, a)}e^{${a === 1 ? '' : a}x}$`, `$F(${x1}) - F(0) = ${fmt(val, 4)}$`],
          viz: { type: 'function', xRange: [-0.5, x1 + 1], fns: [{ f: (x) => Math.exp(a * x) }], area: { f: (x) => Math.exp(a * x), from: 0, to: x1 } },
        };
      }
      const x0 = rng.int(1, 3), x1 = x0 + rng.int(1, 5);
      const val = Math.log(x1) - Math.log(x0);
      return {
        prompt: `Spočítej (na 4 des. místa):\n$$\\int_{${x0}}^{${x1}} \\frac{1}{x}\\,dx$$`,
        answer: { type: 'number', value: val, decimals: 4 },
        answerLabel: 'výsledek =',
        hints: [`$\\int \\frac{1}{x}dx = \\ln|x| + C$`, `$\\ln ${x1} - \\ln ${x0} = \\ln\\frac{${x1}}{${x0}}$`],
        solution: [`$[\\ln x]_{${x0}}^{${x1}} = \\ln ${x1} - \\ln ${x0} = \\ln ${fmt(x1 / x0, 4)} \\approx ${fmt(val, 4)}$`],
        viz: { type: 'function', xRange: [0.2, x1 + 1], yRange: [0, 1.4], fns: [{ f: (x) => 1 / x }], area: { f: (x) => 1 / x, from: x0, to: x1 } },
      };
    }
    // level 4 – obsah plochy mezi dvěma křivkami
    const r = rng.int(1, 4), k = rng.nz(1, 3);
    // y = k*r^2 - k x^2  (parabola) a y = 0 ; obsah = integral -r..r
    const val = (2 * Math.abs(k) * r ** 3 * 2) / 3;
    return {
      prompt: `Urči **obsah plochy** ohraničené parabolou $y = ${fmt(Math.abs(k))}(${r * r} - x^2)$ a osou $x$.\n(na 4 des. místa)`,
      answer: { type: 'number', value: val, decimals: 4 },
      answerLabel: 'S =',
      hints: [
        `Nejdřív najdi, kde parabola protíná osu $x$: $${r * r} - x^2 = 0$.`,
        `Meze jsou $-${r}$ a $${r}$.`,
        `$S = \\int_{-${r}}^{${r}} ${fmt(Math.abs(k))}(${r * r} - x^2)\\,dx$`,
      ],
      solution: [
        `Průsečíky: $x = \\pm${r}$`,
        `$S = ${fmt(Math.abs(k))}\\left[${r * r}x - \\frac{x^3}{3}\\right]_{-${r}}^{${r}} = ${fmt(val, 4)}$`,
      ],
      viz: {
        type: 'function', xRange: [-r - 2, r + 2],
        fns: [{ f: (x) => Math.abs(k) * (r * r - x * x) }],
        area: { f: (x) => Math.abs(k) * (r * r - x * x), from: -r, to: r },
        hlines: [0],
      },
    };
  },
};
