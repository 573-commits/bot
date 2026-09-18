import { fmt } from '../core/util.js';

const TABLE = [
  { deg: 0, tex: '0', sin: 0, cos: 1 },
  { deg: 30, tex: '\\frac{\\pi}{6}', sin: 0.5, cos: Math.sqrt(3) / 2 },
  { deg: 45, tex: '\\frac{\\pi}{4}', sin: Math.SQRT1_2, cos: Math.SQRT1_2 },
  { deg: 60, tex: '\\frac{\\pi}{3}', sin: Math.sqrt(3) / 2, cos: 0.5 },
  { deg: 90, tex: '\\frac{\\pi}{2}', sin: 1, cos: 0 },
  { deg: 120, tex: '\\frac{2\\pi}{3}', sin: Math.sqrt(3) / 2, cos: -0.5 },
  { deg: 135, tex: '\\frac{3\\pi}{4}', sin: Math.SQRT1_2, cos: -Math.SQRT1_2 },
  { deg: 150, tex: '\\frac{5\\pi}{6}', sin: 0.5, cos: -Math.sqrt(3) / 2 },
  { deg: 180, tex: '\\pi', sin: 0, cos: -1 },
  { deg: 210, tex: '\\frac{7\\pi}{6}', sin: -0.5, cos: -Math.sqrt(3) / 2 },
  { deg: 240, tex: '\\frac{4\\pi}{3}', sin: -Math.sqrt(3) / 2, cos: -0.5 },
  { deg: 270, tex: '\\frac{3\\pi}{2}', sin: -1, cos: 0 },
  { deg: 300, tex: '\\frac{5\\pi}{3}', sin: -Math.sqrt(3) / 2, cos: 0.5 },
  { deg: 330, tex: '\\frac{11\\pi}{6}', sin: -0.5, cos: Math.sqrt(3) / 2 },
];

