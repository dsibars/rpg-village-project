import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const gamePath = 'file://' + join(__dirname, '../dist/index.html');
const screenshotDir = join(__dirname, '../screenshots');

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function takeScreenshot(page, name) {
  const path = join(screenshotDir, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`Screenshot: ${name}.png`);
}

async function logButtons(page, label) {
  console.log(`\n=== ${label} ===`);
  const all = await page.locator('button, [role="button"], .nav-btn, .tab-btn, .action-btn, .footer-btn, .btn').all();
  console.log(`Total clickable elements: ${all.length}`);
  for (let i = 0; i < Math.min(all.length, 20); i++) {
    const text = await all[i].textContent();
    const cls = await all[i].getAttribute('class');
    console.log(`  [${i}] "${text?.trim().substring(0, 45)}" (class: ${cls?.substring(0, 35)})`);
  }
}

async function playGame() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  await page.goto(gamePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 1. Save slots
  await takeScreenshot(page, '01_save_slots');
  await logButtons(page, 'Save Slots');

  // Click first slot
  const slots = await page.locator('.slot-card').all();
  console.log(`\nClicking slot 0...`);
  await slots[0].click();
  await page.waitForTimeout(1500);
  await takeScreenshot(page, '02_village_initial');
  await logButtons(page, 'Village Page (Initial)');

  // Capture full text
  const text = await page.textContent('body');
  console.log('\n--- Page text (first 2500 chars) ---');
  console.log(text.substring(0, 2500));

  // Find footer/nav buttons
  const footerNav = await page.locator('.footer-nav .nav-btn').all();
  console.log(`\nFound ${footerNav.length} footer nav buttons`);

  // Click each nav button and screenshot
  for (let i = 0; i < footerNav.length; i++) {
    const navText = await footerNav[i].textContent();
    console.log(`\n--- Clicking nav [${i}]: "${navText?.trim()}" ---`);
    await footerNav[i].click();
    await page.waitForTimeout(1500);
    await takeScreenshot(page, `03_nav_${i}_${navText?.trim().replace(/[^a-zA-Z0-9]/g, '_')}`);
    await logButtons(page, `Page: ${navText?.trim()}`);

    // If page has tabs, click them too
    const tabs = await page.locator('.tab-nav .tab-btn').all();
    if (tabs.length > 0) {
      console.log(`  Found ${tabs.length} tabs`);
      for (let t = 0; t < Math.min(tabs.length, 4); t++) {
        const tabText = await tabs[t].textContent();
        console.log(`  Clicking tab [${t}]: "${tabText?.trim()}"`);
        await tabs[t].click();
        await page.waitForTimeout(800);
        await takeScreenshot(page, `04_nav_${i}_tab_${t}_${tabText?.trim().replace(/[^a-zA-Z0-9]/g, '_')}`);
      }
    }
  }

  // Go back to village and click Next Day
  if (footerNav.length > 0) {
    await footerNav[0].click();
    await page.waitForTimeout(800);
  }
  const nextDay = page.locator('.btn-next-day');
  if (await nextDay.count() > 0) {
    console.log('\n--- Clicking Next Day ---');
    await nextDay.click();
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '05_after_next_day');
  }

  // Try clicking on a building tile
  const tiles = await page.locator('.village-tile.active').all();
  if (tiles.length > 0) {
    console.log(`\n--- Clicking first active building tile ---`);
    await tiles[0].click();
    await page.waitForTimeout(1000);
    await takeScreenshot(page, '06_building_clicked');
  }

  await browser.close();
  console.log('\nDone! Screenshots in screenshots/');
}

playGame().catch(console.error);
