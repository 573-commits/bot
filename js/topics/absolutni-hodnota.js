import { fmt, coef, sgn, intervalVariants, unionVariants } from '../core/util.js';

export default {
  id: 'absolutni-hodnota',
  name: 'Absolutní hodnota',
  category: 'Algebra',
  icon: '|x|',
  description: 'Rovnice a nerovnice s absolutní hodnotou. Čti ji jako vzdálenost na číselné ose.',
  levels: 3,

  generate(level, rng) {
    const a = rng.nz(1, 5), b = rng.nz(-9, 9), c = rng.int(1, 14);

    if (level === 1) {
      // |ax + b| = c  ->  x = (c-b)/a  nebo  (-c-b)/a
      const r1 = (c - b) / a, r2 = (-c - b) / a;
      const roots = [r1, r2].sort((p, q) => p - q);
      return {
        prompt: `Vyřeš rovnici:\n$$|${coef(a)} ${sgn(b)}| = ${c}$$\nZapiš obě řešení oddělená středníkem.`,
        answer: { type: 'numberSet', value: roots, tol: 1e-6 },
        answerLabel: 'x =',
        placeholder: 'např. -4; 2',
        hints: [
          'Absolutní hodnota je $c$, když je vnitřek $+c$ **nebo** $-c$. Vznikají tedy dvě rovnice.',
          `$${coef(a)} ${sgn(b)} = ${c}$ a $${coef(a)} ${sgn(b)} = ${-c}$`,
        ],
        solution: [
          `$${coef(a)} ${sgn(b)} = ${c} \\Rightarrow x = ${fmt(r1)}$`,
          `$${coef(a)} ${sgn(b)} = ${-c} \\Rightarrow x = ${fmt(r2)}$`,
          `Řešení: $x \\in \\{${roots.map((r) => fmt(r)).join(';\\ ')}\\}$`,
        ],
        viz: { type: 'numberline', range: [Math.min(...roots) - 3, Math.max(...roots) + 3], points: roots.map((r) => ({ x: r, label: fmt(r) })) },
      };
    }
    if (level === 2) {
      // |x - m| < c  ->  (m-c; m+c)
      const m = rng.int(-8, 8);
      const rel = rng.pick(['<', '\\le']);
      const closed = rel === '\\le';
      const tex = `${closed ? '\\langle ' : '('}${m - c};${m + c}${closed ? '\\rangle' : ')'}`;
      return {
        prompt: `Vyřeš nerovnici a zapiš výsledek jako interval:\n$$|x ${sgn(-m)}| ${rel} ${c}$$\n*Zápis: `+'`(-2;6)`'+` nebo `+'`<-2;6>`'+`*`,
        answer: { type: 'text', value: intervalVariants(m - c, m + c, !closed, !closed), display: `$${tex}$` },
        answerLabel: 'x ∈',
        placeholder: `(${m - c};${m + c})`,
        hints: [
          `Čti to jako vzdálenost: $|x ${sgn(-m)}|$ je vzdálenost $x$ od čísla ${fmt(m)}.`,
          `Hledáš tedy všechna $x$ vzdálená od ${fmt(m)} nejvýš o ${c}.`,
          `Rozepsáno: $${-c} ${rel} x ${sgn(-m)} ${rel} ${c}$.`,
        ],
        solution: [
          `$${-c} ${rel} x ${sgn(-m)} ${rel} ${c}$`,
          `Přičteme ${fmt(m)}: $${m - c} ${rel} x ${rel} ${m + c}$`,
          `$x \\in ${tex}$`,
        ],
        viz: {
          type: 'numberline', range: [m - c - 4, m + c + 4],
          intervals: [{ from: m - c, to: m + c, openL: !closed, openR: !closed, label: 'řešení' }],
          points: [{ x: m, label: 'střed', color: 'var(--c4)' }],
        },
      };
    }
    // level 3 – vnější nerovnice |x - m| > c
    const m = rng.int(-8, 8);
    const rel = rng.pick(['>', '\\ge']);
    const closed = rel === '\\ge';
    const tex = `(-\\infty;${m - c}${closed ? '\\rangle' : ')'} \\cup ${closed ? '\\langle ' : '('}${m + c};\\infty)`;
    return {
      prompt: `Vyřeš nerovnici:\n$$|x ${sgn(-m)}| ${rel} ${c}$$\n*Zápis: `+'`(-inf;-2) u (6;inf)`'+`*`,
      answer: { type: 'text', value: unionVariants(m - c, m + c, !closed), display: `$${tex}$` },
      answerLabel: 'x ∈',
      placeholder: `(-inf;${m - c}) u (${m + c};inf)`,
      hints: [
        `Teď hledáš body **dál** než ${c} od čísla ${fmt(m)} – to jsou dva oddělené kusy osy.`,
        `$x ${sgn(-m)} ${rel} ${c}$ **nebo** $x ${sgn(-m)} ${rel === '>' ? '<' : '\\le'} ${-c}$`,
      ],
      solution: [
        `$x ${sgn(-m)} ${rel} ${c} \\Rightarrow x ${rel} ${m + c}$`,
        `$x ${sgn(-m)} ${rel === '>' ? '<' : '\\le'} ${-c} \\Rightarrow x ${rel === '>' ? '<' : '\\le'} ${m - c}$`,
        `$x \\in ${tex}$`,
      ],
      viz: {
        type: 'numberline', range: [m - c - 5, m + c + 5],
        intervals: [
          { from: m - c - 5, to: m - c, openR: !closed },
          { from: m + c, to: m + c + 5, openL: !closed },
        ],
        points: [{ x: m, label: 'střed', color: 'var(--c4)' }],
      },
    };
  },
};
