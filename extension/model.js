export const STORAGE_KEY = 'open-monknow-v1';
export const WALLPAPERS = ['paper', 'dune', 'forest', 'night', 'custom'];
export const UI_SCALES = [1, 1.15, 1.3, 1.5];
export const ENGINES = {
  google: { name: 'Google', url: 'https://www.google.com/search?q=' },
  bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
  baidu: { name: '百度', url: 'https://www.baidu.com/s?wd=' },
  duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' }
};
export const uid = () => crypto.randomUUID();
const link = (title, url, glyph, color) => ({ id: uid(), title, url: new URL(url).href, glyph, color, iconMode: 'auto' });
export function createState() {
  return {
    version: 1,
    settings: { name: '', engine: 'google', wallpaper: 'paper', customWallpaper: '', theme: 'light', showClock: true, showSeconds: false, newTab: false, compact: false, uiScale: 1 },
    activeGroup: 'daily',
    groups: [
      { id: 'daily', name: '日常', links: [
        link('Google', 'https://www.google.com', 'G', '#4285f4'),
        link('Gmail', 'https://mail.google.com', 'M', '#ce5344'),
        link('YouTube', 'https://www.youtube.com', '▶', '#ed4145'),
        link('GitHub', 'https://github.com', 'GH', '#272d35'),
        link('Notion', 'https://www.notion.so', 'N', '#343936'),
        link('哔哩哔哩', 'https://www.bilibili.com', 'bili', '#e56a93'),
        link('豆瓣', 'https://www.douban.com', '豆', '#268352'),
        link('知乎', 'https://www.zhihu.com', '知', '#3681d8')
      ] },
      { id: 'work', name: '工作', links: [link('Google Drive', 'https://drive.google.com', 'D', '#58996a'), link('Linear', 'https://linear.app', 'L', '#6866cb')] },
      { id: 'inspire', name: '灵感', links: [link('Are.na', 'https://www.are.na', '✳', '#57635b'), link('Pinterest', 'https://www.pinterest.com', 'P', '#bf4c50')] },
      { id: 'ai', name: 'AI 工具', links: [link('ChatGPT', 'https://chatgpt.com', '◎', '#388570'), link('Claude', 'https://claude.ai', '✳', '#c17759')] }
    ],
    todos: []
  };
}
export function safeUrl(raw) {
  const value = String(raw).trim();
  if (!value || value.length > 2048) throw new Error('请输入有效的网址');
  // Reject every explicitly supplied scheme except http(s), including javascript/data/file.
  if (/^[a-z][a-z\d+.-]*:/i.test(value) && !/^https?:\/\//i.test(value) && !/^(?:localhost|[^/:\s]+\.\w+):\d+([/?#]|$)/.test(value)) throw new Error('只支持 http 或 https 网址');
  let url;
  try { url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`); }
  catch { throw new Error('请输入有效的网址'); }
  if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) throw new Error('请输入不含登录信息的 http 或 https 网址');
  return url.href;
}
export function searchTarget(query, engine) {
  const q = query.trim();
  if (!q) return null;
  if (/^https?:\/\//i.test(q) || /^(localhost|(?:[\p{L}\d-]+\.)+[\p{L}\d-]+)(:\d+)?([/?#].*)?$/u.test(q)) {
    try { return safeUrl(q); } catch { /* fall back to a search */ }
  }
  return (ENGINES[engine] || ENGINES.google).url + encodeURIComponent(q);
}
export function moveLink(state, linkId, targetGroupId, beforeId) {
  const source = state.groups.find(g => g.links.some(l => l.id === linkId));
  const target = state.groups.find(g => g.id === targetGroupId);
  if (!source || !target || beforeId === linkId) return false;
  const [item] = source.links.splice(source.links.findIndex(l => l.id === linkId), 1);
  const index = target.links.findIndex(l => l.id === beforeId);
  target.links.splice(index < 0 ? target.links.length : index, 0, item);
  return true;
}
function boundedString(value, max, label) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`备份中的${label}无效`);
  return value.trim();
}
export function validateState(raw) {
  if (!raw || raw.version !== 1 || !Array.isArray(raw.groups) || raw.groups.length < 1 || raw.groups.length > 50 || !Array.isArray(raw.todos) || raw.todos.length > 500) throw new Error('不是有效的 Open Monknow v1 备份');
  const ids = new Set();
  const validId = value => {
    const id = boundedString(value, 100, '标识');
    if (ids.has(id)) throw new Error('备份中有重复标识');
    ids.add(id); return id;
  };
  const groups = raw.groups.map(g => {
    if (!g || !Array.isArray(g.links) || g.links.length > 500) throw new Error('分组内容无效');
    return { id: validId(g.id), name: boundedString(g.name, 30, '分组名称'), links: g.links.map(l => ({
      id: validId(l.id), title: boundedString(l.title, 60, '网址名称'), url: safeUrl(boundedString(l.url, 2048, '网址')),
      glyph: typeof l.glyph === 'string' && l.glyph.trim() ? l.glyph.slice(0, 4) : l.title.slice(0, 2),
      color: /^#[\da-f]{6}$/i.test(l.color) ? l.color : '#43816b', iconMode: l.iconMode === 'text' ? 'text' : 'auto'
    })) };
  });
  const s = raw.settings || {};
  if (s.customWallpaper && (typeof s.customWallpaper !== 'string' || s.customWallpaper.length > 3000000 || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z\d+/=]+$/.test(s.customWallpaper))) throw new Error('壁纸数据无效');
  const settings = {
    name: typeof s.name === 'string' ? s.name.slice(0, 30) : '', engine: Object.hasOwn(ENGINES, s.engine) ? s.engine : 'google',
    wallpaper: WALLPAPERS.includes(s.wallpaper) ? s.wallpaper : 'paper', customWallpaper: s.customWallpaper || '',
    theme: ['light', 'dark', 'system'].includes(s.theme) ? s.theme : 'light', showClock: s.showClock !== false,
    showSeconds: s.showSeconds === true, newTab: s.newTab === true, compact: s.compact === true,
    uiScale: UI_SCALES.includes(s.uiScale) ? s.uiScale : 1
  };
  if (settings.wallpaper === 'custom' && !settings.customWallpaper) settings.wallpaper = 'paper';
  return { version: 1, settings, groups, activeGroup: groups.some(g => g.id === raw.activeGroup) ? raw.activeGroup : groups[0].id,
    todos: raw.todos.map(t => ({ id: validId(t.id), text: boundedString(t.text, 200, '待办'), done: t.done === true })) };
}
