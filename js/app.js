import { TOPICS, CATEGORIES, byId } from './topics/index.js';
import { makeRng, czDate } from './core/util.js';
import { md, loadKatex } from './core/mathrender.js';
import { renderViz } from './core/plot.js';
import { check, answerTex } from './core/checker.js';
import * as store from './core/store.js';
import { adjustLevel, mastery, masteryLabel, recentAccuracy, pickWeak } from './core/adaptive.js';

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
  mode: 'adaptive',      // adaptive | weak | fixed
  fixedLevel: 1,
  catFilter: null,
  task: null,            // { topic, level, data, startedAt, hints, answered, correct }
  solved: 0,
  correct: 0,
};

const selectedIds = () => {
  const sel = store.getSettings().selected || [];
  const valid = sel.filter(byId);
  return valid.length ? valid : TOPICS.map((t) => t.id);
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
  setTimeout(() => t.remove(), 2600);
}

const levelPill = (lvl, max) => `<span class="pill pill-accent">⚡ úroveň ${lvl}/${max}</span>`;

function masteryBar(topic) {
  const st = store.topicStats(topic.id);
  const m = mastery(topic);
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
  const all = TOPICS.map((t) => ({ t, m: mastery(t), st: store.topicStats(t.id) }));
  const started = all.filter((x) => x.st.attempts > 0);
  const weak = started.filter((x) => x.m < 55).sort((a, b) => a.m - b.m).slice(0, 3);
  const strong = started.filter((x) => x.m >= 70).sort((a, b) => b.m - a.m).slice(0, 3);
  const totalSolved = Object.values(store.getState().topics).reduce((s, t) => s + t.attempts, 0);
  const totalCorrect = Object.values(store.getState().topics).reduce((s, t) => s + t.correct, 0);

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
    <p class="faint" style="margin:14px 0 0">Vybráno ${selectedIds().length} z ${TOPICS.length} témat${session.mode === 'weak' ? ' · režim slabých míst' : ''}</p>
  </div>

  <div class="grid grid-stats" style="margin-top:16px">
    <div class="stat stat-accent"><div class="n">${today.solved}</div><div class="l">dnes úloh</div></div>
    <div class="stat stat-ok"><div class="n">${today.solved ? Math.round((today.correct / today.solved) * 100) : 0} %</div><div class="l">dnes úspěšnost</div></div>
    <div class="stat stat-warn"><div class="n">${days}</div><div class="l">dní v řadě</div></div>
    <div class="stat"><div class="n">${totalSolved}</div><div class="l">celkem úloh</div></div>
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
            <div class="sub">${masteryLabel(m, st.attempts)} · úspěšnost ${Math.round((recentAccuracy(t.id) ?? 0) * 100)} % · úroveň ${st.level}/${t.levels}</div>
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
      4. V <b>Postupu</b> vidíš, co ti jde a co ne. Všechno se ukládá jen u tebe v prohlížeči.
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
        const st = store.topicStats(t.id);
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
  const topic = session.mode === 'weak' ? pickWeak(pool, rng) : rng.pick(pool);
  const max = topic.levels ?? 5;
  const level = session.mode === 'fixed'
    ? Math.min(session.fixedLevel, max)
    : Math.max(1, Math.min(max, store.topicStats(topic.id).level));
  let data;
  try { data = topic.generate(level, rng); } catch (e) { console.error('generate', topic.id, e); return null; }
  session.task = { topic, level, data, startedAt: Date.now(), hints: 0, answered: false, correct: false };
  return session.task;
}