export default {
  id: 'goniometrie',
  name: 'Goniometrie',
  category: 'Funkce',
  icon: '∿',
  description: 'Jednotková kružnice, hodnoty sin/cos/tg, převod stupňů a radiánů, jednoduché rovnice.',
  levels: 4,

  generate(level, rng) {
    if (level === 1) {
      const e = rng.pick(TABLE.filter((t) => t.deg % 90 === 0 || [30, 45, 60].includes(t.deg)));
      const f = rng.pick(['sin', 'cos']);
      const val = f === 'sin' ? e.sin : e.cos;
      return {
        prompt: `Urči hodnotu (přesně, klidně jako $\\sqrt{}$ výraz):\n$$\\${f}\\ ${e.deg}°$$`,
        answer: { type: 'number', value: val, tol: 5e-4, display: fmt(val, 4) },
        answerLabel: `${f} ${e.deg}° =`,
        placeholder: 'např. sqrt(3)/2 nebo 0,866',
        hints: [
          'Představ si bod na jednotkové kružnici. $\\cos$ je vodorovná souřadnice, $\\sin$ svislá.',
          `Pro ${e.deg}° je bod $[${fmt(e.cos, 4)}; ${fmt(e.sin, 4)}]$.`,
        ],
        solution: [`$\\${f}\\ ${e.deg}° = ${fmt(val, 6)}$`],
        viz: { type: 'unitcircle', angle: e.deg, angleLabel: `${e.deg}°` },
      };
    }
    if (level === 2) {
      const e = rng.pick(TABLE.slice(1));
      const toRad = rng() < 0.5;
      if (toRad) {
        return {
          prompt: `Převeď na radiány (zapiš číselně, např. \`pi/6\` nebo \`0,524\`):\n$$${e.deg}°$$`,
          answer: { type: 'number', value: (e.deg * Math.PI) / 180, tol: 1e-3 },
          answerLabel: 'radiány =',
          placeholder: 'pi/3',
          hints: ['$180° = \\pi$ rad, takže násobíš $\\frac{\\pi}{180}$.', `$${e.deg} \\cdot \\frac{\\pi}{180}$`],
          solution: [`$${e.deg}° = ${e.deg}\\cdot\\frac{\\pi}{180} = ${e.tex} \\approx ${fmt((e.deg * Math.PI) / 180, 4)}$ rad`],
          viz: { type: 'unitcircle', angle: e.deg, angleLabel: e.tex.replace(/\\frac\{(.*?)\}\{(.*?)\}/, '$1/$2') },
        };
      }
      return {
        prompt: `Převeď na stupně:\n$$${e.tex}\\ \\text{rad}$$`,
        answer: { type: 'number', value: e.deg, tol: 0.5 },
        answerLabel: 'stupně =',
        hints: ['$\\pi$ rad $= 180°$, takže násobíš $\\frac{180}{\\pi}$.'],
        solution: [`$${e.tex} \\cdot \\frac{180}{\\pi} = ${e.deg}°$`],
        viz: { type: 'unitcircle', angle: e.deg, angleLabel: `${e.deg}°` },
      };
    }
    if (level === 3) {
      const e = rng.pick(TABLE.filter((t) => Math.abs(t.cos) > 1e-6));
      const tg = e.sin / e.cos;
      return {
        prompt: `Urči (na 4 desetinná místa):\n$$\\operatorname{tg} ${e.deg}°$$`,
        answer: { type: 'number', value: tg, tol: 5e-4 },
        answerLabel: `tg ${e.deg}° =`,
        placeholder: 'např. -1,7321',
        hints: ['$\\operatorname{tg} x = \\frac{\\sin x}{\\cos x}$', `$\\sin ${e.deg}° = ${fmt(e.sin, 4)}$, $\\cos ${e.deg}° = ${fmt(e.cos, 4)}$`],
        solution: [`$\\operatorname{tg} ${e.deg}° = \\frac{${fmt(e.sin, 4)}}{${fmt(e.cos, 4)}} = ${fmt(tg, 4)}$`],
        viz: { type: 'unitcircle', angle: e.deg, angleLabel: `${e.deg}°` },
      };
    }
    // level 4 – jednoduchá goniometrická rovnice na <0°; 360°)
    const f = rng.pick(['sin', 'cos']);
    const e = rng.pick(TABLE.filter((t) => [0.5, -0.5, Math.SQRT1_2, -Math.SQRT1_2, Math.sqrt(3) / 2, -Math.sqrt(3) / 2].some((v) => Math.abs((f === 'sin' ? t.sin : t.cos) - v) < 1e-9)));
    const target = f === 'sin' ? e.sin : e.cos;
    const sols = TABLE.filter((t) => Math.abs((f === 'sin' ? t.sin : t.cos) - target) < 1e-9).map((t) => t.deg);
    return {
      prompt: `Najdi **všechna** řešení na intervalu $\\langle 0°; 360°)$:\n$$\\${f} x = ${fmt(target, 4)}$$\nZapiš ve stupních, oddělené středníkem.`,
      answer: { type: 'numberSet', value: sols, tol: 0.5 },
      answerLabel: 'x =',
      placeholder: 'např. 60; 120',
      hints: [
        `Na jednotkové kružnici hledáš body, kde ${f === 'sin' ? 'svislá' : 'vodorovná'} souřadnice je ${fmt(target, 4)}.`,
        'Takové body jsou zpravidla **dva**.',
        f === 'sin' ? 'Souměrnost podle svislé osy: $x$ a $180° - x$.' : 'Souměrnost podle vodorovné osy: $x$ a $360° - x$.',
      ],
      solution: [`$\\${f} x = ${fmt(target, 4)}$`, `Řešení: $x \\in \\{${sols.join('°;\\ ')}°\\}$`],
      viz: { type: 'unitcircle', angle: sols[0], angleLabel: `${sols[0]}°` },
    };
  },
};
