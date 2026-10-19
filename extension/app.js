import { ENGINES, uid, safeUrl, searchTarget, moveLink, validateState } from './model.js';
import { load, save, subscribe } from './storage.js';
import { siteIconSource } from './site-icons.js';

const $ = (selector, root = document) => root.querySelector(selector);
const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const paths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  briefcase: '<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a20 20 0 0 0 18 0M12 12v3"/>',
  sparkles: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', close: '<path d="m6 6 12 12M6 18 18 6"/>',
  settings: '<path d="m9 3-.6 2.1-1.8 1L4.5 6 2 10l1.5 1.5v2L2 15l2.5 4 2.1-.1 1.8 1L9 22h5l.6-2.1 1.8-1 2.1.1 2.5-4-1.5-1.5v-2L21 10l-2.5-4-2.1.1-1.8-1L14 3Z"/><circle cx="11.5" cy="12.5" r="3"/>',
  'arrow-right': '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  'check-square': '<rect x="3" y="3" width="18" height="18" rx="5"/><path d="m8 12 3 3 5-6"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8" cy="8" r="1.5"/><path d="m3 16 5-4 4 4 4-7 5 8"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>', edit: '<path d="m15 4 5 5M4 20l5-1L20 8a3.5 3.5 0 0 0-5-5L4 14Z"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.grid}</svg>`;
const hydrateIcons = root => root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
const wallpaperNames = { paper: '纸间留白', dune: '沙丘日落', forest: '山野之间', night: '深夜墨绿', custom: '我的壁纸' };
let state, drawerView = '', editorContext = null, lastFocus, undoAction, toastTimer, pendingImport, draggingId;
let saveQueue = Promise.resolve(), pendingSaves = 0;

