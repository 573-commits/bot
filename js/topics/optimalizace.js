import { fmt, polyTex } from '../core/util.js';

export default {
  id: 'optimalizace',
  name: 'Optimalizace a extrémy',
  category: 'Analýza',
  icon: '⌃',
  description: 'Lokální extrémy funkcí a slovní úlohy na maximalizaci zisku.',
  levels: 4,

  generate(level, rng) {
    if (level <= 2) {
      const a = rng.pick([1, 2, -1, -2]), x1 = rng.int(-4, 1), x2 = x1 + rng.int(2, 6);
      // f' = 3a(x-x1)(x-x2) -> f = a(x^3 - (3/2)(x1+x2)x^2 + 3 x1 x2 x)
      const f = (x) => a * (x ** 3 - 1.5 * (x1 + x2) * x * x + 3 * x1 * x2 * x);
      const fp = (x) => 3 * a * (x - x1) * (x - x2);
      const isMaxAtX1 = a > 0;
      const asked = level === 1 ? 'všechny stacionární body' : (isMaxAtX1 ? 'bod lokálního **maxima**' : 'bod lokálního **maxima**');
      if (level === 1) {
        return {
          prompt: `Najdi **všechny stacionární body** funkce (kde $f'(x) = 0$):\n$$f(x) = ${polyTex([a, -1.5 * a * (x1 + x2), 3 * a * x1 * x2, 0])}$$\nZapiš $x$-ové souřadnice oddělené středníkem.`,
          answer: { type: 'numberSet', value: [x1, x2].sort((p, q) => p - q), tol: 1e-6 },
          answerLabel: 'x =',
          placeholder: 'např. -1; 3',
          hints: ['Stacionární bod = kde je derivace nulová.', `$f'(x) = ${polyTex([3 * a, -3 * a * (x1 + x2), 3 * a * x1 * x2])}$`, 'Vyřeš kvadratickou rovnici $f\'(x) = 0$.'],
          solution: [`$f'(x) = ${polyTex([3 * a, -3 * a * (x1 + x2), 3 * a * x1 * x2])} = 3\\cdot${fmt(a)}(x ${x1 < 0 ? '+' : '-'} ${Math.abs(x1)})(x ${x2 < 0 ? '+' : '-'} ${Math.abs(x2)})$`, `$x_1 = ${x1},\\ x_2 = ${x2}$`],
          viz: { type: 'function', xRange: [x1 - 2, x2 + 2], fns: [{ f, label: 'f(x)' }], points: [{ x: x1, y: f(x1) }, { x: x2, y: f(x2) }] },
        };
      }
      const maxAt = a > 0 ? x1 : x2;
      return {
        prompt: `Ve kterém bodě má funkce **lokální maximum**?\n$$f(x) = ${polyTex([a, -1.5 * a * (x1 + x2), 3 * a * x1 * x2, 0])}$$`,
        answer: { type: 'number', value: maxAt, tol: 1e-6 },
        answerLabel: 'x =',
        hints: [
          `Stacionární body jsou $${x1}$ a $${x2}$.`,
          'Rozhodni podle druhé derivace: $f\'\'(x) < 0$ → maximum.',
          `$f''(x) = ${polyTex([6 * a, -3 * a * (x1 + x2)])}$`,
        ],
        solution: [
          `$f'(x) = 0 \\Rightarrow x \\in \\{${x1}; ${x2}\\}$`,
          `$f''(${maxAt}) = ${fmt(6 * a * maxAt - 3 * a * (x1 + x2))} < 0$ → lokální maximum`,
          `Maximum v $x = ${maxAt}$, hodnota $f(${maxAt}) = ${fmt(f(maxAt), 4)}$`,
        ],
        viz: { type: 'function', xRange: [x1 - 2, x2 + 2], fns: [{ f, label: 'f(x)' }], points: [{ x: maxAt, y: f(maxAt), label: 'max' }] },
      };
    }
    if (level === 3) {
      // maximalizace zisku: P(q) = -a q^2 + b q - c
      const a = rng.int(1, 5), b = rng.int(20, 120), c = rng.int(50, 400);
      const q = b / (2 * a);
      const P = (x) => -a * x * x + b * x - c;
      return {
        prompt: `Zisk firmy je $P(q) = ${polyTex([-a, b, -c], 'q')}$ (v tis. Kč).\nPři jakém množství $q$ je zisk **největší**? (na 2 des. místa)`,
        answer: { type: 'number', value: q, decimals: 2 },
        answerLabel: 'q =',
        hints: [
          'Zisk je maximální tam, kde $P\'(q) = 0$.',
          `$P'(q) = ${polyTex([-2 * a, b], 'q')}$`,
          'Je to parabola otevřená dolů, takže stacionární bod je maximum.',
        ],
        solution: [
          `$P'(q) = ${polyTex([-2 * a, b], 'q')} = 0$`,
          `$q = \\frac{${b}}{${2 * a}} = ${fmt(q, 2)}$`,
          `Maximální zisk $P(${fmt(q, 2)}) = ${fmt(P(q), 2)}$ tis. Kč`,
        ],
        viz: { type: 'function', xRange: [0, q * 2 + 2], fns: [{ f: P, label: 'P(q)' }], points: [{ x: q, y: P(q), label: 'max' }], xLabel: 'q', yLabel: 'zisk' },
      };
    }
    // level 4 – geometrická optimalizace: obdélník s daným obvodem
    const O = rng.int(4, 30) * 4;
    const side = O / 4;
    return {
      prompt: `Z plotu dlouhého **${O} m** chceš ohradit obdélníkový pozemek s **největším obsahem**.\nJaká bude délka jedné strany? (na 2 des. místa)`,
      answer: { type: 'number', value: side, decimals: 2 },
      answerLabel: 'strana (m) =',
      hints: [
        `Označ strany $a$ a $b$. Platí $2a + 2b = ${O}$, tedy $b = ${O / 2} - a$.`,
        `Obsah $S(a) = a(${O / 2} - a) = -a^2 + ${O / 2}a$.`,
        'Maximum kvadratické funkce najdeš přes derivaci nebo vrchol paraboly.',
      ],
      solution: [
        `$S(a) = -a^2 + ${O / 2}a$`,
        `$S'(a) = -2a + ${O / 2} = 0 \\Rightarrow a = ${fmt(side, 2)}$`,
        `Vyjde čtverec se stranou ${fmt(side, 2)} m a obsahem ${fmt(side * side, 2)} m². Čtverec má z obdélníků daného obvodu vždy největší obsah.`,
      ],
      viz: { type: 'function', xRange: [0, O / 2], fns: [{ f: (a) => a * (O / 2 - a), label: 'S(a)' }], points: [{ x: side, y: side * side, label: 'max' }], xLabel: 'a', yLabel: 'S' },
    };
  },
};
