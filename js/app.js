import { TOPICS, CATEGORIES, byId } from './topics/index.js';
import { makeRng, czDate } from './core/util.js';
import { md, loadKatex } from './core/mathrender.js';
import { renderViz } from './core/plot.js';
import { check, answerTex } from './core/checker.js';
import * as store from './core/store.js';
import * as sync from './core/sync.js';
import { mastery, masteryLabel, recentAccuracy, pickWeak } from './core/adaptive.js';

const $ = (sel, root = document) => root.querySelector(sel);
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const VIEWS = [
  { id: 'domu', label: 'Domů', icon: '🏠' },
  { id: 'temata', label: 'Témata', icon: '🧩' },
  { id: 'trenink', label: 'Trénink', icon: '🏋️' },
  { id: 'postup', label: 'Postup', icon: '📈' },
];

/* ============================ stav sezení ============================ */
const session = {
  mode: 'adaptive',      // adaptive | weak
  catFilter: null,
  task: null,            // { topic, level, data, startedAt, hints, answered }
  solved: 0,
  correct: 0,
};

const statsOf = (t) => store.topicStats(t.id);
const masteryOf = (t) => mastery(store.topicStats(t.id), t.levels);

const selectedIds = () => {
  const sel = (store.getSettings().selected || []).filter(byId);
  return sel.length ? sel : TOPICS.map((t) => t.id);
};
const selectedTopics = () => selectedIds().map(byId).filter(Boolean);
const isChosen = (id) => (store.getSettings().selected || []).includes(id);

function toggleTopic(id) {
  const sel = (store.getSettings().selected || []).slice();
  const i = sel.indexOf(id);
  if (i >= 0) sel.splice(i, 1); else sel.push(id);
  store.setSetting('selected', sel);
}

