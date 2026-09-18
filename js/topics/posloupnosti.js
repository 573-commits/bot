import { fmt, sgn } from '../core/util.js';

export default {
  id: 'posloupnosti',
  name: 'Posloupnosti a řady',
  category: 'Diskrétní matematika',
  icon: '⋯',
  description: 'Aritmetická i geometrická posloupnost, součty, nekonečná řada.',
  levels: 4,

  generate(level, rng) {
    if (level === 1) {
      const a1 = rng.int(-10, 15), d = rng.nz(-8, 8), n = rng.int(6, 20);
      const an = a1 + (n - 1) * d;
      return {
        prompt: `Aritmetická posloupnost má první člen $a_1 = ${a1}$ a diferenci $d = ${d}$.\nUrči $a_{${n}}$.`,
        answer: { type: 'number', value: an, tol: 1e-9 },
        answerLabel: `a_${n} =`,
        hints: [`$a_n = a_1 + (n-1)d$`, `$a_{${n}} = ${a1} + ${n - 1} \\cdot (${d})$`],
        solution: [`$a_{${n}} = ${a1} + (${n}-1)\\cdot(${d}) = ${fmt(an)}$`],
        viz: { type: 'bars', data: Array.from({ length: Math.min(n, 10) }, (_, i) => ({ label: `a${i + 1}`, value: a1 + i * d })), showValues: false },
      };
    }
    if (level === 2) {
      const a1 = rng.int(1, 12), d = rng.nz(1, 7), n = rng.int(8, 25);
      const S = (n * (2 * a1 + (n - 1) * d)) / 2;
      return {
        prompt: `Spočítej součet prvních ${n} členů aritmetické posloupnosti s $a_1 = ${a1}$, $d = ${d}$.`,
        answer: { type: 'number', value: S, tol: 1e-6 },
        answerLabel: `S_${n} =`,
        hints: [`$S_n = \\frac{n}{2}(a_1 + a_n)$`, `$a_{${n}} = ${fmt(a1 + (n - 1) * d)}$`],
        solution: [`$a_{${n}} = ${fmt(a1 + (n - 1) * d)}$`, `$S_{${n}} = \\frac{${n}}{2}(${a1} + ${fmt(a1 + (n - 1) * d)}) = ${fmt(S)}$`],
      };
    }
    if (level === 3) {
      const a1 = rng.int(1, 8), q = rng.pick([2, 3, 0.5, 1.5, -2]);
      const n = rng.int(4, 9);
      const an = a1 * q ** (n - 1);
      return {
        prompt: `Geometrická posloupnost: $a_1 = ${a1}$, kvocient $q = ${fmt(q)}$.\nUrči $a_{${n}}$. (na 4 des. místa)`,
        answer: { type: 'number', value: an, decimals: 4 },
        answerLabel: `a_${n} =`,
        hints: [`$a_n = a_1 q^{n-1}$`, `$a_{${n}} = ${a1} \\cdot ${fmt(q)}^{${n - 1}}$`],
        solution: [`$a_{${n}} = ${a1}\\cdot(${fmt(q)})^{${n - 1}} = ${fmt(an, 4)}$`],
        viz: { type: 'bars', data: Array.from({ length: Math.min(n, 8) }, (_, i) => ({ label: `a${i + 1}`, value: Math.abs(a1 * q ** i) })), showValues: false },
      };
    }
    // level 4 – nekonečná geometrická řada
    const a1 = rng.int(1, 12);
    const q = rng.pick([0.5, 1 / 3, 0.25, 0.2, 2 / 3, -0.5]);
    const S = a1 / (1 - q);
    return {
      prompt: `Spočítej součet nekonečné geometrické řady s $a_1 = ${a1}$ a $q = ${fmt(q, 4)}$.\n(na 4 des. místa)`,
      answer: { type: 'number', value: S, decimals: 4 },
      answerLabel: 'S =',
      hints: [
        `Řada konverguje, protože $|q| < 1$.`,
        `$S = \\frac{a_1}{1 - q}$`,
        `$S = \\frac{${a1}}{1 - (${fmt(q, 4)})}$`,
      ],
      solution: [
        `$|q| = ${fmt(Math.abs(q), 4)} < 1$ → řada konverguje`,
        `$S = \\frac{${a1}}{1 - (${fmt(q, 4)})} = ${fmt(S, 4)}$`,
      ],
    };
  },
};
