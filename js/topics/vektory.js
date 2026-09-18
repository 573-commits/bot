import { fmt } from '../core/util.js';

export default {
  id: 'vektory',
  name: 'Vektory',
  category: 'Lineární algebra',
  icon: '→',
  description: 'Skalární součin, velikost vektoru, úhel a kolmost.',
  levels: 4,

  generate(level, rng) {
    const u = [rng.nz(-8, 8), rng.nz(-8, 8)];
    const v = [rng.nz(-8, 8), rng.nz(-8, 8)];
    const dot = u[0] * v[0] + u[1] * v[1];
    const nu = Math.hypot(...u), nv = Math.hypot(...v);

    if (level === 1) {
      return {
        prompt: `$\\vec{u} = (${u.join('; ')})$, $\\vec{v} = (${v.join('; ')})$\n\nSpočítej **skalární součin** $\\vec{u} \\cdot \\vec{v}$.`,
        answer: { type: 'number', value: dot, tol: 1e-9 },
        answerLabel: 'u·v =',
        hints: ['Vynásob odpovídající složky a sečti.', `$${u[0]}\\cdot${v[0]} + ${u[1]}\\cdot${v[1]}$`],
        solution: [`$\\vec{u}\\cdot\\vec{v} = ${u[0]}\\cdot${v[0]} + ${u[1]}\\cdot${v[1]} = ${fmt(dot)}$`],
        viz: { type: 'function', xRange: [-10, 10], yRange: [-10, 10], fns: [{ f: (t) => (u[1] / u[0]) * t, label: 'u' }, { f: (t) => (v[1] / v[0]) * t, label: 'v' }], points: [{ x: u[0], y: u[1], label: 'u' }, { x: v[0], y: v[1], label: 'v' }] },
      };
    }
    if (level === 2) {
      return {
        prompt: `Urči **velikost** vektoru $\\vec{u} = (${u.join('; ')})$. (na 4 des. místa)`,
        answer: { type: 'number', value: nu, decimals: 4 },
        answerLabel: '|u| =',
        hints: ['Pythagorova věta: $|\\vec{u}| = \\sqrt{u_1^2 + u_2^2}$.', `$\\sqrt{${u[0] ** 2} + ${u[1] ** 2}} = \\sqrt{${u[0] ** 2 + u[1] ** 2}}$`],
        solution: [`$|\\vec{u}| = \\sqrt{${u[0]}^2 + ${u[1]}^2} = \\sqrt{${u[0] ** 2 + u[1] ** 2}} = ${fmt(nu, 4)}$`],
        viz: { type: 'function', xRange: [-10, 10], yRange: [-10, 10], points: [{ x: u[0], y: u[1], label: 'u' }, { x: 0, y: 0 }] },
      };
    }
    if (level === 3) {
      const cosA = dot / (nu * nv);
      const angle = (Math.acos(Math.max(-1, Math.min(1, cosA))) * 180) / Math.PI;
      return {
        prompt: `Urči **úhel** mezi $\\vec{u} = (${u.join('; ')})$ a $\\vec{v} = (${v.join('; ')})$ ve stupních. (na 2 des. místa)`,
        answer: { type: 'number', value: angle, decimals: 2 },
        answerLabel: 'úhel (°) =',
        hints: [
          `$\\cos\\varphi = \\frac{\\vec{u}\\cdot\\vec{v}}{|\\vec{u}||\\vec{v}|}$`,
          `$\\vec{u}\\cdot\\vec{v} = ${fmt(dot)}$, $|\\vec{u}| = ${fmt(nu, 4)}$, $|\\vec{v}| = ${fmt(nv, 4)}$`,
          `$\\cos\\varphi = ${fmt(cosA, 5)}$ – teď arccos.`,
        ],
        solution: [
          `$\\cos\\varphi = \\frac{${fmt(dot)}}{${fmt(nu, 4)} \\cdot ${fmt(nv, 4)}} = ${fmt(cosA, 5)}$`,
          `$\\varphi = \\arccos(${fmt(cosA, 5)}) = ${fmt(angle, 2)}°$`,
        ],
        viz: { type: 'function', xRange: [-10, 10], yRange: [-10, 10], points: [{ x: u[0], y: u[1], label: 'u' }, { x: v[0], y: v[1], label: 'v' }] },
      };
    }
    // level 4 – doplň složku tak, aby byly vektory kolmé
    const w = [rng.nz(-7, 7), rng.nz(-7, 7)];
    const x = rng.nz(-7, 7);
    // (w1, w2) . (x, y) = 0  =>  y = -w1 x / w2
    const y = (-w[0] * x) / w[1];
    return {
      prompt: `Vektor $\\vec{w} = (${w.join('; ')})$. Najdi $y$ tak, aby $\\vec{z} = (${x}; y)$ byl **kolmý** k $\\vec{w}$.\n(na 4 des. místa)`,
      answer: { type: 'number', value: y, decimals: 4 },
      answerLabel: 'y =',
      placeholder: 'klidně zlomek',
      hints: [
        'Kolmé vektory mají skalární součin **nulový**.',
        `$${w[0]}\\cdot${x} + ${w[1]}\\cdot y = 0$`,
      ],
      solution: [
        `$\\vec{w}\\cdot\\vec{z} = ${w[0]}\\cdot${x} + ${w[1]}y = 0$`,
        `$${w[1]}y = ${fmt(-w[0] * x)}$`,
        `$y = ${fmt(y, 4)}$`,
      ],
      viz: { type: 'function', xRange: [-10, 10], yRange: [-10, 10], points: [{ x: w[0], y: w[1], label: 'w' }, { x, y, label: 'z' }] },
    };
  },
};
