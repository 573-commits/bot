// Vyhodnocení odpovědi. Každá úloha nese `answer` = { type, value, ... }.
import { evalExpr, splitParts } from './expr.js';
import { fmt } from './util.js';

const near = (a, b, tol) => Math.abs(a - b) <= tol;

function tolFor(ans, expected) {
  if (ans.tol != null) return ans.tol;
  if (ans.decimals != null) return 0.5 * 10 ** -ans.decimals + 1e-9;
  // relativní tolerance, ať funguje i pro velká čísla
  return Math.max(1e-6, Math.abs(expected) * 1e-6);
}

function normText(s) {
  return String(s).toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[–—−]/g, '-')
    .replace(/[{[]/g, '(')
    .replace(/[}\]]/g, ')')
    .replace(/[×·]/g, '*')
    .replace(/∞/g, 'inf')
    .replace(/nekonečno|nekonecno/g, 'inf')
    .replace(/,/g, ';');
}

/**
 * @returns {{ok:boolean, message?:string}}
 */
export function check(input, ans) {
  const raw = String(input ?? '').trim();
  if (!raw) return { ok: false, message: 'Napiš odpověď.' };

  switch (ans.type) {
    case 'number': {
      const v = evalExpr(raw);
      if (Number.isNaN(v)) return { ok: false, message: 'Tomu nerozumím – zkus číslo, zlomek (3/4) nebo výraz (sqrt(2)/2).' };
      return { ok: near(v, ans.value, tolFor(ans, ans.value)) };
    }
    case 'integer': {
      const v = evalExpr(raw);
      return { ok: Number.isFinite(v) && near(v, ans.value, 1e-9) };
    }
    case 'numberSet': { // na pořadí nezáleží
      const parts = splitParts(raw).map(evalExpr);
      if (parts.some(Number.isNaN)) return { ok: false, message: 'Odděl hodnoty středníkem, např. 2; 3' };
      const exp = ans.value.slice();
      if (parts.length !== exp.length) {
        return { ok: false, message: `Čekám ${exp.length} ${exp.length === 1 ? 'hodnotu' : exp.length < 5 ? 'hodnoty' : 'hodnot'}.` };
      }
      const used = new Array(exp.length).fill(false);
      for (const p of parts) {
        const i = exp.findIndex((e, k) => !used[k] && near(p, e, tolFor(ans, e)));
        if (i < 0) return { ok: false };
        used[i] = true;
      }
      return { ok: true };
    }
    case 'numberList': { // pořadí rozhoduje
      const parts = splitParts(raw).map(evalExpr);
      if (parts.length !== ans.value.length || parts.some(Number.isNaN)) {
        return { ok: false, message: `Čekám ${ans.value.length} hodnot oddělených středníkem.` };
      }
      return { ok: parts.every((p, i) => near(p, ans.value[i], tolFor(ans, ans.value[i]))) };
    }
    case 'fraction': { // musí sedět hodnota; volitelně i základní tvar
      const v = evalExpr(raw);
      if (Number.isNaN(v)) return { ok: false, message: 'Zapiš zlomek jako a/b.' };
      return { ok: near(v, ans.value, 1e-9) };
    }
    case 'text': {
      const want = (Array.isArray(ans.value) ? ans.value : [ans.value]).map(normText);
      return { ok: want.includes(normText(raw)) };
    }
    case 'choice': {
      return { ok: normText(raw) === normText(ans.value) };
    }
    case 'custom':
      return ans.validate(raw);
    default:
      return { ok: false, message: 'Neznámý typ odpovědi.' };
  }
}

/** Hezký zápis správné odpovědi (LaTeX nebo text). */
export function answerTex(ans) {
  if (ans.display) return ans.display;
  switch (ans.type) {
    case 'number': case 'integer': case 'fraction': return fmt(ans.value, 6);
    case 'numberSet': case 'numberList': return ans.value.map((v) => fmt(v, 6)).join('; ');
    default: return Array.isArray(ans.value) ? ans.value[0] : String(ans.value);
  }
}
