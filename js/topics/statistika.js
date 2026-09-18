import { fmt, mean, median, variance, stdev, round } from '../core/util.js';

export default {
  id: 'statistika',
  name: 'Popisná statistika',
  category: 'Data',
  icon: '📊',
  description: 'Průměr, medián, modus, rozptyl, směrodatná odchylka a kvartily.',
  levels: 4,

  generate(level, rng) {
    const n = level === 1 ? rng.int(5, 7) : rng.int(7, 11);
    const data = Array.from({ length: n }, () => rng.int(1, 40));
    const bars = { type: 'bars', data: data.map((v, i) => ({ label: String(i + 1), value: v })) };

    if (level === 1) {
      const which = rng.pick(['prumer', 'median']);
      if (which === 'prumer') {
        return {
          prompt: `Urči **aritmetický průměr** těchto hodnot (na 4 des. místa):\n$$${data.join(';\\ ')}$$`,
          answer: { type: 'number', value: mean(data), decimals: 4 },
          answerLabel: 'x̄ =',
          hints: ['Sečti všechny hodnoty a vyděl jejich počtem.', `Součet je ${data.reduce((s, x) => s + x, 0)}, počet ${n}.`],
          solution: [`$\\bar{x} = \\frac{${data.reduce((s, x) => s + x, 0)}}{${n}} = ${fmt(mean(data), 4)}$`],
          viz: { ...bars, lines: [{ value: mean(data), label: 'průměr' }] },
        };
      }
      const sorted = data.slice().sort((a, b) => a - b);
      return {
        prompt: `Urči **medián**:\n$$${data.join(';\\ ')}$$`,
        answer: { type: 'number', value: median(data), tol: 1e-6 },
        answerLabel: 'medián =',
        hints: ['Nejdřív hodnoty **seřaď**.', `Seřazeno: $${sorted.join(';\\ ')}$`, n % 2 ? 'Počet je lichý → prostřední hodnota.' : 'Počet je sudý → průměr dvou prostředních.'],
        solution: [`Seřazeno: $${sorted.join(';\\ ')}$`, `Medián $= ${fmt(median(data))}$`],
        viz: { ...bars, lines: [{ value: median(data), label: 'medián' }] },
      };
    }
    if (level === 2) {
      return {
        prompt: `Urči **rozptyl** (populační, dělíš $n$) těchto hodnot (na 4 des. místa):\n$$${data.join(';\\ ')}$$`,
        answer: { type: 'number', value: variance(data), decimals: 4 },
        answerLabel: 'σ² =',
        hints: [
          'Nejdřív průměr, pak průměr čtverců odchylek.',
          `$\\bar{x} = ${fmt(mean(data), 4)}$`,
          `$\\sigma^2 = \\frac{1}{n}\\sum (x_i - \\bar{x})^2$`,
        ],
        solution: [
          `$\\bar{x} = ${fmt(mean(data), 4)}$`,
          `$\\sum (x_i - \\bar{x})^2 = ${fmt(variance(data) * n, 4)}$`,
          `$\\sigma^2 = \\frac{${fmt(variance(data) * n, 4)}}{${n}} = ${fmt(variance(data), 4)}$`,
        ],
        viz: { ...bars, lines: [{ value: mean(data), label: 'průměr' }] },
      };
    }
    if (level === 3) {
      return {
        prompt: `Urči **směrodatnou odchylku** (populační) (na 4 des. místa):\n$$${data.join(';\\ ')}$$`,
        answer: { type: 'number', value: stdev(data), decimals: 4 },
        answerLabel: 'σ =',
        hints: ['Směrodatná odchylka je odmocnina z rozptylu.', `$\\sigma^2 = ${fmt(variance(data), 4)}$`],
        solution: [`$\\sigma^2 = ${fmt(variance(data), 4)}$`, `$\\sigma = \\sqrt{${fmt(variance(data), 4)}} = ${fmt(stdev(data), 4)}$`],
        viz: { ...bars, lines: [{ value: mean(data), label: 'průměr' }, { value: mean(data) + stdev(data), label: '+σ', color: 'var(--c3)' }] },
      };
    }
    // level 4 – variační koeficient nebo kvartily
    if (rng() < 0.5) {
      const cv = (stdev(data) / mean(data)) * 100;
      return {
        prompt: `Urči **variační koeficient** v procentech (na 2 des. místa):\n$$${data.join(';\\ ')}$$`,
        answer: { type: 'number', value: cv, decimals: 2 },
        answerLabel: 'V (%) =',
        hints: [
          'Variační koeficient = směrodatná odchylka / průměr · 100. Říká, jak velký je rozptyl **vzhledem k velikosti** hodnot.',
          `$\\sigma = ${fmt(stdev(data), 4)}$, $\\bar{x} = ${fmt(mean(data), 4)}$`,
        ],
        solution: [`$V = \\frac{${fmt(stdev(data), 4)}}{${fmt(mean(data), 4)}} \\cdot 100 = ${fmt(cv, 2)}\\ \\%$`],
        viz: { ...bars, lines: [{ value: mean(data), label: 'průměr' }] },
      };
    }
    const sorted = data.slice().sort((a, b) => a - b);
    const q = (p) => { // lineární interpolace, stejná konvence jako Excel PERCENTILE.INC
      const idx = p * (sorted.length - 1);
      const lo = Math.floor(idx), hi = Math.ceil(idx);
      return sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
    };
    const iqr = q(0.75) - q(0.25);
    return {
      prompt: `Urči **mezikvartilové rozpětí** $IQR = Q_3 - Q_1$ (lineární interpolace jako v Excelu, na 4 des. místa):\n$$${data.join(';\\ ')}$$`,
      answer: { type: 'number', value: iqr, decimals: 4 },
      answerLabel: 'IQR =',
      hints: [
        `Seřazeno: $${sorted.join(';\\ ')}$`,
        `$Q_1 = ${fmt(q(0.25), 4)}$ (25. percentil), $Q_3 = ${fmt(q(0.75), 4)}$`,
        'IQR měří rozptyl prostředních 50 % dat – na rozdíl od rozpětí ho netáhnou odlehlé hodnoty.',
      ],
      solution: [`$Q_1 = ${fmt(q(0.25), 4)}$`, `$Q_3 = ${fmt(q(0.75), 4)}$`, `$IQR = ${fmt(iqr, 4)}$`],
      viz: { ...bars, lines: [{ value: q(0.25), label: 'Q1' }, { value: q(0.75), label: 'Q3', color: 'var(--c3)' }] },
    };
  },
};
