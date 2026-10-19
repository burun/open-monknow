import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, validateState } from '../extension/model.js';
import { siteIconPath, siteIconSource } from '../extension/site-icons.js';

test('default shortcuts resolve to a bundled or browser icon, including old saved links', () => {
  const runtime = { id:'test', getURL:path => `chrome-extension://test/${path}` };
  for (const group of createState().groups) for (const link of group.links) {
    if (new URL(link.url).hostname !== 'www.are.na') assert.ok(siteIconPath(link.url), link.url);
    assert.ok(siteIconSource({ ...link, iconMode: undefined }, runtime), link.url);
  }
});
test('host-specific icons win over the general domain and reject lookalikes', () => {
  assert.equal(siteIconPath('https://mail.google.com/mail/u/0/'), 'assets/sites/gmail.svg');
  assert.equal(siteIconPath('https://drive.google.com/drive'), 'assets/sites/googledrive.svg');
  assert.equal(siteIconPath('https://github.com/project'), 'assets/sites/github.svg');
  assert.equal(siteIconPath('https://github.com.evil.example/'), null);
  assert.equal(siteIconPath('https://fakegithub.com/'), null);
});
test('unknown websites use Chrome resource without sending domains to a third party', () => {
  const runtime = { id:'test', getURL: path => `chrome-extension://test/${path}` };
  const src = new URL(siteIconSource({url:'https://example.com/path?q=test'}, runtime));
  assert.equal(src.origin, 'null');
  assert.equal(src.protocol, 'chrome-extension:');
  assert.equal(src.searchParams.get('pageUrl'), 'https://example.com/path?q=test');
  assert.equal(src.searchParams.get('size'), '64');
  assert.equal(siteIconSource({url:'https://example.com'}, null), null);
});
test('manual text icons are respected even for recognized sites', () => {
  assert.equal(siteIconSource({url:'https://github.com', iconMode:'text'}), null);
});
test('legacy backups keep links and settings while gaining automatic sizing and icons', () => {
  const old = createState(); delete old.settings.uiScale;
  for (const group of old.groups) for (const link of group.links) delete link.iconMode;
  const updated = validateState(old);
  assert.equal(updated.settings.uiScale, 1);
  assert.equal(updated.groups[0].links[0].iconMode, 'auto');
  assert.deepEqual(updated.groups.map(g=>g.links.map(l=>l.id)), old.groups.map(g=>g.links.map(l=>l.id)));
  old.settings.uiScale = 1.3; assert.equal(validateState(old).settings.uiScale, 1.3);
  old.settings.uiScale = 20; assert.equal(validateState(old).settings.uiScale, 1);
});
