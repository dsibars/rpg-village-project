import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://localhost:45869');
  await page.waitForSelector('.slot-card', { timeout: 10000 });
  await page.click('.slot-card.empty');
  await page.waitForTimeout(500);
  const btn = await page.$('.slot-action-new, .slot-card button');
  if (btn) await btn.click();
  await page.waitForTimeout(1500);
  const skip = await page.$('.presentation-skip');
  if (skip) await skip.click();
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const e = window.__ENGINE__;
    if (!e?.villageService) return;
    e.villageService.state.population.total = 8;
    e.villageService.state.population.builders = 3;
    e.villageService.state.population.assigned = 0;
    e.villageService.state.population.roles = { builder: 3, farmer: 2, miner: 3, scout: 0 };
    e.villageService.save();
    if (e.update) e.update();
  });
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'screenshots/worker_assignment_v2.png' });
  await browser.close();
})();
