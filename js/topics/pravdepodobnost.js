import { fmt, fracTex, nCr, round } from '../core/util.js';

export default {
  id: 'pravdepodobnost',
  name: 'Pravděpodobnost',
  category: 'Diskrétní matematika',
  icon: '🎲',
  description: 'Klasická pravděpodobnost, nezávislé jevy, opačný jev, podmíněná pravděpodobnost.',
  levels: 4,

  generate(level, rng) {
    if (level === 1) {
      const r = rng.int(2, 8), b = rng.int(2, 8), g = rng.int(0, 5);
      const total = r + b + g;
      const color = rng.pick([['červenou', r], ['modrou', b]]);
      return {
        prompt: `V osudí je ${r} červených, ${b} modrých${g ? ` a ${g} zelených` : ''} kuliček.\nJaká je pravděpodobnost, že náhodně vytáhneš **${color[0]}**? (zapiš jako zlomek nebo desetinné číslo na 4 místa)`,
        answer: { type: 'number', value: color[1] / total, tol: 5e-5, display: fracTex(color[1], total) },
        answerLabel: 'P =',
        placeholder: `např. ${color[1]}/${total}`,
        hints: ['Klasická pravděpodobnost = příznivé / všechny možnosti.', `Celkem je ${total} kuliček.`],
        solution: [`$P = \\frac{${color[1]}}{${total}} = ${fmt(color[1] / total, 4)}$`],
        viz: { type: 'bars', data: [{ label: 'červené', value: r }, { label: 'modré', value: b }, ...(g ? [{ label: 'zelené', value: g }] : [])] },
      };
    }
    if (level === 2) {
      const n = rng.int(2, 4);
      const p = rng.pick([1 / 2, 1 / 6, 1 / 3]);
      const desc = p === 1 / 2 ? 'padne panna' : p === 1 / 6 ? 'padne šestka' : 'padne číslo dělitelné 3';
      const val = p ** n;
      return {
        prompt: `Opakuješ pokus **${n}×** nezávisle. V každém pokusu ${desc} s pravděpodobností $${fracTex(1, Math.round(1 / p))}$.\nJaká je pravděpodobnost, že to nastane **pokaždé**? (na 4 des. místa)`,
        answer: { type: 'number', value: val, decimals: 4 },
        answerLabel: 'P =',
        hints: ['Nezávislé jevy → pravděpodobnosti se **násobí**.', `$P = \\left(${fracTex(1, Math.round(1 / p))}\\right)^{${n}}$`],
        solution: [`$P = ${fracTex(1, Math.round(1 / p))}^{${n}} = ${fmt(val, 6)}$`],
      };
    }
    if (level === 3) {
      const n = rng.int(3, 6);
      const p = 1 / 6;
      const val = 1 - (1 - p) ** n;
      return {
        prompt: `Házíš kostkou **${n}×**. Jaká je pravděpodobnost, že padne **alespoň jedna** šestka?\n(na 4 des. místa)`,
        answer: { type: 'number', value: val, decimals: 4 },
        answerLabel: 'P =',
        hints: [
          'Počítat „alespoň jedna“ přímo je pracné – použij **opačný jev**.',
          'Opačný jev: ani jednou nepadne šestka.',
          `$P(\\text{ani jednou}) = \\left(\\frac{5}{6}\\right)^{${n}}$`,
        ],
        solution: [
          `$P(\\overline{A}) = \\left(\\frac{5}{6}\\right)^{${n}} = ${fmt((5 / 6) ** n, 4)}$`,
          `$P(A) = 1 - ${fmt((5 / 6) ** n, 4)} = ${fmt(val, 4)}$`,
        ],
      };
    }
    // level 4 – podmíněná pravděpodobnost / Bayes (business flavour)
    const nA = rng.int(20, 70);
    const defA = rng.int(1, 6);
    let defB = rng.int(1, 8);
    while (defB === defA) defB = rng.int(1, 8);
    return {
      prompt: `Dodavatel A dodává ${nA} % dílů, dodavatel B ${100 - nA} %. U A je ${defA} % vadných, u B ${defB} %.\nVybereš náhodně vadný díl. Jaká je pravděpodobnost, že je **od dodavatele A**? (na 4 des. místa)`,
      answer: { type: 'number', value: (((defA / 100) * nA) / ((defA / 100) * nA + (defB / 100) * (100 - nA))), decimals: 4 },
      answerLabel: 'P(A | vadný) =',
      hints: [
        'Tohle je Bayesova věta – obracíš podmínku.',
        `$P(\\text{vadný}) = ${fmt(nA / 100, 2)}\\cdot${fmt(defA / 100, 2)} + ${fmt((100 - nA) / 100, 2)}\\cdot${fmt(defB / 100, 2)}$`,
        `$P(A|\\text{vadný}) = \\frac{P(A)\\cdot P(\\text{vadný}|A)}{P(\\text{vadný})}$`,
      ],
      solution: [
        `$P(\\text{vadný}) = ${fmt((nA / 100) * (defA / 100) + ((100 - nA) / 100) * (defB / 100), 5)}$`,
        `$P(A|\\text{vadný}) = \\frac{${fmt((nA / 100) * (defA / 100), 5)}}{${fmt((nA / 100) * (defA / 100) + ((100 - nA) / 100) * (defB / 100), 5)}} = ${fmt(((defA / 100) * nA) / ((defA / 100) * nA + (defB / 100) * (100 - nA)), 4)}$`,
      ],
    };
  },
};
