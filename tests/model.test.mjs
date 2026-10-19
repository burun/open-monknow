import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, validateState, safeUrl, searchTarget, moveLink } from '../extension/model.js';
test('defaults round-trip through a backup without loss', () => {
  const state = createState(); assert.deepEqual(validateState(JSON.parse(JSON.stringify(state))), state);
});
test('URLs accept https/http and reject executable schemes and credentials', () => {
  assert.equal(safeUrl('example.com/path?q=1'), 'https://example.com/path?q=1');
  assert.equal(safeUrl('http://127.0.0.1:3000'), 'http://127.0.0.1:3000/');
  for (const unsafe of ['javascript:alert(1)', 'data:text/html,test','file:///tmp/a','chrome://settings','https://user:password@example.com','', 'https://']) assert.throws(() => safeUrl(unsafe));
});
test('search encodes Chinese and reserved characters; direct URLs navigate', () => {
  assert.equal(searchTarget('荷兰语 & A2', 'google'), 'https://www.google.com/search?q=%E8%8D%B7%E5%85%B0%E8%AF%AD%20%26%20A2');
  assert.equal(searchTarget('github.com/morluto/rea', 'bing'), 'https://github.com/morluto/rea');
  assert.equal(searchTarget('javascript:alert(1)', 'bing'), 'https://www.bing.com/search?q=javascript%3Aalert(1)');
  assert.equal(searchTarget('  ', 'google'), null);
});
test('dragging reorders in one group and moves across groups without loss', () => {
  const s = createState(), [a,b] = s.groups[0].links;
  assert.equal(moveLink(s,b.id,'daily',a.id),true); assert.equal(s.groups[0].links[0].id,b.id);
  moveLink(s,a.id,'work'); assert.ok(!s.groups[0].links.some(l => l.id === a.id)); assert.equal(s.groups[1].links.at(-1).id,a.id);
  const before = structuredClone(s); assert.equal(moveLink(s,a.id,'missing'),false); assert.deepEqual(s,before);
  assert.equal(moveLink(s,a.id,'work',a.id),false);
});
test('backup validation blocks malicious URLs, duplicate IDs, oversized and invalid data', () => {
  const s = createState(); s.groups[0].links[0].url = 'javascript:alert(1)'; assert.throws(() => validateState(s));
  const dup = createState(); dup.groups[0].links[0].id = dup.groups[0].id; assert.throws(() => validateState(dup));
  const img = createState(); img.settings.customWallpaper = 'data:image/svg+xml,<svg onload="alert(1)"/>'; assert.throws(() => validateState(img));
  const long = createState(); long.groups[0].name = 'a'.repeat(31); assert.throws(() => validateState(long));
  assert.throws(() => validateState({version:2,groups:[],todos:[]}));
  assert.throws(() => validateState(null));
});
test('backup normalizes settings and strips unknown fields', () => {
  const s = createState(); s.settings.engine = '__proto__'; s.settings.wallpaper = 'custom'; s.settings.theme = 'invalid'; s.tracker = 'remote'; s.settings.extra = 'remote';
  const valid = validateState(s); assert.equal(valid.settings.engine, 'google'); assert.equal(valid.settings.wallpaper, 'paper'); assert.equal(valid.settings.theme, 'light'); assert.equal(valid.tracker,undefined); assert.equal(valid.settings.extra,undefined);
});
