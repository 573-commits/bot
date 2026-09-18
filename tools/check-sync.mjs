// Kontrola slučování postupu (na tom stojí synchronizace mezi zařízeními).
// Spusť: node tools/check-sync.mjs
const mem = {};
globalThis.localStorage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; }, removeItem: (k) => { delete mem[k]; } };

const store = await import('../js/core/store.js');
const { replayTopic } = await import('../js/core/adaptive.js');

let fails = 0;
const ok = (cond, label, detail = '') => {
  console.log(`${cond ? '✓' : '✗'} ${label}${cond ? '' : '  → ' + detail}`);
  if (!cond) fails++;
};
const same = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);

const events = (dev, topic, n, t0, okAt) => Array.from({ length: n }, (_, i) => ({
  id: `${dev}-${i}`, ts: t0 + i * 60000, topic, level: 1, ok: okAt(i), ms: 5000, hints: 0,
}));
const device = (id, evs, settingsAt = 0, settings = {}) => ({
  version: 2, createdAt: 1000, deviceId: id, events: evs, legacy: {},
  settings: { theme: 'auto', selected: [], ...settings }, settingsUpdatedAt: settingsAt,
});

const T0 = Date.UTC(2026, 0, 1);
const shared = events('spolecne', 'derivace', 6, T0, () => true);           // po dřívější synchronizaci
const pc = device('pc', [...shared, ...events('pc', 'derivace', 5, T0 + 1e7, (i) => i % 2 === 0)], 500, { theme: 'dark' });
const mobil = device('mob', [...shared, ...events('mob', 'derivace', 4, T0 + 2e7, () => true)], 900, { theme: 'light' });

const m1 = store.mergeStates(pc, mobil);
const m2 = store.mergeStates(mobil, pc);

same(m1.events.length, 15, 'sjednocení bez duplicit (11 + 10 se 6 společnými = 15)');
same(new Set(m1.events.map((e) => e.id)).size, 15, 'žádná duplicitní id');
ok(m1.events.every((e, i, a) => i === 0 || a[i - 1].ts <= e.ts), 'seřazeno podle času');

const s1 = replayTopic(m1.events, 5), s2 = replayTopic(m2.events, 5);
same([s1.level, s1.attempts, s1.correct], [s2.level, s2.attempts, s2.correct], 'na pořadí slučování nezáleží');
same([s1.attempts, s1.correct], [15, 13], 'součty odpovídají ručnímu výpočtu');

same(store.mergeStates(m1, mobil).events.length, 15, 'opakované sloučení nic nepřidá (idempotence)');
same(store.mergeStates(store.mergeStates(m1, pc), mobil).events.length, 15, 'trojí sloučení taky');

same(m1.settings.theme, 'light', 'novější nastavení vyhrává');
same(m2.settings.theme, 'light', 'a to i při obráceném pořadí');
same(m1.settingsUpdatedAt, 900, 'razítko nastavení je maximum');

store.resetAll();
for (let i = 0; i < 4; i++) store.recordAttempt({ topic: 'zlomky', level: 1, ok: true, ms: 3000 });
const local = store.eventCount();
const r = store.mergeIn(mobil);
same(r.total, local + mobil.events.length, 'mergeIn přidá jen nové záznamy');
same(store.mergeIn(mobil).added, 0, 'druhé mergeIn už nepřidá nic');
same(store.topicStats('zlomky').attempts, 4, 'statistiky tématu po sloučení sedí');

const dump = store.exportJson();
ok(!/"token"/.test(dump), 'záloha neobsahuje přihlašovací token');
store.resetAll();
same(store.eventCount(), 0, 'reset vyprázdní log');
store.importJson(dump);
same(store.eventCount(), 14, 'import zálohu obnoví');

// migrace ze staré verze dat
delete mem['mathgym.v2'];
mem['mathgym.v1'] = JSON.stringify({
  version: 1, createdAt: 1, settings: { theme: 'dark', selected: ['zlomky'] },
  topics: { zlomky: { level: 3, attempts: 10, correct: 7, bestStreak: 4, totalTimeMs: 50000, hintsUsed: 2, recent: [], byLevel: {} } },
  history: Array.from({ length: 6 }, (_, i) => ({ ts: T0 + i * 1000, topic: 'zlomky', level: 2, ok: i < 4 ? 1 : 0, ms: 4000, hints: 0 })),
  daily: {},
});
const fresh = await import('../js/core/store.js?migrace');
same(fresh.topicStats('zlomky').attempts, 10, 'migrace z v1 zachová počet pokusů');
same(fresh.topicStats('zlomky').correct, 7, 'migrace z v1 zachová správné odpovědi');
same(fresh.getSettings().theme, 'dark', 'migrace z v1 přenese nastavení');

console.log(`\nProblémů: ${fails}`);
process.exit(fails ? 1 : 0);
