// Úložiště postupu.
//
// Klíčová vlastnost: ukládá se **seznam událostí** (každý vyřešený příklad =
// jeden záznam s vlastním id), ne průběžně přepisovaná čísla. Statistiky
// i úroveň se z událostí dopočítávají.
//
// Díky tomu je sloučení dat ze dvou zařízení jen sjednocení množin podle id –
// je jedno, v jakém pořadí synchronizace proběhne, nic se nezdvojí a nic se
// neztratí. Právě na tom stojí synchronizace v sync.js.

import { TOPICS, byId } from '../topics/index.js';
import { replayTopic, emptyStats } from './adaptive.js';

const KEY = 'mathgym.v2';
const KEY_V1 = 'mathgym.v1';
const MAX_EVENTS = 20000;

const newDeviceId = () => Math.random().toString(36).slice(2, 10);

const blank = () => ({
  version: 2,
  createdAt: Date.now(),
  deviceId: newDeviceId(),
  events: [],                 // { id, ts, topic, level, ok, ms, hints }
  legacy: {},                 // agregáty přenesené ze starší verze dat
  settings: { theme: 'auto', selected: [] },
  settingsUpdatedAt: 0,
  sync: null,                 // { provider, token, gistId, lastSyncAt, lastPushedCount }
});

/* ============================== načtení ============================== */

