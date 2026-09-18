// Vizualizace -> inline SVG. Barvy jdou přes CSS proměnné, takže sedí i v tmavém režimu.

const W = 460, H = 320;
const PAL = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];
let uid = 0;
const esc = (s) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
const svgWrap = (inner, w = W, h = H) =>
  `<svg class="viz" viewBox="0 0 ${w} ${h}" role="img" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;

/** Hezké dělení osy. */
function niceStep(range) {
  const raw = range / 8;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
}
const fmtTick = (v) => (Math.abs(v) < 1e-9 ? '0' : String(Math.round(v * 1e6) / 1e6));

/* ---------- kartézský graf ---------- */
function cartesian(spec) {
  const pad = { l: 42, r: 16, t: 16, b: 34 };
  let [x0, x1] = spec.xRange || [-6, 6];
  let [y0, y1] = spec.yRange || autoY(spec, x0, x1);
  if (!isFinite(y0) || !isFinite(y1) || y1 - y0 < 1e-6) { y0 = -6; y1 = 6; }
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const X = (x) => pad.l + ((x - x0) / (x1 - x0)) * iw;
  const Y = (y) => pad.t + ih - ((y - y0) / (y1 - y0)) * ih;
  const id = `clip${++uid}`;
  let s = `<rect x="0" y="0" width="${W}" height="${H}" rx="18" class="viz-bg"/>`
    + `<defs><clipPath id="${id}"><rect x="${pad.l - 2}" y="${pad.t - 2}" width="${iw + 4}" height="${ih + 4}"/></clipPath></defs>`;

  // mřížka + popisky
  const sx = niceStep(x1 - x0), sy = niceStep(y1 - y0);
  for (let v = Math.ceil(x0 / sx) * sx; v <= x1 + 1e-9; v += sx) {
    s += `<line x1="${X(v)}" y1="${pad.t}" x2="${X(v)}" y2="${H - pad.b}" class="viz-grid"/>`;
    if (Math.abs(v) > 1e-9) s += `<text x="${X(v)}" y="${Math.min(H - pad.b + 15, Y(0) + 15)}" class="viz-tick" text-anchor="middle">${fmtTick(v)}</text>`;
  }
  for (let v = Math.ceil(y0 / sy) * sy; v <= y1 + 1e-9; v += sy) {
    s += `<line x1="${pad.l}" y1="${Y(v)}" x2="${W - pad.r}" y2="${Y(v)}" class="viz-grid"/>`;
    if (Math.abs(v) > 1e-9) s += `<text x="${pad.l - 6}" y="${Y(v) + 4}" class="viz-tick" text-anchor="end">${fmtTick(v)}</text>`;
  }
  // osy
  const ax = Math.max(pad.t, Math.min(H - pad.b, Y(0)));
  const ay = Math.max(pad.l, Math.min(W - pad.r, X(0)));
  s += `<line x1="${pad.l}" y1="${ax}" x2="${W - pad.r}" y2="${ax}" class="viz-axis"/>`;
  s += `<line x1="${ay}" y1="${pad.t}" x2="${ay}" y2="${H - pad.b}" class="viz-axis"/>`;
  s += `<text x="${W - pad.r}" y="${ax - 8}" class="viz-lab" text-anchor="end">${esc(spec.xLabel || 'x')}</text>`;
  s += `<text x="${ay + 8}" y="${pad.t + 12}" class="viz-lab">${esc(spec.yLabel || 'y')}</text>`;

  // plocha pod křivkou (integrály)
  if (spec.area) {
    const { f, g, from, to } = spec.area;
    const N = 160; let d = '';
    for (let i = 0; i <= N; i++) { const x = from + ((to - from) * i) / N; d += `${i ? 'L' : 'M'}${X(x)},${Y(f(x))} `; }
    for (let i = N; i >= 0; i--) { const x = from + ((to - from) * i) / N; d += `L${X(x)},${Y(g ? g(x) : 0)} `; }
    s += `<path d="${d}Z" class="viz-area"/>`;
  }

  s += `<g clip-path="url(#${id})">`;

  // vyšrafovaná oblast (množina přípustných řešení u lineárního programování)
  if (spec.polygon?.length) {
    const pts = spec.polygon.map((p) => `${X(p.x)},${Y(p.y)}`).join(' ');
    s += `<polygon points="${pts}" class="viz-area" stroke="var(--c3)" stroke-width="2.5" stroke-linejoin="round"/>`;
  }

  // svislé / vodorovné čáry
  (spec.vlines || []).forEach((v) => {
    const x = typeof v === 'number' ? v : v.x;
    s += `<line x1="${X(x)}" y1="${pad.t}" x2="${X(x)}" y2="${H - pad.b}" class="viz-guide"/>`;
    if (v.label) s += `<text x="${X(x) + 4}" y="${pad.t + 12}" class="viz-lab">${esc(v.label)}</text>`;
  });
  (spec.hlines || []).forEach((v) => {
    const y = typeof v === 'number' ? v : v.y;
    s += `<line x1="${pad.l}" y1="${Y(y)}" x2="${W - pad.r}" y2="${Y(y)}" class="viz-guide"/>`;
    if (v.label) s += `<text x="${W - pad.r - 4}" y="${Y(y) - 5}" class="viz-lab" text-anchor="end">${esc(v.label)}</text>`;
  });

  // funkce
  (spec.fns || []).forEach((fn, k) => {
    const f = fn.f || fn;
    const color = fn.color || PAL[k % PAL.length];
    const N = 400;
    let d = '', pen = false;
    for (let i = 0; i <= N; i++) {
      const x = x0 + ((x1 - x0) * i) / N;
      let y;
      try { y = f(x); } catch { y = NaN; }
      if (!isFinite(y) || y < y0 - (y1 - y0) * 3 || y > y1 + (y1 - y0) * 3) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'}${X(x).toFixed(2)},${Y(y).toFixed(2)} `;
      pen = true;
    }
    s += `<path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" ${fn.dashed ? 'stroke-dasharray="7 6"' : ''}/>`;
    if (fn.label) s += `<text x="${W - pad.r - 6}" y="${pad.t + 16 + k * 17}" class="viz-lab" text-anchor="end" fill="${color}">${esc(fn.label)}</text>`;
  });

  // body
  (spec.points || []).forEach((p, k) => {
    const color = p.color || PAL[(k + 1) % PAL.length];
    s += `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="${p.r || 6}" fill="${p.hollow ? 'var(--surface)' : color}" stroke="${color}" stroke-width="3"/>`;
    if (p.label) s += `<text x="${X(p.x) + 10}" y="${Y(p.y) - 9}" class="viz-lab">${esc(p.label)}</text>`;
  });
  s += '</g>';
  return svgWrap(s);
}