function toast(message, undo, sticky = false) {
  clearTimeout(toastTimer); undoAction = undo;
  $('#toast-text').textContent = message; $('#undo').hidden = !undo; $('#toast').hidden = false;
  if (!sticky) toastTimer = setTimeout(() => { $('#toast').hidden = true; undoAction = null; }, undo ? 9000 : 5000);
}
function persist() {
  const snapshot = structuredClone(state); pendingSaves++;
  $('.local-status').innerHTML = '<span class="local-dot"></span>保存中';
  saveQueue = saveQueue.then(() => save(snapshot)).then(() => {
    if (pendingSaves === 1) $('.local-status').innerHTML = '<span class="local-dot"></span>本地保存';
    return true;
  }).catch(error => {
    console.error('Local storage failed:', error);
    $('.local-status').textContent = '保存失败';
    toast('本地保存失败，请在设置中导出备份，检查浏览器存储空间后重试。', null, true);
    return false;
  }).finally(() => { pendingSaves--; });
  return saveQueue;
}
const activeGroup = () => state.groups.find(g => g.id === state.activeGroup) || state.groups[0];
function renderAppearance() {
  const s = state.settings;
  document.documentElement.style.setProperty('--ui-scale', String(s.uiScale || 1));
  const dark = s.wallpaper === 'night' || (s.theme === 'system' ? matchMedia('(prefers-color-scheme: dark)').matches : s.theme === 'dark');
  document.body.dataset.theme = dark ? 'dark' : 'light'; document.body.dataset.wallpaper = s.wallpaper;
  document.body.classList.toggle('compact', s.compact);
  $('#wallpaper').style.backgroundImage = s.wallpaper === 'custom' ? `url("${s.customWallpaper}")` : '';
  $('#clock-block').hidden = !s.showClock;
  $('#clock').classList.toggle('seconds', s.showSeconds);
  $('#engine').value = s.engine;
  $('#wallpaper-name').textContent = wallpaperNames[s.wallpaper]; renderClock();
}
function renderClock() {
  if (!state || document.hidden) return;
  const now = new Date(), s = state.settings;
  $('#clock').textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', ...(s.showSeconds ? { second: '2-digit' } : {}), hourCycle: 'h23' }).format(now);
  $('#clock').dateTime = now.toISOString();
  $('#date').textContent = new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(now);
  const hour = now.getHours(); const greeting = hour < 6 ? '夜深了' : hour < 12 ? '上午好' : hour < 18 ? '下午好' : '晚上好';
  $('#greeting').textContent = `${greeting}${s.name.trim() ? `，${s.name.trim()}` : '，今天也从容一点'}`;
}
function renderGroups() {
  const icons = ['home', 'briefcase', 'sparkles', 'grid'];
  $('#groups').innerHTML = state.groups.map((g, i) => `<button class="group-button ${g.id === state.activeGroup ? 'active' : ''}" data-group="${esc(g.id)}" aria-label="${esc(g.name)}分组" ${g.id === state.activeGroup ? 'aria-current="page"' : ''}>${icon(icons[i] || 'grid')}<span class="group-label">${esc(g.name)}</span><span class="group-number">${String(g.links.length).padStart(2, '0')}</span></button>`).join('');
}
function renderLinks() {
  const group = activeGroup();
  $('#current-group').textContent = group.name; $('#links-heading').textContent = group.name; $('#link-count').textContent = `${group.links.length} 个网址`;
  $('#links').innerHTML = group.links.map(l => `<article class="link-tile" draggable="true" data-link="${esc(l.id)}"><a class="link-anchor" href="${esc(l.url)}" ${state.settings.newTab ? 'target="_blank"' : ''} rel="noopener noreferrer" title="${esc(l.url)}"><span class="link-icon ${l.glyph.length > 1 ? 'small-glyph' : ''}">${esc(l.glyph)}</span><span class="link-title">${esc(l.title)}</span></a><button class="link-edit" aria-label="编辑 ${esc(l.title)}" data-edit="${esc(l.id)}">${icon('more')}</button></article>`).join('') + `<button class="link-tile add-tile" id="add-link-tile" aria-label="添加网址"><span class="link-icon">${icon('plus')}</span><span>添加网址</span></button>`;
  $('#links').querySelectorAll('[data-link]').forEach(el => {
    const item = group.links.find(l => l.id === el.dataset.link), holder = $('.link-icon', el);
    holder.style.color = item.color;
    const source = siteIconSource(item);
    if (source) {
      const image = document.createElement('img'); image.alt = ''; image.className = 'site-icon'; image.draggable = false;
      image.addEventListener('load', () => { holder.classList.add('has-site-icon'); holder.querySelector('.icon-fallback')?.remove(); });
      image.addEventListener('error', () => { image.remove(); holder.classList.remove('has-site-icon'); }, { once: true });
      holder.textContent = ''; const fallback = document.createElement('span'); fallback.className = 'icon-fallback'; fallback.textContent = item.glyph;
      holder.append(fallback, image); image.src = source;
    }
  });
}
function renderTodoCount() { $('#todo-count').textContent = state.todos.filter(t => !t.done).length; }
function render() { renderAppearance(); renderGroups(); renderLinks(); renderTodoCount(); }

