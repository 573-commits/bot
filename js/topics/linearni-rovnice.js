import { fmt, fracTex, simplify, coef, sgn } from '../core/util.js';

export default {
  id: 'linearni-rovnice',
  name: 'Lineární rovnice',
  category: 'Algebra',
  icon: '=',
  description: 'Rovnice s jednou neznámou – od ax+b=c až po zlomky a závorky.',
  levels: 5,

  generate(level, rng) {
    if (level === 1) {
      const a = rng.nz(2, 9), x = rng.int(-9, 9), b = rng.nz(-12, 12);
      const c = a * x + b;
      return {
        prompt: `Vyřeš rovnici:\n$$${coef(a)} ${sgn(b)} = ${c}$$`,
        answer: { type: 'number', value: x },
        answerLabel: 'x =',
        hints: [
          `Převeď ${fmt(b)} na druhou stranu – u obou stran uber ${fmt(b)}.`,
          `Zbude ti $${coef(a)} = ${c - b}$. Zbývá vydělit ${a}.`,
        ],
        solution: [
          `$${coef(a)} ${sgn(b)} = ${c}$`,
          `$${coef(a)} = ${c} ${sgn(-b)} = ${c - b}$`,
          `$x = \\frac{${c - b}}{${a}} = ${fmt(x)}$`,
        ],
      };
    }
    if (level === 2) {
      const a = rng.nz(2, 9); let c = rng.nz(-9, 9);
      while (c === a) c = rng.nz(-9, 9);
      const x = rng.int(-8, 8), b = rng.nz(-12, 12);
      const d = (a - c) * x + b;
      const [n, den] = simplify(d - b, a - c);
      return {
        prompt: `Vyřeš rovnici:\n$$${coef(a)} ${sgn(b)} = ${coef(c)} ${sgn(d)}$$`,
        answer: { type: 'number', value: x },
        answerLabel: 'x =',
        hints: [
          'Neznámé dej na jednu stranu, čísla na druhou.',
          `Po převedení: $${coef(a - c)} = ${d - b}$.`,
        ],
        solution: [
          `$${coef(a)} ${sgn(-c, { hideOne: true })}x ${sgn(b)} = ${d}$ → sloučíme členy s $x$`,
          `$${coef(a - c)} = ${d - b}$`,
          `$x = ${fracTex(n, den)} = ${fmt(x)}$`,
        ],
      };
    }
    if (level === 3) {
      const a = rng.nz(2, 6), b = rng.nz(-8, 8), c = rng.nz(2, 6), d = rng.nz(-8, 8);
      // a(x+b) = c(x+d)  ->  x(a-c) = cd - ab
      if (a === c) return this.generate(3, rng);
      const x = (c * d - a * b) / (a - c);
      return {
        prompt: `Vyřeš rovnici:\n$$${a}(x ${sgn(b)}) = ${c}(x ${sgn(d)})$$`,
        answer: { type: 'number', value: x, tol: 1e-6 },
        answerLabel: 'x =',
        placeholder: 'číslo nebo zlomek, např. 7/3',
        hints: [
          'Nejdřív roznásob obě závorky.',
          `Vlevo $${coef(a)} ${sgn(a * b)}$, vpravo $${coef(c)} ${sgn(c * d)}$.`,
          'Pak převeď x doleva a čísla doprava.',
        ],
        solution: [
          `$${coef(a)} ${sgn(a * b)} = ${coef(c)} ${sgn(c * d)}$`,
          `$${coef(a - c)} = ${fmt(c * d - a * b)}$`,
          `$x = ${fracTex(c * d - a * b, a - c)}$`,
        ],
      };
    }
    if (level === 4) {
      // x/p + q = x/r + s
      const p = rng.int(2, 6); let r = rng.int(2, 6);
      while (r === p) r = rng.int(2, 6);
      const x = rng.int(-6, 6) * p * r / Math.max(1, 1); // pěkné číslo
      const q = rng.nz(-6, 6);
      const s = x / p + q - x / r;
      return {
        prompt: `Vyřeš rovnici:\n$$\\frac{x}{${p}} ${sgn(q)} = \\frac{x}{${r}} ${sgn(s)}$$`,
        answer: { type: 'number', value: x, tol: 1e-6 },
        answerLabel: 'x =',
        hints: [
          `Vynásob celou rovnici společným jmenovatelem ${p * r}.`,
          `Dostaneš $${coef(r)} ${sgn(q * p * r)} = ${coef(p)} ${sgn(s * p * r)}$.`,
        ],
        solution: [
          `Násobíme ${p * r}: $${coef(r)} ${sgn(q * p * r)} = ${coef(p)} ${sgn(s * p * r)}$`,
          `$${coef(r - p)} = ${fmt(s * p * r - q * p * r)}$`,
          `$x = ${fmt(x)}$`,
        ],
      };
    }
    // level 5 – rovnice s neznámou ve jmenovateli
    const a = rng.nz(2, 7), b = rng.int(1, 6), c = rng.nz(2, 9);
    // a/(x+b) = c  ->  x = a/c - b
    const x = a / c - b;
    return {
      prompt: `Vyřeš rovnici a urči podmínku pro $x$:\n$$\\frac{${a}}{x ${sgn(b)}} = ${c}$$`,
      answer: { type: 'number', value: x, tol: 1e-6 },
      answerLabel: 'x =',
      placeholder: 'např. -2/3',
      hints: [
        `Podmínka: jmenovatel nesmí být nula, tedy $x \\ne ${fmt(-b)}$.`,
        `Vynásob rovnici $(x ${sgn(b)})$: $${a} = ${c}(x ${sgn(b)})$.`,
      ],
      solution: [
        `Podmínka $x \\ne ${fmt(-b)}$`,
        `$${a} = ${c}(x ${sgn(b)}) = ${coef(c)} ${sgn(c * b)}$`,
        `$${coef(c)} = ${fmt(a - c * b)}$, tedy $x = ${fracTex(a - c * b, c)}$`,
      ],
      viz: { type: 'numberline', range: [Math.min(x, -b) - 4, Math.max(x, -b) + 4], points: [{ x, label: 'řešení' }, { x: -b, label: 'zakázáno', open: true, color: 'var(--c4)' }] },
    };
  },
};