function autoY(spec, x0, x1) {
  const vals = [];
  (spec.fns || []).forEach((fn) => {
    const f = fn.f || fn;
    for (let i = 0; i <= 80; i++) {
      const x = x0 + ((x1 - x0) * i) / 80;
      let y; try { y = f(x); } catch { y = NaN; }
      if (isFinite(y)) vals.push(y);
    }
  });
  (spec.points || []).forEach((p) => vals.push(p.y));
  (spec.polygon || []).forEach((p) => vals.push(p.y));
  if (!vals.length) return [-6, 6];
  vals.sort((a, b) => a - b);
  // ořízneme extrémy, ať jedna asymptota nerozbije měřítko
  const lo = vals[Math.floor(vals.length * 0.04)], hi = vals[Math.ceil(vals.length * 0.96) - 1];
  const m = Math.max(1, (hi - lo) * 0.15);
  return [Math.min(lo - m, -0.5), Math.max(hi + m, 0.5)];
}

/* ---------- číselná osa ---------- */
function numberline(spec) {
  const h = 130, pad = 34;
  const [a, b] = spec.range || [-10, 10];
  const X = (x) => pad + ((clampN(x, a, b) - a) / (b - a)) * (W - 2 * pad);
  const y = 74;
  let s = `<rect x="0" y="0" width="${W}" height="${h}" rx="18" class="viz-bg"/>`;
  s += `<line x1="${pad - 14}" y1="${y}" x2="${W - pad + 14}" y2="${y}" class="viz-axis"/>`;
  s += `<path d="M${W - pad + 14},${y} l-10,-5 l0,10 Z" class="viz-axis-fill"/>`;
  const st = niceStep(b - a);
  for (let v = Math.ceil(a / st) * st; v <= b + 1e-9; v += st) {
    s += `<line x1="${X(v)}" y1="${y - 6}" x2="${X(v)}" y2="${y + 6}" class="viz-axis"/>`;
    s += `<text x="${X(v)}" y="${y + 24}" class="viz-tick" text-anchor="middle">${fmtTick(v)}</text>`;
  }
  (spec.intervals || []).forEach((iv, k) => {
    const color = iv.color || PAL[k % PAL.length];
    const x1 = X(iv.from ?? a), x2 = X(iv.to ?? b);
    s += `<line x1="${x1}" y1="${y - 18}" x2="${x2}" y2="${y - 18}" stroke="${color}" stroke-width="9" stroke-linecap="round" opacity="0.85"/>`;
    if (isFinite(iv.from)) s += endpoint(X(iv.from), y - 18, color, iv.openL);
    if (isFinite(iv.to)) s += endpoint(X(iv.to), y - 18, color, iv.openR);
    if (iv.label) s += `<text x="${(x1 + x2) / 2}" y="${y - 32}" class="viz-lab" text-anchor="middle" fill="${color}">${esc(iv.label)}</text>`;
  });
  (spec.points || []).forEach((p, k) => {
    const color = p.color || PAL[(k + 2) % PAL.length];
    s += endpoint(X(p.x), y, color, p.open);
    if (p.label) s += `<text x="${X(p.x)}" y="${y - 16}" class="viz-lab" text-anchor="middle">${esc(p.label)}</text>`;
  });
  return svgWrap(s, W, h);
}
const clampN = (x, a, b) => Math.max(a, Math.min(b, x));
const endpoint = (x, y, color, open) =>
  `<circle cx="${x}" cy="${y}" r="7" fill="${open ? 'var(--surface)' : color}" stroke="${color}" stroke-width="3"/>`;

