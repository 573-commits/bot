import { fmt, fracTex } from '../core/util.js';

export default {
  id: 'mocniny-odmocniny',
  name: 'Mocniny a odmocniny',
  category: 'Základy',
  icon: 'aⁿ',
  description: 'Pravidla pro mocniny, záporné a zlomkové exponenty, částečné odmocňování.',
  levels: 4,

  generate(level, rng) {
    if (level === 1) {
      const a = rng.int(2, 6), m = rng.int(2, 6), n = rng.int(2, 5);
      const op = rng.pick(['mul', 'div', 'pow']);
      const exp = op === 'mul' ? m + n : op === 'div' ? m - n : m * n;
      const tex = op === 'mul' ? `${a}^{${m}} \\cdot ${a}^{${n}}` : op === 'div' ? `\\frac{${a}^{${m}}}{${a}^{${n}}}` : `(${a}^{${m}})^{${n}}`;
      return {
        prompt: `Zjednoduš a vyčísli:\n$$${tex}$$`,
        answer: { type: 'number', value: a ** exp, tol: 1e-6 },
        answerLabel: 'výsledek =',
        hints: [
          op === 'mul' ? 'Stejný základ, násobení → exponenty **sečteme**.' : op === 'div' ? 'Stejný základ, dělení → exponenty **odečteme**.' : 'Mocnina mocniny → exponenty **vynásobíme**.',
          `Vyjde $${a}^{${exp}}$.`,
        ],
        solution: [`$${tex} = ${a}^{${exp}} = ${fmt(a ** exp)}$`],
      };
    }
    if (level === 2) {
      const a = rng.int(2, 5), n = rng.int(1, 4);
      return {
        prompt: `Vyčísli (výsledek jako zlomek):\n$$${a}^{-${n}}$$`,
        answer: { type: 'fraction', value: a ** -n, display: fracTex(1, a ** n) },
        answerLabel: 'výsledek =',
        placeholder: 'např. 1/8',
        hints: ['Záporný exponent = převrácená hodnota.', `$a^{-n} = \\frac{1}{a^n}$`],
        solution: [`$${a}^{-${n}} = \\frac{1}{${a}^{${n}}} = ${fracTex(1, a ** n)}$`],
      };
    }
    if (level === 3) {
      const b = rng.pick([2, 3, 5, 6, 7, 10]);
      const k = rng.pick([2, 3, 4, 5, 6]);
      const inside = k * k * b;
      return {
        prompt: `Částečně odmocni (uprav do tvaru $k\\sqrt{b}$) a zapiš **desetinnou hodnotu na 3 des. místa**:\n$$\\sqrt{${inside}}$$`,
        answer: { type: 'number', value: Math.sqrt(inside), decimals: 3 },
        answerLabel: '√ =',
        hints: [`Hledej největší druhou mocninu, která dělí ${inside}.`, `$${inside} = ${k * k} \\cdot ${b}$`, `$\\sqrt{${inside}} = ${k}\\sqrt{${b}}$`],
        solution: [`$\\sqrt{${inside}} = \\sqrt{${k * k} \\cdot ${b}} = ${k}\\sqrt{${b}} \\approx ${fmt(Math.sqrt(inside), 3)}$`],
      };
    }
    // level 4 – zlomkové exponenty
    const base = rng.pick([4, 8, 9, 16, 27, 25, 32, 64]);
    const den = rng.pick([2, 3]);
    let num = rng.pick([1, 2, 3, 4, 5]);
    while (num % den === 0) num = rng.pick([1, 2, 3, 4, 5]);
    const val = base ** (num / den);
    return {
      prompt: `Vyčísli:\n$$${base}^{${fracTex(num, den)}}$$\n(zaokrouhli na 3 des. místa, pokud nevyjde celé)`,
      answer: { type: 'number', value: val, decimals: 3 },
      answerLabel: 'výsledek =',
      hints: [
        `$a^{m/n} = \\sqrt[n]{a^m} = (\\sqrt[n]{a})^m$`,
        `$\\sqrt[${den}]{${base}} = ${fmt(base ** (1 / den), 4)}$, pak umocni na ${num}.`,
      ],
      solution: [`$${base}^{${fracTex(num, den)}} = (\\sqrt[${den}]{${base}})^{${num}} = ${fmt(val, 3)}$`],
    };
  },
};
