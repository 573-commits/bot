import { fmt, normalCdf, normalInv, normalPdf } from '../core/util.js';

export default {
  id: 'testovani-hypotez',
  name: 'Testování hypotéz',
  category: 'Data',
  icon: 'H₀',
  description: 'Testové kritérium, p-hodnota a rozhodnutí. To, co stojí za každým A/B testem.',
  levels: 3,

  generate(level, rng) {
    if (level === 1) {
      const mu0 = rng.int(50, 500), sigma = rng.int(5, 60), n = rng.pick([25, 36, 49, 100]);
      const diff = rng.int(-30, 30) / 10 * (sigma / Math.sqrt(n));
      const xbar = Math.round((mu0 + diff) * 100) / 100;
      const z = (xbar - mu0) / (sigma / Math.sqrt(n));
      return {
        prompt: `Testuješ $H_0: \\mu = ${mu0}$. Z výběru **n = ${n}** vyšel průměr **${fmt(xbar)}**, směrodatná odchylka je **${sigma}**.\nSpočítej **testové kritérium** $z$. (na 4 des. místa)`,
        answer: { type: 'number', value: z, decimals: 4 },
        answerLabel: 'z =',
        hints: [
          `$z = \\frac{\\bar{x} - \\mu_0}{\\sigma / \\sqrt{n}}$`,
          `Jmenovatel (standardní chyba) $= \\frac{${sigma}}{\\sqrt{${n}}} = ${fmt(sigma / Math.sqrt(n), 4)}$`,
          `Čitatel $= ${fmt(xbar)} - ${mu0} = ${fmt(xbar - mu0, 4)}$`,
        ],
        solution: [
          `Standardní chyba $= ${fmt(sigma / Math.sqrt(n), 4)}$`,
          `$z = \\frac{${fmt(xbar - mu0, 4)}}{${fmt(sigma / Math.sqrt(n), 4)}} = ${fmt(z, 4)}$`,
          'Testové kritérium říká, o kolik standardních chyb se výběr liší od hypotézy.',
        ],
      };
    }
    if (level === 2) {
      const z = Math.round(rng.int(-320, 320)) / 100;
      const side = rng.pick(['obou', 'prave']);
      const pv = side === 'obou' ? 2 * (1 - normalCdf(Math.abs(z))) : 1 - normalCdf(z);
      return {
        prompt: `Testové kritérium vyšlo $z = ${fmt(z)}$.\nUrči **p-hodnotu** pro **${side === 'obou' ? 'oboustranný' : 'pravostranný'}** test. (na 4 des. místa)`,
        answer: { type: 'number', value: pv, decimals: 4 },
        answerLabel: 'p =',
        hints: [
          'p-hodnota je pravděpodobnost, že bys dostal takový nebo extrémnější výsledek, **kdyby $H_0$ platila**.',
          side === 'obou'
            ? 'U oboustranného testu počítáš oba konce: $p = 2\\left(1 - \\Phi(|z|)\\right)$.'
            : 'U pravostranného testu jen pravý konec: $p = 1 - \\Phi(z)$.',
          `$\\Phi(${fmt(Math.abs(z))}) = ${fmt(normalCdf(Math.abs(z)), 4)}$`,
        ],
        solution: [
          side === 'obou'
            ? `$p = 2(1 - ${fmt(normalCdf(Math.abs(z)), 4)}) = ${fmt(pv, 4)}$`
            : `$p = 1 - ${fmt(normalCdf(z), 4)} = ${fmt(pv, 4)}$`,
          pv < 0.05 ? 'Na hladině 5 % bys $H_0$ zamítl.' : 'Na hladině 5 % bys $H_0$ nezamítl.',
        ],
        viz: {
          type: 'function', xRange: [-3.8, 3.8], yRange: [0, 0.5],
          fns: [{ f: (x) => normalPdf(x) }],
          area: { f: (x) => normalPdf(x), from: Math.abs(z), to: 3.8 },
          vlines: [{ x: z, label: 'z' }],
          xLabel: 'z', yLabel: '',
        },
      };
    }
    // level 3 – rozhodnutí + kritická hodnota
    const alpha = rng.pick([0.01, 0.05, 0.10]);
    const z = Math.round(rng.int(-300, 300)) / 100;
    const crit = normalInv(1 - alpha / 2);
    const reject = Math.abs(z) > crit;
    return {
      prompt: `Oboustranný test na hladině významnosti $\\alpha = ${fmt(alpha)}$, testové kritérium $z = ${fmt(z)}$.\nUrči **kritickou hodnotu** $z_{krit}$ (kladnou, na 4 des. místa).`,
      answer: { type: 'number', value: crit, decimals: 4 },
      answerLabel: 'z_krit =',
      hints: [
        'U oboustranného testu se hladina dělí na dva konce, na každý $\\alpha/2$.',
        `Hledáš $z$, pro které $\\Phi(z) = 1 - \\frac{${fmt(alpha)}}{2} = ${fmt(1 - alpha / 2, 4)}$.`,
        'Nejčastější hodnoty: 1,6449 (10 %), 1,9600 (5 %), 2,5758 (1 %).',
      ],
      solution: [
        `$\\Phi(z_{krit}) = ${fmt(1 - alpha / 2, 4)} \\Rightarrow z_{krit} = ${fmt(crit, 4)}$`,
        `Protože $|z| = ${fmt(Math.abs(z))} ${reject ? '>' : '<'} ${fmt(crit, 4)}$, hypotézu $H_0$ **${reject ? 'zamítáme' : 'nezamítáme'}**.`,
        reject ? 'Výsledek je statisticky významný.' : 'Data nestačí na zamítnutí – to ale neznamená, že $H_0$ platí.',
      ],
      viz: {
        type: 'function', xRange: [-3.8, 3.8], yRange: [0, 0.5],
        fns: [{ f: (x) => normalPdf(x) }],
        area: { f: (x) => normalPdf(x), from: crit, to: 3.8 },
        vlines: [{ x: z, label: 'z' }, { x: -crit }, { x: crit, label: 'krit.' }],
        xLabel: 'z', yLabel: '',
      },
    };
  },
};
