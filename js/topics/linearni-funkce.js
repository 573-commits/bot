import { fmt, sgn, coef, fracTex } from '../core/util.js';

export default {
  id: 'linearni-funkce',
  name: 'Lineární funkce',
  category: 'Funkce',
  icon: '／',
  description: 'Směrnice, průsečíky s osami, rovnice přímky ze dvou bodů.',
  levels: 4,

  generate(level, rng) {
    const k = rng.nz(-4, 4), q = rng.int(-6, 6);
    const line = { type: 'function', xRange: [-7, 7], fns: [{ f: (x) => k * x + q, label: `y = ${coef(k)} ${sgn(q)}` }] };

    if (level === 1) {
      const x0 = rng.int(-5, 5);
      return {
        prompt: `Funkce je dána předpisem $y = ${coef(k)} ${sgn(q)}$.\nUrči $f(${x0})$.`,
        answer: { type: 'number', value: k * x0 + q, tol: 1e-9 },
        answerLabel: `f(${x0}) =`,
        hints: [`Dosaď $x = ${x0}$ do předpisu.`, `$${fmt(k)} \\cdot ${fmt(x0)} ${sgn(q)}$`],
        solution: [`$f(${x0}) = ${fmt(k)}\\cdot(${fmt(x0)}) ${sgn(q)} = ${fmt(k * x0 + q)}$`],
        viz: { ...line, points: [{ x: x0, y: k * x0 + q, label: `[${x0}; ${fmt(k * x0 + q)}]` }] },
      };
    }
    if (level === 2) {
      const zero = -q / k;
      return {
        prompt: `Najdi průsečíky přímky $y = ${coef(k)} ${sgn(q)}$ s osami.\nZapiš $x$-ovou souřadnici průsečíku s osou $x$ a $y$-ovou souřadnici průsečíku s osou $y$, tedy $x_0; y_0$.`,
        answer: { type: 'numberList', value: [zero, q], tol: 1e-6 },
        answerLabel: 'x₀; y₀ =',
        placeholder: 'např. 1,5; -3',
        hints: [
          'Průsečík s osou $y$: dosaď $x = 0$.',
          'Průsečík s osou $x$: polož $y = 0$ a vyřeš rovnici.',
          `$${coef(k)} ${sgn(q)} = 0 \\Rightarrow x = ${fracTex(-q, k)}$`,
        ],
        solution: [
          `Osa $y$: $f(0) = ${fmt(q)}$, tedy bod $[0; ${fmt(q)}]$`,
          `Osa $x$: $${coef(k)} ${sgn(q)} = 0 \\Rightarrow x = ${fmt(zero)}$, bod $[${fmt(zero)}; 0]$`,
        ],
        viz: { ...line, points: [{ x: zero, y: 0, label: 'osa x' }, { x: 0, y: q, label: 'osa y' }] },
      };
    }
    if (level === 3) {
      const x1 = rng.int(-6, 2), x2 = x1 + rng.int(1, 6);
      const y1 = k * x1 + q, y2 = k * x2 + q;
      return {
        prompt: `Přímka prochází body $A = [${x1}; ${fmt(y1)}]$ a $B = [${x2}; ${fmt(y2)}]$.\nUrči směrnici $k$ a posun $q$ v zápisu $y = kx + q$. Zapiš $k; q$.`,
        answer: { type: 'numberList', value: [k, q], tol: 1e-6 },
        answerLabel: 'k; q =',
        hints: [
          `Směrnice: $k = \\frac{y_2 - y_1}{x_2 - x_1}$.`,
          `$k = \\frac{${fmt(y2)} - (${fmt(y1)})}{${x2} - (${x1})} = ${fmt(k)}$`,
          `$q$ dopočítáš dosazením bodu A: $q = y_1 - k x_1$.`,
        ],
        solution: [
          `$k = \\frac{${fmt(y2 - y1)}}{${fmt(x2 - x1)}} = ${fmt(k)}$`,
          `$q = ${fmt(y1)} - ${fmt(k)}\\cdot(${x1}) = ${fmt(q)}$`,
          `$y = ${coef(k)} ${sgn(q)}$`,
        ],
        viz: { ...line, points: [{ x: x1, y: y1, label: 'A' }, { x: x2, y: y2, label: 'B' }] },
      };
    }
    // level 4 – rovnoběžnost / kolmost
    const kind = rng.pick(['rovnobezka', 'kolmice']);
    const px = rng.int(-4, 4), py = rng.int(-4, 4);
    const k2 = kind === 'rovnobezka' ? k : -1 / k;
    const q2 = py - k2 * px;
    return {
      prompt: `Najdi přímku, která je **${kind === 'rovnobezka' ? 'rovnoběžná' : 'kolmá'}** k $y = ${coef(k)} ${sgn(q)}$ a prochází bodem $P = [${px}; ${py}]$.\nZapiš $k; q$.`,
      answer: { type: 'numberList', value: [k2, q2], tol: 1e-6 },
      answerLabel: 'k; q =',
      placeholder: 'např. -0,5; 3',
      hints: [
        kind === 'rovnobezka' ? 'Rovnoběžky mají **stejnou** směrnici.' : 'Pro kolmice platí $k_1 \\cdot k_2 = -1$.',
        `Takže $k = ${fmt(k2)}$.`,
        `$q$ dopočítej z toho, že bod $P$ na přímce leží: $${fmt(py)} = ${fmt(k2)}\\cdot(${px}) + q$.`,
      ],
      solution: [
        kind === 'rovnobezka' ? `$k_2 = k_1 = ${fmt(k2)}$` : `$k_2 = -\\frac{1}{${fmt(k)}} = ${fmt(k2)}$`,
        `$q = ${fmt(py)} - ${fmt(k2)}\\cdot(${px}) = ${fmt(q2)}$`,
      ],
      viz: {
        type: 'function', xRange: [-7, 7],
        fns: [{ f: (x) => k * x + q, label: 'původní' }, { f: (x) => k2 * x + q2, label: 'hledaná', dashed: true }],
        points: [{ x: px, y: py, label: 'P' }],
      },
    };
  },
};