function viewPractice() {
  if (!session.task) nextTask();
  const t = session.task;
  if (!t) return `<div class="card"><h1>Není co trénovat</h1><p class="muted">Vyber si aspoň jedno téma.</p><button class="btn btn-primary" data-nav="temata">Vybrat témata</button></div>`;

  const { topic, level, data } = t;
  const acc = session.solved ? Math.round((session.correct / session.solved) * 100) : 0;
  const st = store.topicStats(topic.id);

  return `
  <div class="card card-lg">
    <div class="task-meta">
      <span class="pill">${esc(topic.icon)} ${esc(topic.name)}</span>
      ${levelPill(level, topic.levels)}
      ${st.streak > 1 ? `<span class="pill pill-ok">🔥 série ${st.streak}</span>` : ''}
      <span class="spacer" style="flex:1"></span>
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
  t.answered = true; t.correct = ok;
  const ms = Date.now() - t.startedAt;
  store.recordAttempt({ topic: t.topic.id, level: t.level, ok, ms, hints: t.hints });
  const { changed } = adjustLevel(t.topic, { ok, usedHints: t.hints > 0 });
  session.solved++;
  if (ok) session.correct++;

  const fb = $('#feedback');
  fb.innerHTML = '';
  if (ok) {
    const praise = ['Přesně tak!', 'Sedí to. 👌', 'Správně!', 'Perfektní.', 'Ano, přesně.'];
    fb.appendChild(el(`<div class="feedback feedback-ok"><span class="big">✓</span><span>${praise[Math.floor(Math.random() * praise.length)]}${t.hints ? ' (s nápovědou)' : ''}${changed > 0 ? `<br><b>Posun na úroveň ${store.topicStats(t.topic.id).level} 🚀</b>` : ''}</span></div>`));
  } else {
    fb.appendChild(el(`<div class="feedback feedback-bad"><span class="big">✕</span><span>
      ${gaveUp ? 'Nevadí, mrkni na postup.' : 'Ještě ne.'} Správná odpověď: <b>${md(String(answerTex(t.data.answer)))}</b>
      ${changed < 0 ? `<br>Zkusíme to o stupeň lehčí (úroveň ${store.topicStats(t.topic.id).level}).` : ''}
    </span></div>`));
    showSolution();
  }
  if (ok && !$('#solution').children.length) {
    $('#next-wrap').appendChild(el('<div class="btn-row" style="margin-top:12px"><button class="btn btn-sm btn-ghost" data-act="show-solution">Ukázat postup</button></div>'));
  }
  $('#next-wrap').appendChild(el('<button class="btn btn-primary btn-block" data-act="next" style="margin-top:12px">Další úloha →</button>'));
  const inp = $('#answer');
  if (inp) { inp.disabled = true; }
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
    const fb = $('#feedback');
    fb.innerHTML = `<div class="feedback feedback-info"><span class="big">ℹ</span><span>${esc(res.message)}</span></div>`;
    return;
  }
  finishTask(res.ok);
}

/* ============================ VIEW: Postup ============================ */
function viewProgress() {
  const state = store.getState();
  const rows = TOPICS.map((t) => ({ t, st: store.topicStats(t.id), m: mastery(t) }))
    .sort((a, b) => b.st.attempts - a.st.attempts || a.m - b.m);
  const played = rows.filter((r) => r.st.attempts);
  const totalA = played.reduce((s, r) => s + r.st.attempts, 0);
  const totalC = played.reduce((s, r) => s + r.st.correct, 0);
  const totalMs = played.reduce((s, r) => s + r.st.totalTimeMs, 0);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 864e5).toISOString().slice(0, 10);
    return { d, ...(state.daily[d] || { solved: 0, correct: 0 }) };
  });
  const maxDay = Math.max(1, ...days.map((d) => d.solved));

  return `
  <div class="card card-lg">
    <h1>Tvůj postup</h1>
    <div class="grid grid-stats" style="margin-top:14px">
      <div class="stat stat-accent"><div class="n">${totalA}</div><div class="l">vyřešených úloh</div></div>
      <div class="stat stat-ok"><div class="n">${totalA ? Math.round((totalC / totalA) * 100) : 0} %</div><div class="l">celková úspěšnost</div></div>
      <div class="stat stat-warn"><div class="n">${store.streakDays()}</div><div class="l">dní v řadě</div></div>
      <div class="stat"><div class="n">${Math.round(totalMs / 60000)}</div><div class="l">minut tréninku</div></div>
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

  <div class="card">
    <h2>Nastavení a data</h2>
    <p class="muted">Postup se ukládá <b>jen ve tvém prohlížeči</b>. Když si appku otevřeš na mobilu i na notebooku, každé zařízení má vlastní postup – přeneseš ho exportem a importem.</p>
    <div class="btn-row" style="margin-top:14px">
      <button class="btn btn-sm" data-act="theme">🌗 Přepnout vzhled</button>
      <button class="btn btn-sm" data-act="export">⬇ Exportovat postup</button>
      <button class="btn btn-sm" data-act="import">⬆ Importovat postup</button>
      <button class="btn btn-sm" data-act="reset">🗑 Vymazat vše</button>
    </div>
    <div id="io"></div>
  </div>`;
}

/* ============================ render ============================ */
function render() {
  const view = currentView();
  const main = $('#main');
  const body = view === 'domu' ? viewHome()
    : view === 'temata' ? viewTopics()
      : view === 'trenink' ? viewPractice()
        : viewProgress();
  main.innerHTML = body;
  document.querySelectorAll('.nav button').forEach((b) => {
    b.toggleAttribute('aria-current', b.dataset.nav === view);
    if (b.dataset.nav === view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  if (view === 'trenink') setTimeout(() => $('#answer')?.focus({ preventScroll: true }), 80);
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

/* ============================ akce ============================ */
function startTraining(mode = 'adaptive', onlyId = null) {
  session.mode = mode;
  if (onlyId) { store.setSetting('selected', [onlyId]); session.mode = 'adaptive'; }
  session.task = null;
  go('trenink');
  if (currentView() === 'trenink') render();
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
    case 'skip': session.task = null; render(); break;
    case 'next': session.task = null; render(); break;
    case 'theme': toggleTheme(); break;
    case 'export': doExport(); break;
    case 'import': doImport(); break;
    case 'reset': doReset(); break;
  }
});

document.addEventListener('keydown', (e) => {
  if (currentView() !== 'trenink') return;
  if (e.key === 'Enter') {
    e.preventDefault();
    if (session.task?.answered) { session.task = null; render(); }
    else doCheck();
  } else if (e.key === '?' && e.target.id !== 'answer') {
    showHint();
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

/* ---------- export / import ---------- */
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
    $('#io').innerHTML = `<p class="faint" style="margin-top:12px">Zkopíruj si tenhle text:</p><textarea readonly>${esc(data)}</textarea>`;
  }
}
function doImport() {
  $('#io').innerHTML = `
    <p class="faint" style="margin-top:12px">Vlož sem obsah zálohy (JSON) a potvrď:</p>
    <textarea id="import-box" placeholder='{"version":1,...}'></textarea>
    <div class="btn-row" style="margin-top:10px"><button class="btn btn-sm btn-primary" id="import-go">Načíst zálohu</button></div>`;
  $('#import-go').onclick = () => {
    try {
      store.importJson($('#import-box').value);
      applyTheme();
      toast('Postup načten.');
      render();
    } catch (err) { toast('Nepovedlo se: ' + err.message); }
  };
}
function doReset() {
  $('#io').innerHTML = `
    <div class="feedback feedback-bad" style="margin-top:12px"><span class="big">⚠</span><span>
      Tím smažeš <b>všechen</b> postup na tomhle zařízení. Nejde to vrátit.
    </span></div>
    <div class="btn-row" style="margin-top:10px">
      <button class="btn btn-sm" id="reset-yes">Ano, smazat</button>
      <button class="btn btn-sm btn-ghost" id="reset-no">Zrušit</button>
    </div>`;
  $('#reset-no').onclick = () => { $('#io').innerHTML = ''; };
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
loadKatex().then((ok) => { if (ok) render(); });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
