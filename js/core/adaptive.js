// Adaptivní obtížnost: úroveň se hýbe podle posledních výsledků v daném tématu.
import { topicStats, setLevel } from './store.js';

const UP_STREAK = 3;     // tolik správných v řadě = posun nahoru
const DOWN_STREAK = 2;   // tolik špatných v řadě = posun dolů

/** Doporučená úroveň pro další úlohu. */
export function nextLevel(topic, maxLevel) {
  const t = topicStats(topic.id);
  return Math.max(1, Math.min(maxLevel ?? topic.levels ?? 5, t.level));
}

/**
 * Po vyhodnocení pokusu posuneme úroveň.
 * @returns {{level:number, changed:-1|0|1}}
 */
export function adjustLevel(topic, { ok, usedHints }) {
  const max = topic.levels ?? 5;
  const t = topicStats(topic.id);
  let level = t.level, changed = 0;
  if (ok && t.streak >= UP_STREAK && !usedHints && level < max) {
    level++; changed = 1;
  } else if (!ok && t.wrongStreak >= DOWN_STREAK && level > 1) {
    level--; changed = -1;
  }
  if (changed) {
    setLevel(topic.id, level);
    const s = topicStats(topic.id);
    s.streak = 0; s.wrongStreak = 0;
  }
  return { level, changed };
}

/** Úspěšnost z posledních pokusů (0–1), null když ještě nic. */
export function recentAccuracy(id) {
  const t = topicStats(id);
  if (!t.recent.length) return null;
  return t.recent.reduce((s, x) => s + x, 0) / t.recent.length;
}

/**
 * Zvládnutí tématu 0–100. Kombinuje dosaženou úroveň, čerstvou úspěšnost
 * a množství odcvičeného – aby se jedna šťastná trefa netvářila jako mistrovství.
 */
export function mastery(topic) {
  const t = topicStats(topic.id);
  if (!t.attempts) return 0;
  const max = topic.levels ?? 5;
  const acc = recentAccuracy(topic.id) ?? 0;
  const lvl = (t.level - 1) / Math.max(1, max - 1);
  const volume = Math.min(1, t.attempts / (max * 4));
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
 * Výběr tématu pro režim „slabá místa“ – preferuje nízké mastery,
 * ale i dlouho neprocvičovaná témata.
 */
export function pickWeak(topics, rng) {
  const now = Date.now();
  const weights = topics.map((tp) => {
    const t = topicStats(tp.id);
    const m = mastery(tp);
    const daysIdle = t.lastPracticed ? (now - t.lastPracticed) / 864e5 : 7;
    const freshness = Math.min(2.5, 0.6 + daysIdle * 0.35);
    return Math.max(0.15, ((100 - m) / 100) ** 1.5 * 3 + 0.4) * freshness;
  });
  const total = weights.reduce((s, x) => s + x, 0);
  let r = rng() * total;
  for (let i = 0; i < topics.length; i++) { r -= weights[i]; if (r <= 0) return topics[i]; }
  return topics[topics.length - 1];
}
