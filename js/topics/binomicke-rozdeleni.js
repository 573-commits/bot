import { fmt, nCr, binomPmf, binomCdf } from '../core/util.js';

const distBars = (n, p, highlight = null) => ({
  type: 'bars',
  showValues: false,
  data: Array.from({ length: Math.min(n + 1, 16) }, (_, k) => ({
    label: String(k),
    value: binomPmf(n, k, p),
    color: highlight != null && k === highlight ? 'var(--c2)' : 'var(--c1)',
  })),
});

export default {
  id: 'binomicke-rozdeleni',
  name: 'Binomické rozdělení',
  category: 'Data',
  icon: '🎯',
  description: 'Počet úspěchů z n nezávislých pokusů – konverze, zmetky, odpovědi v dotazníku.',
  levels: 4,

  generate(level, rng) {
    const n = rng.int(5, 14);
    const p = rng.pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.75]);

    if (level === 1) {
      const k = rng.int(1, n - 1);
      return {
        prompt: `Provedeš **${n} nezávislých pokusů**, každý uspěje s pravděpodobností **${fmt(p)}**.\nJaká je pravděpodobnost **právě ${k} úspěchů**? (na 4 des. místa)`,
        answer: { type: 'number', value: binomPmf(n, k, p), decimals: 4 },
        answerLabel: 'P(X = ' + k + ') =',
        hints: [
          `$P(X = k) = \\binom{n}{k} p^k (1-p)^{n-k}$`,
          `$\\binom{${n}}{${k}} = ${nCr(n, k)}$`,
          `Dosaď: $${nCr(n, k)} \\cdot ${fmt(p)}^{${k}} \\cdot ${fmt(1 - p)}^{${n - k}}$`,
        ],
        solution: [
          `$\\binom{${n}}{${k}} = ${nCr(n, k)}$`,
          `$P = ${nCr(n, k)} \\cdot ${fmt(p)}^{${k}} \\cdot ${fmt(1 - p)}^{${n - k}} = ${fmt(binomPmf(n, k, p), 4)}$`,
        ],
        viz: distBars(n, p, k),
      };
    }
    if (level === 2) {
      const which = rng.pick(['stredni', 'rozptyl']);
      const val = which === 'stredni' ? n * p : n * p * (1 - p);
      return {
        prompt: `$X \\sim Bi(${n};\\ ${fmt(p)})$.\nUrči **${which === 'stredni' ? 'střední hodnotu' : 'rozptyl'}** $${which === 'stredni' ? 'E(X)' : 'D(X)'}$. (na 4 des. místa)`,
        answer: { type: 'number', value: val, decimals: 4 },
        answerLabel: which === 'stredni' ? 'E(X) =' : 'D(X) =',
        hints: [
          which === 'stredni' ? '$E(X) = np$ – prostě průměrný počet úspěchů.' : '$D(X) = np(1-p)$',
          `$n = ${n}$, $p = ${fmt(p)}$`,
        ],
        solution: [
          which === 'stredni'
            ? `$E(X) = ${n} \\cdot ${fmt(p)} = ${fmt(val, 4)}$`
            : `$D(X) = ${n} \\cdot ${fmt(p)} \\cdot ${fmt(1 - p)} = ${fmt(val, 4)}$`,
          which === 'rozptyl' ? `Směrodatná odchylka je $\\sqrt{${fmt(val, 4)}} = ${fmt(Math.sqrt(val), 4)}$.` : `Nejpravděpodobnější počet úspěchů bude kolem ${Math.round(val)}.`,
        ],
        viz: distBars(n, p),
      };
    }
    if (level === 3) {
      const k = rng.int(1, n - 2);
      const dir = rng.pick(['nejvyse', 'aspon']);
      const val = dir === 'nejvyse' ? binomCdf(n, k, p) : 1 - binomCdf(n, k - 1, p);
      return {
        prompt: `$X \\sim Bi(${n};\\ ${fmt(p)})$.\nUrči $P(X ${dir === 'nejvyse' ? '\\le' : '\\ge'} ${k})$ — tedy **${dir === 'nejvyse' ? 'nejvýše' : 'alespoň'} ${k} úspěchů**. (na 4 des. místa)`,
        answer: { type: 'number', value: val, decimals: 4 },
        answerLabel: 'P =',
        hints: [
          dir === 'nejvyse'
            ? `Sečti pravděpodobnosti pro $k = 0, 1, \\ldots, ${k}$.`
            : `„Alespoň ${k}“ se počítá přes opačný jev: $1 - P(X \\le ${k - 1})$.`,
          `$P(X = 0) = ${fmt(binomPmf(n, 0, p), 5)}$, $P(X = 1) = ${fmt(binomPmf(n, 1, p), 5)}$, …`,
        ],
        solution: [
          dir === 'nejvyse'
            ? `$P = \\sum_{i=0}^{${k}} \\binom{${n}}{i} ${fmt(p)}^i ${fmt(1 - p)}^{${n}-i} = ${fmt(val, 4)}$`
            : `$P = 1 - P(X \\le ${k - 1}) = 1 - ${fmt(binomCdf(n, k - 1, p), 4)} = ${fmt(val, 4)}$`,
        ],
        viz: distBars(n, p),
      };
    }
    // level 4 – slovní úloha z praxe
    const visits = rng.int(8, 20);
    const conv = rng.pick([0.05, 0.1, 0.15, 0.2]);
    const val = 1 - binomCdf(visits, 0, conv);
    return {
      prompt: `Konverzní poměr e-shopu je **${fmt(conv * 100)} %**. Dnes přišlo **${visits} návštěvníků**.\nJaká je pravděpodobnost, že nakoupí **alespoň jeden**? (na 4 des. místa)`,
      answer: { type: 'number', value: val, decimals: 4 },
      answerLabel: 'P =',
      hints: [
        'Počítat „alespoň jeden“ přímo znamená sečíst spoustu členů – jdi přes opačný jev.',
        `Opačný jev: nenakoupí nikdo, tedy $${fmt(1 - conv)}^{${visits}}$.`,
      ],
      solution: [
        `$P(X = 0) = ${fmt(1 - conv)}^{${visits}} = ${fmt(binomPmf(visits, 0, conv), 5)}$`,
        `$P(X \\ge 1) = 1 - ${fmt(binomPmf(visits, 0, conv), 5)} = ${fmt(val, 4)}$`,
        `Očekávaný počet nákupů je $np = ${fmt(visits * conv, 2)}$.`,
      ],
      viz: distBars(visits, conv),
    };
  },
};
