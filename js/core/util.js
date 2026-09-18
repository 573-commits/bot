// Pomocné funkce: náhoda, čísla, zlomky, formátování.

/** Seedovatelný generátor (mulberry32) – stejný seed = stejná úloha. */
export function makeRng(seed = Date.now()) {
  let a = seed >>> 0;
  const rng = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // pohodlné metody
  rng.int = (min, max) => Math.floor(rng() * (max - min + 1)) + min;
  rng.pick = (arr) => arr[Math.floor(rng() * arr.length)];
  rng.shuffle = (arr) => {
    const a2 = arr.slice();
    for (let i = a2.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a2[i], a2[j]] = [a2[j], a2[i]];
    }
    return a2;
  };
  /** Nenulové celé číslo z intervalu. */
  rng.nz = (min, max) => {
    let v = 0;
    while (v === 0) v = rng.int(min, max);
    return v;
  };
  /** Náhodné znaménko. */
  rng.sign = () => (rng() < 0.5 ? -1 : 1);
  /** Vybere n různých prvků. */
  rng.sample = (arr, n) => rng.shuffle(arr).slice(0, n);
  return rng;
}

export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; };
export const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
export const factorial = (n) => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
export const nCr = (n, k) => { if (k < 0 || k > n) return 0; let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - i + 1)) / i; return Math.round(r); };
export const nPr = (n, k) => { let r = 1; for (let i = 0; i < k; i++) r *= (n - i); return r; };

/** Zaokrouhlení na daný počet desetinných míst (vrací číslo). */
export const round = (x, d = 2) => Math.round((x + Number.EPSILON) * 10 ** d) / 10 ** d;

/** Číslo pro zobrazení – ořízne plovoucí smetí, česká desetinná čárka volitelně. */
export function fmt(x, d = 4) {
  if (!isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
  const r = round(x, d);
  if (Object.is(r, -0)) return '0';
  return String(r);
}

/** Zlomek v základním tvaru jako [čitatel, jmenovatel]. */
export function simplify(num, den) {
  if (den < 0) { num = -num; den = -den; }
  const g = gcd(num, den);
  return [num / g, den / g];
}

/** LaTeX zlomek, celé číslo zkrátí. */
export function fracTex(num, den) {
  const [n, d] = simplify(num, den);
  if (d === 1) return String(n);
  return n < 0 ? `-\\frac{${-n}}{${d}}` : `\\frac{${n}}{${d}}`;
}

/** "+3" / "-3" pro skládání výrazů. */
export const sgn = (x, opts = {}) => {
  const s = x < 0 ? '-' : '+';
  const a = Math.abs(x);
  if (opts.hideOne && a === 1) return s;
  return s + fmt(a);
};

/** Koeficient před proměnnou: 1x -> x, -1x -> -x, 0x -> ''. */
export function coef(c, varName = 'x') {
  if (c === 0) return '';
  if (c === 1) return varName;
  if (c === -1) return '-' + varName;
  return fmt(c) + varName;
}

/** Sestaví polynom z pole koeficientů [a_n, ..., a_1, a_0]. */
export function polyTex(coefs, v = 'x') {
  const n = coefs.length - 1;
  let out = '';
  coefs.forEach((c, i) => {
    const p = n - i;
    if (c === 0) return;
    const abs = Math.abs(c);
    let term = '';
    if (p === 0) term = fmt(abs);
    else {
      term = (abs === 1 ? '' : fmt(abs)) + v + (p === 1 ? '' : `^{${p}}`);
    }
    if (out === '') out += (c < 0 ? '-' : '') + term;
    else out += (c < 0 ? ' - ' : ' + ') + term;
  });
  return out === '' ? '0' : out;
}

/** Seznam čísel -> text "1, 2, 3". */
export const listTex = (arr, d = 4) => arr.map((x) => fmt(x, d)).join(';\\ ');

/** Je číslo (skoro) celé? */
export const isInt = (x, eps = 1e-9) => Math.abs(x - Math.round(x)) < eps;

/** Průměr, medián, rozptyl. */
export const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
export function median(a) {
  const s = a.slice().sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
export const variance = (a, sample = false) => {
  const m = mean(a);
  return a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - (sample ? 1 : 0));
};
export const stdev = (a, sample = false) => Math.sqrt(variance(a, sample));

/** Klasické datum v češtině. */
export function czDate(ts) {
  const d = new Date(ts);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/* ---------- zápis intervalů ---------- */

/** Přijatelné podoby zápisu jednoho intervalu, ať uživatel nemusí hádat notaci. */
export function intervalVariants(lo, hi, openL, openR) {
  const L = isFinite(lo) ? String(round(lo, 6)) : '-inf';
  const R = isFinite(hi) ? String(round(hi, 6)) : 'inf';
  const ls = isFinite(lo) ? (openL ? ['('] : ['<', '⟨', '[']) : ['('];
  const rs = isFinite(hi) ? (openR ? [')'] : ['>', '⟩', ']']) : [')'];
  const out = [];
  for (const a of ls) for (const b of rs) for (const sep of [';', ',']) out.push(`${a}${L}${sep}${R}${b}`);
  return out;
}

/** Totéž pro sjednocení dvou intervalů typu (-inf;a) u (b;inf). */
export function unionVariants(x1, x2, open) {
  const left = intervalVariants(-Infinity, x1, true, open);
  const right = intervalVariants(x2, Infinity, open, true);
  const out = [];
  for (const l of left) for (const r of right) for (const u of ['u', '∪', 'v']) out.push(`${l}${u}${r}`);
  return out;
}

/* ---------- normální rozdělení ---------- */

/** Hustota standardního normálního rozdělení. */
export const normalPdf = (z) => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);

/**
 * Distribuční funkce standardního normálního rozdělení, tedy P(Z < z).
 * Aproximace Zelen–Severo (Abramowitz & Stegun 26.2.17), přesnost ~7,5e-8 –
 * bohatě stačí na úlohy zaokrouhlované na čtyři desetinná místa.
 */
export function normalCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = normalPdf(z);
  const p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - p : p;
}

/** Kvantil standardního normálního rozdělení (inverze k normalCdf). */
export function normalInv(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  let lo = -9, hi = 9;
  for (let i = 0; i < 90; i++) {
    const mid = (lo + hi) / 2;
    if (normalCdf(mid) < p) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Pravděpodobnost k úspěchů z n pokusů (binomické rozdělení). */
export const binomPmf = (n, k, p) => nCr(n, k) * p ** k * (1 - p) ** (n - k);
/** P(X <= k) pro binomické rozdělení. */
export function binomCdf(n, k, p) {
  let s = 0;
  for (let i = 0; i <= k; i++) s += binomPmf(n, i, p);
  return s;
}
