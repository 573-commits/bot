import { fmt, round } from '../core/util.js';

export default {
  id: 'procenta',
  name: 'Procenta',
  category: 'Základy',
  icon: '%',
  description: 'Část z celku, změny v procentech, slevy, DPH a procentní body.',
  levels: 4,

  generate(level, rng) {
    if (level === 1) {
      const p = rng.pick([5, 10, 12, 15, 20, 25, 30, 40, 60, 75]);
      const base = rng.int(2, 40) * 50;
      return {
        prompt: `Kolik je **${p} %** z **${base}**?`,
        answer: { type: 'number', value: (p * base) / 100, tol: 0.01 },
        answerLabel: 'výsledek =',
        hints: [`1 % je $\\frac{${base}}{100} = ${fmt(base / 100)}$.`, `${p} % je ${p}× víc.`],
        solution: [`$\\frac{${p}}{100} \\cdot ${base} = ${fmt((p * base) / 100)}$`],
      };
    }
    if (level === 2) {
      const part = rng.int(3, 60) * 5, whole = part + rng.int(4, 80) * 5;
      const p = round((part / whole) * 100, 2);
      return {
        prompt: `Z ${whole} zaměstnanců firmy jich ${part} pracuje z domova.\nKolik **procent** to je? (na 2 desetinná místa)`,
        answer: { type: 'number', value: p, decimals: 2 },
        answerLabel: 'podíl (%) =',
        hints: ['Procento = část / celek · 100.', `$\\frac{${part}}{${whole}} = ${fmt(part / whole, 4)}$`],
        solution: [`$\\frac{${part}}{${whole}} \\cdot 100 = ${fmt(p)}\\ \\%$`],
        viz: { type: 'bars', data: [{ label: 'z domova', value: part }, { label: 'v kanceláři', value: whole - part }] },
      };
    }
    if (level === 3) {
      const price = rng.int(6, 60) * 100;
      const d1 = rng.pick([10, 15, 20, 25, 30]);
      const d2 = rng.pick([5, 10, 20]);
      const finalP = price * (1 - d1 / 100) * (1 - d2 / 100);
      return {
        prompt: `Zboží za **${price} Kč** zlevnilo o **${d1} %** a z nové ceny ještě o **${d2} %**.\nJaká je konečná cena?`,
        answer: { type: 'number', value: finalP, decimals: 2 },
        answerLabel: 'cena (Kč) =',
        hints: [
          'Pozor: slevy se nesčítají! Druhá sleva se počítá z už snížené ceny.',
          `Po první slevě: $${price} \\cdot ${fmt(1 - d1 / 100)} = ${fmt(price * (1 - d1 / 100))}$ Kč.`,
        ],
        solution: [
          `$${price} \\cdot (1 - ${fmt(d1 / 100)}) = ${fmt(price * (1 - d1 / 100))}$`,
          `$${fmt(price * (1 - d1 / 100))} \\cdot (1 - ${fmt(d2 / 100)}) = ${fmt(finalP, 2)}$ Kč`,
          `Celková sleva je ${fmt(round((1 - finalP / price) * 100, 2))} %, ne ${d1 + d2} %.`,
        ],
      };
    }
    // level 4 – zpětný výpočet základu / procentní body
    if (rng() < 0.5) {
      const p = rng.pick([12, 15, 21, 25, 40]);
      const after = rng.int(10, 90) * 100;
      const base = after / (1 + p / 100);
      return {
        prompt: `Cena **s DPH ${p} %** je **${after} Kč**.\nJaká je cena **bez DPH**? (na 2 desetinná místa)`,
        answer: { type: 'number', value: base, decimals: 2 },
        answerLabel: 'cena bez DPH =',
        hints: ['Cena s DPH = cena bez DPH · (1 + sazba). Hledáš základ, tedy děl.', `$\\frac{${after}}{1{,}${String(p).padStart(2, '0')}}$`],
        solution: [`$x \\cdot (1 + ${fmt(p / 100)}) = ${after}$`, `$x = \\frac{${after}}{${fmt(1 + p / 100)}} = ${fmt(base, 2)}$ Kč`],
      };
    }
    const a = rng.int(20, 45), b = a + rng.int(3, 20);
    return {
      prompt: `Podíl na trhu vzrostl z **${a} %** na **${b} %**.\nO kolik **procent** (ne procentních bodů) vzrostl? (na 2 des. místa)`,
      answer: { type: 'number', value: ((b - a) / a) * 100, decimals: 2 },
      answerLabel: 'růst (%) =',
      hints: [
        `Rozdíl ${b - a} je v **procentních bodech**. Relativní růst je ale vztažený k původní hodnotě.`,
        `$\\frac{${b} - ${a}}{${a}} \\cdot 100$`,
      ],
      solution: [
        `Absolutně: $+${b - a}$ procentních bodů.`,
        `Relativně: $\\frac{${b - a}}{${a}} \\cdot 100 = ${fmt(((b - a) / a) * 100, 2)}\\ \\%$`,
      ],
      viz: { type: 'bars', data: [{ label: 'před', value: a }, { label: 'po', value: b }] },
    };
  },
};
