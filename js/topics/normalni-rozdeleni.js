import { fmt, normalCdf, normalInv, normalPdf, round } from '../core/util.js';

/** Zvonovitá křivka s vyšrafovanou částí pod ní. */
const bell = (from, to, mu = 0, sigma = 1) => ({
  type: 'function',
  xRange: [mu - 3.6 * sigma, mu + 3.6 * sigma],
  yRange: [0, normalPdf(0) / sigma * 1.25],
  fns: [{ f: (x) => normalPdf((x - mu) / sigma) / sigma }],
  area: { f: (x) => normalPdf((x - mu) / sigma) / sigma, from: Math.max(from, mu - 3.6 * sigma), to: Math.min(to, mu + 3.6 * sigma) },
  xLabel: sigma === 1 ? 'z' : 'x', yLabel: '',
});

export default {
  id: 'normalni-rozdeleni',
  name: 'Normální rozdělení',
  category: 'Data',
  icon: '🔔',
  description: 'z-skóre, pravděpodobnosti pod Gaussovou křivkou a percentily. Základ statistiky i A/B testů.',
  levels: 4,

  generate(level, rng) {
    if (level === 1) {
      const z = round(rng.int(-25, 25) / 10, 2);
      const dir = rng.pick(['pod', 'nad']);
      const val = dir === 'pod' ? normalCdf(z) : 1 - normalCdf(z);
      return {
        prompt: `Náhodná veličina má **standardní normální rozdělení** $Z \\sim N(0;1)$.\nUrči $P(Z ${dir === 'pod' ? '<' : '>'} ${fmt(z)})$. (na 4 des. místa)`,
        answer: { type: 'number', value: val, decimals: 4 },
        answerLabel: 'P =',
        hints: [
          'Distribuční funkce $\\Phi(z)$ udává pravděpodobnost **nalevo** od $z$.',
          dir === 'pod' ? `Hledáš přímo $\\Phi(${fmt(z)})$.` : `$P(Z > z) = 1 - \\Phi(z)$, protože celá plocha pod křivkou je 1.`,
          z < 0 ? 'Pro záporné $z$ využij souměrnost: $\\Phi(-z) = 1 - \\Phi(z)$.' : 'Křivka je souměrná kolem nuly.',
        ],
        solution: [
          `$\\Phi(${fmt(z)}) = ${fmt(normalCdf(z), 4)}$`,
          dir === 'pod' ? `$P = ${fmt(val, 4)}$` : `$P = 1 - ${fmt(normalCdf(z), 4)} = ${fmt(val, 4)}$`,
        ],
        viz: dir === 'pod' ? bell(-4, z) : bell(z, 4),
      };
    }
    if (level === 2) {
      const mu = rng.int(20, 180), sigma = rng.int(3, 25);
      const x = mu + Math.round(rng.int(-22, 22) / 10 * sigma);
      const z = (x - mu) / sigma;
      return {
        prompt: `Výška zákazníků má normální rozdělení se **střední hodnotou ${mu}** a **směrodatnou odchylkou ${sigma}**.\nJaká je pravděpodobnost, že náhodně vybraná hodnota bude **menší než ${x}**? (na 4 des. místa)`,
        answer: { type: 'number', value: normalCdf(z), decimals: 4 },
        answerLabel: 'P =',
        hints: [
          'Nejdřív převeď na z-skóre: $z = \\frac{x - \\mu}{\\sigma}$.',
          `$z = \\frac{${x} - ${mu}}{${sigma}} = ${fmt(z, 4)}$`,
          'Pak už jen $\\Phi(z)$.',
        ],
        solution: [
          `$z = \\frac{${x} - ${mu}}{${sigma}} = ${fmt(z, 4)}$`,
          `$P(X < ${x}) = \\Phi(${fmt(z, 4)}) = ${fmt(normalCdf(z), 4)}$`,
          `Slovy: zhruba ${fmt(normalCdf(z) * 100, 1)} % hodnot leží pod ${x}.`,
        ],
        viz: bell(mu - 4 * sigma, x, mu, sigma),
      };
    }
    if (level === 3) {
      const mu = rng.int(40, 160), sigma = rng.int(4, 20);
      const a = mu - rng.int(5, 20) * sigma / 10;
      const bb = mu + rng.int(5, 20) * sigma / 10;
      const za = (a - mu) / sigma, zb = (bb - mu) / sigma;
      const val = normalCdf(zb) - normalCdf(za);
      return {
        prompt: `$X \\sim N(${mu};\\ ${sigma}^2)$. Urči $P(${fmt(a)} < X < ${fmt(bb)})$. (na 4 des. místa)`,
        answer: { type: 'number', value: val, decimals: 4 },
        answerLabel: 'P =',
        hints: [
          'Pravděpodobnost mezi dvěma body = rozdíl distribučních funkcí.',
          `$z_1 = ${fmt(za, 4)}$, $z_2 = ${fmt(zb, 4)}$`,
          `$P = \\Phi(z_2) - \\Phi(z_1)$`,
        ],
        solution: [
          `$z_1 = \\frac{${fmt(a)} - ${mu}}{${sigma}} = ${fmt(za, 4)},\\quad z_2 = ${fmt(zb, 4)}$`,
          `$P = ${fmt(normalCdf(zb), 4)} - ${fmt(normalCdf(za), 4)} = ${fmt(val, 4)}$`,
        ],
        viz: bell(a, bb, mu, sigma),
      };
    }
    // level 4 – obrácená úloha: hledáme hodnotu k danému percentilu
    const mu = rng.int(50, 400), sigma = rng.int(5, 40);
    const p = rng.pick([0.05, 0.1, 0.25, 0.75, 0.9, 0.95, 0.99]);
    const z = normalInv(p);
    const x = mu + z * sigma;
    return {
      prompt: `$X \\sim N(${mu};\\ ${sigma}^2)$.\nNajdi hodnotu $x$, pod kterou leží **${fmt(p * 100)} %** všech hodnot (${fmt(p * 100)}. percentil). (na 3 des. místa)`,
      answer: { type: 'number', value: x, decimals: 3 },
      answerLabel: 'x =',
      hints: [
        'Tentokrát jdeš obráceně: z pravděpodobnosti hledáš hodnotu.',
        `Najdi $z$, pro které $\\Phi(z) = ${fmt(p)}$ → $z = ${fmt(z, 4)}$.`,
        `Pak $x = \\mu + z\\sigma$.`,
      ],
      solution: [
        `$\\Phi(z) = ${fmt(p)} \\Rightarrow z = ${fmt(z, 4)}$`,
        `$x = ${mu} + ${fmt(z, 4)} \\cdot ${sigma} = ${fmt(x, 3)}$`,
      ],
      viz: bell(mu - 4 * sigma, x, mu, sigma),
    };
  },
};
