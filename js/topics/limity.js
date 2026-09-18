import { fmt, polyTex, sgn } from '../core/util.js';

export default {
  id: 'limity',
  name: 'Limity',
  category: 'Analýza',
  icon: 'lim',
  description: 'Limity v bodě i v nekonečnu, neurčité výrazy typu 0/0.',
  levels: 4,

  generate(level, rng) {
    if (level === 1) {
      const a = rng.nz(1, 4), b = rng.nz(-6, 6), c = rng.int(-6, 6), x0 = rng.int(-3, 3);
      const val = a * x0 * x0 + b * x0 + c;
      return {
        prompt: `Spočítej limitu:\n$$\\lim_{x \\to ${x0}} \\left(${polyTex([a, b, c])}\\right)$$`,
        answer: { type: 'number', value: val, tol: 1e-9 },
        answerLabel: 'limita =',
        hints: ['Polynom je spojitý – stačí dosadit.', `Dosaď $x = ${x0}$.`],
        solution: [`Polynom je spojitý, takže $\\lim = f(${x0}) = ${fmt(val)}$`],
        viz: { type: 'function', fns: [{ f: (x) => a * x * x + b * x + c }], points: [{ x: x0, y: val }], xRange: [x0 - 4, x0 + 4] },
      };
    }
    if (level === 2) {
      // typ 0/0 – krácení (x^2 - r^2)/(x - r)
      const r = rng.nz(1, 6);
      const val = 2 * r;
      return {
        prompt: `Spočítej limitu:\n$$\\lim_{x \\to ${r}} \\frac{x^2 ${sgn(-r * r)}}{x ${sgn(-r)}}$$`,
        answer: { type: 'number', value: val, tol: 1e-9 },
        answerLabel: 'limita =',
        hints: [
          `Dosazením dostaneš $\\frac{0}{0}$ – neurčitý výraz, musíš upravit.`,
          `Rozlož čitatel: $x^2 ${sgn(-r * r)} = (x ${sgn(-r)})(x ${sgn(r)})$.`,
          'Zkrať a teprve pak dosaď.',
        ],
        solution: [
          `$\\frac{(x ${sgn(-r)})(x ${sgn(r)})}{x ${sgn(-r)}} = x ${sgn(r)}$ (pro $x \\ne ${fmt(r)}$)`,
          `$\\lim_{x \\to ${r}} (x ${sgn(r)}) = ${fmt(val)}$`,
        ],
        viz: { type: 'function', fns: [{ f: (x) => x + r }], points: [{ x: r, y: val, hollow: true, label: 'díra' }], xRange: [r - 5, r + 5] },
      };
    }
    if (level === 3) {
      // limita v nekonečnu, racionální funkce
      const a = rng.nz(1, 9), b = rng.nz(1, 9), c = rng.int(-9, 9), d = rng.int(-9, 9);
      const deg = rng.pick(['same', 'lower', 'higher']);
      let num, den, val, numTex, denTex;
      if (deg === 'same') {
        numTex = polyTex([a, c]); denTex = polyTex([b, d]); val = a / b;
        num = (x) => a * x + c; den = (x) => b * x + d;
      } else if (deg === 'lower') {
        numTex = polyTex([a, c]); denTex = polyTex([b, d, 1]); val = 0;
        num = (x) => a * x + c; den = (x) => b * x * x + d * x + 1;
      } else {
        numTex = polyTex([a, c, 1]); denTex = polyTex([b, d]); val = Infinity * Math.sign(a / b);
        num = (x) => a * x * x + c * x + 1; den = (x) => b * x + d;
      }
      return {
        prompt: `Spočítej limitu:\n$$\\lim_{x \\to \\infty} \\frac{${numTex}}{${denTex}}$$\n${deg === 'higher' ? '*Pokud je výsledek nekonečno, napiš `inf` nebo `-inf`.*' : ''}`,
        answer: deg === 'higher'
          ? { type: 'text', value: val > 0 ? ['inf', '+inf', '∞', '+∞', 'nekonecno', 'nekonečno'] : ['-inf', '-∞'], display: val > 0 ? '$\\infty$' : '$-\\infty$' }
          : { type: 'number', value: val, tol: 1e-6 },
        answerLabel: 'limita =',
        hints: [
          'Porovnej **stupně** polynomu v čitateli a ve jmenovateli.',
          deg === 'same' ? 'Stejné stupně → podíl vedoucích koeficientů.' : deg === 'lower' ? 'Nižší stupeň nahoře → limita je 0.' : 'Vyšší stupeň nahoře → limita je nekonečno.',
          'Formálně: vytkni nejvyšší mocninu $x$ z čitatele i jmenovatele.',
        ],
        solution: [
          deg === 'same' ? `$\\frac{${fmt(a)}}{${fmt(b)}} = ${fmt(val)}$ (podíl vedoucích koeficientů)`
            : deg === 'lower' ? 'Jmenovatel roste rychleji → limita $= 0$.'
              : `Čitatel roste rychleji → limita $= ${val > 0 ? '\\infty' : '-\\infty'}$.`,
        ],
        viz: { type: 'function', xRange: [1, 60], fns: [{ f: (x) => num(x) / den(x) }] },
      };
    }
    // level 4 – 0/0 s odmocninou
    const a = rng.int(1, 9);
    // lim x->0 (sqrt(x+a) - sqrt(a))/x = 1/(2 sqrt(a))
    const val = 1 / (2 * Math.sqrt(a));
    return {
      prompt: `Spočítej limitu (na 4 des. místa):\n$$\\lim_{x \\to 0} \\frac{\\sqrt{x + ${a}} - \\sqrt{${a}}}{x}$$`,
      answer: { type: 'number', value: val, decimals: 4 },
      answerLabel: 'limita =',
      placeholder: 'např. 0,1667',
      hints: [
        'Zase typ $\\frac{0}{0}$.',
        'Rozšiř zlomek výrazem $\\sqrt{x+' + a + '} + \\sqrt{' + a + '}$ (sdružený výraz).',
        `V čitateli použij $(A-B)(A+B) = A^2 - B^2$, takže zbyde jen $x$.`,
      ],
      solution: [
        `$\\frac{(\\sqrt{x+${a}} - \\sqrt{${a}})(\\sqrt{x+${a}} + \\sqrt{${a}})}{x(\\sqrt{x+${a}} + \\sqrt{${a}})} = \\frac{x}{x(\\sqrt{x+${a}}+\\sqrt{${a}})}$`,
        `$= \\frac{1}{\\sqrt{x+${a}}+\\sqrt{${a}}} \\to \\frac{1}{2\\sqrt{${a}}} = ${fmt(val, 4)}$`,
        'Mimochodem: je to derivace $\\sqrt{x}$ v bodě ' + a + '.',
      ],
    };
  },
};
