import { fmt, polyTex } from '../core/util.js';

export default {
  id: 'elasticita',
  name: 'Elasticita poptávky',
  category: 'Business',
  icon: 'Eₚ',
  description: 'O kolik procent klesne poptávka, když zdražíš o procento. Derivace použitá v praxi.',
  levels: 3,

  generate(level, rng) {
    if (level === 1) {
      const p1 = rng.int(50, 400), q1 = rng.int(100, 900);
      const dp = rng.int(5, 25), dq = rng.int(3, 30);
      const p2 = Math.round(p1 * (1 + dp / 100)), q2 = Math.round(q1 * (1 - dq / 100));
      const e = ((q2 - q1) / q1) / ((p2 - p1) / p1);
      return {
        prompt: `Cena vzrostla z **${p1} Kč** na **${p2} Kč** a prodané množství kleslo z **${q1}** na **${q2}** kusů.\nUrči **cenovou elasticitu poptávky** (na 4 des. místa).`,
        answer: { type: 'number', value: e, decimals: 4 },
        answerLabel: 'E =',
        hints: [
          'Elasticita je podíl **relativních** změn, ne absolutních.',
          `$E = \\frac{\\Delta Q / Q}{\\Delta P / P}$`,
          `$\\Delta Q/Q = \\frac{${q2 - q1}}{${q1}} = ${fmt((q2 - q1) / q1, 5)}$, $\\Delta P/P = \\frac{${p2 - p1}}{${p1}} = ${fmt((p2 - p1) / p1, 5)}$`,
        ],
        solution: [
          `$E = \\frac{${fmt((q2 - q1) / q1, 5)}}{${fmt((p2 - p1) / p1, 5)}} = ${fmt(e, 4)}$`,
          Math.abs(e) > 1
            ? `$|E| > 1$ → poptávka je **elastická**: zdražení srazí tržby.`
            : `$|E| < 1$ → poptávka je **neelastická**: zdražení tržby zvedne.`,
        ],
        viz: { type: 'scatter', points: [{ x: q1, y: p1, label: 'před' }, { x: q2, y: p2, label: 'po' }], xLabel: 'množství', yLabel: 'cena' },
      };
    }
    if (level === 2) {
      const a = rng.int(200, 900), b = rng.int(2, 12);
      const p = rng.int(10, Math.floor(a / b / 2));
      const q = a - b * p;
      const e = (-b * p) / q;
      return {
        prompt: `Poptávková funkce je $Q(p) = ${a} - ${b}p$.\nUrči **bodovou elasticitu** při ceně $p = ${p}$. (na 4 des. místa)`,
        answer: { type: 'number', value: e, decimals: 4 },
        answerLabel: 'E =',
        hints: [
          `Bodová elasticita: $E = \\frac{dQ}{dp} \\cdot \\frac{p}{Q}$`,
          `$\\frac{dQ}{dp} = ${-b}$`,
          `$Q(${p}) = ${a} - ${b}\\cdot${p} = ${q}$`,
        ],
        solution: [
          `$Q'(p) = ${-b}$, $Q(${p}) = ${q}$`,
          `$E = ${-b} \\cdot \\frac{${p}}{${q}} = ${fmt(e, 4)}$`,
          Math.abs(e) > 1 ? 'Poptávka je elastická – snížení ceny zvýší tržby.' : 'Poptávka je neelastická – zvýšení ceny zvýší tržby.',
        ],
        viz: {
          type: 'function', xRange: [0, a / b], yRange: [0, a * 1.1],
          fns: [{ f: (x) => a - b * x, label: 'Q(p)' }],
          points: [{ x: p, y: q, label: `p=${p}` }],
          xLabel: 'cena', yLabel: 'množství',
        },
      };
    }
    // level 3 – cena maximalizující tržby
    const a = rng.int(200, 900), b = rng.int(2, 12);
    const pOpt = a / (2 * b);
    return {
      prompt: `Poptávka je $Q(p) = ${a} - ${b}p$, tržby jsou $R(p) = p \\cdot Q(p)$.\nPři jaké ceně budou **tržby největší**? (na 4 des. místa)`,
      answer: { type: 'number', value: pOpt, decimals: 4 },
      answerLabel: 'p =',
      hints: [
        `$R(p) = p(${a} - ${b}p) = ${polyTex([-b, a, 0], 'p')}$`,
        'Maximum hledej přes derivaci: $R\'(p) = 0$.',
        `$R'(p) = ${a} - ${2 * b}p$`,
      ],
      solution: [
        `$R(p) = ${polyTex([-b, a, 0], 'p')}$`,
        `$R'(p) = ${a} - ${2 * b}p = 0 \\Rightarrow p = ${fmt(pOpt, 4)}$`,
        `Tržby tam činí $${fmt(pOpt * (a - b * pOpt), 2)}$ a elasticita je přesně $-1$ – to platí v maximu tržeb vždycky.`,
      ],
      viz: {
        type: 'function', xRange: [0, a / b], fns: [{ f: (x) => x * (a - b * x), label: 'tržby' }],
        points: [{ x: pOpt, y: pOpt * (a - b * pOpt), label: 'max' }],
        xLabel: 'cena', yLabel: 'tržby',
      },
    };
  },
};
