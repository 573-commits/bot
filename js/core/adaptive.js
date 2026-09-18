// Pravidla adaptivní obtížnosti a rozloženého opakování.
// Čistě funkční – nesahá na úložiště, aby se daly stejné rutiny pustit
// i nad daty z jiného zařízení.

import { clamp } from './util.js';

export const UP_STREAK = 3;     // tolik správných v řadě = posun nahoru
export const DOWN_STREAK = 2;   // tolik špatných v řadě = posun dolů
export const RECENT_WINDOW = 20;

/* ---------- rozložené opakování (varianta SM-2) ---------- */

export const SESSION_GAP_MS = 30 * 60 * 1000;  // delší pauza = nové sezení
export const START_EASE = 2.3;
export const MIN_EASE = 1.3;
export const MAX_EASE = 2.8;
export const MAX_INTERVAL_DAYS = 120;
export const DAY = 864e5;

/** Prázdný plán opakování. */
const emptyReview = () => ({
  ease: START_EASE,
  reps: 0,
  interval: 0,      // ve dnech
  dueAt: 0,
  lastReview: 0,
  sessions: 0,
  lastQuality: null,
});

/** Prázdné statistiky tématu. */
export const emptyStats = () => ({
  level: 1,
  attempts: 0,
  correct: 0,
  streak: 0,
  wrongStreak: 0,
  bestStreak: 0,
  recent: [],
  byLevel: {},
  totalTimeMs: 0,
  hintsUsed: 0,
  lastPracticed: 0,
  review: emptyReview(),
});

/**
 * Vyhodnotí jedno cvičební sezení a posune plán opakování.
 *
 * Známka 0–5 vychází z úspěšnosti v sezení, sníženě za použité nápovědy.
 * Váha `w` podle délky sezení zajistí, že jeden zběžně vyřešený příklad
 * plánem jen pohne, kdežto pořádné sezení ho posune naplno – jinak by
 * jediná šťastná trefa odsunula téma o měsíc.
 */
function applySession(review, ses) {
  const hintRate = ses.hints / ses.n;
  const acc = (ses.correct / ses.n) * (1 - 0.25 * Math.min(1, hintRate));
  const q = clamp(Math.round(acc * 5), 0, 5);
  const w = Math.min(1, ses.n / 4);

  if (q < 3) {
    review.reps = 0;
    review.interval = 1;                    // zítra znovu
  } else {
    review.reps++;
    if (review.reps === 1) review.interval = 1;
    else if (review.reps === 2) review.interval = 3;
    else {
      const growth = 1 + (review.ease - 1) * w;
      review.interval = Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.round(review.interval * growth)));
    }
  }
  const d = 5 - q;
  review.ease = clamp(review.ease + w * (0.1 - d * (0.08 + d * 0.02)), MIN_EASE, MAX_EASE);
  review.lastReview = ses.end;
  review.dueAt = ses.end + review.interval * DAY;
  review.sessions++;
  review.lastQuality = q;
}

/**
 * Přehraje záznamy jednoho tématu a spočítá z nich statistiky včetně úrovně
 * a termínu dalšího opakování.
 *
 * Protože je všechno **odvozené** (nic se neukládá jako stav), vyjde po
 * sloučení dat ze dvou zařízení stejný výsledek bez ohledu na to, kde se
 * cvičilo dřív.
 *
 * @param {Array} events záznamy jednoho tématu seřazené podle času
 * @param {number} maxLevel počet úrovní tématu
 * @param {object} [legacy] agregát ze starší verze dat (před event logem)
 */
export function replayTopic(events, maxLevel = 5, legacy = null) {
  const s = emptyStats();
  if (legacy) {
    s.attempts += legacy.attempts || 0;
    s.correct += legacy.correct || 0;
    s.totalTimeMs += legacy.totalTimeMs || 0;
    s.hintsUsed += legacy.hintsUsed || 0;
    s.bestStreak = legacy.bestStreak || 0;
    for (const [lv, v] of Object.entries(legacy.byLevel || {})) {
      s.byLevel[lv] = { a: v.a || 0, c: v.c || 0 };
    }
  }

  let ses = null;
  const closeSession = () => { if (ses?.n) applySession(s.review, ses); ses = null; };

  for (const ev of events) {
    if (ses && ev.ts - ses.end > SESSION_GAP_MS) closeSession();
    ses ||= { start: ev.ts, end: ev.ts, n: 0, correct: 0, hints: 0 };
    ses.end = ev.ts;
    ses.n++;
    if (ev.ok) ses.correct++;
    ses.hints += ev.hints || 0;

    s.attempts++;
    if (ev.ok) s.correct++;
    s.totalTimeMs += ev.ms || 0;
    s.hintsUsed += ev.hints || 0;
    s.lastPracticed = Math.max(s.lastPracticed, ev.ts);

    const bl = (s.byLevel[ev.level] ||= { a: 0, c: 0 });
    bl.a++; if (ev.ok) bl.c++;

    s.recent.push(ev.ok ? 1 : 0);
    if (s.recent.length > RECENT_WINDOW) s.recent.shift();

    if (ev.ok) {
      s.streak++;
      s.wrongStreak = 0;
      s.bestStreak = Math.max(s.bestStreak, s.streak);
      if (s.streak >= UP_STREAK && !ev.hints && s.level < maxLevel) {
        s.level++; s.streak = 0; s.wrongStreak = 0;
      }
    } else {
      s.streak = 0;
      s.wrongStreak++;
      if (s.wrongStreak >= DOWN_STREAK && s.level > 1) {
        s.level--; s.streak = 0; s.wrongStreak = 0;
      }
    }
  }
  closeSession();
  return s;
}

