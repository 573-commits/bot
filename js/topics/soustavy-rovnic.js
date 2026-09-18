import { fmt, coef, sgn } from '../core/util.js';

export default {
  id: 'soustavy-rovnic',
  name: 'Soustavy rovnic',
  category: 'Algebra',
  icon: '⚖',
  description: 'Dvě rovnice o dvou neznámých – dosazovací i sčítací metoda, graficky průsečík přímek.',
  levels: 4,

  generate(level, rng) {
    const x = rng.int(-6, 6), y = rng.int(-6, 6);
    let a1, b1, a2, b2;
    do {
      a1 = rng.nz(level === 1 ? 1 : -6, 6); b1 = rng.nz(level === 1 ? 1 : -6, 6);
      a2 = rng.nz(-6, 6); b2 = rng.nz(-6, 6);
    } while (a1 * b2 - a2 * b1 === 0);
    const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
    const det = a1 * b2 - a2 * b1;

    if (level === 4) {
      // slovní úloha – nákup dvou položek
      const pA = rng.int(20, 90), pB = rng.int(20, 90);
      const nA = rng.int(2, 9), nB = rng.int(2, 9);
      const mA = rng.int(2, 9), mB = rng.int(2, 9);
      if (nA * mB - mA * nB === 0) return this.generate(4, rng);
      const t1 = nA * pA + nB * pB, t2 = mA * pA + mB * pB;
      return {
        prompt: `Ve školním bufetu: ${nA}× káva a ${nB}× bageta stojí **${t1} Kč**, ${mA}× káva a ${mB}× bageta stojí **${t2} Kč**.\nKolik stojí káva a kolik bageta? Zapiš $káva; bageta$.`,
        answer: { type: 'numberList', value: [pA, pB], tol: 0.01 },
        answerLabel: 'káva; bageta =',
        placeholder: 'např. 45; 62',
        hints: [
          'Označ $k$ = cena kávy, $b$ = cena bagety.',
          `Dostaneš soustavu $${nA}k + ${nB}b = ${t1}$ a $${mA}k + ${mB}b = ${t2}$.`,
          'Sčítací metoda: vynásob rovnice tak, aby se jedna neznámá vyrušila.',
        ],
        solution: [
          `$${nA}k + ${nB}b = ${t1}$`,
          `$${mA}k + ${mB}b = ${t2}$`,
          `Determinant $= ${nA}\\cdot${mB} - ${mA}\\cdot${nB} = ${fmt(nA * mB - mA * nB)}$`,
          `$k = ${fmt(pA)}$ Kč, $b = ${fmt(pB)}$ Kč`,
        ],
      };
    }

    const viz = {
      type: 'function',
      xRange: [x - 6, x + 6],
      yRange: [y - 6, y + 6],
      fns: [
        { f: (t) => (c1 - a1 * t) / b1, label: '1. rovnice' },
        { f: (t) => (c2 - a2 * t) / b2, label: '2. rovnice' },
      ],
      points: [{ x, y, label: 'průsečík' }],
    };
    return {
      prompt: `Vyřeš soustavu:\n$$\\begin{aligned}${coef(a1)} ${sgn(b1, { hideOne: true })}y &= ${c1}\\\\ ${coef(a2)} ${sgn(b2, { hideOne: true })}y &= ${c2}\\end{aligned}$$\nZapiš $x; y$.`,
      answer: { type: 'numberList', value: [x, y], tol: 1e-6 },
      answerLabel: 'x; y =',
      placeholder: 'např. 3; -2',
      hints: [
        level === 1 ? 'Z jedné rovnice vyjádři jednu neznámou a dosaď do druhé.' : 'Sčítací metoda: vynásob rovnice tak, aby koeficienty u $y$ byly opačné.',
        `Zkus první rovnici × ${fmt(b2)} a druhou × ${fmt(-b1)}.`,
        `Vyjde $x = ${fmt(x)}$ – dopočítej $y$ dosazením.`,
      ],
      solution: [
        `Determinant $D = ${fmt(a1)}\\cdot${fmt(b2)} - ${fmt(a2)}\\cdot${fmt(b1)} = ${fmt(det)} \\ne 0$, soustava má jedno řešení.`,
        `$x = \\frac{${fmt(c1)}\\cdot${fmt(b2)} - ${fmt(c2)}\\cdot${fmt(b1)}}{${fmt(det)}} = ${fmt(x)}$`,
        `$y = ${fmt(y)}$`,
        'Graficky: průsečík dvou přímek.',
      ],
      viz,
    };
  },
};