/* ---------- sloupcový graf ---------- */
function bars(spec) {
  const pad = { l: 40, r: 16, t: 20, b: 40 };
  const data = spec.data || [];
  const max = Math.max(...data.map((d) => d.value), ...(spec.lines || []).map((l) => l.value), 1);
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const bw = (iw / data.length) * 0.66;
  let s = `<rect x="0" y="0" width="${W}" height="${H}" rx="18" class="viz-bg"/>`;
  s += `<line x1="${pad.l}" y1="${H - pad.b}" x2="${W - pad.r}" y2="${H - pad.b}" class="viz-axis"/>`;
  data.forEach((d, i) => {
    const cx = pad.l + (iw / data.length) * (i + 0.5);
    const bh = (d.value / max) * ih;
    s += `<rect x="${cx - bw / 2}" y="${H - pad.b - bh}" width="${bw}" height="${Math.max(bh, 1)}" rx="8" fill="${d.color || PAL[i % PAL.length]}" opacity="0.9"/>`;
    s += `<text x="${cx}" y="${H - pad.b + 17}" class="viz-tick" text-anchor="middle">${esc(d.label)}</text>`;
    if (spec.showValues !== false) s += `<text x="${cx}" y="${H - pad.b - bh - 7}" class="viz-lab" text-anchor="middle">${esc(fmtTick(d.value))}</text>`;
  });
  (spec.lines || []).forEach((l, k) => {
    const yy = H - pad.b - (l.value / max) * ih;
    s += `<line x1="${pad.l}" y1="${yy}" x2="${W - pad.r}" y2="${yy}" stroke="${l.color || 'var(--c4)'}" stroke-width="2.5" stroke-dasharray="7 6"/>`;
    if (l.label) s += `<text x="${W - pad.r - 4}" y="${yy - 6}" class="viz-lab" text-anchor="end">${esc(l.label)}</text>`;
  });
  return svgWrap(s);
}

