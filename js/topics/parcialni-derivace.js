import { fmt, polyTex, sgn, coef } from '../core/util.js';

export default {
  id: 'parcialni-derivace',
  name: 'Parciální derivace',
  category: 'Analýza',
  icon: '∂',
  description: 'Funkce více proměnných, gradient a stacionární body. Základ optimalizace i strojového učení.',
  levels: 3,

  generate(level, rng) {
    const a = rng.nz(1, 5), b = rng.nz(1, 5), c = rng.nz(-6, 6);
    const x0 = rng.int(-4, 4), y0 = rng.int(-4, 4);
    // f = a x^2 + c xy + b y^2
    const fTex = `${a === 1 ? '' : fmt(a)}x^2 ${sgn(c, { hideOne: true })}xy ${sgn(b, { hideOne: true })}y^2`;
    const fx = 2 * a * x0 + c * y0;
    const fy = 2 * b * y0 + c * x0;

    if (level === 1) {
      const which = rng.pick(['x', 'y']);
      const val = which === 'x' ? fx : fy;
      return {
        prompt: `$f(x, y) = ${fTex}$\n\nUrči parciální derivaci **podle ${which}** v bodě $[${x0}; ${y0}]$.`,
        answer: { type: 'number', value: val, tol: 1e-9 },
        answerLabel: `∂f/∂${which} =`,
        hints: [
          `Při derivování podle ${which} ber druhou proměnnou jako **konstantu**.`,
          which === 'x'
            ? `$\\frac{\\partial f}{\\partial x} = ${polyTex([2 * a, 0], 'x').replace('x', 'x')} ${sgn(c, { hideOne: true })}y$`
            : `$\\frac{\\partial f}{\\partial y} = ${fmt(2 * b)}y ${sgn(c, { hideOne: true })}x$`,
          `Dosaď $x = ${x0}$, $y = ${y0}$.`,
        ],
        solution: [
          which === 'x'
            ? `$\\frac{\\partial f}{\\partial x} = ${coef(2 * a)} ${sgn(c, { hideOne: true })}y$`
            : `$\\frac{\\partial f}{\\partial y} = ${coef(2 * b, 'y')} ${sgn(c, { hideOne: true })}x$`,
          `Po dosazení: $${fmt(val)}$`,
        ],
      };
    }
    if (level === 2) {
      return {
        prompt: `$f(x, y) = ${fTex}$\n\nUrči **gradient** v bodě $[${x0}; ${y0}]$. Zapiš $\\partial f/\\partial x; \\partial f/\\partial y$.`,
        answer: { type: 'numberList', value: [fx, fy], tol: 1e-9 },
        answerLabel: '∇f =',
        placeholder: 'např. 6; -2',
        hints: [
          'Gradient je vektor obou parciálních derivací.',
          `$\\frac{\\partial f}{\\partial x} = ${coef(2 * a)} ${sgn(c, { hideOne: true })}y$`,
          `$\\frac{\\partial f}{\\partial y} = ${coef(2 * b, 'y')} ${sgn(c, { hideOne: true })}x$`,
        ],
        solution: [
          `$\\nabla f = \\left(${coef(2 * a)} ${sgn(c, { hideOne: true })}y;\\ ${coef(2 * b, 'y')} ${sgn(c, { hideOne: true })}x\\right)$`,
          `V bodě $[${x0}; ${y0}]$: $\\nabla f = (${fmt(fx)};\\ ${fmt(fy)})$`,
          'Gradient ukazuje směr nejrychlejšího růstu funkce – přesně to, po čem klouže gradientní sestup.',
        ],
        viz: (() => {
          // gradient zkrátíme na rozumnou délku, ať se šipka vejde do obrázku
          const len = Math.max(1e-9, Math.hypot(fx, fy));
          const gx = x0 + (fx / len) * 3, gy = y0 + (fy / len) * 3;
          const m = Math.max(6, Math.max(Math.abs(x0), Math.abs(y0), Math.abs(gx), Math.abs(gy)) * 1.25);
          return {
            type: 'function', xRange: [-m, m], yRange: [-m, m], xLabel: 'x', yLabel: 'y',
            points: [{ x: x0, y: y0, label: 'bod' }, { x: gx, y: gy, label: '∇f (směr)', color: 'var(--c2)' }],
          };
        })(),
      };
    }
    // level 3 – stacionární bod funkce s lineárními členy
    const d = rng.nz(-12, 12), e = rng.nz(-12, 12);
    // f = a x^2 + b y^2 + d x + e y  (bez smíšeného členu, ať vyjde hezky)
    const sx = -d / (2 * a), sy = -e / (2 * b);
    return {
      prompt: `Najdi **stacionární bod** funkce\n$$f(x, y) = ${a === 1 ? '' : fmt(a)}x^2 ${sgn(b, { hideOne: true })}y^2 ${sgn(d, { hideOne: true })}x ${sgn(e, { hideOne: true })}y$$\nZapiš $x; y$ (na 4 des. místa).`,
      answer: { type: 'numberList', value: [sx, sy], decimals: 4 },
      answerLabel: 'x; y =',
      hints: [
        'Stacionární bod je tam, kde jsou **obě** parciální derivace nulové.',
        `$\\frac{\\partial f}{\\partial x} = ${coef(2 * a)} ${sgn(d)} = 0$`,
        `$\\frac{\\partial f}{\\partial y} = ${coef(2 * b, 'y')} ${sgn(e)} = 0$`,
      ],
      solution: [
        `$${coef(2 * a)} ${sgn(d)} = 0 \\Rightarrow x = ${fmt(sx, 4)}$`,
        `$${coef(2 * b, 'y')} ${sgn(e)} = 0 \\Rightarrow y = ${fmt(sy, 4)}$`,
        a > 0 && b > 0 ? 'Oba kvadratické členy jsou kladné → je to **minimum**.'
          : a < 0 && b < 0 ? 'Oba kvadratické členy jsou záporné → je to **maximum**.'
            : 'Členy mají opačná znaménka → je to **sedlový bod**, ani maximum, ani minimum.',
      ],
    };
  },
};
