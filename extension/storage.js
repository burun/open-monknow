import { STORAGE_KEY, createState, validateState } from './model.js';
const extension = Boolean(globalThis.chrome?.storage?.local);
export async function load() {
  const raw = extension ? (await chrome.storage.local.get(STORAGE_KEY))[STORAGE_KEY] : JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  return raw ? validateState(raw) : createState();
}
export async function save(state) {
  if (extension) await chrome.storage.local.set({ [STORAGE_KEY]: state });
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
export function subscribe(callback) {
  if (extension) chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes[STORAGE_KEY]?.newValue) callback(changes[STORAGE_KEY].newValue);
  });
  else window.addEventListener('storage', e => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try { callback(JSON.parse(e.newValue)); } catch { /* preserve current state */ }
    }
  });
}
