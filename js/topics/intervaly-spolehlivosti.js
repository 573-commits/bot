import { fmt, normalInv } from '../core/util.js';

const Z = { 0.90: 1.6449, 0.95: 1.9600, 0.99: 2.5758 };

export default {
  id: 'intervaly-spolehlivosti',
  name: 'Intervaly spolehlivosti',
  category: 'Data',
  icon: '±',
  description: 'Jak přesný je odhad z výběru – interval pro průměr, pro podíl a potřebná velikost vzorku.',
  levels: 3,

  generate(level, rng) {
    const conf = rng.pick([0.90, 0.95, 0.99]);
    const z = normalInv(1 - (1 - conf) / 2);

    if (level === 1) {
      const mean = rng.int(20, 300), sigma = rng.int(3, 40), n = rng.pick([25, 36, 49, 64, 100, 144]);
      const margin = z * sigma / Math.sqrt(n);
      return {
        prompt: `Z výběru **n = ${n}** vyšel průměr **${mean}**, směrodatná odchylka v populaci je **${sigma}**.\nUrči **poloviční šířku** ${fmt(conf * 100)}% intervalu spolehlivosti pro střední hodnotu. (na 4 des. místa)`,
        answer: { type: 'number', value: margin, decimals: 4 },
        answerLabel: 'chyba odhadu =',
        hints: [
          `Pro ${fmt(conf * 100)}% spolehlivost je $z_{${fmt(conf)}} = ${fmt(z, 4)}$.`,
          `Chyba odhadu $= z \\cdot \\frac{\\sigma}{\\sqrt{n}}$`,
          `$\\frac{${sigma}}{\\sqrt{${n}}} = ${fmt(sigma / Math.sqrt(n), 4)}$`,
        ],
        solution: [
          `$z = ${fmt(z, 4)}$, standardní chyba $= \\frac{${sigma}}{\\sqrt{${n}}} = ${fmt(sigma / Math.sqrt(n), 4)}$`,
          `$E = ${fmt(z, 4)} \\cdot ${fmt(sigma / Math.sqrt(n), 4)} = ${fmt(margin, 4)}$`,
          `Interval je $\\langle ${fmt(mean - margin, 3)};\\ ${fmt(mean + margin, 3)} \\rangle$ – se ${fmt(conf * 100)}% spolehlivostí v něm leží skutečný průměr.`,
        ],
        viz: {
          type: 'numberline',
          range: [mean - margin * 2.4, mean + margin * 2.4],
          intervals: [{ from: mean - margin, to: mean + margin, label: `${fmt(conf * 100)} %` }],
          points: [{ x: mean, label: 'průměr' }],
        },
      };
    }
    if (level === 2) {
      const succ = rng.int(30, 400);
      const n = succ + rng.int(60, 600);
      const p = succ / n;
      const margin = z * Math.sqrt((p * (1 - p)) / n);
      return {
        prompt: `V dotazníku odpovědělo **${succ} z ${n}** lidí kladně.\nUrči **poloviční šířku** ${fmt(conf * 100)}% intervalu spolehlivosti pro podíl. (na 5 des. míst)`,
        answer: { type: 'number', value: margin, decimals: 5 },
        answerLabel: 'chyba odhadu =',
        hints: [
          `Odhad podílu $\\hat{p} = \\frac{${succ}}{${n}} = ${fmt(p, 5)}$`,
          `$E = z\\sqrt{\\frac{\\hat{p}(1-\\hat{p})}{n}}$, kde $z = ${fmt(z, 4)}$`,
          `$\\frac{${fmt(p, 4)} \\cdot ${fmt(1 - p, 4)}}{${n}} = ${fmt((p * (1 - p)) / n, 8)}$`,
        ],
        solution: [
          `$\\hat{p} = ${fmt(p, 5)}$`,
          `$E = ${fmt(z, 4)} \\cdot \\sqrt{${fmt((p * (1 - p)) / n, 8)}} = ${fmt(margin, 5)}$`,
          `Podíl je tedy ${fmt(p * 100, 2)} % ± ${fmt(margin * 100, 2)} procentního bodu.`,
        ],
      };
    }
    // level 3 – potřebná velikost vzorku
    const sigma = rng.int(5, 50);
    const wanted = rng.pick([0.5, 1, 2, 2.5, 5]);
    const n = Math.ceil((z * sigma / wanted) ** 2);
    return {
      prompt: `Chceš odhadnout střední hodnotu s chybou **nejvýše ±${fmt(wanted)}** při ${fmt(conf * 100)}% spolehlivosti.\nSměrodatná odchylka je **${sigma}**. Kolik lidí musíš minimálně oslovit?`,
      answer: { type: 'integer', value: n },
      answerLabel: 'n =',
      hints: [
        `Vyjdi ze vzorce pro chybu: $E = z\\frac{\\sigma}{\\sqrt{n}}$ a vyjádři $n$.`,
        `$n = \\left(\\frac{z\\sigma}{E}\\right)^2$, kde $z = ${fmt(z, 4)}$`,
        'Výsledek vždy **zaokrouhli nahoru** – půl respondenta neexistuje.',
      ],
      solution: [
        `$n = \\left(\\frac{${fmt(z, 4)} \\cdot ${sigma}}{${fmt(wanted)}}\\right)^2 = ${fmt((z * sigma / wanted) ** 2, 3)}$`,
        `Zaokrouhleno nahoru: $n = ${n}$`,
        'Všimni si: pro poloviční chybu potřebuješ **čtyřikrát** větší vzorek.',
      ],
    };
  },
};
