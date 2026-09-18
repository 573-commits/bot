import { fmt, mean } from '../core/util.js';

function fit(pts) {
  const n = pts.length;
  const mx = mean(pts.map((p) => p.x)), my = mean(pts.map((p) => p.y));
  const sxy = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const sxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  const syy = pts.reduce((s, p) => s + (p.y - my) ** 2, 0);
  const a = sxy / sxx, b = my - a * mx;
  const r = sxy / Math.sqrt(sxx * syy);
  return { a, b, r, mx, my, sxy, sxx, syy, n };
}

export default {
  id: 'regrese',
  name: 'Regrese a korelace',
  category: 'Data',
  icon: '📈',
  description: 'Metoda nejmenších čtverců, korelační koeficient, predikce. Pro data analytics.',
  levels: 3,

  generate(level, rng) {
    const n = rng.int(5, 7);
    const a = rng.nz(-3, 4) + rng() * 0.6;
    const b = rng.int(-5, 20);
    const noise = level === 1 ? 0.6 : level === 2 ? 2.2 : 3.4;
    const pts = Array.from({ length: n }, (_, i) => {
      const x = i + 1 + rng.int(0, 1);
      return { x, y: Math.round((a * x + b + (rng() - 0.5) * 2 * noise) * 10) / 10 };
    });
    const f = fit(pts);
    const table = `\n\n$x$: ${pts.map((p) => p.x).join('; ')}\n$y$: ${pts.map((p) => fmt(p.y)).join('; ')}\n`;
    const viz = { type: 'scatter', points: pts, line: { a: f.a, b: f.b, label: 'regrese' }, xLabel: 'x', yLabel: 'y' };

    if (level === 1) {
      return {
        prompt: `Urči **směrnici regresní přímky** $y = ax + b$ metodou nejmenších čtverců (na 4 des. místa):\n${table}`,
        answer: { type: 'number', value: f.a, decimals: 4 },
        answerLabel: 'a =',
        hints: [
          `$a = \\frac{\\sum (x_i - \\bar{x})(y_i - \\bar{y})}{\\sum (x_i - \\bar{x})^2}$`,
          `$\\bar{x} = ${fmt(f.mx, 4)}$, $\\bar{y} = ${fmt(f.my, 4)}$`,
          `Čitatel $= ${fmt(f.sxy, 4)}$, jmenovatel $= ${fmt(f.sxx, 4)}$`,
        ],
        solution: [`$\\bar{x} = ${fmt(f.mx, 4)},\\ \\bar{y} = ${fmt(f.my, 4)}$`, `$a = \\frac{${fmt(f.sxy, 4)}}{${fmt(f.sxx, 4)}} = ${fmt(f.a, 4)}$`],
        viz,
      };
    }
    if (level === 2) {
      return {
        prompt: `Urči **Pearsonův korelační koeficient** $r$ (na 4 des. místa):\n${table}`,
        answer: { type: 'number', value: f.r, decimals: 4 },
        answerLabel: 'r =',
        hints: [
          `$r = \\frac{\\sum (x_i-\\bar{x})(y_i-\\bar{y})}{\\sqrt{\\sum(x_i-\\bar{x})^2 \\cdot \\sum(y_i-\\bar{y})^2}}$`,
          `$S_{xy} = ${fmt(f.sxy, 4)},\\ S_{xx} = ${fmt(f.sxx, 4)},\\ S_{yy} = ${fmt(f.syy, 4)}$`,
          '$r$ je vždy mezi $-1$ a $1$.',
        ],
        solution: [
          `$r = \\frac{${fmt(f.sxy, 4)}}{\\sqrt{${fmt(f.sxx, 4)} \\cdot ${fmt(f.syy, 4)}}} = ${fmt(f.r, 4)}$`,
          `$r^2 = ${fmt(f.r ** 2, 4)}$ – model vysvětluje ${fmt(f.r ** 2 * 100, 1)} % rozptylu $y$.`,
          Math.abs(f.r) > 0.8 ? 'Silná lineární závislost.' : Math.abs(f.r) > 0.5 ? 'Střední lineární závislost.' : 'Slabá lineární závislost.',
        ],
        viz,
      };
    }
    // level 3 – predikce
    const xNew = Math.max(...pts.map((p) => p.x)) + rng.int(1, 4);
    const pred = f.a * xNew + f.b;
    return {
      prompt: `Sestav regresní přímku a **predikuj** hodnotu $y$ pro $x = ${xNew}$ (na 4 des. místa):\n${table}`,
      answer: { type: 'number', value: pred, decimals: 4 },
      answerLabel: `ŷ(${xNew}) =`,
      hints: [
        `$a = ${fmt(f.a, 4)}$ (směrnice)`,
        `$b = \\bar{y} - a\\bar{x} = ${fmt(f.b, 4)}$`,
        `Dosaď: $\\hat{y} = ${fmt(f.a, 4)}\\cdot${xNew} + ${fmt(f.b, 4)}$`,
      ],
      solution: [
        `$a = ${fmt(f.a, 4)},\\ b = ${fmt(f.b, 4)}$`,
        `$\\hat{y} = ${fmt(f.a, 4)}\\cdot${xNew} ${f.b < 0 ? '-' : '+'} ${fmt(Math.abs(f.b), 4)} = ${fmt(pred, 4)}$`,
        'Pozor: extrapolace mimo rozsah dat je vždy riskantní.',
      ],
      viz: { ...viz, points: [...pts, { x: xNew, y: pred, label: 'predikce', color: 'var(--c4)' }] },
    };
  },
};
