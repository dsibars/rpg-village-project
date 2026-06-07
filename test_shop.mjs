import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 } });

await page.goto('http://localhost:4173/index_v2.html', { waitUntil: 'networkidle' });

// Clear localStorage and start fresh
await page.evaluate(() => {
  Object.keys(localStorage).filter(k => k.startsWith('rpg_village_v1_')).forEach(k => localStorage.removeItem(k));
});
await page.reload({ waitUntil: 'networkidle' });

// Click first slot
const slot = await page.$('.slot-card');
if (slot) await slot.click();

// Skip prologue
await page.waitForSelector('.presentation-overlay', { timeout: 10000 });
const skip = await page.$('.presentation-skip');
if (skip) await skip.click();
await page.waitForSelector('.presentation-overlay', { state: 'hidden', timeout: 5000 });

// Unlock shop by completing tutorial cave
await page.evaluate(() => {
  const e = window.__ENGINE__;
  if (e?.expeditionService?.state) {
    e.expeditionService.state.completedIds = ['exp_tutorial_cave'];
    e.expeditionService.save();
  }
});
await page.evaluate(() => {
  if (window.__ENGINE__) window.__ENGINE__.update();
});
await page.waitForTimeout(400);

// Navigate to Town > Shop
await page.click('.footer-nav .nav-item:nth-child(4)');
await page.waitForSelector('.town-page', { timeout: 3000 });
await page.click('.tab-nav .tab-btn:nth-child(2)'); // Shop tab
await page.waitForTimeout(800);

// Take buy tab screenshot
await page.screenshot({ path: '/home/dsibars/development/rpg-village-project/ux/_migration_screenshots/test_shop_buy.png' });

// Click first item to see detail pane
const firstItem = await page.$('.shop-item-row');
if (firstItem) await firstItem.click();
await page.waitForTimeout(300);
await page.screenshot({ path: '/home/dsibars/development/rpg-village-project/ux/_migration_screenshots/test_shop_detail.png' });

// Click sell tab
const tabs = await page.$$('.shop-tab');
if (tabs.length >= 2) await tabs[1].click();
await page.waitForTimeout(500);
await page.screenshot({ path: '/home/dsibars/development/rpg-village-project/ux/_migration_screenshots/test_shop_sell.png' });

// Click resources tab
if (tabs.length >= 3) await tabs[2].click();
await page.waitForTimeout(500);
await page.screenshot({ path: '/home/dsibars/development/rpg-village-project/ux/_migration_screenshots/test_shop_resources.png' });

await browser.close();
