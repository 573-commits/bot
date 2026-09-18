import { fmt, mean, round } from '../core/util.js';

export default {
  id: 'casove-rady',
  name: 'Časové řady a indexy',
  category: 'Business',
  icon: '📅',
  description: 'Bazické a řetězové indexy, tempo růstu, CAGR a klouzavý průměr. Čím se měří vývoj tržeb.',
  levels: 4,

  generate(level, rng) {
    const years = rng.int(4, 7);
    const start = rng.int(20, 200) * 10;
    const series = [start];
    for (let i = 1; i < years; i++) {
      series.push(Math.round(series[i - 1] * (1 + rng.int(-15, 35) / 100)));
    }
    const y0 = 2019 + rng.int(0, 3);
    const table = `\n\n${series.map((v, i) => `${y0 + i}: **${v}**`).join(' · ')}\n`;

    if (level === 1) {
      const i = rng.int(1, years - 1);
      const idx = (series[i] / series[0]) * 100;
      return {
        prompt: `Tržby v tisících Kč:${table}\nUrči **bazický index** roku ${y0 + i} vzhledem k základnímu roku ${y0} (v %, na 2 des. místa).`,
        answer: { type: 'number', value: idx, decimals: 2 },
        answerLabel: 'index (%) =',
        hints: [
          'Bazický index porovnává vždy se stejným základním rokem.',
          `$I = \\frac{y_{${y0 + i}}}{y_{${y0}}} \\cdot 100 = \\frac{${series[i]}}{${series[0]}} \\cdot 100$`,
        ],
        solution: [
          `$I = \\frac{${series[i]}}{${series[0]}} \\cdot 100 = ${fmt(idx, 2)}\\ \\%$`,
          idx > 100 ? `Tržby vzrostly o ${fmt(idx - 100, 2)} % oproti základnímu roku.` : `Tržby klesly o ${fmt(100 - idx, 2)} % oproti základnímu roku.`,
        ],
        viz: { type: 'bars', data: series.map((v, k) => ({ label: String(y0 + k), value: v, color: k === i ? 'var(--c2)' : k === 0 ? 'var(--c3)' : 'var(--c1)' })), showValues: false },
      };
    }
    if (level === 2) {
      const i = rng.int(1, years - 1);
      const growth = ((series[i] - series[i - 1]) / series[i - 1]) * 100;
      return {
        prompt: `Tržby v tisících Kč:${table}\nUrči **tempo růstu** v roce ${y0 + i} oproti předchozímu roku (v %, na 2 des. místa).`,
        answer: { type: 'number', value: growth, decimals: 2 },
        answerLabel: 'tempo růstu (%) =',
        hints: [
          'Řetězový pohled: porovnáváš vždy s **předchozím** obdobím.',
          `$\\frac{y_t - y_{t-1}}{y_{t-1}} \\cdot 100 = \\frac{${series[i]} - ${series[i - 1]}}{${series[i - 1]}} \\cdot 100$`,
        ],
        solution: [
          `$\\frac{${series[i] - series[i - 1]}}{${series[i - 1]}} \\cdot 100 = ${fmt(growth, 2)}\\ \\%$`,
          `Řetězový index je ${fmt(100 + growth, 2)} %.`,
        ],
        viz: { type: 'bars', data: series.map((v, k) => ({ label: String(y0 + k), value: v, color: k === i ? 'var(--c2)' : k === i - 1 ? 'var(--c4)' : 'var(--c1)' })), showValues: false },
      };
    }
    if (level === 3) {
      const last = series[years - 1], periods = years - 1;
      const cagr = ((last / start) ** (1 / periods) - 1) * 100;
      return {
        prompt: `Tržby vzrostly z **${start}** (rok ${y0}) na **${last}** (rok ${y0 + periods}).\nUrči **průměrné roční tempo růstu (CAGR)** v % (na 4 des. místa).`,
        answer: { type: 'number', value: cagr, decimals: 4 },
        answerLabel: 'CAGR (%) =',
        hints: [
          'Prostý průměr ročních temp tady nefunguje – růst se skládá, ne sčítá.',
          `Použij geometrický průměr: $CAGR = \\left(\\frac{y_n}{y_0}\\right)^{1/n} - 1$, kde $n = ${periods}$ (počet **období**, ne let v řadě).`,
          `$\\frac{${last}}{${start}} = ${fmt(last / start, 6)}$`,
        ],
        solution: [
          `$CAGR = \\left(${fmt(last / start, 6)}\\right)^{1/${periods}} - 1 = ${fmt(cagr / 100, 6)}$`,
          `Tedy $${fmt(cagr, 4)}\\ \\%$ ročně.`,
          `Kontrola: $${start} \\cdot ${fmt(1 + cagr / 100, 6)}^{${periods}} = ${fmt(start * (1 + cagr / 100) ** periods, 1)}$`,
        ],
        viz: {
          type: 'function', xRange: [0, periods], yRange: [0, Math.max(...series) * 1.2],
          fns: [{ f: (t) => start * (1 + cagr / 100) ** t, label: 'CAGR' }],
          points: series.map((v, k) => ({ x: k, y: v })),
          xLabel: 'rok', yLabel: 'tržby',
        },
      };
    }
    // level 4 – klouzavý průměr
    const w = rng.pick([3, 3, 5]);
    if (series.length < w + 1) return this.generate(3, rng);
    const at = rng.int(Math.floor(w / 2), series.length - 1 - Math.floor(w / 2));
    const window = series.slice(at - Math.floor(w / 2), at + Math.floor(w / 2) + 1);
    const ma = mean(window);
    return {
      prompt: `Tržby v tisících Kč:${table}\nUrči **${w}členný klouzavý průměr** vystředěný na rok ${y0 + at} (na 4 des. místa).`,
      answer: { type: 'number', value: ma, decimals: 4 },
      answerLabel: 'klouzavý průměr =',
      hints: [
        `Vezmi ${w} hodnot tak, aby rok ${y0 + at} byl uprostřed.`,
        `Okno: ${window.join(' + ')}`,
        'Klouzavý průměr vyhlazuje výkyvy a ukáže trend.',
      ],
      solution: [
        `$\\frac{${window.join(' + ')}}{${w}} = \\frac{${window.reduce((a, b) => a + b, 0)}}{${w}} = ${fmt(ma, 4)}$`,
      ],
      viz: {
        type: 'bars', showValues: false,
        data: series.map((v, k) => ({ label: String(y0 + k), value: v, color: k >= at - Math.floor(w / 2) && k <= at + Math.floor(w / 2) ? 'var(--c2)' : 'var(--c1)' })),
        lines: [{ value: ma, label: 'kl. průměr' }],
      },
    };
  },
};
