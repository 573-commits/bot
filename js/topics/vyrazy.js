import { fmt, polyTex, sgn, coef } from '../core/util.js';

export default {
  id: 'vyrazy',
  name: 'Úpravy výrazů',
  category: 'Algebra',
  icon: '( )',
  description: 'Roznásobení, vzorce (a±b)² a a²−b², vytýkání. Odpovídáš hodnotou výrazu pro dané x.',
  levels: 4,

  generate(level, rng) {
    if (level === 1) {
      const a = rng.nz(2, 6), b = rng.nz(-8, 8), x0 = rng.int(-4, 4);
      const c = rng.nz(2, 6), d = rng.nz(-8, 8);
      const val = (a * x0 + b) * (c * x0 + d);
      return {
        prompt: `Roznásob a dosaď $x = ${x0}$:\n$$(${coef(a)} ${sgn(b)})(${coef(c)} ${sgn(d)})$$`,
        answer: { type: 'number', value: val, tol: 1e-6 },
        answerLabel: 'hodnota =',
        hints: ['Každý člen první závorky vynásob každým členem druhé.', `$${polyTex([a * c, a * d + b * c, b * d])}$`],
        solution: [`$= ${polyTex([a * c, a * d + b * c, b * d])}$`, `Pro $x = ${x0}$: $${fmt(val)}$`],
      };
    }
    if (level === 2) {
      const a = rng.nz(1, 5), b = rng.nz(1, 9), s = rng.pick(['+', '-']);
      const x0 = rng.int(-4, 4);
      const inner = a * x0 + (s === '+' ? b : -b);
      return {
        prompt: `Použij vzorec, uprav a dosaď $x = ${x0}$:\n$$(${coef(a)} ${s} ${b})^2$$`,
        answer: { type: 'number', value: inner ** 2, tol: 1e-6 },
        answerLabel: 'hodnota =',
        hints: [`$(A ${s} B)^2 = A^2 ${s} 2AB + B^2$`, `$A = ${coef(a)}$, $B = ${b}$`],
        solution: [
          `$= ${polyTex([a * a, (s === '+' ? 2 : -2) * a * b, b * b])}$`,
          `Pro $x = ${x0}$: $(${fmt(inner)})^2 = ${fmt(inner ** 2)}$`,
        ],
      };
    }
    if (level === 3) {
      const a = rng.nz(1, 5), b = rng.nz(2, 9), x0 = rng.int(-5, 5);
      const val = (a * x0) ** 2 - b * b;
      return {
        prompt: `Uprav pomocí vzorce $a^2-b^2$ a dosaď $x = ${x0}$:\n$$(${coef(a)} + ${b})(${coef(a)} - ${b})$$`,
        answer: { type: 'number', value: val, tol: 1e-6 },
        answerLabel: 'hodnota =',
        hints: ['$(A+B)(A-B) = A^2 - B^2$ – prostřední členy se vyruší.', `$= ${polyTex([a * a, 0, -b * b])}$`],
        solution: [`$= ${polyTex([a * a, 0, -b * b])}$`, `Pro $x = ${x0}$: $${fmt(val)}$`],
      };
    }
    // level 4 – krácení lomeného výrazu
    const r = rng.nz(1, 6), a = rng.nz(1, 4), x0 = rng.int(-5, 5);
    if (x0 === r) return this.generate(4, rng);
    // (a x^2 - a r^2)/(x - r) = a(x + r)
    const val = a * (x0 + r);
    return {
      prompt: `Zkrať výraz a dosaď $x = ${x0}$:\n$$\\frac{${polyTex([a, 0, -a * r * r])}}{x ${sgn(-r)}}$$`,
      answer: { type: 'number', value: val, tol: 1e-6 },
      answerLabel: 'hodnota =',
      hints: [
        `Vytkni ${a} v čitateli: $${a}(x^2 - ${r * r})$.`,
        `A rozlož podle vzorce: $x^2 - ${r * r} = (x ${sgn(-r)})(x ${sgn(r)})$.`,
        `Krátíme $(x ${sgn(-r)})$ – podmínka $x \\ne ${fmt(r)}$.`,
      ],
      solution: [
        `$\\frac{${a}(x ${sgn(-r)})(x ${sgn(r)})}{x ${sgn(-r)}} = ${a}(x ${sgn(r)})$, pro $x \\ne ${fmt(r)}$`,
        `Pro $x = ${x0}$: $${a} \\cdot (${fmt(x0 + r)}) = ${fmt(val)}$`,
      ],
    };
  },
};
