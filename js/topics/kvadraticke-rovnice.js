import { fmt, polyTex, sgn } from '../core/util.js';

export default {
  id: 'kvadraticke-rovnice',
  name: 'Kvadratické rovnice',
  category: 'Algebra',
  icon: 'x²',
  description: 'Diskriminant, Vietovy vzorce, kořeny i graf paraboly.',
  levels: 5,

  generate(level, rng) {
    // Úrovně 1–3 stavíme z celočíselných kořenů, ať vyjdou hezky.
    if (level <= 3) {
      const x1 = rng.int(-7, 7), x2 = rng.int(-7, 7);
      const a = level === 3 ? rng.pick([2, 2, 3, -1, -2]) : 1;
      const b = -a * (x1 + x2), c = a * x1 * x2;
      const roots = [...new Set([x1, x2])].sort((p, q) => p - q);
      const D = b * b - 4 * a * c;
      return {
        prompt: `Vyřeš kvadratickou rovnici:\n$$${polyTex([a, b, c])} = 0$$`,
        answer: { type: 'numberSet', value: roots, tol: 1e-6 },
        answerLabel: roots.length === 2 ? 'x₁; x₂ =' : 'x =',
        placeholder: roots.length === 2 ? 'např. -1; 4' : 'jedno číslo',
        hints: [
          `Diskriminant $D = b^2 - 4ac = ${fmt(b)}^2 - 4\\cdot${fmt(a)}\\cdot${fmt(c)} = ${fmt(D)}$.`,
          `$\\sqrt{D} = ${fmt(Math.sqrt(D))}$, dosaď do $x_{1,2} = \\frac{-b \\pm \\sqrt{D}}{2a}$.`,
          level <= 2 ? `Zkus Vietovy vzorce: hledáš dvě čísla se součtem ${fmt(-b / a)} a součinem ${fmt(c / a)}.` : 'Nezapomeň dělit $2a$, ne jen 2.',
        ],
        solution: [
          `$a = ${fmt(a)},\\ b = ${fmt(b)},\\ c = ${fmt(c)}$`,
          `$D = ${fmt(b)}^2 - 4\\cdot ${fmt(a)} \\cdot ${fmt(c)} = ${fmt(D)}$`,
          `$x_{1,2} = \\frac{${fmt(-b)} \\pm ${fmt(Math.sqrt(D))}}{${fmt(2 * a)}}$`,
          roots.length === 2 ? `$x_1 = ${fmt(roots[0])}, \\quad x_2 = ${fmt(roots[1])}$` : `dvojnásobný kořen $x = ${fmt(roots[0])}$`,
        ],
        viz: {
          type: 'function',
          xRange: [Math.min(...roots) - 3, Math.max(...roots) + 3],
          fns: [{ f: (x) => a * x * x + b * x + c, label: 'y = ax²+bx+c' }],
          points: roots.map((r) => ({ x: r, y: 0, label: `x=${fmt(r)}` })),
        },
      };
    }
    if (level === 4) {
      // iracionální kořeny / rozhodování podle D
      const a = rng.pick([1, 1, 2]), b = rng.nz(-9, 9), c = rng.int(-9, 9);
      const D = b * b - 4 * a * c;
      if (D < 0) {
        return {
          prompt: `Kolik reálných řešení má rovnice?\n$$${polyTex([a, b, c])} = 0$$\nNapiš počet řešení (0, 1 nebo 2).`,
          answer: { type: 'integer', value: 0 },
          answerLabel: 'počet řešení =',
          hints: ['Spočítej diskriminant.', `$D = ${fmt(D)}$ – co to znamená pro odmocninu?`],
          solution: [`$D = ${fmt(b)}^2 - 4\\cdot${fmt(a)}\\cdot${fmt(c)} = ${fmt(D)} < 0$`, 'Záporný diskriminant → žádné reálné řešení (parabola neprotne osu x).'],
          viz: { type: 'function', fns: [{ f: (x) => a * x * x + b * x + c }], xRange: [-b / (2 * a) - 5, -b / (2 * a) + 5] },
        };
      }
      const r1 = (-b - Math.sqrt(D)) / (2 * a), r2 = (-b + Math.sqrt(D)) / (2 * a);
      const roots = D === 0 ? [r1] : [r1, r2];
      return {
        prompt: `Vyřeš rovnici (zaokrouhli na 2 desetinná místa):\n$$${polyTex([a, b, c])} = 0$$`,
        answer: { type: 'numberSet', value: roots, decimals: 2 },
        answerLabel: 'x₁; x₂ =',
        placeholder: 'např. -0,73; 2,73',
        hints: [`$D = ${fmt(D)}$`, `$\\sqrt{D} \\approx ${fmt(Math.sqrt(D), 4)}$`],
        solution: [
          `$D = ${fmt(D)},\\ \\sqrt{D} \\approx ${fmt(Math.sqrt(D), 4)}$`,
          `$x_{1,2} = \\frac{${fmt(-b)} \\pm ${fmt(Math.sqrt(D), 4)}}{${fmt(2 * a)}}$`,
          `$x_1 \\approx ${fmt(r1, 2)},\\ x_2 \\approx ${fmt(r2, 2)}$`,
        ],
        viz: { type: 'function', fns: [{ f: (x) => a * x * x + b * x + c }], points: roots.map((r) => ({ x: r, y: 0 })), xRange: [Math.min(...roots) - 3, Math.max(...roots) + 3] },
      };
    }
    // level 5 – vrchol paraboly / Vietovy vzorce
    const mode = rng.pick(['vrchol', 'viete']);
    const a = rng.pick([1, 1, 2, -1]), b = rng.nz(-10, 10), c = rng.int(-9, 9);
    if (mode === 'vrchol') {
      const vx = -b / (2 * a), vy = a * vx * vx + b * vx + c;
      return {
        prompt: `Urči souřadnice vrcholu paraboly:\n$$y = ${polyTex([a, b, c])}$$\nZapiš jako $x; y$.`,
        answer: { type: 'numberList', value: [vx, vy], tol: 0.005 },
        answerLabel: 'V =',
        placeholder: 'např. 2,5; -3,25',
        hints: ['Vrchol má $x$-ovou souřadnici $-\\frac{b}{2a}$.', `$x_V = ${fmt(vx)}$, dosaď zpět do rovnice.`],
        solution: [`$x_V = -\\frac{${fmt(b)}}{2\\cdot${fmt(a)}} = ${fmt(vx)}$`, `$y_V = ${fmt(vy)}$`, `$V = [${fmt(vx)};\\ ${fmt(vy)}]$`],
        viz: { type: 'function', fns: [{ f: (x) => a * x * x + b * x + c }], points: [{ x: vx, y: vy, label: 'V' }], xRange: [vx - 5, vx + 5] },
      };
    }
    const x1 = rng.int(-6, 6), x2 = rng.int(-6, 6);
    return {
      prompt: `Rovnice $x^2 ${sgn(-(x1 + x2))}x ${sgn(x1 * x2)} = 0$ má kořeny $x_1, x_2$.\nUrči **součet i součin** kořenů bez počítání diskriminantu. Zapiš $součet; součin$.`,
      answer: { type: 'numberList', value: [x1 + x2, x1 * x2], tol: 1e-6 },
      answerLabel: 'součet; součin =',
      hints: ['Vietovy vzorce: $x_1+x_2 = -\\frac{b}{a}$, $x_1 x_2 = \\frac{c}{a}$.', `Tady $a=1$, $b=${fmt(-(x1 + x2))}$, $c=${fmt(x1 * x2)}$.`],
      solution: [`$x_1 + x_2 = -\\frac{b}{a} = ${fmt(x1 + x2)}$`, `$x_1 \\cdot x_2 = \\frac{c}{a} = ${fmt(x1 * x2)}$`],
    };
  },
};
