import { fmt, factorial, nCr, nPr } from '../core/util.js';

export default {
  id: 'kombinatorika',
  name: 'Kombinatorika',
  category: 'Diskrétní matematika',
  icon: 'n!',
  description: 'Faktoriál, variace, permutace a kombinace – a hlavně kdy co použít.',
  levels: 4,

  generate(level, rng) {
    if (level === 1) {
      const n = rng.int(3, 8);
      return {
        prompt: `Kolika způsoby lze seřadit ${n} různých knih na poličce?`,
        answer: { type: 'integer', value: factorial(n) },
        answerLabel: 'počet =',
        hints: ['Na první místo máš $n$ možností, na druhé $n-1$, …', `To je faktoriál: $${n}!$`],
        solution: [`$${n}! = ${Array.from({ length: n }, (_, i) => n - i).join(' \\cdot ')} = ${factorial(n)}$`],
      };
    }
    if (level === 2) {
      const n = rng.int(5, 12), k = rng.int(2, Math.min(4, 5));
      return {
        prompt: `Z ${n} lidí vybíráš **${k}člennou komisi** (na pořadí nezáleží).\nKolik je možností?`,
        answer: { type: 'integer', value: nCr(n, k) },
        answerLabel: 'počet =',
        hints: [
          'Nezáleží na pořadí → kombinace.',
          `$\\binom{n}{k} = \\frac{n!}{k!(n-k)!}$`,
          `$\\binom{${n}}{${k}}$`,
        ],
        solution: [`$\\binom{${n}}{${k}} = \\frac{${n}!}{${k}!\\cdot${n - k}!} = ${nCr(n, k)}$`],
      };
    }
    if (level === 3) {
      const n = rng.int(5, 10), k = rng.int(2, 4);
      const kind = rng.pick(['variace', 'sVracenim']);
      if (kind === 'variace') {
        return {
          prompt: `Ze ${n} sportovců se určuje pořadí na **prvních ${k} místech**.\nKolik různých výsledků je možných?`,
          answer: { type: 'integer', value: nPr(n, k) },
          answerLabel: 'počet =',
          hints: [
            'Záleží na pořadí a nikdo se neopakuje → variace bez opakování.',
            `$V(k,n) = \\frac{n!}{(n-k)!}$`,
            `$${n} \\cdot ${n - 1} \\cdot \\ldots$ (${k} činitelů)`,
          ],
          solution: [`$V(${k},${n}) = \\frac{${n}!}{${n - k}!} = ${Array.from({ length: k }, (_, i) => n - i).join(' \\cdot ')} = ${nPr(n, k)}$`],
        };
      }
      return {
        prompt: `PIN má **${k} číslic**, každá z ${n} možných symbolů, číslice se mohou opakovat.\nKolik různých PINů existuje?`,
        answer: { type: 'integer', value: n ** k },
        answerLabel: 'počet =',
        hints: ['Opakování je povoleno → variace s opakováním.', `$n^k = ${n}^{${k}}$`],
        solution: [`$${n}^{${k}} = ${n ** k}$`],
      };
    }
    // level 4 – kombinovaná úloha
    const m = rng.int(4, 8), z = rng.int(4, 8), km = rng.int(2, 3), kz = rng.int(2, 3);
    const total = nCr(m, km) * nCr(z, kz);
    return {
      prompt: `V týmu je ${m} mužů a ${z} žen. Vybíráš delegaci: **${km} muže a ${kz} ženy**.\nKolik je možností?`,
      answer: { type: 'integer', value: total },
      answerLabel: 'počet =',
      hints: [
        'Vyber zvlášť muže, zvlášť ženy a možnosti **vynásob** (pravidlo součinu).',
        `$\\binom{${m}}{${km}} = ${nCr(m, km)}$`,
        `$\\binom{${z}}{${kz}} = ${nCr(z, kz)}$`,
      ],
      solution: [`$\\binom{${m}}{${km}} \\cdot \\binom{${z}}{${kz}} = ${nCr(m, km)} \\cdot ${nCr(z, kz)} = ${total}$`],
    };
  },
};
