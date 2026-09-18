// Synchronizace postupu mezi zařízeními.
//
// Data leží v soukromém GitHub Gistu – žádný vlastní server, žádná další
// registrace. Postup se vždy **slučuje** (viz store.mergeStates), takže když
// cvičíš offline na mobilu i na notebooku, po připojení se obojí sečte.

import * as store from './store.js';

const FILE = 'matematicka-posilovna.json';
const MARKER = 'mathgym-sync-v1';
const DESCRIPTION = `Matematická posilovna – můj postup (${MARKER}) · nemazat`;
const API = 'https://api.github.com';

export const STATUS = {
  off: 'nenastaveno',
  idle: 'synchronizováno',
  syncing: 'synchronizuji…',
  offline: 'offline – uloženo v zařízení',
  error: 'chyba synchronizace',
};

export const syncState = { status: 'off', lastSyncAt: 0, lastError: '', pending: false };

const listeners = new Set();
export const onSyncChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
function emit(patch) {
  Object.assign(syncState, patch);
  listeners.forEach((fn) => { try { fn(syncState); } catch (e) { console.warn(e); } });
}

export const isConfigured = () => !!store.getSync()?.token;

/* ============================== GitHub Gist ============================== */

const netError = (msg) => { const e = new Error(msg); e.offline = true; return e; };

async function api(path, { token, method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(API + path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw netError('Nedaří se spojit s GitHubem.');
  }
  if (res.status === 401) throw new Error('Token GitHub neplatí nebo mu vypršela platnost. Vygeneruj nový.');
  if (res.status === 403 || res.status === 429) throw new Error('GitHub dočasně odmítá požadavky (limit). Zkus to za chvíli.');
  if (res.status === 404) { const e = new Error('Záloha na GitHubu nebyla nalezena.'); e.notFound = true; throw e; }
  if (!res.ok) throw new Error(`GitHub vrátil chybu ${res.status}.`);
  if (res.status === 204) return null;
  try { return await res.json(); }
  catch { throw netError('Z GitHubu přišla neplatná odpověď.'); }
}

/** Najde existující gist s postupem, nebo založí nový. */
async function findOrCreateGist(token) {
  const list = await api('/gists?per_page=100', { token });
  const found = list.find((g) => (g.description || '').includes(MARKER) && g.files?.[FILE]);
  if (found) return found.id;
  const created = await api('/gists', {
    token, method: 'POST',
    body: { description: DESCRIPTION, public: false, files: { [FILE]: { content: JSON.stringify(store.snapshot()) } } },
  });
  return created.id;
}

async function pull(token, gistId) {
  const g = await api(`/gists/${gistId}`, { token });
  const f = g.files?.[FILE];
  if (!f) return null;
  let content = f.content;
  if (f.truncated) {
    try { content = await (await fetch(f.raw_url)).text(); }
    catch { throw netError('Nedaří se stáhnout zálohu z GitHubu.'); }
  }
  if (!content) return null;
  try { return JSON.parse(content); } catch { throw new Error('Záloha na GitHubu je poškozená.'); }
}

async function push(token, gistId, data) {
  await api(`/gists/${gistId}`, {
    token, method: 'PATCH',
    body: { description: DESCRIPTION, files: { [FILE]: { content: JSON.stringify(data) } } },
  });
}

/* ============================== připojení ============================== */

/**
 * Ověří token, najde nebo založí gist a hned provede první sloučení.
 * @param {string} token osobní přístupový token GitHubu s právem na gisty
 */
export async function connect(token) {
  const clean = String(token || '').trim();
  if (!clean) throw new Error('Vlož token.');
  emit({ status: 'syncing', lastError: '' });
  try {
    const me = await api('/user', { token: clean });
    const gistId = await findOrCreateGist(clean);
    store.setSync({ provider: 'gist', token: clean, gistId, login: me.login });
    const r = await syncNow({ force: true });
    return { login: me.login, gistId, ...r };
  } catch (e) {
    emit({ status: 'error', lastError: e.message });
    throw e;
  }
}

export function disconnect() {
  store.setSync(null);
  emit({ status: 'off', lastError: '', lastSyncAt: 0 });
}

/* ============================== vlastní synchronizace ============================== */

let running = null;
let timer = null;

/**
 * Stáhne vzdálený stav, sloučí ho s místním a výsledek nahraje zpět.
 * Volání během běhu se spojí do jednoho.
 */
export function syncNow({ force = false } = {}) {
  if (running) return running;
  const cfg = store.getSync();
  if (!cfg?.token || !cfg.gistId) return Promise.resolve({ skipped: 'nenastaveno' });
  if (!force && !navigator.onLine) { emit({ status: 'offline' }); return Promise.resolve({ skipped: 'offline' }); }

  emit({ status: 'syncing', pending: false });
  running = (async () => {
    try {
      const remote = await pull(cfg.token, cfg.gistId);
      const before = store.eventCount();
      if (remote) store.mergeIn(remote);
      const pulled = store.eventCount() - before;
      const merged = store.snapshot();
      const remoteCount = remote?.events?.length || 0;
      // nahrávej jen když se něco změnilo (šetří limity API)
      if (!remote || remoteCount !== merged.events.length || (merged.settingsUpdatedAt || 0) > (remote.settingsUpdatedAt || 0)) {
        await push(cfg.token, cfg.gistId, merged);
      }
      store.setSync({ lastSyncAt: Date.now() });
      emit({ status: 'idle', lastSyncAt: Date.now(), lastError: '' });
      return { pulled, total: merged.events.length };
    } catch (e) {
      const offline = e.offline || !navigator.onLine
        || /Failed to fetch|NetworkError|load failed/i.test(e.message);
      emit({ status: offline ? 'offline' : 'error', lastError: offline ? '' : e.message });
      return { error: e.message, offline };
    } finally {
      running = null;
    }
  })();
  return running;
}

/** Odloží synchronizaci – ať se po každém příkladu nevolá API. */
export function scheduleSync(delay = 8000) {
  if (!isConfigured()) return;
  emit({ pending: true });
  clearTimeout(timer);
  timer = setTimeout(() => syncNow(), delay);
}

/** Napojí automatické spouštění na životní cyklus stránky. */
export function startAutoSync() {
  if (!isConfigured()) { emit({ status: 'off' }); return; }
  syncNow();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && syncState.pending) { clearTimeout(timer); syncNow(); }
    else if (document.visibilityState === 'visible') syncNow();
  });
  window.addEventListener('online', () => syncNow());
  store.onChange(() => scheduleSync());
}

/** Text do stavového řádku. */
export function statusText() {
  if (syncState.status === 'idle' && syncState.lastSyncAt) {
    const min = Math.floor((Date.now() - syncState.lastSyncAt) / 60000);
    if (min < 1) return 'synchronizováno právě teď';
    if (min < 60) return `synchronizováno před ${min} min`;
    const h = Math.floor(min / 60);
    return `synchronizováno před ${h} h`;
  }
  return STATUS[syncState.status] || '';
}
