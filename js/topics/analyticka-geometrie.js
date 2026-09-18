import { fmt, sgn, coef, gcd } from '../core/util.js';

export default {
  id: 'analyticka-geometrie',
  name: 'Analytická geometrie',
  category: 'Geometrie',
  icon: '📐',
  description: 'Vzdálenost bodů, přímka v rovině, vzdálenost bodu od přímky a rovnice kružnice.',
  levels: 4,

  generate(level, rng) {
    if (level === 1) {
      const A = { x: rng.int(-9, 9), y: rng.int(-9, 9) };
      const B = { x: rng.int(-9, 9), y: rng.int(-9, 9) };
      if (A.x === B.x && A.y === B.y) return this.generate(1, rng);
      const d = Math.hypot(B.x - A.x, B.y - A.y);
      return {
        prompt: `Urči **vzdálenost** bodů $A = [${A.x}; ${A.y}]$ a $B = [${B.x}; ${B.y}]$. (na 4 des. místa)`,
        answer: { type: 'number', value: d, decimals: 4 },
        answerLabel: '|AB| =',
        hints: [
          '$|AB| = \\sqrt{(x_B - x_A)^2 + (y_B - y_A)^2}$ – je to Pythagorova věta.',
          `$\\Delta x = ${fmt(B.x - A.x)}$, $\\Delta y = ${fmt(B.y - A.y)}$`,
        ],
        solution: [
          `$|AB| = \\sqrt{${fmt(B.x - A.x)}^2 + ${fmt(B.y - A.y)}^2} = \\sqrt{${(B.x - A.x) ** 2 + (B.y - A.y) ** 2}} = ${fmt(d, 4)}$`,
        ],
        viz: { type: 'function', xRange: [-11, 11], yRange: [-11, 11], points: [{ x: A.x, y: A.y, label: 'A' }, { x: B.x, y: B.y, label: 'B' }] },
      };
    }
    if (level === 2) {
      const A = { x: rng.int(-7, 7), y: rng.int(-7, 7) };
      const B = { x: rng.int(-7, 7), y: rng.int(-7, 7) };
      if (A.x === B.x && A.y === B.y) return this.generate(2, rng);
      // obecná rovnice: a x + b y + c = 0, normálový vektor (a, b) = (-Δy, Δx)
      let a = -(B.y - A.y), b = B.x - A.x;
      let c = -(a * A.x + b * A.y);
      const g = gcd(gcd(Math.abs(a), Math.abs(b)), Math.abs(c) || 1);
      a /= g; b /= g; c /= g;
      const S = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
      return {
        prompt: `Body $A = [${A.x}; ${A.y}]$ a $B = [${B.x}; ${B.y}]$.\nUrči **střed úsečky** $AB$. Zapiš $x; y$.`,
        answer: { type: 'numberList', value: [S.x, S.y], tol: 1e-9 },
        answerLabel: 'S =',
        placeholder: 'např. 1,5; -2',
        hints: ['Střed je prostě průměr souřadnic.', `$S = \\left[\\frac{${A.x} + ${B.x}}{2};\\ \\frac{${A.y} + ${B.y}}{2}\\right]$`],
        solution: [
          `$S = [${fmt(S.x)};\\ ${fmt(S.y)}]$`,
          `Mimochodem, obecná rovnice přímky $AB$ je $${coef(a)} ${sgn(b, { hideOne: true })}y ${sgn(c)} = 0$.`,
        ],
        viz: {
          type: 'function', xRange: [-9, 9], yRange: [-9, 9],
          fns: b !== 0 ? [{ f: (t) => (-a * t - c) / b }] : [],
          points: [{ x: A.x, y: A.y, label: 'A' }, { x: B.x, y: B.y, label: 'B' }, { x: S.x, y: S.y, label: 'S', color: 'var(--c2)' }],
        },
      };
    }
    if (level === 3) {
      const a = rng.nz(-6, 6), b = rng.nz(-6, 6), c = rng.int(-9, 9);
      const P = { x: rng.int(-8, 8), y: rng.int(-8, 8) };
      const d = Math.abs(a * P.x + b * P.y + c) / Math.hypot(a, b);
      return {
        prompt: `Urči **vzdálenost bodu** $P = [${P.x}; ${P.y}]$ **od přímky** $${coef(a)} ${sgn(b, { hideOne: true })}y ${sgn(c)} = 0$. (na 4 des. místa)`,
        answer: { type: 'number', value: d, decimals: 4 },
        answerLabel: 'd =',
        hints: [
          `$d = \\frac{|ax_P + by_P + c|}{\\sqrt{a^2 + b^2}}$`,
          `Čitatel: $|${fmt(a)}\\cdot${P.x} ${sgn(b * P.y)} ${sgn(c)}| = ${fmt(Math.abs(a * P.x + b * P.y + c))}$`,
          `Jmenovatel: $\\sqrt{${a * a} + ${b * b}} = ${fmt(Math.hypot(a, b), 4)}$`,
        ],
        solution: [
          `$d = \\frac{${fmt(Math.abs(a * P.x + b * P.y + c))}}{${fmt(Math.hypot(a, b), 4)}} = ${fmt(d, 4)}$`,
          d < 1e-9 ? 'Vzdálenost je nula – bod na přímce leží.' : '',
        ].filter(Boolean),
        viz: {
          type: 'function', xRange: [-10, 10], yRange: [-10, 10],
          fns: [{ f: (t) => (-a * t - c) / b, label: 'přímka' }],
          points: [{ x: P.x, y: P.y, label: 'P' }],
        },
      };
    }
    // level 4 – kružnice
    const m = rng.int(-6, 6), n = rng.int(-6, 6), r = rng.int(2, 8);
    const mode = rng.pick(['stred', 'polomer']);
    const tex = `x^2 ${sgn(-2 * m, { hideOne: true })}x + y^2 ${sgn(-2 * n, { hideOne: true })}y ${sgn(m * m + n * n - r * r)} = 0`;
    if (mode === 'stred') {
      return {
        prompt: `Kružnice má rovnici\n$$${tex}$$\nUrči souřadnice **středu**. Zapiš $x; y$.`,
        answer: { type: 'numberList', value: [m, n], tol: 1e-9 },
        answerLabel: 'S =',
        hints: [
          'Doplň na čtverec: $x^2 + px = (x + \\frac{p}{2})^2 - \\frac{p^2}{4}$.',
          `U $x$: polovina z $${fmt(-2 * m)}$ je $${fmt(-m)}$, takže $(x ${sgn(-m)})^2$.`,
          'Střed je pak $[-\\frac{p}{2}; -\\frac{q}{2}]$.',
        ],
        solution: [
          `Doplněním na čtverec: $(x ${sgn(-m)})^2 + (y ${sgn(-n)})^2 = ${r * r}$`,
          `Střed $S = [${fmt(m)};\\ ${fmt(n)}]$, poloměr $r = ${fmt(r)}$`,
        ],
        viz: {
          type: 'function', xRange: [m - r - 2, m + r + 2], yRange: [n - r - 2, n + r + 2],
          fns: [{ f: (x) => n + Math.sqrt(Math.max(0, r * r - (x - m) ** 2)) }, { f: (x) => n - Math.sqrt(Math.max(0, r * r - (x - m) ** 2)), color: 'var(--c1)' }],
          points: [{ x: m, y: n, label: 'S' }],
        },
      };
    }
    return {
      prompt: `Kružnice má rovnici\n$$${tex}$$\nUrči její **poloměr**. (na 4 des. místa)`,
      answer: { type: 'number', value: r, decimals: 4 },
      answerLabel: 'r =',
      hints: [
        'Doplň obě proměnné na čtverec a převeď na tvar $(x-m)^2 + (y-n)^2 = r^2$.',
        `$(x ${sgn(-m)})^2 + (y ${sgn(-n)})^2 = ${r * r}$`,
      ],
      solution: [
        `$(x ${sgn(-m)})^2 + (y ${sgn(-n)})^2 = ${r * r}$`,
        `$r = \\sqrt{${r * r}} = ${fmt(r)}$`,
      ],
      viz: {
        type: 'function', xRange: [m - r - 2, m + r + 2], yRange: [n - r - 2, n + r + 2],
        fns: [{ f: (x) => n + Math.sqrt(Math.max(0, r * r - (x - m) ** 2)) }, { f: (x) => n - Math.sqrt(Math.max(0, r * r - (x - m) ** 2)), color: 'var(--c1)' }],
        points: [{ x: m, y: n, label: 'S' }],
      },
    };
  },
};
