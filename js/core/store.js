// Ukládání postupu do localStorage. Vše je jeden JSON objekt -> snadný export/import.

const KEY = 'mathgym.v1';
const MAX_HISTORY = 400;

const blankTopic = () => ({
  level: 1,
  attempts: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  wrongStreak: 0,
  recent: [],        // posledních 20 výsledků (1/0)
  byLevel: {},       // { "1": {a, c} }
  totalTimeMs: 0,
  hintsUsed: 0,
  lastPracticed: 0,
  levelChangedAt: 0,
});

const blank = () => ({
  version: 1,
  createdAt: Date.now(),
  topics: {},
  history: [],       // { ts, topic, level, ok, ms, hints }
  daily: {},         // { "2026-09-18": { solved, correct, ms } }
  settings: { theme: 'auto', sound: false, adaptive: true, selected: [] },
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw);
    return { ...blank(), ...parsed, settings: { ...blank().settings, ...(parsed.settings || {}) } };
  } catch { return blank(); }
}

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('save failed', e); }
  }, 120);
}

export const getState = () => state;
export const getSettings = () => state.settings;
export function setSetting(k, v) { state.settings[k] = v; save(); }

export function topicStats(id) {
  if (!state.topics[id]) { state.topics[id] = blankTopic(); }
  return state.topics[id];
}

const todayKey = (ts = Date.now()) => new Date(ts).toISOString().slice(0, 10);

/** Zapíše výsledek jednoho pokusu. */
export function recordAttempt({ topic, level, ok, ms = 0, hints = 0 }) {
  const t = topicStats(topic);
  t.attempts++;
  t.totalTimeMs += ms;
  t.hintsUsed += hints;
  t.lastPracticed = Date.now();
  if (ok) {
    t.correct++;
    t.streak++;
    t.wrongStreak = 0;
    t.bestStreak = Math.max(t.bestStreak, t.streak);
  } else {
    t.streak = 0;
    t.wrongStreak++;
  }
  t.recent.push(ok ? 1 : 0);
  if (t.recent.length > 20) t.recent.shift();
  const bl = (t.byLevel[level] ||= { a: 0, c: 0 });
  bl.a++; if (ok) bl.c++;

  state.history.push({ ts: Date.now(), topic, level, ok: ok ? 1 : 0, ms, hints });
  if (state.history.length > MAX_HISTORY) state.history.splice(0, state.history.length - MAX_HISTORY);

  const d = (state.daily[todayKey()] ||= { solved: 0, correct: 0, ms: 0 });
  d.solved++; if (ok) d.correct++; d.ms += ms;
  save();
  return t;
}

export function setLevel(topic, level) {
  const t = topicStats(topic);
  if (t.level !== level) { t.level = level; t.levelChangedAt = Date.now(); save(); }
}

export function resetTopic(id) { state.topics[id] = blankTopic(); save(); }
export function resetAll() { state = blank(); save(); }

export function exportJson() { return JSON.stringify(state, null, 2); }
export function importJson(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || !('topics' in parsed)) throw new Error('Tohle nevypadá jako záloha Matematické posilovny.');
  state = { ...blank(), ...parsed, settings: { ...blank().settings, ...(parsed.settings || {}) } };
  save();
}

/** Série dní po sobě, kdy se cvičilo. */
export function streakDays() {
  let n = 0;
  for (let i = 0; ; i++) {
    const k = todayKey(Date.now() - i * 864e5);
    if (state.daily[k]?.solved) n++;
    else if (i > 0) break; // dnešek ještě nemusí být splněný
  }
  return n;
}

export const dailyStats = () => state.daily;
export const todayStats = () => state.daily[todayKey()] || { solved: 0, correct: 0, ms: 0 };
