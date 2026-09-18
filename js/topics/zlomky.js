import { fmt, fracTex, simplify, gcd, lcm } from '../core/util.js';

export default {
  id: 'zlomky',
  name: 'Zlomky',
  category: 'Základy',
  icon: '½',
  description: 'Krácení, sčítání, násobení a dělení zlomků. Odpověď piš jako a/b.',
  levels: 4,

  generate(level, rng) {
    if (level === 1) {
      const g = rng.int(2, 9), n = rng.nz(2, 12), d = rng.int(2, 12);
      const [sn, sd] = simplify(n * g, d * g);
      return {
        prompt: `Zkrať zlomek na základní tvar:\n$$\\frac{${n * g}}{${d * g}}$$`,
        answer: { type: 'fraction', value: (n * g) / (d * g), display: fracTex(sn, sd) },
        answerLabel: 'výsledek =',
        placeholder: 'např. 3/4',
        hints: [`Najdi největšího společného dělitele čísel ${n * g} a ${d * g}.`, `NSD = ${gcd(n * g, d * g)}.`],
        solution: [`$\\text{NSD}(${n * g}, ${d * g}) = ${gcd(n * g, d * g)}$`, `$\\frac{${n * g}}{${d * g}} = ${fracTex(sn, sd)}$`],
      };
    }
    if (level === 2) {
      const a = rng.nz(1, 9), b = rng.int(2, 9), c = rng.nz(1, 9), d = rng.int(2, 9);
      const op = rng.pick(['+', '-']);
      const num = op === '+' ? a * d + c * b : a * d - c * b;
      const den = b * d;
      return {
        prompt: `Spočítej a zkrať:\n$$\\frac{${a}}{${b}} ${op} \\frac{${c}}{${d}}$$`,
        answer: { type: 'fraction', value: num / den, display: fracTex(num, den) },
        answerLabel: 'výsledek =',
        placeholder: 'např. -5/12',
        hints: [`Společný jmenovatel: nejmenší je ${lcm(b, d)}.`, `Rozšiř na $\\frac{${a * d}}{${den}} ${op} \\frac{${c * b}}{${den}}$.`],
        solution: [`$\\frac{${a * d}}{${den}} ${op} \\frac{${c * b}}{${den}} = \\frac{${num}}{${den}}$`, `Zkrátíme: $${fracTex(num, den)}$`],
      };
    }
    if (level === 3) {
      const a = rng.nz(1, 9), b = rng.int(2, 9), c = rng.nz(1, 9), d = rng.int(2, 9);
      const op = rng.pick(['\\cdot', ':']);
      const num = op === ':' ? a * d : a * c;
      const den = op === ':' ? b * c : b * d;
      return {
        prompt: `Spočítej a zkrať:\n$$\\frac{${a}}{${b}} ${op} \\frac{${c}}{${d}}$$`,
        answer: { type: 'fraction', value: num / den, display: fracTex(num, den) },
        answerLabel: 'výsledek =',
        hints: [op === ':' ? 'Dělení zlomkem = násobení převrácenou hodnotou.' : 'Násob čitatel s čitatelem, jmenovatel se jmenovatelem.', `Před zkrácením: $\\frac{${num}}{${den}}$.`],
        solution: [op === ':' ? `$\\frac{${a}}{${b}} \\cdot \\frac{${d}}{${c}} = \\frac{${num}}{${den}}$` : `$\\frac{${a * c}}{${b * d}}$`, `$= ${fracTex(num, den)}$`],
      };
    }
    // level 4 – složený zlomek
    const a = rng.int(1, 6), b = rng.int(2, 7), c = rng.int(1, 6), d = rng.int(2, 7);
    // a + a/b = a(b+1)/b
    const numT = a * (b + 1), denT = b;
    const numB = c * (d + 1), denB = d;
    const num = numT * denB, den = denT * numB;
    return {
      prompt: `Zjednoduš složený zlomek:\n$$\\frac{${a} + \\frac{${a}}{${b}}}{${c} + \\frac{${c}}{${d}}}$$`,
      answer: { type: 'fraction', value: num / den, display: fracTex(num, den) },
      answerLabel: 'výsledek =',
      hints: ['Uprav zvlášť čitatel a zvlášť jmenovatel.', `Čitatel $= ${fracTex(numT, denT)}$, jmenovatel $= ${fracTex(numB, denB)}$.`, 'Pak děl – tedy násob převrácenou hodnotou.'],
      solution: [
        `Čitatel: $${a} + \\frac{${a}}{${b}} = \\frac{${numT}}{${denT}}$`,
        `Jmenovatel: $${c} + \\frac{${c}}{${d}} = \\frac{${numB}}{${denB}}$`,
        `$\\frac{${numT}}{${denT}} : \\frac{${numB}}{${denB}} = \\frac{${num}}{${den}} = ${fracTex(num, den)}$`,
      ],
    };
  },
};
