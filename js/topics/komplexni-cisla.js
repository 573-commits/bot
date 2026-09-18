import { fmt, sgn } from '../core/util.js';

const cTex = (re, im) => {
  if (Math.abs(im) < 1e-9) return fmt(re);
  if (Math.abs(re) < 1e-9) return `${im === 1 ? '' : im === -1 ? '-' : fmt(im)}i`;
  return `${fmt(re)} ${im < 0 ? '-' : '+'} ${Math.abs(im) === 1 ? '' : fmt(Math.abs(im))}i`;
};

export default {
  id: 'komplexni-cisla',
  name: 'Komplexní čísla',
  category: 'Algebra',
  icon: 'i',
  description: 'Operace v algebraickém tvaru, absolutní hodnota, dělení a Moivreova věta.',
  levels: 4,

  generate(level, rng) {
    const a = rng.nz(-8, 8), b = rng.nz(-8, 8), c = rng.nz(-8, 8), d = rng.nz(-8, 8);

    if (level === 1) {
      const op = rng.pick(['+', '-', '\\cdot']);
      const re = op === '+' ? a + c : op === '-' ? a - c : a * c - b * d;
      const im = op === '+' ? b + d : op === '-' ? b - d : a * d + b * c;
      return {
        prompt: `$z_1 = ${cTex(a, b)}$, $z_2 = ${cTex(c, d)}$\n\nSpočítej $z_1 ${op} z_2$ a zapiš **reálnou a imaginární část**: $Re; Im$.`,
        answer: { type: 'numberList', value: [re, im], tol: 1e-9, display: cTex(re, im) },
        answerLabel: 'Re; Im =',
        placeholder: 'např. 3; -5',
        hints: [
          op === '\\cdot' ? 'Roznásob jako závorky a využij $i^2 = -1$.' : 'Sčítej (odčítej) zvlášť reálné a zvlášť imaginární části.',
          op === '\\cdot' ? `$(${fmt(a)} ${sgn(b, { hideOne: true })}i)(${fmt(c)} ${sgn(d, { hideOne: true })}i) = ${fmt(a * c)} + ${fmt(a * d)}i + ${fmt(b * c)}i + ${fmt(b * d)}i^2$` : `Reálná část: $${fmt(a)} ${op === '+' ? '+' : '-'} ${fmt(c)}$`,
        ],
        solution: [
          op === '\\cdot' ? `$i^2 = -1$, takže člen $${fmt(b * d)}i^2$ dá $${fmt(-b * d)}$` : 'Části se sčítají nezávisle.',
          `$z_1 ${op} z_2 = ${cTex(re, im)}$`,
        ],
        viz: (() => {
          // výsledek násobení může být daleko od obou činitelů – měřítko proto
          // odvozujeme ze všech bodů, jinak by výsledek z obrázku vypadl
          const xs = [0, a, c, re], ys = [0, b, d, im];
          const m = Math.max(4, Math.max(...xs.map(Math.abs), ...ys.map(Math.abs)) * 1.25);
          return {
            type: 'function', xRange: [-m, m], yRange: [-m, m], xLabel: 'Re', yLabel: 'Im',
            points: [{ x: a, y: b, label: 'z₁' }, { x: c, y: d, label: 'z₂' }, { x: re, y: im, label: 'výsledek', color: 'var(--c2)' }],
          };
        })(),
      };
    }
    if (level === 2) {
      const mod = Math.hypot(a, b);
      return {
        prompt: `Urči **absolutní hodnotu** komplexního čísla $z = ${cTex(a, b)}$. (na 4 des. místa)`,
        answer: { type: 'number', value: mod, decimals: 4 },
        answerLabel: '|z| =',
        hints: ['$|z| = \\sqrt{a^2 + b^2}$ – je to vzdálenost od počátku v Gaussově rovině.', `$\\sqrt{${a * a} + ${b * b}} = \\sqrt{${a * a + b * b}}$`],
        solution: [`$|z| = \\sqrt{${fmt(a)}^2 + ${fmt(b)}^2} = \\sqrt{${a * a + b * b}} = ${fmt(mod, 4)}$`],
        viz: { type: 'function', xRange: [-10, 10], yRange: [-10, 10], xLabel: 'Re', yLabel: 'Im', points: [{ x: a, y: b, label: 'z' }, { x: 0, y: 0 }] },
      };
    }
    if (level === 3) {
      const den = c * c + d * d;
      const re = (a * c + b * d) / den, im = (b * c - a * d) / den;
      return {
        prompt: `Vyděl a zapiš $Re; Im$ (na 4 des. místa):\n$$\\frac{${cTex(a, b)}}{${cTex(c, d)}}$$`,
        answer: { type: 'numberList', value: [re, im], decimals: 4, display: cTex(Math.round(re * 1e4) / 1e4, Math.round(im * 1e4) / 1e4) },
        answerLabel: 'Re; Im =',
        hints: [
          'Rozšiř zlomek **komplexně sdruženým** jmenovatelem – jmenovatel se tím stane reálným.',
          `Sdružené číslo k $${cTex(c, d)}$ je $${cTex(c, -d)}$.`,
          `Jmenovatel vyjde $${fmt(c)}^2 + ${fmt(d)}^2 = ${den}$.`,
        ],
        solution: [
          `$\\frac{(${cTex(a, b)})(${cTex(c, -d)})}{(${cTex(c, d)})(${cTex(c, -d)})} = \\frac{${fmt(a * c + b * d)} ${sgn(b * c - a * d, { hideOne: true })}i}{${den}}$`,
          `$= ${fmt(re, 4)} ${im < 0 ? '-' : '+'} ${fmt(Math.abs(im), 4)}i$`,
        ],
      };
    }
    // level 4 – goniometrický tvar a Moivre
    const mod = Math.hypot(a, b);
    const arg = (Math.atan2(b, a) * 180) / Math.PI;
    const n = rng.int(2, 5);
    if (rng() < 0.5) {
      return {
        prompt: `Urči **argument** čísla $z = ${cTex(a, b)}$ ve stupních z intervalu $\\langle 0°; 360°)$. (na 2 des. místa)`,
        answer: { type: 'number', value: (arg + 360) % 360, decimals: 2 },
        answerLabel: 'φ =',
        hints: [
          'Argument je úhel od kladné reálné poloosy.',
          `$\\operatorname{tg}\\varphi = \\frac{b}{a} = \\frac{${fmt(b)}}{${fmt(a)}}$`,
          `Pozor na kvadrant: $z$ leží v ${a > 0 && b > 0 ? 'I.' : a < 0 && b > 0 ? 'II.' : a < 0 ? 'III.' : 'IV.'} kvadrantu.`,
        ],
        solution: [`$\\varphi = \\operatorname{arctg2}(${fmt(b)}; ${fmt(a)}) = ${fmt((arg + 360) % 360, 2)}°$`, `$|z| = ${fmt(mod, 4)}$, takže $z = ${fmt(mod, 3)}(\\cos ${fmt((arg + 360) % 360, 1)}° + i\\sin ${fmt((arg + 360) % 360, 1)}°)$`],
        viz: { type: 'function', xRange: [-10, 10], yRange: [-10, 10], xLabel: 'Re', yLabel: 'Im', points: [{ x: a, y: b, label: 'z' }, { x: 0, y: 0 }] },
      };
    }
    return {
      prompt: `Podle **Moivreovy věty** urči $|z^{${n}}|$ pro $z = ${cTex(a, b)}$. (na 4 des. místa)`,
      answer: { type: 'number', value: mod ** n, decimals: 4 },
      answerLabel: `|z^${n}| =`,
      hints: [
        'Moivre: $z^n = |z|^n(\\cos n\\varphi + i \\sin n\\varphi)$ – absolutní hodnota se umocní, úhel vynásobí.',
        `$|z| = ${fmt(mod, 4)}$`,
      ],
      solution: [`$|z| = \\sqrt{${a * a + b * b}} = ${fmt(mod, 4)}$`, `$|z^{${n}}| = ${fmt(mod, 4)}^{${n}} = ${fmt(mod ** n, 4)}$`],
    };
  },
};