/* ============================ router ============================ */
function currentView() {
  const h = location.hash.replace(/^#\/?/, '') || 'domu';
  return VIEWS.some((v) => v.id === h) ? h : 'domu';
}
window.addEventListener('hashchange', render);
const go = (v) => { location.hash = '#/' + v; };

/* ============================ pomocné UI ============================ */
function toast(msg) {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const t = el(`<div class="toast">${esc(msg)}</div>`);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

const levelPill = (lvl, max) => `<span class="pill pill-accent">⚡ úroveň ${lvl}/${max}</span>`;

function masteryBar(topic) {
  const st = statsOf(topic);
  const m = masteryOf(topic);
  const cls = !st.attempts ? '' : m >= 60 ? 'bar-ok' : m < 30 ? 'bar-bad' : '';
  return `<div class="bar-row">
    <div class="bar ${cls}"><i style="width:${Math.max(m, st.attempts ? 5 : 0)}%"></i></div>
    <span>${st.attempts ? m + ' %' : '—'}</span>
  </div>`;
}

/* ============================ VIEW: Domů ============================ */
function viewHome() {
  const today = store.todayStats();
  const days = store.streakDays();
  const all = TOPICS.map((t) => ({ t, m: masteryOf(t), st: statsOf(t) }));
  const started = all.filter((x) => x.st.attempts > 0);
  const weak = started.filter((x) => x.m < 55).sort((a, b) => a.m - b.m).slice(0, 3);
  const strong = started.filter((x) => x.m >= 70).sort((a, b) => b.m - a.m).slice(0, 3);
  const tot = store.totals();

  const hour = new Date().getHours();
  const greet = hour < 10 ? 'Dobré ráno' : hour < 18 ? 'Ahoj' : 'Dobrý večer';

  return `
  <div class="card card-lg">
    <h1>${greet} 👋</h1>
    <p class="muted">Vyber si témata, spusť trénink a posilovna se sama přizpůsobí tomu, co ti jde a co ne.</p>
    <div class="btn-row" style="margin-top:18px">
      <button class="btn btn-primary" data-act="start">🏋️ Začít trénink</button>
      <button class="btn" data-act="weak">🎯 Procvičit slabá místa</button>
      <button class="btn btn-ghost" data-nav="temata">Vybrat témata</button>
    </div>
    <p class="faint" style="margin:14px 0 0">Vybráno ${selectedIds().length} z ${TOPICS.length} témat</p>
  </div>

  <div class="grid grid-stats" style="margin-top:16px">
    <div class="stat stat-accent"><div class="n">${today.solved}</div><div class="l">dnes úloh</div></div>
    <div class="stat stat-ok"><div class="n">${today.solved ? Math.round((today.correct / today.solved) * 100) : 0} %</div><div class="l">dnes úspěšnost</div></div>
    <div class="stat stat-warn"><div class="n">${days}</div><div class="l">dní v řadě</div></div>
    <div class="stat"><div class="n">${tot.attempts}</div><div class="l">celkem úloh</div></div>
  </div>

  ${weak.length ? `
  <div class="sec-title"><h2>Na tomhle zapracuj</h2></div>
  <div class="card">
    <div class="list">
      ${weak.map(({ t, m, st }) => `
        <div class="row">
          <div class="topic-icon">${esc(t.icon)}</div>
          <div class="grow">
            <div class="name">${esc(t.name)}</div>
            <div class="sub">${masteryLabel(m, st.attempts)} · úspěšnost ${Math.round((recentAccuracy(st) ?? 0) * 100)} % · úroveň ${st.level}/${t.levels}</div>
          </div>
          <button class="btn btn-sm btn-primary" data-solo="${t.id}">Procvičit</button>
        </div>`).join('')}
    </div>
  </div>` : ''}

  ${strong.length ? `
  <div class="sec-title"><h2>Tohle ti jde</h2></div>
  <div class="card">
    <div class="list">
      ${strong.map(({ t, m, st }) => `
        <div class="row">
          <div class="topic-icon">${esc(t.icon)}</div>
          <div class="grow">
            <div class="name">${esc(t.name)}</div>
            <div class="sub">${m} % · úroveň ${st.level}/${t.levels} · nejdelší série ${st.bestStreak}</div>
          </div>
          <button class="btn btn-sm" data-solo="${t.id}">Zopakovat</button>
        </div>`).join('')}
    </div>
  </div>` : ''}

  ${!started.length ? `
  <div class="card" style="margin-top:16px">
    <h2>Jak to funguje</h2>
    <p class="muted">
      1. V <b>Tématech</b> si zaškrtneš, co chceš procvičovat.<br>
      2. V <b>Tréninku</b> dostaneš úlohu. Když nevíš, klikni na <b>Nápovědu</b> – dostaneš postup po krocích.<br>
      3. Každé téma má vlastní úroveň 1–5. Tři správné odpovědi v řadě = posun nahoru, dvě chyby = o stupeň dolů.<br>
      4. V <b>Postupu</b> vidíš, co ti jde a co ne – a nastavíš si tam <b>synchronizaci</b>, aby byl postup stejný na mobilu i na počítači.
    </p>
  </div>` : ''}`;
}

/* ============================ VIEW: Témata ============================ */
function viewTopics() {
  const cats = CATEGORIES.filter((c) => TOPICS.some((t) => t.category === c));
  const shown = session.catFilter ? TOPICS.filter((t) => t.category === session.catFilter) : TOPICS;
  const byCat = {};
  shown.forEach((t) => (byCat[t.category] ||= []).push(t));
  const chosen = (store.getSettings().selected || []).length;

  return `
  <div class="card">
    <h1>Témata</h1>
    <p class="muted">Klikni na kartu a zařadíš ji do tréninku. Nic nevybráno = trénuje se ze všeho.</p>
    <div class="chips" style="margin-top:14px">
      <button class="chip" aria-pressed="${!session.catFilter}" data-cat="">Vše</button>
      ${cats.map((c) => `<button class="chip" aria-pressed="${session.catFilter === c}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
    </div>
    <div class="btn-row" style="margin-top:14px">
      <button class="btn btn-sm" data-act="select-all">Vybrat vše</button>
      <button class="btn btn-sm" data-act="select-none">Zrušit výběr</button>
      <span class="pill">${chosen ? `vybráno ${chosen}` : 'vybráno vše'}</span>
    </div>
  </div>

  ${Object.entries(byCat).map(([cat, list]) => `
    <div class="sec-title"><h2>${esc(cat)}</h2><span class="faint">${list.length}</span></div>
    <div class="grid grid-topics">
      ${list.map((t) => {
        const st = statsOf(t);
        return `
        <button class="topic" aria-pressed="${isChosen(t.id)}" data-topic="${t.id}">
          <div class="topic-head">
            <div class="topic-icon">${esc(t.icon)}</div>
            <div>
              <div class="topic-name">${esc(t.name)}</div>
              <div class="topic-cat">úroveň ${st.level}/${t.levels} · ${st.attempts} úloh</div>
            </div>
          </div>
          <div class="topic-desc">${esc(t.description)}</div>
          ${masteryBar(t)}
          <span class="btn btn-sm" data-solo="${t.id}" role="button" tabindex="0" style="align-self:flex-start;margin-top:4px">Trénovat jen tohle →</span>
        </button>`;
      }).join('')}
    </div>`).join('')}

  <div class="card" style="margin-top:22px">
    <button class="btn btn-primary btn-block" data-act="start">🏋️ Spustit trénink (${chosen || TOPICS.length} témat)</button>
  </div>`;
}

/* ============================ VIEW: Trénink ============================ */
function nextTask() {
  const rng = makeRng(Date.now() ^ Math.floor(Math.random() * 1e9));
  const pool = selectedTopics();
  if (!pool.length) return null;
  const topic = session.mode === 'weak' ? pickWeak(pool, statsOf, rng) : rng.pick(pool);
  const max = topic.levels ?? 5;
  const level = Math.max(1, Math.min(max, statsOf(topic).level));
  let data;
  try { data = topic.generate(level, rng); } catch (e) { console.error('generate', topic.id, e); return null; }
  session.task = { topic, level, data, startedAt: Date.now(), hints: 0, answered: false };
  return session.task;
}

function viewPractice() {
  if (!session.task) nextTask();
  const t = session.task;
  if (!t) return `<div class="card"><h1>Není co trénovat</h1><p class="muted">Vyber si aspoň jedno téma.</p><button class="btn btn-primary" data-nav="temata">Vybrat témata</button></div>`;

  const { topic, level, data } = t;
  const acc = session.solved ? Math.round((session.correct / session.solved) * 100) : 0;
  const st = statsOf(topic);

  return `
  <div class="card card-lg">
    <div class="task-meta">
      <span class="pill">${esc(topic.icon)} ${esc(topic.name)}</span>
      ${levelPill(level, topic.levels)}
      ${st.streak > 1 ? `<span class="pill pill-ok">🔥 série ${st.streak}</span>` : ''}
      <span style="flex:1"></span>
      <span class="pill">${session.solved} úloh · ${acc} %</span>
    </div>

    <div class="task-prompt">${md(data.prompt)}</div>
    ${data.viz ? `<div class="viz-wrap">${renderViz(data.viz)}</div>` : ''}

    <div class="answer-row" style="margin-top:18px">
      ${data.answerLabel ? `<span class="answer-label">${md(data.answerLabel)}</span>` : ''}
      <input type="text" id="answer" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"
             inputmode="${/text|choice/.test(data.answer.type) ? 'text' : 'decimal'}"
             placeholder="${esc(data.placeholder || 'tvoje odpověď')}">
      <button class="btn btn-primary" data-act="check">Zkontrolovat</button>
    </div>

    <div class="btn-row" style="margin-top:12px">
      <button class="btn btn-sm" data-act="hint">💡 Nápověda${data.hints?.length ? ` (${t.hints}/${data.hints.length})` : ''}</button>
      <button class="btn btn-sm" data-act="give-up">🤷 Nevím, ukaž postup</button>
      <button class="btn btn-sm btn-ghost" data-act="skip">Přeskočit →</button>
    </div>

    <div id="hints"></div>
    <div id="feedback"></div>
    <div id="solution"></div>
    <div id="next-wrap"></div>
  </div>

  <div class="card">
    <h3>Jak psát odpovědi</h3>
    <p class="faint" style="line-height:1.8">
      Desetinná čárka i tečka fungují obě · zlomek zapiš <code>3/4</code> · odmocnina <code>sqrt(2)</code> ·
      mocnina <code>2^5</code> · <code>pi</code>, <code>e</code>, <code>ln(x)</code> ·
      víc hodnot odděl středníkem <code>2; 3</code> · <kbd>Enter</kbd> zkontroluje a pak posune dál.
    </p>
  </div>`;
}

function showHint() {
  const t = session.task;
  const hints = t.data.hints || [];
  if (t.hints >= hints.length) { toast('Další nápověda už není – zkus „Nevím, ukaž postup“.'); return; }
  const idx = t.hints++;
  $('#hints').appendChild(el(`<div class="hint"><b>Nápověda ${idx + 1}:</b> ${md(hints[idx])}</div>`));
  const btn = $('[data-act="hint"]');
  if (btn) btn.innerHTML = `💡 Nápověda (${t.hints}/${hints.length})`;
  $('#hints').lastElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function showSolution() {
  const t = session.task;
  if ($('#solution').children.length) return;
  const steps = t.data.solution || [];
  $('#solution').appendChild(el(`
    <div class="solution">
      <h4>Postup</h4>
      <ol>${steps.map((s) => `<li>${md(s)}</li>`).join('')}</ol>
    </div>`));
}

function finishTask(ok, { gaveUp = false } = {}) {
  const t = session.task;
  if (t.answered) return;
  t.answered = true;
  const ms = Date.now() - t.startedAt;
  const { after, changed } = store.recordAttempt({ topic: t.topic.id, level: t.level, ok, ms, hints: t.hints });
  session.solved++;
  if (ok) session.correct++;

  const fb = $('#feedback');
  fb.innerHTML = '';
  if (ok) {
    const praise = ['Přesně tak!', 'Sedí to. 👌', 'Správně!', 'Perfektní.', 'Ano, přesně.'];
    fb.appendChild(el(`<div class="feedback feedback-ok"><span class="big">✓</span><span>
      ${praise[Math.floor(Math.random() * praise.length)]}${t.hints ? ' (s nápovědou)' : ''}
      ${changed > 0 ? `<br><b>Posun na úroveň ${after} 🚀</b>` : ''}
    </span></div>`));
  } else {
    fb.appendChild(el(`<div class="feedback feedback-bad"><span class="big">✕</span><span>
      ${gaveUp ? 'Nevadí, mrkni na postup.' : 'Ještě ne.'} Správná odpověď: <b>${md(String(answerTex(t.data.answer)))}</b>
      ${changed < 0 ? `<br>Zkusíme to o stupeň lehčí (úroveň ${after}).` : ''}
    </span></div>`));
    showSolution();
  }
  if (ok && !$('#solution').children.length) {
    $('#next-wrap').appendChild(el('<div class="btn-row" style="margin-top:12px"><button class="btn btn-sm btn-ghost" data-act="show-solution">Ukázat postup</button></div>'));
  }
  $('#next-wrap').appendChild(el('<button class="btn btn-primary btn-block" data-act="next" style="margin-top:12px">Další úloha →</button>'));
  const inp = $('#answer');
  if (inp) inp.disabled = true;
  const chk = $('[data-act="check"]');
  if (chk) chk.disabled = true;
  $('#next-wrap').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  setTimeout(() => $('[data-act="next"]')?.focus(), 60);
}

function doCheck() {
  const t = session.task;
  if (!t || t.answered) return;
  const val = $('#answer').value;
  const res = check(val, t.data.answer);
  if (!res.ok && res.message && !String(val).trim()) { toast(res.message); return; }
  if (!res.ok && res.message) {
    // formát nesedí – dáme šanci opravit překlep, nepočítáme jako chybu
    $('#feedback').innerHTML = `<div class="feedback feedback-info"><span class="big">ℹ</span><span>${esc(res.message)}</span></div>`;
    return;
  }
  finishTask(res.ok);
}

/* ============================ VIEW: Postup ============================ */
function syncCard() {
  const cfg = store.getSync();
  if (!cfg?.token) {
    return `
    <div class="card">
      <h2>Synchronizace mezi zařízeními</h2>
      <p class="muted">Postup se ukládá do prohlížeče, takže mobil a počítač o sobě samy nevědí.
      Když propojíš obě zařízení přes GitHub, budeš mít všude <b>stejná data</b> – a co odcvičíš
      offline, se po připojení přičte, nic se nepřepíše.</p>

      <h3 style="margin-top:18px">Nastavení (jednou, ~2 minuty)</h3>
      <ol class="muted" style="padding-left:22px;line-height:1.9">
        <li>Otevři <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com → nový fine-grained token</a></li>
        <li>Jméno libovolné, <b>Expiration</b> dej co nejdelší (jinak to za čas přestane fungovat)</li>
        <li>V <b>Account permissions</b> najdi <b>Gists</b> a nastav na <b>Read and write</b>.
            Nic jiného nepovoluj – k repozitářům se appka nedostane.</li>
        <li>Klikni <b>Generate token</b>, zkopíruj ho a vlož sem:</li>
      </ol>
      <div class="answer-row" style="margin-top:12px">
        <input type="password" id="sync-token" placeholder="github_pat_…" autocomplete="off" spellcheck="false">
        <button class="btn btn-primary" data-act="sync-connect">Propojit</button>
      </div>
      <p class="faint" style="margin-top:12px">Na druhém zařízení pak vlož <b>ten samý token</b> – appka si sama najde tvoji zálohu a data sloučí.</p>

      <h3 style="margin-top:18px">Na co si dát pozor</h3>
      <p class="faint" style="line-height:1.8">
        Token zůstává uložený v tomhle prohlížeči, aby se appka mohla sama synchronizovat.
        Nezadávej ho na cizím počítači. Kdykoli ho můžeš zneplatnit v nastavení GitHubu.
        Data leží v <b>soukromém</b> gistu – veřejně je nikdo nenajde.
      </p>
      <div class="btn-row" style="margin-top:12px">
        <button class="btn btn-sm btn-ghost" data-act="sync-manual">Nechci token, přenesu to ručně</button>
      </div>
      <div id="io"></div>
    </div>`;
  }
  return `
  <div class="card">
    <h2>Synchronizace <span class="pill ${sync.syncState.status === 'idle' ? 'pill-ok' : sync.syncState.status === 'error' ? 'pill-bad' : ''}" id="sync-pill">${esc(sync.statusText())}</span></h2>
    <div class="list" style="margin-top:12px">
      <div class="row"><div class="grow"><div class="name">Účet</div><div class="sub">${esc(cfg.login || '—')} · soukromý gist</div></div></div>
      <div class="row"><div class="grow"><div class="name">Uložených příkladů</div><div class="sub">${store.eventCount()} záznamů · poslední synchronizace ${cfg.lastSyncAt ? czDate(cfg.lastSyncAt) + ', ' + new Date(cfg.lastSyncAt).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }) : 'zatím neproběhla'}</div></div></div>
    </div>
    ${sync.syncState.lastError ? `<div class="feedback feedback-bad" style="margin-top:12px"><span class="big">⚠</span><span>${esc(sync.syncState.lastError)}</span></div>` : ''}
    <div class="btn-row" style="margin-top:14px">
      <button class="btn btn-sm btn-primary" data-act="sync-now">↻ Synchronizovat teď</button>
      <button class="btn btn-sm btn-ghost" data-act="sync-disconnect">Odpojit toto zařízení</button>
    </div>
    <p class="faint" style="margin-top:12px">Synchronizuje se samo po spuštění, po každých pár příkladech a při zavření appky.
    Na dalším zařízení vlož stejný token a data se sloučí.</p>
  </div>`;
}

function viewProgress() {
  const rows = TOPICS.map((t) => ({ t, st: statsOf(t), m: masteryOf(t) }))
    .sort((a, b) => b.st.attempts - a.st.attempts || a.m - b.m);
  const played = rows.filter((r) => r.st.attempts);
  const tot = store.totals();
  const daily = store.dailyStats();

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10);
    return { d, ...(daily[d] || { solved: 0, correct: 0 }) };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.solved));

  return `
  <div class="card card-lg">
    <h1>Tvůj postup</h1>
    <div class="grid grid-stats" style="margin-top:14px">
      <div class="stat stat-accent"><div class="n">${tot.attempts}</div><div class="l">vyřešených úloh</div></div>
      <div class="stat stat-ok"><div class="n">${tot.attempts ? Math.round((tot.correct / tot.attempts) * 100) : 0} %</div><div class="l">celková úspěšnost</div></div>
      <div class="stat stat-warn"><div class="n">${store.streakDays()}</div><div class="l">dní v řadě</div></div>
      <div class="stat"><div class="n">${Math.round(tot.ms / 60000)}</div><div class="l">minut tréninku</div></div>
    </div>
  </div>

  <div class="card">
    <h2>Posledních 14 dní</h2>
    <div class="spark">
      ${days.map((d) => `<i class="${d.solved ? '' : 'empty'}" style="height:${d.solved ? Math.max(8, (d.solved / maxDay) * 100) : 6}%" title="${d.d}: ${d.solved} úloh"></i>`).join('')}
    </div>
    <p class="faint" style="margin-top:10px">${czDate(Date.now() - 13 * 864e5)} → dnes</p>
  </div>

  <div class="sec-title"><h2>Podle témat</h2><span class="faint">${played.length} rozpracovaných</span></div>
  <div class="card">
    <div class="list">
      ${rows.map(({ t, st, m }) => `
        <div class="row">
          <div class="topic-icon">${esc(t.icon)}</div>
          <div class="grow">
            <div class="name">${esc(t.name)}</div>
            <div class="sub">${st.attempts
              ? `${st.correct}/${st.attempts} správně · úroveň ${st.level}/${t.levels} · ${masteryLabel(m, st.attempts)}${st.lastPracticed ? ` · naposledy ${czDate(st.lastPracticed)}` : ''}`
              : 'ještě nezkoušeno'}</div>
            <div style="margin-top:8px">${masteryBar(t)}</div>
          </div>
          <button class="btn btn-sm" data-solo="${t.id}">▶</button>
        </div>`).join('')}
    </div>
  </div>

  ${syncCard()}

  <div class="card">
    <h2>Vzhled a data</h2>
    <div class="btn-row" style="margin-top:6px">
      <button class="btn btn-sm" data-act="theme">🌗 Přepnout vzhled</button>
      <button class="btn btn-sm" data-act="export">⬇ Stáhnout zálohu</button>
      <button class="btn btn-sm" data-act="import">⬆ Načíst zálohu</button>
      <button class="btn btn-sm" data-act="reset">🗑 Vymazat vše</button>
    </div>
    <div id="io2"></div>
  </div>`;
}

/* ============================ render ============================ */
function render() {
  const view = currentView();
  const body = view === 'domu' ? viewHome()
    : view === 'temata' ? viewTopics()
      : view === 'trenink' ? viewPractice()
        : viewProgress();
  $('#main').innerHTML = body;
  document.querySelectorAll('.nav button').forEach((b) => {
    if (b.dataset.nav === view) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  paintSyncDot();
  if (view === 'trenink') setTimeout(() => $('#answer')?.focus({ preventScroll: true }), 80);
  window.scrollTo({ top: 0 });
}

function paintSyncDot() {
  const dot = $('#sync-dot');
  if (!dot) return;
  const s = sync.syncState.status;
  if (s === 'off') { dot.className = 'sync-dot hidden'; dot.textContent = ''; return; }
  dot.className = `sync-dot sync-${s}`;
  dot.title = sync.statusText();
  dot.textContent = s === 'syncing' ? '↻' : s === 'error' ? '⚠' : s === 'offline' ? '⌁' : '✓';
}

/* ============================ akce ============================ */
function startTraining(mode = 'adaptive', onlyId = null) {
  session.mode = mode;
  if (onlyId) { store.setSetting('selected', [onlyId]); session.mode = 'adaptive'; }
  session.task = null;
  if (currentView() === 'trenink') render(); else go('trenink');
}

document.addEventListener('click', (e) => {
  const nav = e.target.closest('[data-nav]');
  if (nav) { go(nav.dataset.nav); return; }

  const solo = e.target.closest('[data-solo]');
  if (solo) { e.preventDefault(); e.stopPropagation(); startTraining('adaptive', solo.dataset.solo); return; }

  const cat = e.target.closest('[data-cat]');
  if (cat) { session.catFilter = cat.dataset.cat || null; render(); return; }

  const topicBtn = e.target.closest('[data-topic]');
  if (topicBtn) { toggleTopic(topicBtn.dataset.topic); render(); return; }

  const act = e.target.closest('[data-act]')?.dataset.act;
  if (!act) return;

  switch (act) {
    case 'start': startTraining('adaptive'); break;
    case 'weak': startTraining('weak'); break;
    case 'select-all': store.setSetting('selected', TOPICS.map((t) => t.id)); render(); break;
    case 'select-none': store.setSetting('selected', []); render(); break;
    case 'check': doCheck(); break;
    case 'hint': showHint(); break;
    case 'show-solution': showSolution(); break;
    case 'give-up': showSolution(); finishTask(false, { gaveUp: true }); break;
    case 'skip': case 'next': session.task = null; render(); break;
    case 'theme': toggleTheme(); break;
    case 'export': doExport(); break;
    case 'import': doImport(); break;
    case 'reset': doReset(); break;
    case 'sync-connect': doConnect(); break;
    case 'sync-now': doSyncNow(); break;
    case 'sync-disconnect': doDisconnect(); break;
    case 'sync-manual': doImport('#io'); break;
  }
});

document.addEventListener('keydown', (e) => {
  if (currentView() !== 'trenink') return;
  if (e.key === 'Enter') {
    e.preventDefault();
    if (session.task?.answered) { session.task = null; render(); }
    else doCheck();
  }
});

/* ---------- vzhled ---------- */
function applyTheme() {
  const th = store.getSettings().theme || 'auto';
  if (th === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', th);
}
function toggleTheme() {
  const order = ['auto', 'light', 'dark'];
  const cur = store.getSettings().theme || 'auto';
  const next = order[(order.indexOf(cur) + 1) % order.length];
  store.setSetting('theme', next);
  applyTheme();
  toast(`Vzhled: ${{ auto: 'podle systému', light: 'světlý', dark: 'tmavý' }[next]}`);
}

/* ---------- synchronizace ---------- */
async function doConnect() {
  const token = $('#sync-token')?.value;
  const btn = $('[data-act="sync-connect"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Propojuji…'; }
  try {
    const r = await sync.connect(token);
    toast(`Propojeno jako ${r.login}. Načteno ${r.pulled || 0} příkladů z jiného zařízení.`);
    render();
  } catch (err) {
    toast(err.message);
    if (btn) { btn.disabled = false; btn.textContent = 'Propojit'; }
  }
}
async function doSyncNow() {
  const btn = $('[data-act="sync-now"]');
  if (btn) { btn.disabled = true; btn.textContent = '↻ Synchronizuji…'; }
  const r = await sync.syncNow({ force: true });
  if (r.error) toast('Nepovedlo se: ' + r.error);
  else if (r.offline) toast('Jsi offline – zkusím to, až bude připojení.');
  else toast(r.pulled ? `Načteno ${r.pulled} nových příkladů z druhého zařízení.` : 'Hotovo, všude je to stejné.');
  render();
}
function doDisconnect() {
  $('#io2').innerHTML = `
    <div class="feedback feedback-info" style="margin-top:12px"><span class="big">ℹ</span><span>
      Odpojí se jen tohle zařízení. Data v gistu i postup v tomhle prohlížeči zůstanou.
    </span></div>
    <div class="btn-row" style="margin-top:10px">
      <button class="btn btn-sm" id="dis-yes">Odpojit</button>
      <button class="btn btn-sm btn-ghost" id="dis-no">Zrušit</button>
    </div>`;
  $('#dis-no').onclick = () => { $('#io2').innerHTML = ''; };
  $('#dis-yes').onclick = () => { sync.disconnect(); toast('Odpojeno.'); render(); };
}

/* ---------- záloha ---------- */
function doExport() {
  const data = store.exportJson();
  const name = `matematicka-posilovna-${new Date().toISOString().slice(0, 10)}.json`;
  try {
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Záloha stažena.');
  } catch {
    $('#io2').innerHTML = `<p class="faint" style="margin-top:12px">Zkopíruj si tenhle text:</p><textarea readonly>${esc(data)}</textarea>`;
  }
}
function doImport(target = '#io2') {
  const box = $(target) || $('#io2');
  box.innerHTML = `
    <p class="faint" style="margin-top:12px">Vlož obsah zálohy (JSON). Data se <b>sloučí</b> s tím, co tu máš – nic se nepřepíše.</p>
    <textarea id="import-box" placeholder='{"version":2,…}'></textarea>
    <div class="btn-row" style="margin-top:10px"><button class="btn btn-sm btn-primary" id="import-go">Načíst a sloučit</button></div>`;
  $('#import-go').onclick = () => {
    try {
      const r = store.importJson($('#import-box').value);
      applyTheme();
      toast(`Načteno ${r.added} nových příkladů (celkem ${r.total}).`);
      render();
    } catch (err) { toast('Nepovedlo se: ' + err.message); }
  };
}
function doReset() {
  $('#io2').innerHTML = `
    <div class="feedback feedback-bad" style="margin-top:12px"><span class="big">⚠</span><span>
      Tím smažeš <b>všechen</b> postup na tomhle zařízení. Když máš zapnutou synchronizaci,
      při dalším spojení se prázdný stav <b>nepropíše</b> na ostatní zařízení – ale zpátky sem
      se data zase stáhnou. Chceš-li smazat všude, nejdřív se odpoj.
    </span></div>
    <div class="btn-row" style="margin-top:10px">
      <button class="btn btn-sm" id="reset-yes">Ano, smazat</button>
      <button class="btn btn-sm btn-ghost" id="reset-no">Zrušit</button>
    </div>`;
  $('#reset-no').onclick = () => { $('#io2').innerHTML = ''; };
  $('#reset-yes').onclick = () => { store.resetAll(); applyTheme(); toast('Hotovo, začínáš znovu.'); render(); };
}

/* ============================ start ============================ */
function buildNav() {
  $('#nav').innerHTML = VIEWS.map((v) =>
    `<button data-nav="${v.id}"><span class="ico">${v.icon}</span><span>${v.label}</span></button>`).join('');
}

applyTheme();
buildNav();
render();
sync.onSyncChange(() => {
  paintSyncDot();
  const pill = $('#sync-pill');
  if (pill) {
    pill.textContent = sync.statusText();
    pill.className = `pill ${sync.syncState.status === 'idle' ? 'pill-ok' : sync.syncState.status === 'error' ? 'pill-bad' : ''}`;
  }
});
sync.startAutoSync();
loadKatex().then((ok) => { if (ok) render(); });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
