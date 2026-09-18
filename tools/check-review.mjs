// Kontrola rozloženého opakování (spaced repetition).
// Spusť: node tools/check-review.mjs
import {
  replayTopic, reviewStatus, reviewLabel, dueTopics, pickDue, reviewForecast, DAY,
} from '../js/core/adaptive.js';
import { makeRng } from '../js/core/util.js';

let fails = 0;
const ok = (cond, label, detail = '') => {
  console.log(`${cond ? '✓' : '✗'} ${label}${cond ? '' : '  → ' + detail}`);
  if (!cond) fails++;
};
const same = (a, b, label) => ok(JSON.stringify(a) === JSON.stringify(b), label, `${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);

const T0 = Date.UTC(2026, 0, 1);
/** Jedno sezení: `day` = kolikátý den, `n` příkladů, z toho `correct` správně. */
const ses = (day, n, correct, hints = 0) => Array.from({ length: n }, (_, i) => ({
  id: `d${day}-${i}`, ts: T0 + day * DAY + i * 60000, topic: 'x', level: 1,
  ok: i < correct, ms: 5000, hints: i < hints ? 1 : 0,
}));
const plan = (...sessions) => replayTopic(sessions.flat(), 5).review;

console.log('— růst intervalu při bezchybných sezeních —');
const p1 = plan(ses(0, 5, 5));
const p2 = plan(ses(0, 5, 5), ses(1, 5, 5));
const p3 = plan(ses(0, 5, 5), ses(1, 5, 5), ses(4, 5, 5));
const p4 = plan(ses(0, 5, 5), ses(1, 5, 5), ses(4, 5, 5), ses(12, 5, 5));
console.log(`  ${p1.interval} → ${p2.interval} → ${p3.interval} → ${p4.interval} dní`);
same([p1.interval, p2.interval], [1, 3], 'první dvě opakování jsou za 1 a 3 dny');
ok(p3.interval > p2.interval && p4.interval > p3.interval, 'interval dál roste');
ok(p4.ease > p1.ease, 'snadnost tématu roste s úspěchy');

console.log('\n— reakce na chyby —');
const fail = plan(ses(0, 5, 5), ses(1, 5, 5), ses(4, 5, 5), ses(12, 5, 1));
same([fail.interval, fail.reps], [1, 0], 'propadlé sezení vrátí téma na zítřek');
ok(fail.ease < p3.ease, 'a sníží snadnost');
const hinted = plan(ses(0, 5, 5, 5));
ok(hinted.lastQuality < p1.lastQuality, 'sezení s nápovědami má nižší známku', `${hinted.lastQuality} vs ${p1.lastQuality}`);

console.log('\n— malá sezení nesmí odpálit termín na měsíc —');
const big = plan(ses(0, 5, 5), ses(1, 5, 5), ses(4, 5, 5), ses(12, 5, 5), ses(33, 5, 5));
const tiny = plan(ses(0, 5, 5), ses(1, 5, 5), ses(4, 5, 5), ses(12, 5, 5), ses(33, 1, 1));
ok(tiny.interval < big.interval, 'jeden příklad posune plán méně než pět', `${tiny.interval} vs ${big.interval} dní`);

console.log('\n— rozpoznání toho, co je na řadě —');
const now = T0 + 10 * DAY;
const stDue = reviewStatus(replayTopic(ses(0, 5, 5), 5), now);
const stFuture = reviewStatus(replayTopic([...ses(0, 5, 5), ...ses(1, 5, 5), ...ses(4, 5, 5), ...ses(9, 5, 5)].flat(), 5), now);
ok(stDue.due, 'staré téma je k opakování');
same(stDue.overdueDays, 8, 'zpoždění se počítá v celých dnech od termínu');
ok(!stFuture.due, 'čerstvě procvičené téma na řadě není');
ok(/za /.test(reviewLabel(stFuture)), 'popisek u naplánovaného tématu mluví o budoucnu', reviewLabel(stFuture));
same(reviewStatus(replayTopic([], 5), now).state, 'new', 'téma bez historie je „nové“, ne „po termínu“');

console.log('\n— fronta a výhled —');
const topics = [{ id: 'a', levels: 5 }, { id: 'b', levels: 5 }, { id: 'c', levels: 5 }];
const data = {
  a: replayTopic(ses(0, 5, 5), 5),                                   // dávno
  b: replayTopic([...ses(0, 5, 5), ...ses(1, 5, 5)], 5),             // o něco méně dávno
  c: replayTopic([...ses(0, 5, 5), ...ses(1, 5, 5), ...ses(4, 5, 5), ...ses(9, 5, 5)], 5),
};
const statsOf = (t) => data[t.id];
const q = dueTopics(topics, statsOf, now);
same(q.map((x) => x.topic.id), ['a', 'b'], 've frontě jsou jen prošlá témata, nejzpožděnější první');
const rng = makeRng(42);
ok(Array.from({ length: 50 }, () => pickDue(topics, statsOf, rng, now).id).every((id) => id !== 'c'), 'losování nikdy nesáhne po tématu, které na řadě není');
const fc = reviewForecast(topics, statsOf, 30, now);
same(fc[0].count, 2, 've výhledu na dnešek sedí počet prošlých témat');
same(fc.reduce((a, f) => a + f.count, 0), 3, 'a všechna tři témata se do třicetidenního okna vejdou');
ok(fc.slice(1).some((f) => f.count > 0), 'budoucí opakování padne na pozdější den, ne na dnešek');
same(reviewForecast(topics, statsOf, 5, now).reduce((a, f) => a + f.count, 0), 2,
  'kratší okno ukáže jen to, co do něj spadá');

console.log('\n— plán přežije sloučení dat ze dvou zařízení —');
const pc = [...ses(0, 5, 5), ...ses(4, 3, 3)];
const mob = [...ses(0, 5, 5), ...ses(2, 4, 4)];               // sdílené první sezení
const union = [...new Map([...pc, ...mob].map((e) => [e.id, e])).values()].sort((x, y) => x.ts - y.ts);
const unionRev = replayTopic(union, 5).review;
const reversed = replayTopic([...union].sort((x, y) => x.ts - y.ts), 5).review;
same([unionRev.interval, unionRev.reps], [reversed.interval, reversed.reps], 'plán po sloučení nezávisí na pořadí');
ok(unionRev.sessions === 3, 'sezení ze dvou zařízení se nezdvojí', `sezení: ${unionRev.sessions}`);

console.log(`\nProblémů: ${fails}`);
process.exit(fails ? 1 : 0);
