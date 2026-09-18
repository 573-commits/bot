import { fmt } from '../core/util.js';

const OPS = [
  { tex: 'A \\cap B', name: 'průnik', shade: 'A∩B', calc: (a, b) => [...a].filter((x) => b.has(x)) },
  { tex: 'A \\cup B', name: 'sjednocení', shade: 'A∪B', calc: (a, b) => [...new Set([...a, ...b])] },
  { tex: 'A \\setminus B', name: 'rozdíl', shade: 'A\\B', calc: (a, b) => [...a].filter((x) => !b.has(x)) },
  { tex: 'B \\setminus A', name: 'rozdíl', shade: 'B\\A', calc: (a, b) => [...b].filter((x) => !a.has(x)) },
];

export default {
  id: 'mnoziny',
  name: 'Množiny',
  category: 'Základy',
  icon: '∪',
  description: 'Průnik, sjednocení, rozdíl, doplněk a inkluzně-exkluzivní princip.',
  levels: 3,

  generate(level, rng) {
    if (level <= 2) {
      const univ = Array.from({ length: 10 }, (_, i) => i + 1);
      const A = new Set(rng.sample(univ, rng.int(4, 6)));
      const B = new Set(rng.sample(univ, rng.int(4, 6)));
      const op = rng.pick(level === 1 ? OPS.slice(0, 2) : OPS);
      const res = op.calc(A, B).sort((x, y) => x - y);
      const sa = [...A].sort((x, y) => x - y), sb = [...B].sort((x, y) => x - y);
      return {
        prompt: `$A = \\{${sa.join('; ')}\\}$, $B = \\{${sb.join('; ')}\\}$\n\nUrči **${op.name}** $${op.tex}$.\nZapiš prvky oddělené středníkem${res.length ? '' : ' (prázdná množina = napiš `0` prvků: `prazdna`)'}.`,
        answer: res.length
          ? { type: 'numberSet', value: res, tol: 1e-9, display: `\\{${res.join('; ')}\\}` }
          : { type: 'text', value: ['prazdna', 'prázdná', '{}', '∅', 'prazdnamnozina'], display: '$\\emptyset$' },
        answerLabel: `${op.tex.replace(/\\\w+/g, (m) => ({ '\\cap': '∩', '\\cup': '∪', '\\setminus': '\\' }[m] || m))} =`,
        placeholder: res.length ? `např. ${res.slice(0, 3).join('; ')}` : 'prazdna',
        hints: [
          op.shade === 'A∩B' ? 'Průnik = prvky, které jsou v **obou** množinách.'
            : op.shade === 'A∪B' ? 'Sjednocení = prvky, které jsou **aspoň v jedné**.'
              : `Rozdíl $X \\setminus Y$ = prvky, které jsou v $X$, ale **nejsou** v $Y$.`,
          `Projdi prvky ${op.shade.startsWith('B') ? 'množiny B' : 'množiny A'} jeden po druhém.`,
        ],
        solution: [`$${op.tex} = \\{${res.join('; ')}\\}$`],
        viz: { type: 'venn', shade: op.shade, labelA: 'A', labelB: 'B' },
      };
    }
    // level 3 – inkluzně-exkluzivní princip (slovní úloha)
    const nA = rng.int(20, 60), nB = rng.int(20, 60), both = rng.int(5, Math.min(nA, nB) - 2);
    const total = nA + nB - both;
    return {
      prompt: `Ve třídě umí ${nA} studentů anglicky, ${nB} německy a ${both} studentů **oba jazyky**.\nKolik studentů umí **aspoň jeden** z těch jazyků?`,
      answer: { type: 'integer', value: total },
      answerLabel: '|A ∪ B| =',
      hints: [
        'Kdybys jen sečetl, počítáš „oba jazyky“ dvakrát.',
        `$|A \\cup B| = |A| + |B| - |A \\cap B|$`,
        `$= ${nA} + ${nB} - ${both}$`,
      ],
      solution: [`$|A \\cup B| = ${nA} + ${nB} - ${both} = ${total}$`, `Jen anglicky: ${nA - both}, jen německy: ${nB - both}, oba: ${both}.`],
      viz: {
        type: 'venn', shade: 'A∪B', labelA: 'AJ', labelB: 'NJ',
        texts: [{ x: 140, y: 135, text: String(nA - both) }, { x: 230, y: 135, text: String(both) }, { x: 320, y: 135, text: String(nB - both) }],
      },
    };
  },
};