/* ---------- bodový graf + regresní přímka ---------- */
function scatter(spec) {
  const pts = spec.points || [];
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const pad = 0.12;
  const xr = spec.xRange || padRange(Math.min(...xs), Math.max(...xs), pad);
  const yr = spec.yRange || padRange(Math.min(...ys), Math.max(...ys), pad);
  const fns = [];
  if (spec.line) { const { a, b } = spec.line; fns.push({ f: (x) => a * x + b, color: 'var(--c3)', label: spec.line.label }); }
  return cartesian({ ...spec, xRange: xr, yRange: yr, fns, points: pts.map((p) => ({ color: 'var(--c1)', ...p, r: 5 })) });
}
const padRange = (lo, hi, f) => { const d = Math.max(hi - lo, 1) * f; return [lo - d, hi + d]; };

/* ---------- Vennův diagram ---------- */
function venn(spec) {
  const h = 260, cy = 130, r = 78, cxA = 175, cxB = 285;
  const shade = spec.shade || '';
  let s = `<rect x="0" y="0" width="${W}" height="${h}" rx="18" class="viz-bg"/>`;
  s += `<defs><clipPath id="cA"><circle cx="${cxA}" cy="${cy}" r="${r}"/></clipPath>
        <clipPath id="cB"><circle cx="${cxB}" cy="${cy}" r="${r}"/></clipPath></defs>`;
  s += `<rect x="24" y="24" width="${W - 48}" height="${h - 48}" rx="14" class="viz-univ"/>`;
  s += `<text x="${W - 40}" y="44" class="viz-lab" text-anchor="end">U</text>`;
  const fillA = `<circle cx="${cxA}" cy="${cy}" r="${r}" fill="var(--c1)" opacity="0.55"/>`;
  const fillB = `<circle cx="${cxB}" cy="${cy}" r="${r}" fill="var(--c2)" opacity="0.55"/>`;
  if (shade.includes('∪')) s += fillA + fillB;
  else if (shade === 'A∩B') s += `<g clip-path="url(#cA)">${fillB}</g>`;
  else if (shade === 'A\\B') s += `<g>${fillA}</g><g clip-path="url(#cB)"><circle cx="${cxA}" cy="${cy}" r="${r}" fill="var(--surface)"/></g>`;
  else if (shade === 'B\\A') s += `<g>${fillB}</g><g clip-path="url(#cA)"><circle cx="${cxB}" cy="${cy}" r="${r}" fill="var(--surface)"/></g>`;
  else if (shade === 'A') s += fillA;
  else if (shade === 'B') s += fillB;
  s += `<circle cx="${cxA}" cy="${cy}" r="${r}" fill="none" stroke="var(--c1)" stroke-width="3"/>`;
  s += `<circle cx="${cxB}" cy="${cy}" r="${r}" fill="none" stroke="var(--c2)" stroke-width="3"/>`;
  s += `<text x="${cxA - 46}" y="${cy - 52}" class="viz-lab">${esc(spec.labelA || 'A')}</text>`;
  s += `<text x="${cxB + 40}" y="${cy - 52}" class="viz-lab">${esc(spec.labelB || 'B')}</text>`;
  (spec.texts || []).forEach((t) => { s += `<text x="${t.x}" y="${t.y}" class="viz-tick" text-anchor="middle">${esc(t.text)}</text>`; });
  return svgWrap(s, W, h);
}

