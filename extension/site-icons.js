// Packaged assets are preferred; unknown sites use Chrome's favicon resource.
// Match hostname boundaries so lookalike domains never get a trusted brand icon.
const sites = {
  'mail.google.com': 'gmail.svg', 'drive.google.com': 'googledrive.svg',
  'calendar.google.com': 'googlecalendar.svg', 'docs.google.com': 'googledocs.svg',
  'google.com': 'google.svg', 'google.nl': 'google.svg', 'google.co.uk': 'google.svg',
  'youtube.com': 'youtube.svg', 'youtu.be': 'youtube.svg', 'github.com': 'github.svg',
  'notion.so': 'notion.svg', 'notion.site': 'notion.svg', 'bilibili.com': 'bilibili.svg',
  'douban.com': 'douban.svg', 'zhihu.com': 'zhihu.svg', 'linear.app': 'linear.svg',
  'pinterest.com': 'pinterest.svg', 'chatgpt.com': 'chatgpt.svg', 'openai.com': 'chatgpt.svg',
  'claude.ai': 'claude.svg', 'reddit.com': 'reddit.svg',
  'stackoverflow.com': 'stackoverflow.svg', 'figma.com': 'figma.svg',
  'vercel.com': 'vercel.svg', 'cloudflare.com': 'cloudflare.svg', 'spotify.com': 'spotify.svg',
  'netflix.com': 'netflix.svg', 'wikipedia.org': 'wikipedia.svg', 'v2ex.com': 'v2ex.svg'
};
export const PACKAGED_ICONS = [...new Set(Object.values(sites))];
export function siteIconPath(rawUrl) {
  let host;
  try { host = new URL(rawUrl).hostname.toLowerCase(); } catch { return null; }
  for (const [domain, file] of Object.entries(sites)) {
    if (host === domain || host.endsWith(`.${domain}`)) return `assets/sites/${file}`;
  }
  return null;
}
export function siteIconSource(link, runtime = globalThis.chrome?.runtime) {
  if (link.iconMode === 'text') return null;
  const local = siteIconPath(link.url);
  if (local) return local;
  if (!runtime?.id || !runtime.getURL) return null;
  const url = new URL(runtime.getURL('_favicon/'));
  url.searchParams.set('pageUrl', link.url); url.searchParams.set('size', '64');
  return url.href;
}
