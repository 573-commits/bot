import { fmt, polyTex, sgn, coef } from '../core/util.js';

export default {
  id: 'derivace',
  name: 'Derivace',
  category: 'Analýza',
  icon: "f′",
  description: 'Derivace polynomů, součin, podíl, složená funkce, tečna a mezní veličiny.',
  levels: 5,

  generate(level, rng) {
    if (level === 1) {
      const a = rng.nz(1, 6), b = rng.nz(-8, 8), c = rng.int(-9, 9), x0 = rng.int(-4, 4);
      const d = (x) => 2 * a * x + b;
      return {
        prompt: `Zderivuj a urči hodnotu derivace v bodě $x = ${x0}$:\n$$f(x) = ${polyTex([a, b, c])}$$`,
        answer: { type: 'number', value: d(x0), tol: 1e-9 },
        answerLabel: `f′(${x0}) =`,
        hints: [`$(x^n)' = n x^{n-1}$, konstanta má derivaci 0.`, `$f'(x) = ${polyTex([2 * a, b])}$`],
        solution: [`$f'(x) = ${polyTex([2 * a, b])}$`, `$f'(${x0}) = ${fmt(d(x0))}$`],
        viz: {
          type: 'function', xRange: [x0 - 4, x0 + 4],
          fns: [{ f: (x) => a * x * x + b * x + c, label: 'f(x)' }, { f: (x) => d(x0) * (x - x0) + (a * x0 * x0 + b * x0 + c), label: 'tečna', dashed: true }],
          points: [{ x: x0, y: a * x0 * x0 + b * x0 + c }],
        },
      };
    }
    if (level === 2) {
      const a = rng.nz(1, 5), n = rng.int(3, 5), b = rng.nz(1, 6), x0 = rng.pick([1, 2, -1, -2]);
      // f = a x^n + b/x  => f' = a n x^(n-1) - b/x^2
      const d = (x) => a * n * x ** (n - 1) - b / (x * x);
      return {
        prompt: `Zderivuj a dosaď $x = ${x0}$:\n$$f(x) = ${coef(a)}^{${n}} + \\frac{${b}}{x}$$`,
        answer: { type: 'number', value: d(x0), tol: 1e-6 },
        answerLabel: `f′(${x0}) =`,
        hints: [`$\\frac{${b}}{x} = ${b}x^{-1}$ – použij mocninné pravidlo i na záporný exponent.`, `$f'(x) = ${fmt(a * n)}x^{${n - 1}} - \\frac{${b}}{x^2}$`],
        solution: [`$f(x) = ${coef(a)}^{${n}} + ${b}x^{-1}$`, `$f'(x) = ${fmt(a * n)}x^{${n - 1}} - ${b}x^{-2}$`, `$f'(${x0}) = ${fmt(d(x0), 6)}$`],
      };
    }
    if (level === 3) {
      const kind = rng.pick(['soucin', 'podil']);
      const a = rng.nz(1, 4), b = rng.nz(-6, 6), c = rng.nz(1, 4), dd = rng.nz(-6, 6);
      const x0 = rng.int(-3, 3);
      if (kind === 'soucin') {
        // f = (ax+b)(cx+d), f' = a(cx+d) + c(ax+b)
        const d1 = (x) => a * (c * x + dd) + c * (a * x + b);
        return {
          prompt: `Zderivuj pomocí pravidla o součinu a dosaď $x = ${x0}$:\n$$f(x) = (${coef(a)} ${sgn(b)})(${coef(c)} ${sgn(dd)})$$`,
          answer: { type: 'number', value: d1(x0), tol: 1e-9 },
          answerLabel: `f′(${x0}) =`,
          hints: [`$(uv)' = u'v + uv'$`, `$u = ${coef(a)} ${sgn(b)},\\ u' = ${fmt(a)}$; $v = ${coef(c)} ${sgn(dd)},\\ v' = ${fmt(c)}$`],
          solution: [`$f'(x) = ${fmt(a)}(${coef(c)} ${sgn(dd)}) + ${fmt(c)}(${coef(a)} ${sgn(b)})$`, `$= ${polyTex([2 * a * c, a * dd + c * b])}$`, `$f'(${x0}) = ${fmt(d1(x0))}$`],
        };
      }
      // f = (ax+b)/(cx+d), f' = (a(cx+d) - c(ax+b))/(cx+d)^2 = (ad - bc)/(cx+d)^2
      if (c * x0 + dd === 0) return this.generate(3, rng);
      const num = a * dd - b * c;
      const d1 = (x) => num / (c * x + dd) ** 2;
      return {
        prompt: `Zderivuj pomocí pravidla o podílu a dosaď $x = ${x0}$:\n$$f(x) = \\frac{${coef(a)} ${sgn(b)}}{${coef(c)} ${sgn(dd)}}$$`,
        answer: { type: 'number', value: d1(x0), tol: 1e-6 },
        answerLabel: `f′(${x0}) =`,
        placeholder: 'klidně zlomek, např. -7/9',
        hints: [`$\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}$`, `Čitatel se zjednoduší na konstantu $${fmt(a)}\\cdot${fmt(dd)} - ${fmt(b)}\\cdot${fmt(c)} = ${fmt(num)}$.`],
        solution: [`$f'(x) = \\frac{${fmt(a)}(${coef(c)} ${sgn(dd)}) - ${fmt(c)}(${coef(a)} ${sgn(b)})}{(${coef(c)} ${sgn(dd)})^2} = \\frac{${fmt(num)}}{(${coef(c)} ${sgn(dd)})^2}$`, `$f'(${x0}) = ${fmt(d1(x0), 6)}$`],
      };
    }
    if (level === 4) {
      const kind = rng.pick(['exp', 'ln', 'slozena']);
      const a = rng.nz(1, 4), b = rng.nz(-5, 5), x0 = rng.int(0, 3);
      if (kind === 'exp') {
        const d1 = (x) => a * Math.exp(a * x + b);
        return {
          prompt: `Zderivuj a dosaď $x = ${x0}$ (na 4 des. místa):\n$$f(x) = e^{${coef(a)} ${sgn(b)}}$$`,
          answer: { type: 'number', value: d1(x0), decimals: 4 },
          answerLabel: `f′(${x0}) =`,
          hints: [`Řetízkové pravidlo: $(e^{g(x)})' = g'(x)\\,e^{g(x)}$.`, `$g'(x) = ${fmt(a)}$`],
          solution: [`$f'(x) = ${fmt(a)}e^{${coef(a)} ${sgn(b)}}$`, `$f'(${x0}) = ${fmt(a)}e^{${fmt(a * x0 + b)}} \\approx ${fmt(d1(x0), 4)}$`],
        };
      }
      if (kind === 'ln') {
        const c = rng.int(2, 8);
        const d1 = (x) => a / (a * x + c);
        return {
          prompt: `Zderivuj a dosaď $x = ${x0}$ (na 4 des. místa):\n$$f(x) = \\ln(${coef(Math.abs(a))} + ${c})$$`,
          answer: { type: 'number', value: Math.abs(a) / (Math.abs(a) * x0 + c), decimals: 4 },
          answerLabel: `f′(${x0}) =`,
          hints: [`$(\\ln g(x))' = \\frac{g'(x)}{g(x)}$`, `$g'(x) = ${fmt(Math.abs(a))}$`],
          solution: [`$f'(x) = \\frac{${fmt(Math.abs(a))}}{${coef(Math.abs(a))} + ${c}}$`, `$f'(${x0}) = ${fmt(Math.abs(a) / (Math.abs(a) * x0 + c), 4)}$`],
        };
      }
      const n = rng.int(2, 4);
      const d1 = (x) => n * a * (a * x + b) ** (n - 1);
      return {
        prompt: `Zderivuj (řetízkové pravidlo) a dosaď $x = ${x0}$:\n$$f(x) = (${coef(a)} ${sgn(b)})^{${n}}$$`,
        answer: { type: 'number', value: d1(x0), tol: 1e-6 },
        answerLabel: `f′(${x0}) =`,
        hints: [`$(g^n)' = n g^{n-1} \\cdot g'$`, `Vnitřní funkce $g = ${coef(a)} ${sgn(b)}$, $g' = ${fmt(a)}$.`],
        solution: [`$f'(x) = ${n} \\cdot (${coef(a)} ${sgn(b)})^{${n - 1}} \\cdot ${fmt(a)}$`, `$f'(${x0}) = ${fmt(d1(x0))}$`],
      };
    }
    // level 5 – ekonomická interpretace: mezní náklady
    const a = rng.int(1, 4), b = rng.int(5, 30), c = rng.int(200, 900), q = rng.int(5, 25);
    // C(q) = a q^2 + b q + c ; MC = 2aq + b
    const mc = 2 * a * q + b;
    return {
      prompt: `Nákladová funkce firmy je $C(q) = ${polyTex([a, b, c], 'q')}$ (v tisících Kč, $q$ = počet kusů).\nUrči **mezní náklady** při výrobě $q = ${q}$ kusů.`,
      answer: { type: 'number', value: mc, tol: 1e-9 },
      answerLabel: 'MC =',
      hints: [
        'Mezní náklady = derivace nákladové funkce podle $q$.',
        `$C'(q) = ${polyTex([2 * a, b], 'q')}$`,
        'Znamená to: o kolik vzrostou náklady při výrobě jednoho kusu navíc.',
      ],
      solution: [
        `$MC(q) = C'(q) = ${polyTex([2 * a, b], 'q')}$`,
        `$MC(${q}) = ${fmt(mc)}$ tis. Kč na další kus`,
      ],
      viz: {
        type: 'function', xRange: [0, q * 2 + 5],
        fns: [{ f: (x) => a * x * x + b * x + c, label: 'C(q)' }],
        points: [{ x: q, y: a * q * q + b * q + c, label: `q=${q}` }],
        xLabel: 'q', yLabel: 'C',
      },
    };
  },
};