function settingsHTML() {
  const s = state.settings;
  return `<label class="field setting-name"><span>怎么称呼你</span><input id="setting-name" value="${esc(s.name)}" maxlength="30" placeholder="留空也很好"></label>
    <h3>外观与习惯</h3>
    <label class="setting-row">页面主题<select data-setting="theme"><option value="light">浅色</option><option value="dark">深色</option><option value="system">跟随系统</option></select></label>
    <label class="setting-row">界面缩放<select data-setting="uiScale"><option value="1">自动适应</option><option value="1.15">自动 + 15%</option><option value="1.3">自动 + 30%</option><option value="1.5">自动 + 50%</option></select></label>
    ${[['showClock','显示时钟'],['showSeconds','时钟显示秒数'],['newTab','在新标签页打开网址'],['compact','紧凑网址布局']].map(([key,label]) => `<label class="setting-row">${label}<input type="checkbox" data-setting="${key}" ${s[key] ? 'checked' : ''}></label>`).join('')}
    <div class="panel-divider"></div><h3>你的数据，你来保管</h3><p class="hint">网址、分组、待办和壁纸仅保存在当前浏览器。没有账号，也没有云同步。换电脑或移除插件前，请导出一份备份。</p>
    <div class="data-actions"><button id="export-backup" class="secondary-button">导出备份</button><button id="import-backup" class="secondary-button">导入备份</button></div><input type="file" id="backup-file" accept=".json,application/json" hidden>
    <div class="panel-divider"></div><div class="eyebrow">OPEN MONKNOW · 0.1.1</div><p class="hint">无广告 · 无追踪 · 无远程依赖<br>独立开发的新标签页，与 MONKNOW 官方无关联。</p>`;
}
function wallpapersHTML() {
  return `<p class="hint">换个背景，换个心情。每一种都在本地。</p><div class="wallpaper-grid">${['paper','dune','forest','night'].map(key => `<button class="wallpaper-option" data-wallpaper-choice="${key}" aria-pressed="${state.settings.wallpaper === key}"><span class="wallpaper-preview ${key}"></span>${wallpaperNames[key]}</button>`).join('')}</div>
    <button class="upload-button" id="upload-wallpaper">${icon('upload')}选择本地图片</button><input id="wallpaper-file" type="file" accept="image/jpeg,image/png,image/webp" hidden><p class="hint">JPG、PNG 或 WebP，最大 15 MB。自动缩放以节省空间，不会上传到任何服务器。</p>${state.settings.customWallpaper ? '<img id="custom-preview" class="custom-preview" alt="已保存的本地壁纸"><button id="use-custom" class="text-button">使用已保存的图片</button><button id="remove-custom" class="text-button">移除本地图片</button>' : ''}`;
}
function todoHTML() {
  const done = state.todos.filter(t => t.done).length;
  return `<p class="todo-intro">先记下来，再一件一件完成。</p><div class="hint">${done} / ${state.todos.length} 已完成</div><div class="todo-progress"><span id="todo-progress-bar"></span></div>
    <form id="todo-form" class="todo-form"><input id="todo-input" class="text-input" maxlength="200" placeholder="接下来要做什么？" aria-label="新的待办事项" required autocomplete="off"><button type="submit" aria-label="添加待办">${icon('plus')}</button></form><ul class="todo-list">${state.todos.map(t => `<li class="todo-row ${t.done ? 'done' : ''}"><label><input type="checkbox" data-todo="${esc(t.id)}" ${t.done ? 'checked' : ''}><span>${esc(t.text)}</span></label><button class="icon-button" data-delete-todo="${esc(t.id)}" aria-label="删除待办 ${esc(t.text)}">${icon('close')}</button></li>`).join('')}</ul>${!state.todos.length ? `<div class="todo-empty">${icon('check-square')}<p>没有待办的此刻，<br>也可以好好享受。</p></div>` : ''}${done ? '<button class="text-button clear-completed" id="clear-completed">清除已完成</button>' : ''}`;
}
function renderDrawer() {
  const titles = { settings: ['MAKE IT YOURS', '按你的习惯'], wallpaper: ['A CHANGE OF SCENERY', '换一片风景'], todo: ['ONE THING AT A TIME', '今天的待办'], import: ['WELCOME BACK', '导入备份'] };
  $('#drawer-eyebrow').textContent = titles[drawerView][0]; $('#drawer-title').textContent = titles[drawerView][1];
  $('#drawer-content').innerHTML = drawerView === 'settings' ? settingsHTML() : drawerView === 'wallpaper' ? wallpapersHTML() : drawerView === 'todo' ? todoHTML() : importHTML();
  if (drawerView === 'settings') $('[data-setting="theme"]').value = state.settings.theme;
  if (drawerView === 'settings') $('[data-setting="uiScale"]').value = String(state.settings.uiScale || 1);
  if ($('#custom-preview')) $('#custom-preview').src = state.settings.customWallpaper;
  if ($('#todo-progress-bar')) $('#todo-progress-bar').style.width = `${state.todos.length ? state.todos.filter(t => t.done).length / state.todos.length * 100 : 0}%`;
}
function openDrawer(view) {
  lastFocus = document.activeElement; drawerView = view; renderDrawer();
  $('#drawer').hidden = false; $('#scrim').hidden = false; document.body.classList.add('drawer-open'); $('#close-drawer').focus();
}
function closeDrawer() {
  $('#drawer').hidden = true; $('#scrim').hidden = true; document.body.classList.remove('drawer-open'); drawerView = ''; pendingImport = null; lastFocus?.focus();
}

