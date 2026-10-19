import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
await mkdir('dist', { recursive:true });
await rm('dist/open-monknow', { recursive:true, force:true });
await cp('extension', 'dist/open-monknow', { recursive:true });
await cp('LICENSE', 'dist/open-monknow/LICENSE');
await cp('THIRD_PARTY_NOTICES.md', 'dist/open-monknow/THIRD_PARTY_NOTICES.md');
await cp('docs/installation.md', 'dist/open-monknow/INSTALL.md');
await cp('docs/installation.md', 'dist/INSTALL.md');
const { version } = JSON.parse(await readFile('extension/manifest.json', 'utf8'));
const archive = `open-monknow-${version}.zip`;
await rm(`dist/${archive}`, { force:true });
execFileSync('zip', ['-qr', archive, 'open-monknow'], { cwd:'dist' });
const sums = [];
for (const file of [archive, 'INSTALL.md']) {
  const content = await readFile(`dist/${file}`);
  sums.push(`${createHash('sha256').update(content).digest('hex')}  ${file}`);
}
await writeFile('dist/SHA256SUMS.txt', sums.join('\n') + '\n');
console.log(`Chrome unpacked folder: dist/open-monknow\nArchive: dist/${archive}\nInstallation: dist/INSTALL.md\nChecksums: dist/SHA256SUMS.txt`);
