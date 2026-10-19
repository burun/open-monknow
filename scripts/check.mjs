import { readFile, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { resolve, dirname } from 'node:path';
import { PACKAGED_ICONS } from '../extension/site-icons.js';
const manifest = JSON.parse(await readFile('extension/manifest.json','utf8'));
assert.equal(manifest.manifest_version, 3);
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
assert.equal(pkg.version, manifest.version);
assert.equal(pkg.license, 'MIT');
assert.deepEqual(manifest.permissions, ['storage', 'favicon']);
assert.ok(!manifest.host_permissions?.length);
const html = await readFile('extension/newtab.html','utf8');
assert.ok(!/<script(?![^>]*src=)/.test(html), 'No inline scripts');
for (const file of [manifest.chrome_url_overrides.newtab, ...Object.values(manifest.icons), 'styles.css','app.js','model.js','storage.js']) await readFile(`extension/${file}`);
for (const file of PACKAGED_ICONS) await readFile(`extension/assets/sites/${file}`);
for (const file of await readdir('extension')) if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', `extension/${file}`]);
const app = await readFile('extension/app.js','utf8');
assert.ok(!/\b(fetch|XMLHttpRequest|eval)\s*\(/.test(app));
const markdown = (await readdir('.', { withFileTypes:true })).filter(file => file.isFile() && file.name.endsWith('.md')).map(file => file.name);
for (const file of await readdir('docs', { recursive:true })) if (file.endsWith('.md')) markdown.push(`docs/${file}`);
for (const file of markdown) {
  const source = await readFile(file, 'utf8');
  for (const [, target] of source.matchAll(/!?\[[^\]]*\]\(([^\s)]+)\)/g)) {
    if (/^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith('#')) continue;
    const path = decodeURIComponent(target.split('#')[0]);
    await readFile(resolve(dirname(file), path));
  }
}
console.log('Manifest, packaged resources, script syntax, network boundary and documentation links: passed');