/* ---------- jednotková kružnice ---------- */
function unitcircle(spec) {
  const h = 320, cx = 230, cy = 160, R = 110;
  const deg = spec.angle || 0, rad = (deg * Math.PI) / 180;
  const px = cx + R * Math.cos(rad), py = cy - R * Math.sin(rad);
  let s = `<rect x="0" y="0" width="${W}" height="${h}" rx="18" class="viz-bg"/>`;
  s += `<line x1="${cx - R - 34}" y1="${cy}" x2="${cx + R + 34}" y2="${cy}" class="viz-axis"/>`;
  s += `<line x1="${cx}" y1="${cy + R + 34}" x2="${cx}" y2="${cy - R - 34}" class="viz-axis"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--c1)" stroke-width="3"/>`;
  const sweep = `M${cx + 34},${cy} A34,34 0 ${Math.abs(deg) > 180 ? 1 : 0} ${deg > 0 ? 0 : 1} ${cx + 34 * Math.cos(rad)},${cy - 34 * Math.sin(rad)}`;
  s += `<path d="${sweep}" fill="none" stroke="var(--c4)" stroke-width="3"/>`;
  s += `<line x1="${cx}" y1="${cy}" x2="${px}" y2="${py}" stroke="var(--c3)" stroke-width="3"/>`;
  if (spec.showProjections !== false) {
    s += `<line x1="${px}" y1="${py}" x2="${px}" y2="${cy}" stroke="var(--c2)" stroke-width="2.5" stroke-dasharray="6 5"/>`;
    s += `<line x1="${px}" y1="${py}" x2="${cx}" y2="${py}" stroke="var(--c5)" stroke-width="2.5" stroke-dasharray="6 5"/>`;
    s += `<text x="${(px + cx) / 2}" y="${cy + 18}" class="viz-lab" text-anchor="middle" fill="var(--c5)">cos</text>`;
    s += `<text x="${px + 10}" y="${(py + cy) / 2}" class="viz-lab" fill="var(--c2)">sin</text>`;
  }
  s += `<circle cx="${px}" cy="${py}" r="6" fill="var(--c3)"/>`;
  s += `<text x="${cx + 44}" y="${cy - 10}" class="viz-lab" fill="var(--c4)">${esc(spec.angleLabel || deg + '°')}</text>`;
  return svgWrap(s, W, h);
}

/* ---------- pravoúhlý / obecný trojúhelník ---------- */
function triangle(spec) {
  const h = 260;
  const P = spec.vertices || [{ x: 60, y: 210 }, { x: 380, y: 210 }, { x: 150, y: 50 }];
  let s = `<rect x="0" y="0" width="${W}" height="${h}" rx="18" class="viz-bg"/>`;
  s += `<polygon points="${P.map((p) => `${p.x},${p.y}`).join(' ')}" fill="var(--c1)" opacity="0.35" stroke="var(--c1)" stroke-width="3" stroke-linejoin="round"/>`;
  (spec.labels || []).forEach((l) => { s += `<text x="${l.x}" y="${l.y}" class="viz-lab" text-anchor="middle">${esc(l.text)}</text>`; });
  if (spec.rightAngleAt != null) {
    const p = P[spec.rightAngleAt];
    s += `<rect x="${p.x}" y="${p.y - 20}" width="20" height="20" fill="none" stroke="var(--c3)" stroke-width="2.5"/>`;
  }
  return svgWrap(s, W, h);
}

const RENDERERS = { function: cartesian, cartesian, numberline, bars, scatter, venn, unitcircle, triangle };

/** @param {object} spec vizualizační předpis z úlohy */
export function renderViz(spec) {
  if (!spec) return '';
  if (spec.type === 'svg') return spec.svg;
  const r = RENDERERS[spec.type];
  if (!r) return '';
  try { return r(spec); } catch (e) { console.warn('viz', e); return ''; }
}