/**
 * Stav opakování tématu.
 * @returns {{state:'new'|'due'|'scheduled', due:boolean, days:number,
 *            overdueDays:number, dueAt:number, interval:number}}
 */
export function reviewStatus(stats, now = Date.now()) {
  const r = stats?.review;
  if (!r?.sessions) return { state: 'new', due: false, days: 0, overdueDays: 0, dueAt: 0, interval: 0 };
  const ms = r.dueAt - now;
  return {
    state: ms <= 0 ? 'due' : 'scheduled',
    due: ms <= 0,
    days: Math.ceil(ms / DAY),
    overdueDays: Math.max(0, Math.floor(-ms / DAY)),
    dueAt: r.dueAt,
    interval: r.interval,
  };
}

/** Slovní popis termínu opakování. */
export function reviewLabel(st) {
  if (st.state === 'new') return 'nezačato';
  if (st.due) return st.overdueDays >= 1 ? `po termínu o ${st.overdueDays} d` : 'dnes na řadě';
  if (st.days <= 1) return 'opakovat zítra';
  if (st.days < 7) return `opakovat za ${st.days} dny`;
  if (st.days < 30) return `opakovat za ${Math.round(st.days / 7)} týdny`;
  return `opakovat za ${Math.round(st.days / 30)} měsíce`;
}

/** Témata, která jsou dnes na řadě – nejvíc zpožděná první. */
export function dueTopics(topics, statsOf, now = Date.now()) {
  return topics
    .map((t) => ({ topic: t, st: reviewStatus(statsOf(t), now) }))
    .filter((x) => x.st.due)
    .sort((a, b) => b.st.overdueDays - a.st.overdueDays || a.st.dueAt - b.st.dueAt);
}

/** Losování z témat k opakování – čím delší zpoždění, tím větší šance. */
export function pickDue(topics, statsOf, rng, now = Date.now()) {
  const due = dueTopics(topics, statsOf, now);
  if (!due.length) return null;
  const weights = due.map((d) => 1 + Math.min(14, d.st.overdueDays));
  const total = weights.reduce((s, x) => s + x, 0);
  let r = rng() * total;
  for (let i = 0; i < due.length; i++) { r -= weights[i]; if (r <= 0) return due[i].topic; }
  return due[due.length - 1].topic;
}

/** Kolik opakování připadne na jednotlivé dny dopředu. */
export function reviewForecast(topics, statsOf, days = 14, now = Date.now()) {
  const out = Array.from({ length: days }, (_, i) => ({ day: i, count: 0 }));
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  for (const t of topics) {
    const st = reviewStatus(statsOf(t), now);
    if (st.state === 'new') continue;
    const idx = st.due ? 0 : Math.floor((new Date(st.dueAt).setHours(0, 0, 0, 0) - startOfToday) / DAY);
    if (idx >= 0 && idx < days) out[idx].count++;
  }
  return out;
}

/* ---------- úspěšnost a zvládnutí ---------- */

/** Úspěšnost z posledních pokusů (0–1), null když ještě nic. */
export function recentAccuracy(stats) {
  if (!stats?.recent?.length) return null;
  return stats.recent.reduce((s, x) => s + x, 0) / stats.recent.length;
}

/**
 * Zvládnutí tématu 0–100. Kombinuje dosaženou úroveň, čerstvou úspěšnost
 * a množství odcvičeného – aby se jedna šťastná trefa netvářila jako mistrovství.
 */
export function mastery(stats, maxLevel = 5) {
  if (!stats?.attempts) return 0;
  const acc = recentAccuracy(stats) ?? 0;
  const lvl = (stats.level - 1) / Math.max(1, maxLevel - 1);
  const volume = Math.min(1, stats.attempts / (maxLevel * 4));
  return Math.round(100 * (0.45 * acc + 0.35 * lvl + 0.20 * volume) * (0.55 + 0.45 * volume));
}

/** Slovní hodnocení. */
export function masteryLabel(m, attempts) {
  if (!attempts) return 'nezačato';
  if (m >= 80) return 'zvládnuté';
  if (m >= 55) return 'jde ti to';
  if (m >= 30) return 'rozcvičeno';
  return 'slabé místo';
}

/**
 * Výběr tématu pro režim „slabá místa“ – preferuje nízké zvládnutí,
 * ale i dlouho neprocvičovaná témata.
 */
export function pickWeak(topics, statsOf, rng) {
  const now = Date.now();
  const weights = topics.map((tp) => {
    const st = statsOf(tp);
    const m = mastery(st, tp.levels);
    const daysIdle = st.lastPracticed ? (now - st.lastPracticed) / DAY : 7;
    const freshness = Math.min(2.5, 0.6 + daysIdle * 0.35);
    return Math.max(0.15, ((100 - m) / 100) ** 1.5 * 3 + 0.4) * freshness;
  });
  const total = weights.reduce((s, x) => s + x, 0);
  let r = rng() * total;
  for (let i = 0; i < topics.length; i++) { r -= weights[i]; if (r <= 0) return topics[i]; }
  return topics[topics.length - 1];
}

/**
 * Chytrý výběr pro běžný trénink: většinou sáhne po tom, co je na řadě
 * k opakování, zbytek času po slabých a dlouho nedotčených tématech.
 */
export const DUE_SHARE = 0.75;
export function pickSmart(topics, statsOf, rng, now = Date.now()) {
  if (rng() < DUE_SHARE) {
    const t = pickDue(topics, statsOf, rng, now);
    if (t) return t;
  }
  return pickWeak(topics, statsOf, rng);
}
