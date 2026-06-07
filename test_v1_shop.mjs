import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 } });
await page.goto('http://localhost:4173/index.html', { waitUntil: 'networkidle' });
// Clear and start fresh
await page.evaluate(() => {
  Object.keys(localStorage).filter(k => k.startsWith('rpg_village_v1_')).forEach(k => localStorage.removeItem(k));
});
await page.reload({ waitUntil: 'networkidle' });
// Wait a bit for slot screen
await page.waitForTimeout(500);
const slot = await page.$('.slot-card');
if (slot) await slot.click();
await page.waitForTimeout(500);
// Skip intro
const skip = await page.$('#intro-skip');
if (skip) await skip.click();
await page.waitForTimeout(800);
// Navigate to Town > Shop
await page.click('#nav-town');
await page.waitForTimeout(300);
await page.click('[data-subview="shop"]');
await page.waitForTimeout(500);
await page.screenshot({ path: '/home/dsibars/development/rpg-village-project/ux/_migration_screenshots/v1_ref_shop.png' });
await browser.close();
