async (page) => {
  const check = (value, message) => { if (!value) throw new Error(message); };
  const results = [];
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion:'reduce' });
  const extURL = page.url();
  // This script runs only in the isolated test profile from extension.config.json.
  const legacy = await page.evaluate(async () => {
    const { createState } = await import('./model.js');
    const old = createState(); delete old.settings.uiScale;
    for (const group of old.groups) for (const link of group.links) delete link.iconMode;
    old.settings.name = '保留的旧数据'; old.todos.push({ id:crypto.randomUUID(), text:'不要丢失的待办', done:false });
    await chrome.storage.local.set({'open-monknow-v1':old}); return old.groups[0].links[0].id;
  });
  await page.reload(); await page.locator('#clock').waitFor();
  check((await page.locator('#greeting').textContent()).includes('保留的旧数据'), 'Legacy settings preserved');
  check(await page.locator('[data-link]').first().getAttribute('data-link') === legacy, 'Legacy link IDs preserved');
  check(await page.locator('#todo-count').textContent() === '1', 'Legacy todos preserved');
  await page.waitForFunction(() => [...document.querySelectorAll('.site-icon')].every(img=>img.complete && img.naturalWidth>0));
  check(await page.locator('.site-icon').count() === 8, 'All eight saved daily shortcuts gain actual icons');
  for (const group of ['work','inspire','ai']) {
    await page.locator(`[data-group="${group}"]`).click();
    await page.waitForFunction(() => [...document.querySelectorAll('.site-icon')].every(img=>img.complete && img.naturalWidth>0));
    check(await page.locator('.site-icon').count() === 2, `Both ${group} icons load`);
  }
  await page.locator('[data-group="daily"]').click();
  const sizes = [];
  for (const [width,height] of [[390,844],[1024,768],[1440,900],[1920,1080],[2560,1440]]) {
    await page.setViewportSize({width,height});
    const data = await page.evaluate(() => ({
      root:parseFloat(getComputedStyle(document.documentElement).fontSize),
      title:parseFloat(getComputedStyle(document.querySelector('.link-title')).fontSize),
      icon:document.querySelector('.link-icon').getBoundingClientRect().width,
      search:document.querySelector('.search-form').getBoundingClientRect().width,
      overflow:document.documentElement.scrollWidth>innerWidth,
      overlap:[...document.querySelectorAll('.link-icon')].some(el=>el.getBoundingClientRect().right>el.closest('.link-tile').getBoundingClientRect().right+1)
    }));
    check(!data.overflow && !data.overlap, `No horizontal overflow or icon overlap at ${width}`);
    sizes.push({width,height,...data});
    await page.screenshot({path:`output/playwright/display-${width}.png`,fullPage:true});
  }
  check(sizes.at(-1).title>sizes[2].title && sizes.at(-1).icon>sizes[2].icon, 'Fonts and icons grow with viewport');
  results.push('Automatic scale grows continuously with viewport; five widths have no overflow');
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('#settings-button').click();
  await page.locator('[data-setting="uiScale"]').selectOption('1.3');
  const enlarged = await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).fontSize));
  check(enlarged>sizes[2].root*1.29, 'Manual scale takes effect');
  await page.locator('#close-drawer').click();
  await page.reload(); await page.locator('#clock').waitFor();
  check(await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).fontSize)) === enlarged, 'Manual scale persists');
  await page.locator('#settings-button').click();
  await page.locator('[data-setting="uiScale"]').selectOption('1.5');
  await page.setViewportSize({width:390,height:844});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth), '150% manual scale has no horizontal overflow at 390px');
  await page.locator('[data-setting="uiScale"]').selectOption('1');
  await page.locator('#close-drawer').click();
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('[aria-label="编辑 Google"]').click();
  await page.locator('select[name="iconMode"]').selectOption('text');
  await page.locator('input[name="glyph"]').fill('自');
  await page.locator('#editor-form button[type="submit"]').click();
  check(await page.locator('[data-link]').first().locator('.site-icon').count() === 0, 'Text icon override works');
  await page.locator('[aria-label="编辑 Google"]').click();
  await page.locator('select[name="iconMode"]').selectOption('auto');
  await page.locator('#editor-form button[type="submit"]').click();
  await page.locator('#add-link-top').click();
  await page.locator('input[name="title"]').fill('新网站');
  await page.locator('input[name="url"]').fill('https://example.com');
  await page.locator('#editor-form button[type="submit"]').click();
  const custom = page.locator('[data-link]').last().locator('.site-icon');
  check((await custom.getAttribute('src')).includes('/_favicon/'), 'Unknown website uses Chrome favicon resource');
  await page.waitForFunction(() => [...document.querySelectorAll('.site-icon')].every(img=>img.complete && img.naturalWidth>0));
  results.push('Custom websites use Chrome favicon API; text icons remain available');
  await page.context().setOffline(true); await page.reload(); await page.locator('#clock').waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll('.site-icon')].every(img=>img.complete && img.naturalWidth>0));
  results.push('Bundled and Chrome favicon resources load offline');
  await page.context().setOffline(false);
  await page.screenshot({path:'output/playwright/display-final.png'});
  check(errors.length===0, 'No browser errors');
  return {results,sizes,manualRoot:enlarged,errors,extURL};
}
