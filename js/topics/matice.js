import { fmt } from '../core/util.js';

const mTex = (M) => `\\begin{pmatrix} ${M.map((r) => r.join(' & ')).join(' \\\\ ')} \\end{pmatrix}`;
const rand2 = (rng, lo = -6, hi = 6) => [[rng.int(lo, hi), rng.int(lo, hi)], [rng.int(lo, hi), rng.int(lo, hi)]];
const det2 = (M) => M[0][0] * M[1][1] - M[0][1] * M[1][0];

export default {
  id: 'matice',
  name: 'Matice a determinanty',
  category: 'Lineární algebra',
  icon: '▦',
  description: 'Sčítání, násobení matic, determinant a inverzní matice 2×2.',
  levels: 4,

  generate(level, rng) {
    if (level === 1) {
      const A = rand2(rng), B = rand2(rng);
      const k = rng.nz(-3, 3);
      const C = A.map((r, i) => r.map((v, j) => v + k * B[i][j]));
      return {
        prompt: `$A = ${mTex(A)}$, $B = ${mTex(B)}$\n\nSpočítej $A ${k < 0 ? '-' : '+'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}B$ a zapiš prvky **po řádcích**: $c_{11}; c_{12}; c_{21}; c_{22}$.`,
        answer: { type: 'numberList', value: [C[0][0], C[0][1], C[1][0], C[1][1]], tol: 1e-9, display: mTex(C) },
        answerLabel: 'výsledek =',
        placeholder: 'např. 3; -1; 0; 5',
        hints: ['Matice se sčítají **po prvcích** – stejné pozice.', `Například $c_{11} = ${A[0][0]} ${k < 0 ? '-' : '+'} ${Math.abs(k)}\\cdot${B[0][0]} = ${fmt(C[0][0])}$.`],
        solution: [`$= ${mTex(C)}$`],
      };
    }
    if (level === 2) {
      const A = rand2(rng, -5, 5), B = rand2(rng, -5, 5);
      const C = [
        [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
        [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
      ];
      return {
        prompt: `$A = ${mTex(A)}$, $B = ${mTex(B)}$\n\nSpočítej součin $A \\cdot B$. Zapiš po řádcích: $c_{11}; c_{12}; c_{21}; c_{22}$.`,
        answer: { type: 'numberList', value: [C[0][0], C[0][1], C[1][0], C[1][1]], tol: 1e-9, display: mTex(C) },
        answerLabel: 'A·B =',
        hints: [
          'Prvek $c_{ij}$ = **i-tý řádek** A skalárně krát **j-tý sloupec** B.',
          `$c_{11} = ${A[0][0]}\\cdot${B[0][0]} + ${A[0][1]}\\cdot${B[1][0]} = ${fmt(C[0][0])}$`,
          'Pozor: násobení matic není komutativní, $AB \\ne BA$.',
        ],
        solution: [
          `$c_{11} = ${fmt(C[0][0])},\\ c_{12} = ${fmt(C[0][1])}$`,
          `$c_{21} = ${fmt(C[1][0])},\\ c_{22} = ${fmt(C[1][1])}$`,
          `$A \\cdot B = ${mTex(C)}$`,
        ],
      };
    }
    if (level === 3) {
      const A = rand2(rng, -8, 8);
      return {
        prompt: `Spočítej determinant:\n$$\\det ${mTex(A)}$$`,
        answer: { type: 'number', value: det2(A), tol: 1e-9 },
        answerLabel: 'det =',
        hints: [`Pro matici 2×2: $\\det = ad - bc$ (hlavní diagonála minus vedlejší).`, `$${A[0][0]}\\cdot${A[1][1]} - ${A[0][1]}\\cdot${A[1][0]}$`],
        solution: [
          `$\\det = ${A[0][0]}\\cdot${A[1][1]} - ${A[0][1]}\\cdot${A[1][0]} = ${fmt(det2(A))}$`,
          det2(A) === 0 ? 'Determinant je nula → matice je singulární, inverzní neexistuje.' : 'Determinant není nula → matice je regulární a má inverzi.',
        ],
      };
    }
    // level 4 – inverzní matice
    let A = rand2(rng, -5, 5);
    while (det2(A) === 0) A = rand2(rng, -5, 5);
    const d = det2(A);
    const Inv = [[A[1][1] / d, -A[0][1] / d], [-A[1][0] / d, A[0][0] / d]];
    return {
      prompt: `Najdi inverzní matici k $A = ${mTex(A)}$.\nZapiš prvky po řádcích: $a_{11}; a_{12}; a_{21}; a_{22}$ (na 4 des. místa).`,
      answer: { type: 'numberList', value: [Inv[0][0], Inv[0][1], Inv[1][0], Inv[1][1]], decimals: 4, display: `\\frac{1}{${fmt(d)}}${mTex([[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]])}` },
      answerLabel: 'A⁻¹ =',
      placeholder: 'např. 0,25; -0,5; 0,125; 0,375',
      hints: [
        `$A^{-1} = \\frac{1}{\\det A}\\begin{pmatrix} d & -b \\\\ -c & a\\end{pmatrix}$ – prohodíš diagonálu, otočíš znaménka mimo ni.`,
        `$\\det A = ${fmt(d)}$`,
        `Adjungovaná matice: $${mTex([[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]])}$`,
      ],
      solution: [
        `$\\det A = ${fmt(d)}$`,
        `$A^{-1} = \\frac{1}{${fmt(d)}}${mTex([[A[1][1], -A[0][1]], [-A[1][0], A[0][0]]])} = ${mTex(Inv.map((r) => r.map((v) => fmt(v, 4))))}$`,
      ],
    };
  },
};
