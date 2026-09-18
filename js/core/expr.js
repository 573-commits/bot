// Malý bezpečný parser matematických výrazů.
// Umí: + - * / ^ ( ), desetinnou tečku i čárku, sqrt, abs, ln, log, exp,
// sin, cos, tan, pi, e, zlomky "3/4", implicitní násobení "2pi", "3(x)".

const FUNCS = {
  sqrt: Math.sqrt, abs: Math.abs, ln: Math.log, log: Math.log10,
  log2: Math.log2, exp: Math.exp, sin: Math.sin, cos: Math.cos, tan: Math.tan,
  asin: Math.asin, acos: Math.acos, atan: Math.atan, floor: Math.floor,
  ceil: Math.ceil, round: Math.round,
};
const CONSTS = { pi: Math.PI, π: Math.PI, e: Math.E, inf: Infinity, nekonecno: Infinity };

function tokenize(src) {
  const s = src.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/,(\d)/g, '.$1')    // desetinná čárka
    .replace(/[×·]/g, '*')
    .replace(/[÷:]/g, '/')
    .replace(/[–—−]/g, '-')
    .replace(/[{[]/g, '(')
    .replace(/[}\]]/g, ')')
    .replace(/√/g, 'sqrt')
    .replace(/∞/g, 'inf')
    .replace(/%/g, '');
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\d|\./.test(c)) {
      let j = i;
      while (j < s.length && /[\d.]/.test(s[j])) j++;
      out.push({ t: 'num', v: parseFloat(s.slice(i, j)) });
      i = j;
    } else if (/[a-zπ]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-z0-9π]/.test(s[j])) j++;
      out.push({ t: 'id', v: s.slice(i, j) });
      i = j;
    } else if ('+-*/^()'.includes(c)) {
      out.push({ t: c });
      i++;
    } else {
      throw new Error('Neznámý znak: ' + c);
    }
  }
  return out;
}

/** Vyhodnotí výraz. Vrací číslo, nebo NaN při chybě. */
export function evalExpr(src) {
  let toks;
  try { toks = tokenize(String(src)); } catch { return NaN; }
  if (!toks.length) return NaN;
  let p = 0;
  const peek = () => toks[p];
  const eat = (t) => (toks[p] && toks[p].t === t ? (p++, true) : false);

  function expr() {
    let v = term();
    for (;;) {
      if (eat('+')) v += term();
      else if (eat('-')) v -= term();
      else return v;
    }
  }
  function term() {
    let v = unary();
    for (;;) {
      if (eat('*')) v *= unary();
      else if (eat('/')) v /= unary();
      else if (peek() && (peek().t === 'num' || peek().t === 'id' || peek().t === '(')) {
        v *= unary(); // implicitní násobení: 2pi, 3(4)
      } else return v;
    }
  }
  function unary() {
    if (eat('-')) return -unary();
    if (eat('+')) return unary();
    return power();
  }
  function power() {
    const base = atom();
    if (eat('^')) return base ** unary();
    return base;
  }
  function atom() {
    const t = peek();
    if (!t) throw new Error('konec');
    if (t.t === 'num') { p++; return t.v; }
    if (t.t === '(') { p++; const v = expr(); if (!eat(')')) throw new Error(')'); return v; }
    if (t.t === 'id') {
      p++;
      if (FUNCS[t.v]) {
        let arg;
        if (eat('(')) { arg = expr(); if (!eat(')')) throw new Error(')'); }
        else arg = power();
        return FUNCS[t.v](arg);
      }
      if (t.v in CONSTS) return CONSTS[t.v];
      throw new Error('Neznámý symbol ' + t.v);
    }
    throw new Error('Neočekávaný token');
  }
  try {
    const v = expr();
    if (p !== toks.length) return NaN;
    return v;
  } catch { return NaN; }
}

/** Rozdělí odpověď na části podle ; , nebo "a". */
export function splitParts(s) {
  return String(s)
    .replace(/\ba\b/gi, ';')
    .split(/[;\n]+|,(?!\d)/)
    .map((x) => x.trim())
    .filter((x) => x.length);
}
