import { fmt, round } from '../core/util.js';

export default {
  id: 'financni-matematika',
  name: 'Finanční matematika',
  category: 'Business',
  icon: '💰',
  description: 'Jednoduché i složené úročení, současná hodnota, NPV a anuitní splátka.',
  levels: 4,

  generate(level, rng) {
    if (level === 1) {
      const P = rng.int(10, 200) * 1000, r = rng.int(2, 12), n = rng.int(1, 10);
      const val = P * (1 + (r / 100) * n);
      return {
        prompt: `Uložíš **${P.toLocaleString('cs-CZ')} Kč** při **jednoduchém úročení ${r} % p.a.** na ${n} ${n === 1 ? 'rok' : n < 5 ? 'roky' : 'let'}.\nKolik budeš mít na konci? (na 2 des. místa)`,
        answer: { type: 'number', value: val, decimals: 2 },
        answerLabel: 'částka (Kč) =',
        hints: ['U jednoduchého úročení se úrok počítá pořád ze **základní** jistiny.', `$FV = P(1 + r \\cdot n) = ${P}(1 + ${fmt(r / 100)} \\cdot ${n})$`],
        solution: [`$FV = ${P} \\cdot (1 + ${fmt(r / 100)}\\cdot${n}) = ${fmt(val, 2)}$ Kč`, `Úrok celkem: ${fmt(val - P, 2)} Kč`],
      };
    }
    if (level === 2) {
      const P = rng.int(10, 200) * 1000, r = rng.int(2, 12), n = rng.int(2, 20);
      const val = P * (1 + r / 100) ** n;
      return {
        prompt: `Uložíš **${P.toLocaleString('cs-CZ')} Kč** při **složeném úročení ${r} % p.a.** na ${n} let.\nKolik budeš mít na konci? (na 2 des. místa)`,
        answer: { type: 'number', value: val, decimals: 2 },
        answerLabel: 'FV (Kč) =',
        hints: [
          'U složeného úročení se úročí i připsané úroky.',
          `$FV = P(1+r)^n = ${P}\\cdot(1 + ${fmt(r / 100)})^{${n}}$`,
        ],
        solution: [
          `$FV = ${P}\\cdot ${fmt(1 + r / 100)}^{${n}} = ${fmt(val, 2)}$ Kč`,
          `Oproti jednoduchému úročení (${fmt(P * (1 + (r / 100) * n), 2)} Kč) je to o ${fmt(val - P * (1 + (r / 100) * n), 2)} Kč víc.`,
        ],
        viz: {
          type: 'function', xRange: [0, n], yRange: [0, val * 1.1],
          fns: [{ f: (t) => P * (1 + r / 100) ** t, label: 'složené' }, { f: (t) => P * (1 + (r / 100) * t), label: 'jednoduché', dashed: true }],
          xLabel: 'roky', yLabel: 'Kč',
        },
      };
    }
    if (level === 3) {
      const FV = rng.int(50, 500) * 1000, r = rng.int(3, 12), n = rng.int(3, 15);
      const PV = FV / (1 + r / 100) ** n;
      return {
        prompt: `Za ${n} let chceš mít **${FV.toLocaleString('cs-CZ')} Kč**. Úroková míra je **${r} % p.a.**\nKolik musíš uložit **dnes**? (současná hodnota, na 2 des. místa)`,
        answer: { type: 'number', value: PV, decimals: 2 },
        answerLabel: 'PV (Kč) =',
        hints: [
          'Diskontování je opak úročení – dělíš místo násobení.',
          `$PV = \\frac{FV}{(1+r)^n}$`,
          `$= \\frac{${FV}}{${fmt(1 + r / 100)}^{${n}}}$`,
        ],
        solution: [`$PV = \\frac{${FV}}{${fmt((1 + r / 100) ** n, 6)}} = ${fmt(PV, 2)}$ Kč`],
      };
    }
    // level 4 – anuitní splátka nebo NPV
    if (rng() < 0.5) {
      const P = rng.int(300, 3000) * 1000, rY = rng.int(3, 9), years = rng.pick([5, 10, 15, 20, 25, 30]);
      const i = rY / 100 / 12, n = years * 12;
      const a = (P * i) / (1 - (1 + i) ** -n);
      return {
        prompt: `Hypotéka **${P.toLocaleString('cs-CZ')} Kč**, úrok **${rY} % p.a.**, splatnost **${years} let**, měsíční anuitní splátky.\nJaká je měsíční splátka? (na 2 des. místa)`,
        answer: { type: 'number', value: a, decimals: 2 },
        answerLabel: 'splátka (Kč) =',
        hints: [
          `Měsíční úroková míra $i = \\frac{${rY}\\,\\%}{12} = ${fmt(i, 8)}$, počet splátek $n = ${n}$.`,
          `$a = \\frac{P \\cdot i}{1 - (1+i)^{-n}}$`,
        ],
        solution: [
          `$i = ${fmt(i, 8)},\\ n = ${n}$`,
          `$a = \\frac{${P}\\cdot${fmt(i, 8)}}{1 - ${fmt((1 + i) ** -n, 8)}} = ${fmt(a, 2)}$ Kč`,
          `Celkem zaplatíš ${fmt(a * n, 2)} Kč, z toho na úrocích ${fmt(a * n - P, 2)} Kč.`,
        ],
      };
    }
    const invest = rng.int(100, 800) * 1000;
    const r = rng.int(5, 12);
    const years = rng.int(3, 5);
    const cf = Array.from({ length: years }, () => rng.int(30, 300) * 1000);
    const npv = -invest + cf.reduce((s, c, i) => s + c / (1 + r / 100) ** (i + 1), 0);
    return {
      prompt: `Investice **${invest.toLocaleString('cs-CZ')} Kč** dnes přinese cash flow ${cf.map((c) => c.toLocaleString('cs-CZ')).join(' Kč, ')} Kč v letech 1–${years}.\nDiskontní sazba **${r} %**. Spočítej **NPV**. (na 2 des. místa)`,
      answer: { type: 'number', value: npv, decimals: 2 },
      answerLabel: 'NPV (Kč) =',
      hints: [
        'Každé budoucí CF diskontuj na dnešek a odečti počáteční investici.',
        `$NPV = -${invest} + \\sum_{t=1}^{${years}} \\frac{CF_t}{${fmt(1 + r / 100)}^t}$`,
        `První rok: $\\frac{${cf[0]}}{${fmt(1 + r / 100)}} = ${fmt(cf[0] / (1 + r / 100), 2)}$`,
      ],
      solution: [
        ...cf.map((c, i) => `Rok ${i + 1}: $\\frac{${c}}{${fmt(1 + r / 100)}^{${i + 1}}} = ${fmt(c / (1 + r / 100) ** (i + 1), 2)}$`),
        `$NPV = -${invest} + ${fmt(cf.reduce((s, c, i) => s + c / (1 + r / 100) ** (i + 1), 0), 2)} = ${fmt(npv, 2)}$ Kč`,
        npv > 0 ? 'NPV > 0 → investice se vyplatí.' : 'NPV < 0 → investice se při této sazbě nevyplatí.',
      ],
      viz: { type: 'bars', data: [{ label: 'inv.', value: invest, color: 'var(--c4)' }, ...cf.map((c, i) => ({ label: `r${i + 1}`, value: c }))], showValues: false },
    };
  },
};
