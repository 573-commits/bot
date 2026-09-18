// Pravidla adaptivní obtížnosti. Čistě funkční – nesahá na úložiště,
// aby se daly stejné rutiny pustit i nad daty z jiného zařízení.

export const UP_STREAK = 3;     // tolik správných v řadě = posun nahoru
export const DOWN_STREAK = 2;   // tolik špatných v řadě = posun dolů
export const RECENT_WINDOW = 20;

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
});

/**
 * Přehraje záznamy jednoho tématu a spočítá z nich statistiky včetně úrovně.
 * Protože je úroveň **odvozená** (ne uložená), vyjde po sloučení dat ze dvou
 * zařízení vždy stejná hodnota bez ohledu na to, kde se cvičilo dřív.
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
  for (const ev of events) {
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
  return s;
}

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
 * @param {Array} topics
 * @param {(topic)=>object} statsOf
 * @param {Function} rng
 */
export function pickWeak(topics, statsOf, rng) {
  const now = Date.now();
  const weights = topics.map((tp) => {
    const st = statsOf(tp);
    const m = mastery(st, tp.levels);
    const daysIdle = st.lastPracticed ? (now - st.lastPracticed) / 864e5 : 7;
    const freshness = Math.min(2.5, 0.6 + daysIdle * 0.35);
    return Math.max(0.15, ((100 - m) / 100) ** 1.5 * 3 + 0.4) * freshness;
  });
  const total = weights.reduce((s, x) => s + x, 0);
  let r = rng() * total;
  for (let i = 0; i < topics.length; i++) { r -= weights[i]; if (r <= 0) return topics[i]; }
  return topics[topics.length - 1];
}