function field(name, label, value = '', extra = '') { return `<label class="field"><span>${label}</span><input name="${name}" value="${esc(value)}" ${extra}></label>`; }
function openEditor(type, itemId) {
  const g = activeGroup(), item = type === 'link' && itemId ? g.links.find(l => l.id === itemId) : null;
  editorContext = { type, groupId: g.id, itemId }; $('#editor-error').textContent = '';
  $('#editor-title').textContent = type === 'link' ? (item ? '编辑网址' : '添加网址') : (itemId ? '编辑分组' : '新建分组');
  $('#editor-fields').innerHTML = type === 'link'
    ? `${field('title','名称',item?.title || '', 'required maxlength="60" placeholder="例如：GitHub"')}${field('url','网址',item?.url || '', 'required maxlength="2048" placeholder="https://example.com" inputmode="url"')}<div class="field-pair">${field('glyph','图标文字',item?.glyph || '', 'maxlength="4" placeholder="可留空，自动取名称首字"')}${field('color','颜色',item?.color || '#43816b', 'type="color"')}</div><label class="field"><span>所在分组</span><select name="group">${state.groups.map(group => `<option value="${esc(group.id)}" ${group.id === g.id ? 'selected' : ''}>${esc(group.name)}</option>`).join('')}</select></label>`
    : field('name','分组名称',itemId ? g.name : '', 'required maxlength="30" placeholder="给这组网址起个名字"');
  if (type === 'link') {
    const label = document.createElement('label'); label.className = 'field';
    label.innerHTML = '<span>网址图标</span><select name="iconMode"><option value="auto">自动识别网站图标</option><option value="text">使用下方文字和颜色</option></select>';
    $('#editor-fields .field-pair').before(label); $('select', label).value = item?.iconMode || 'auto';
  }
  $('#delete-item').hidden = !itemId; $('#delete-item').textContent = type === 'link' ? '删除网址' : '删除分组';
  $('#editor-form button[type="submit"]').textContent = '保存'; $('#editor').showModal();
}
function commitEditor(e) {
  e.preventDefault(); const form = new FormData($('#editor-form')), ctx = editorContext;
  const group = state.groups.find(g => g.id === ctx.groupId);
  try {
    if (ctx.type === 'delete-group') {
      const index = state.groups.indexOf(group); state.groups.splice(index, 1); state.activeGroup = state.groups[0].id;
      persist(); render(); $('#editor').close(); toast('已删除分组及其中的网址', () => { state.groups.splice(index, 0, group); persist(); render(); }); return;
    }
    if (ctx.type === 'link') {
      const title = String(form.get('title')).trim(); if (!title) throw new Error('请填写网址名称');
      const url = safeUrl(form.get('url')); const target = state.groups.find(g => g.id === form.get('group'));
      if (!target) throw new Error('分组已变更，请重新打开编辑窗口');
      if (target.links.length >= 500 && (!ctx.itemId || target !== group)) throw new Error('每个分组最多 500 个网址');
      const item = { id: ctx.itemId || uid(), title, url, glyph: String(form.get('glyph')).trim() || Array.from(title)[0].toUpperCase(), color: form.get('color'), iconMode: form.get('iconMode') === 'text' ? 'text' : 'auto' };
      if (ctx.itemId) {
        const index = group.links.findIndex(l => l.id === ctx.itemId); if (index < 0) throw new Error('网址已变更，请重新打开编辑窗口');
        if (target === group) group.links[index] = item; else { group.links.splice(index, 1); target.links.push(item); }
      } else target.links.push(item);
      state.activeGroup = target.id;
    } else {
      const name = String(form.get('name')).trim(); if (!name) throw new Error('请填写分组名称');
      if (ctx.itemId) group.name = name;
      else {
        if (state.groups.length >= 50) throw new Error('最多可创建 50 个分组');
        const id = uid(); state.groups.push({ id, name, links: [] }); state.activeGroup = id;
      }
    }
    persist(); render(); $('#editor').close(); toast('已保存到本地');
  } catch (error) { $('#editor-error').textContent = error.message; }
}
function deleteCurrentItem() {
  const ctx = editorContext, group = state.groups.find(g => g.id === ctx.groupId);
  if (ctx.type === 'group') {
    if (state.groups.length === 1) { $('#editor-error').textContent = '请至少保留一个分组'; return; }
    editorContext.type = 'delete-group'; $('#editor-title').textContent = '删除这个分组？';
    $('#editor-fields').innerHTML = `<p class="hint">将删除「${esc(group.name)}」及其中的 ${group.links.length} 个网址。删除后可在提示中撤销。</p>`;
    $('#delete-item').hidden = true; $('#editor-form button[type="submit"]').textContent = '确认删除'; return;
  }
  const index = group.links.findIndex(l => l.id === ctx.itemId); if (index < 0) return;
  const [item] = group.links.splice(index, 1); persist(); render(); $('#editor').close();
  toast('已删除网址', () => { const g = state.groups.find(g => g.id === group.id); if (g) { g.links.splice(index, 0, item); persist(); render(); } });
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `open-monknow-${new Date().toISOString().slice(0,10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 15000);
  toast('备份已导出，请妥善保存');
}
function importHTML() {
  return `<div class="import-warning">导入将替换当前所有网址、分组、待办和设置。</div><p class="import-stats">这份备份包含 ${pendingImport.groups.length} 个分组、${pendingImport.groups.reduce((n,g) => n + g.links.length, 0)} 个网址和 ${pendingImport.todos.length} 条待办。</p><p class="hint">建议先导出当前数据。导入完成后，可以在提示中撤销本次导入。</p><div class="import-actions"><button class="secondary-button" id="export-backup">先导出当前数据</button><button class="primary-button" id="confirm-import">替换并导入</button></div>`;
}
async function readBackup(file) {
  if (!file) return;
  try {
    if (file.size > 5 * 1024 * 1024) throw new Error('备份文件不能超过 5 MB');
    pendingImport = validateState(JSON.parse(await file.text())); drawerView = 'import'; renderDrawer(); $('#close-drawer').focus();
  } catch (error) { toast(`无法导入：${error instanceof SyntaxError ? '文件不是有效的 JSON' : error.message}`); }
}
async function readWallpaper(file) {
  if (!file) return;
  const button = $('#upload-wallpaper'); button.disabled = true; button.textContent = '正在处理图片…';
  try {
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('请选择 JPG、PNG 或 WebP 图片');
    if (file.size > 15 * 1024 * 1024) throw new Error('图片不能超过 15 MB');
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1920 / bitmap.width, 1200 / bitmap.height);
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d'); context.fillStyle = '#f6f7f2'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close();
    const data = canvas.toDataURL('image/jpeg', .85); if (data.length > 3000000) throw new Error('图片压缩后仍然过大，请选择更小的图片');
    state.settings.customWallpaper = data; state.settings.wallpaper = 'custom'; const saved = await persist(); renderAppearance();
    if (drawerView === 'wallpaper') renderDrawer(); if (saved) toast('壁纸已保存到本地');
  } catch (error) { toast(`无法使用图片：${error.message}`); }
  finally { if (button.isConnected) { button.disabled = false; button.innerHTML = `${icon('upload')}选择本地图片`; } }
}

function wireEvents() {
  $('#settings-button').onclick = () => openDrawer('settings'); $('#wallpaper-button').onclick = () => openDrawer('wallpaper'); $('#todo-button').onclick = () => openDrawer('todo');
  $('#close-drawer').onclick = closeDrawer; $('#scrim').onclick = closeDrawer;
  $('#add-group').onclick = () => openEditor('group'); $('#edit-group').onclick = () => openEditor('group', state.activeGroup);
  $('#add-link-top').onclick = () => openEditor('link');
  $('#groups').onclick = e => { const button = e.target.closest('[data-group]'); if (button) { state.activeGroup = button.dataset.group; renderGroups(); renderLinks(); persist(); } };
  $('#links').onclick = e => {
    const edit = e.target.closest('[data-edit]');
    if (edit) openEditor('link', edit.dataset.edit); else if (e.target.closest('#add-link-tile')) openEditor('link');
  };
  $('#search-form').onsubmit = e => {
    e.preventDefault(); const target = searchTarget($('#search').value, state.settings.engine);
    if (target) { if (state.settings.newTab) window.open(target, '_blank', 'noopener,noreferrer'); else window.location.assign(target); }
  };
  $('#engine').onchange = e => { state.settings.engine = e.target.value; persist(); $('#search').focus(); };
  $('#editor-form').onsubmit = commitEditor; $('#delete-item').onclick = deleteCurrentItem;
  for (const id of ['close-editor','cancel-editor']) $(`#${id}`).onclick = () => $('#editor').close();
  $('#editor').addEventListener('close', () => { editorContext = null; });
  $('#undo').onclick = () => { const action = undoAction; $('#toast').hidden = true; undoAction = null; action?.(); };
  $('#close-toast').onclick = () => { $('#toast').hidden = true; undoAction = null; };
  $('#drawer-content').addEventListener('change', e => {
    if (e.target.matches('[data-setting]')) { state.settings[e.target.dataset.setting] = e.target.type === 'checkbox' ? e.target.checked : e.target.dataset.setting === 'uiScale' ? Number(e.target.value) : e.target.value; persist(); renderAppearance(); renderLinks(); }
    if (e.target.id === 'setting-name') { state.settings.name = e.target.value.trim(); persist(); renderClock(); }
    if (e.target.id === 'backup-file') readBackup(e.target.files[0]);
    if (e.target.id === 'wallpaper-file') readWallpaper(e.target.files[0]);
    if (e.target.matches('[data-todo]')) {
      const item = state.todos.find(t => t.id === e.target.dataset.todo); if (!item) return; item.done = e.target.checked; persist(); renderTodoCount();
      const id = item.id; renderDrawer(); $(`[data-todo="${CSS.escape(id)}"]`)?.focus();
    }
  });
  $('#drawer-content').addEventListener('click', e => {
    const wallpaper = e.target.closest('[data-wallpaper-choice]');
    if (wallpaper) { state.settings.wallpaper = wallpaper.dataset.wallpaperChoice; persist(); renderAppearance(); renderDrawer(); $(`[data-wallpaper-choice="${state.settings.wallpaper}"]`).focus(); }
    const button = e.target.closest('button'); if (!button) return;
    if (button.id === 'upload-wallpaper') $('#wallpaper-file').click();
    if (button.id === 'use-custom') { state.settings.wallpaper = 'custom'; persist(); renderAppearance(); toast('已使用本地图片'); }
    if (button.id === 'remove-custom') { state.settings.customWallpaper = ''; if (state.settings.wallpaper === 'custom') state.settings.wallpaper = 'paper'; persist(); renderAppearance(); renderDrawer(); }
    if (button.id === 'export-backup') exportBackup();
    if (button.id === 'import-backup') $('#backup-file').click();
    if (button.id === 'confirm-import' && pendingImport) {
      const previous = structuredClone(state); state = pendingImport; pendingImport = null; persist(); render(); closeDrawer();
      toast('备份已导入', () => { state = previous; persist(); render(); });
    }
    if (button.dataset.deleteTodo) {
      const index = state.todos.findIndex(t => t.id === button.dataset.deleteTodo), [item] = state.todos.splice(index, 1);
      persist(); renderTodoCount(); renderDrawer(); $('#todo-input').focus();
      toast('已删除待办', () => { state.todos.splice(index, 0, item); persist(); renderTodoCount(); if (drawerView === 'todo') renderDrawer(); });
    }
    if (button.id === 'clear-completed') {
      const previous = structuredClone(state.todos); state.todos = state.todos.filter(t => !t.done); persist(); renderTodoCount(); renderDrawer(); $('#todo-input').focus();
      toast('已清除完成的待办', () => { const ids = new Set(state.todos.map(t => t.id)); state.todos.push(...previous.filter(t => !ids.has(t.id))); persist(); renderTodoCount(); if (drawerView === 'todo') renderDrawer(); });
    }
  });
  $('#drawer-content').addEventListener('submit', e => {
    if (e.target.id !== 'todo-form') return; e.preventDefault(); const text = $('#todo-input').value.trim(); if (!text) return;
    if (state.todos.length >= 500) { toast('最多保存 500 条待办，请先清理已完成事项'); return; }
    state.todos.push({ id: uid(), text, done: false }); persist(); renderTodoCount(); renderDrawer(); $('#todo-input').focus();
  });
  document.addEventListener('keydown', e => {
    const typing = e.target.matches('input,textarea,select,[contenteditable="true"]');
    if ($('#editor').open) return;
    if (e.key === 'Escape' && drawerView) { closeDrawer(); return; }
    if (drawerView && e.key === 'Tab') {
      const focusable = [...$('#drawer').querySelectorAll('button,input,select,a[href]')].filter(el => !el.disabled && el.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } return;
    }
    if (!drawerView && ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'))) { e.preventDefault(); $('#search').focus(); }
    if ((e.metaKey || e.ctrlKey) && e.key === ',') { e.preventDefault(); if (!drawerView) openDrawer('settings'); }
    if (e.key === 'Escape') $('#search').blur();
  });
  $('#links').addEventListener('dragstart', e => {
    const tile = e.target.closest('[data-link]'); if (!tile) return; draggingId = tile.dataset.link; tile.classList.add('dragging'); e.dataTransfer.setData('text/plain', draggingId); e.dataTransfer.effectAllowed = 'move';
  });
  document.addEventListener('dragend', () => { draggingId = null; document.querySelectorAll('.dragging,.drop-target').forEach(el => el.classList.remove('dragging','drop-target')); });
  for (const container of [$('#links'), $('#groups')]) {
    container.addEventListener('dragover', e => {
      if (!draggingId) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
      e.target.closest('[data-group],[data-link]')?.classList.add('drop-target');
    });
    container.addEventListener('drop', e => {
      if (!draggingId) return; e.preventDefault();
      const targetGroup = e.target.closest('[data-group]')?.dataset.group || state.activeGroup;
      const targetLink = e.target.closest('[data-link]')?.dataset.link;
      const group = state.groups.find(g => g.id === targetGroup);
      if (group.links.length >= 500 && !group.links.some(l => l.id === draggingId)) { toast('每个分组最多 500 个网址'); return; }
      if (moveLink(state, draggingId, targetGroup, targetLink)) { persist(); renderGroups(); renderLinks(); }
      draggingId = null;
    });
  }
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderAppearance);
  document.addEventListener('visibilitychange', renderClock); setInterval(renderClock, 1000);
}

async function init() {
  hydrateIcons(document);
  try { state = await load(); } catch (error) {
    console.error(error); document.body.innerHTML = '<main class="fatal"><h1>暂时无法读取本地数据</h1><p>为了保留原有数据，已停止加载。请重新打开新标签页；如果仍有问题，请保留插件并检查浏览器存储。</p><button class="secondary-button" id="retry">重新读取</button></main>'; $('#retry').onclick = () => location.reload(); return;
  }
  render(); wireEvents();
  subscribe(raw => {
    if (pendingSaves || JSON.stringify(raw) === JSON.stringify(state)) return;
    try { state = validateState(raw); render(); if (drawerView && drawerView !== 'import' && !$('#drawer-content').contains(document.activeElement)) renderDrawer(); } catch { /* never replace a valid state with an invalid one */ }
  });
}
init();