let state = load();
let derived = null;           // cache odvozených statistik

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { console.warn('načtení dat selhalo', e); }
  try {
    const old = localStorage.getItem(KEY_V1);
    if (old) {
      const migrated = migrateV1(JSON.parse(old));
      localStorage.setItem(KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch (e) { console.warn('migrace dat selhala', e); }
  return blank();
}

function normalize(s) {
  const b = blank();
  const out = {
    ...b, ...s,
    settings: { ...b.settings, ...(s.settings || {}) },
    events: Array.isArray(s.events) ? s.events.filter((e) => e && e.id && e.topic) : [],
    legacy: s.legacy && typeof s.legacy === 'object' ? s.legacy : {},
  };
  out.deviceId = s.deviceId || newDeviceId();
  out.events.sort((a, b2) => a.ts - b2.ts);
  return out;
}

/**
 * Převod ze staré verze: záznamy z history se stanou událostmi, zbytek
 * (pokusy, které se do capovaného history nevešly) se uloží jako `legacy`,
 * aby o ně uživatel nepřišel.
 */
function migrateV1(old) {
  const s = blank();
  s.createdAt = old.createdAt || Date.now();
  s.settings = { ...s.settings, ...(old.settings || {}) };
  s.settingsUpdatedAt = Date.now();
  s.events = (old.history || []).map((h, i) => ({
    id: `v1-${s.deviceId}-${h.ts}-${i}`,
    ts: h.ts, topic: h.topic, level: h.level,
    ok: !!h.ok, ms: h.ms || 0, hints: h.hints || 0,
  })).sort((a, b) => a.ts - b.ts);

  const inLog = {};
  s.events.forEach((e) => { inLog[e.topic] = (inLog[e.topic] || 0) + 1; });
  for (const [id, t] of Object.entries(old.topics || {})) {
    const missing = (t.attempts || 0) - (inLog[id] || 0);
    if (missing > 0) {
      const logged = s.events.filter((e) => e.topic === id);
      const loggedCorrect = logged.filter((e) => e.ok).length;
      s.legacy[id] = {
        attempts: missing,
        correct: Math.max(0, (t.correct || 0) - loggedCorrect),
        totalTimeMs: Math.max(0, (t.totalTimeMs || 0) - logged.reduce((a, e) => a + (e.ms || 0), 0)),
        hintsUsed: Math.max(0, (t.hintsUsed || 0) - logged.reduce((a, e) => a + (e.hints || 0), 0)),
        bestStreak: t.bestStreak || 0,
        byLevel: {},
      };
    }
  }
  return s;
}

/* ============================== ukládání ============================== */

let saveTimer = null;
const listeners = new Set();
export const onChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

function touched({ silent = false } = {}) {
  derived = null;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persist, 120);
  if (!silent) listeners.forEach((fn) => { try { fn(state); } catch (e) { console.warn(e); } });
}

function persist() {
  if (state.events.length > MAX_EVENTS) {
    // Nemělo by nastat (20 000 příkladů je hodně), ale ať se nepřeteče úložiště:
    // nejstarší události složíme do agregátu a z logu je vypustíme.
    const drop = state.events.splice(0, state.events.length - MAX_EVENTS);
    for (const e of drop) {
      const L = (state.legacy[e.topic] ||= { attempts: 0, correct: 0, totalTimeMs: 0, hintsUsed: 0, bestStreak: 0, byLevel: {} });
      L.attempts++; if (e.ok) L.correct++;
      L.totalTimeMs += e.ms || 0; L.hintsUsed += e.hints || 0;
    }
  }
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { console.warn('uložení selhalo', e); }
}

/* ============================== odvozená data ============================== */

function compute() {
  const perTopic = {};
  const daily = {};
  const grouped = {};
  for (const ev of state.events) {
    (grouped[ev.topic] ||= []).push(ev);
    const day = new Date(ev.ts).toISOString().slice(0, 10);
    const d = (daily[day] ||= { solved: 0, correct: 0, ms: 0 });
    d.solved++; if (ev.ok) d.correct++; d.ms += ev.ms || 0;
  }
  const ids = new Set([...Object.keys(grouped), ...Object.keys(state.legacy)]);
  for (const id of ids) {
    const maxLevel = byId(id)?.levels ?? 5;
    perTopic[id] = replayTopic(grouped[id] || [], maxLevel, state.legacy[id]);
  }
  return { perTopic, daily };
}

const D = () => (derived ||= compute());

/** Statistiky tématu (odvozené). Vrací i pro téma, které se ještě nehrálo. */
export const topicStats = (id) => D().perTopic[id] || emptyStats();

export const getState = () => state;
export const getSettings = () => state.settings;

export function setSetting(k, v) {
  state.settings[k] = v;
  state.settingsUpdatedAt = Date.now();
  touched();
}

/* ============================== zápis pokusu ============================== */

/** Zapíše výsledek jednoho příkladu. Vrací úroveň před a po. */
export function recordAttempt({ topic, level, ok, ms = 0, hints = 0 }) {
  const before = topicStats(topic).level;
  state.events.push({
    id: `${state.deviceId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    topic, level, ok: !!ok, ms, hints,
  });
  touched();
  const after = topicStats(topic).level;
  return { before, after, changed: Math.sign(after - before) };
}

export function resetTopic(id) {
  state.events = state.events.filter((e) => e.topic !== id);
  delete state.legacy[id];
  touched();
}

export function resetAll() {
  const sync = state.sync;
  state = { ...blank(), deviceId: state.deviceId, sync };
  touched();
}

/* ============================== přehledy ============================== */

const todayKey = (ts = Date.now()) => new Date(ts).toISOString().slice(0, 10);
export const dailyStats = () => D().daily;
export const todayStats = () => D().daily[todayKey()] || { solved: 0, correct: 0, ms: 0 };

/** Série dní po sobě, kdy se cvičilo. */
export function streakDays() {
  const daily = D().daily;
  let n = 0;
  for (let i = 0; ; i++) {
    const k = todayKey(Date.now() - i * 864e5);
    if (daily[k]?.solved) n++;
    else if (i > 0) break;    // dnešek ještě nemusí být splněný
  }
  return n;
}

export function totals() {
  let attempts = 0, correct = 0, ms = 0;
  for (const id of TOPICS.map((t) => t.id)) {
    const s = topicStats(id);
    attempts += s.attempts; correct += s.correct; ms += s.totalTimeMs;
  }
  return { attempts, correct, ms };
}

/* ============================== slučování a přenos ============================== */

/**
 * Sloučí dva stavy. Události se sjednotí podle id (proto je sloučení
 * idempotentní – opakovaná synchronizace nic nezdvojí), nastavení vyhrává
 * to novější, `legacy` agregáty se berou po maximu.
 */
export function mergeStates(a, b) {
  if (!a) return b;
  if (!b) return a;
  const map = new Map();
  for (const ev of a.events || []) map.set(ev.id, ev);
  for (const ev of b.events || []) if (!map.has(ev.id)) map.set(ev.id, ev);
  const events = [...map.values()].sort((x, y) => x.ts - y.ts);

  const legacy = {};
  for (const id of new Set([...Object.keys(a.legacy || {}), ...Object.keys(b.legacy || {})])) {
    const la = a.legacy?.[id] || {}, lb = b.legacy?.[id] || {};
    legacy[id] = {
      attempts: Math.max(la.attempts || 0, lb.attempts || 0),
      correct: Math.max(la.correct || 0, lb.correct || 0),
      totalTimeMs: Math.max(la.totalTimeMs || 0, lb.totalTimeMs || 0),
      hintsUsed: Math.max(la.hintsUsed || 0, lb.hintsUsed || 0),
      bestStreak: Math.max(la.bestStreak || 0, lb.bestStreak || 0),
      byLevel: { ...(la.byLevel || {}), ...(lb.byLevel || {}) },
    };
  }

  const newer = (b.settingsUpdatedAt || 0) > (a.settingsUpdatedAt || 0) ? b : a;
  return {
    version: 2,
    createdAt: Math.min(a.createdAt || Date.now(), b.createdAt || Date.now()),
    deviceId: a.deviceId,
    events,
    legacy,
    settings: { ...blank().settings, ...(newer.settings || {}) },
    settingsUpdatedAt: Math.max(a.settingsUpdatedAt || 0, b.settingsUpdatedAt || 0),
    sync: a.sync,
  };
}

/** Sloučí příchozí stav (ze synchronizace nebo importu) do aktuálního. */
export function mergeIn(incoming) {
  const before = state.events.length;
  state = mergeStates(state, normalize(incoming));
  touched();
  return { added: state.events.length - before, total: state.events.length };
}

/** Data pro odeslání/zálohu – bez přihlašovacích údajů k synchronizaci. */
export function snapshot() {
  const { sync, ...rest } = state;
  return rest;
}

export const exportJson = () => JSON.stringify(snapshot(), null, 2);

export function importJson(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('Tohle není platná záloha.');
  if (parsed.version === 2 || Array.isArray(parsed.events)) return mergeIn(parsed);
  if (parsed.topics && parsed.history) return mergeIn(migrateV1(parsed));
  throw new Error('Tohle nevypadá jako záloha Matematické posilovny.');
}

/* ============================== nastavení synchronizace ============================== */

export const getSync = () => state.sync;
export function setSync(cfg) {
  state.sync = cfg ? { ...(state.sync || {}), ...cfg } : null;
  touched({ silent: true });
  persist();
}
export const eventCount = () => state.events.length;
