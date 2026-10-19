import { spawn } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const browserPath = process.env.CHROMIUM_PATH;
if (!browserPath || !process.env.npm_execpath) {
  console.error('Run through npm with an extension-capable Chromium executable:\nCHROMIUM_PATH="/absolute/path/to/chromium" npm run test:browser');
  process.exit(1);
}
await access(browserPath);
const output = resolve('output/playwright'); await mkdir(output, { recursive:true });
const profile = await mkdtemp(resolve(output, 'test-profile-'));
const extension = resolve('extension');
const configPath = resolve(profile, 'config.json');
await writeFile(configPath, JSON.stringify({
  browser: {
    browserName:'chromium', userDataDir:profile,
    launchOptions: {
      executablePath:resolve(browserPath), headless:process.env.HEADED !== '1',
      ignoreDefaultArgs:['--disable-extensions'],
      args:[`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
    },
    contextOptions:{viewport:{width:1440,height:1000}, reducedMotion:'reduce'}
  }, outputDir:output
}, null, 2));
const session = `open-monknow-${process.pid}`;
let step = 0;
async function cli(...args) {
  const result = await new Promise((resolveResult, reject) => {
    const child = spawn(process.execPath, [process.env.npm_execpath, 'exec', '--yes', '--package=@playwright/cli@0.1.22', '--', 'playwright-cli', `-s=${session}`, ...args], { stdio:['ignore','pipe','pipe'] });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    child.on('error', reject);
    child.on('close', code => resolveResult({code,output}));
  });
  await writeFile(resolve(output, `browser-step-${++step}.log`), result.output);
  if (result.code !== 0) throw new Error(result.output);
  // Keep console output compact; full evidence remains in ignored output/.
  const summary = result.output.match(/### Result\n([\s\S]*?)(?=\n###|$)/)?.[1];
  if (summary) console.log(summary);
}
try {
  await cli('open', 'chrome://newtab/', '--config', configPath);
  await cli('snapshot');
  await cli('run-code', '--filename', 'scripts/browser-smoke.js');
  const invalid = JSON.parse(await readFile(resolve(output, 'backup.json'), 'utf8'));
  invalid.groups[0].links[0].url = 'javascript:alert(1)';
  await writeFile(resolve(output, 'invalid-backup.json'), JSON.stringify(invalid));
  await cli('run-code', '--filename', 'scripts/browser-edge-smoke.js');
  await cli('run-code', '--filename', 'scripts/browser-display-smoke.js');
  await cli('run-code', 'async(page) => { await page.evaluate(() => chrome.storage.local.clear()); await page.reload(); await page.setViewportSize({width:1440,height:1000}); await page.emulateMedia({reducedMotion:"reduce"}); await page.locator(".site-icon").first().waitFor(); await page.waitForFunction(() => [...document.querySelectorAll(".site-icon")].every(img=>img.complete && img.naturalWidth>0)); await page.screenshot({path:"output/playwright/overview.png"}); return {documentationScreenshot:"output/playwright/overview.png"}; }');
  console.log('Browser smoke checks passed in an isolated profile.');
} finally {
  await cli('close').catch(error => console.error(error.message));
}
