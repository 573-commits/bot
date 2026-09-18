// Vykreslení zadání: mini-markdown + LaTeX přes KaTeX (pokud je načtené).

const escHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * Obalí vzorec posuvnou schránkou. Bez toho by jediná široká matice roztáhla
 * stránku a mobilní prohlížeč by kvůli ní oddálil celé rozhraní.
 */
const scroller = (html, display) => display
  ? `<div class="math-scroll math-block">${html}</div>`
  : `<span class="math-scroll">${html}</span>`;

function tex(src, display) {
  if (window.katex) {
    try {
      return scroller(window.katex.renderToString(src, { displayMode: display, throwOnError: false, output: 'html' }), display);
    } catch { /* spadneme na plain text */ }
  }
  const plain = src
    .replace(/\\begin\{[a-z]*\}(\{[^}]*\})?/g, '[ ')
    .replace(/\\end\{[a-z]*\}/g, ' ]')
    .replace(/\\hline/g, '')
    .replace(/\\\\/g, ' | ')
    .replace(/&/g, ', ')
    .replace(/\\frac\{(.*?)\}\{(.*?)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{(.*?)\}/g, 'odm($1)')
    .replace(/\\cdot/g, '*').replace(/\\infty/g, 'inf').replace(/\\pm/g, '+-')
    .replace(/\\le/g, '<=').replace(/\\ge/g, '>=').replace(/\\ne/g, '!=')
    .replace(/\\in/g, 'nalezi').replace(/\\cup/g, 'sjednoceni').replace(/\\cap/g, 'prunik')
    .replace(/\\setminus/g, 'bez').replace(/\\emptyset/g, 'prazdna')
    .replace(/\^\{(.*?)\}/g, '^$1').replace(/_\{(.*?)\}/g, '_$1')
    .replace(/[\\{}]/g, '');
  return scroller(`<span class="tex-fallback">${escHtml(plain)}</span>`, display);
}

const OPEN = '@@MATH', CLOSE = '@@';

/** Mini-markdown: **tučně**, *kurzíva*, `kód`, odřádkování, $inline$ a $$blok$$. */
export function md(src) {
  if (!src) return '';
  const chunks = [];
  // nejdřív vytáhneme matematiku, ať nám markdown nerozbije LaTeX
  let s = String(src).replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (_, blk, inl) => {
    chunks.push(blk != null ? tex(blk, true) : tex(inl, false));
    return `${OPEN}${chunks.length - 1}${CLOSE}`;
  });
  s = escHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\n]+?)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+?)`/g, '<code>$1</code>')
    .replace(/\n{2,}/g, '<br><br>')
    .replace(/\n/g, '<br>');
  return s.replace(/@@MATH(\d+)@@/g, (_, i) => chunks[+i]);
}

/** Načte KaTeX z CDN; bez sítě appka funguje dál, jen s textovým zápisem. */
export function loadKatex() {
  return new Promise((resolve) => {
    if (window.katex) return resolve(true);
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
    document.head.appendChild(css);
    const js = document.createElement('script');
    js.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
    js.onload = () => resolve(true);
    js.onerror = () => resolve(false);
    document.head.appendChild(js);
  });
}
