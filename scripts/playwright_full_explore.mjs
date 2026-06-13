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

async function screenshot(page, name) {
  const p = join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log(`Screenshot: ${name}.png`);
}

async function findButtonsByText(page, textPattern) {
  const all = await page.locator('button, [role="button"], .nav-btn, .tab-btn, .action-btn, .btn, .slot-card, .nav-item').all();
  const matches = [];
  for (const el of all) {
    const text = await el.textContent();
    if (text && text.toLowerCase().includes(textPattern.toLowerCase())) {
      matches.push({ el, text: text.trim() });
    }
  }
  return matches;
}

async function playGame() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  await page.goto(gamePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Start game
  const slots = await page.locator('.slot-card').all();
  await slots[0].click();
  await page.waitForTimeout(2000);

  // Skip story
  let pageNum = 1;
  while (true) {
    const overlay = page.locator('.presentation-overlay.visible, .presentation-overlay');
    if (await overlay.count() === 0 || !(await overlay.isVisible())) break;
    const nextBtn = page.locator('.presentation-overlay .btn-primary, .presentation-overlay .presentation-next');
    if (await nextBtn.count() > 0) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
      pageNum++;
      if (pageNum > 10) break;
    } else break;
  }

  await screenshot(page, 'village_main');
  console.log('=== VILLAGE PAGE ===');
  let text = await page.textContent('body');
  console.log(text.substring(0, 2000));

  // Navigate to HEROES
  const heroesNav = await findButtonsByText(page, 'heroes');
  if (heroesNav.length > 0) {
    console.log(`\n--- Clicking HEROES nav ---`);
    await heroesNav[0].el.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'heroes_page');
    console.log('=== HEROES PAGE ===');
    text = await page.textContent('body');
    console.log(text.substring(0, 2000));
  }

  // Navigate to ADVENTURE
  const advNav = await findButtonsByText(page, 'adventure');
  if (advNav.length > 0) {
    console.log(`\n--- Clicking ADVENTURE nav ---`);
    await advNav[0].el.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'adventure_page');
    console.log('=== ADVENTURE PAGE ===');
    text = await page.textContent('body');
    console.log(text.substring(0, 2000));
  }

  // Navigate to TOWN
  const townNav = await findButtonsByText(page, 'town');
  if (townNav.length > 0) {
    console.log(`\n--- Clicking TOWN nav ---`);
    await townNav[0].el.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'town_page');
    console.log('=== TOWN PAGE ===');
    text = await page.textContent('body');
    console.log(text.substring(0, 2000));
  }

  // Back to Main, click Next Day a few times
  const mainNav = await findButtonsByText(page, 'main');
  if (mainNav.length > 0) {
    await mainNav[0].el.click();
    await page.waitForTimeout(1000);
  }

  for (let day = 1; day <= 3; day++) {
    const nextDay = page.locator('.btn-next-day');
    if (await nextDay.count() > 0) {
      console.log(`\n--- Clicking Next Day (Day ${day}) ---`);
      await nextDay.click();
      await page.waitForTimeout(1500);
      await screenshot(page, `day_${day}_report`);

      // Dismiss any modals
      const acknowledge = await findButtonsByText(page, 'acknowledge');
      if (acknowledge.length > 0) {
        await acknowledge[0].el.click();
        await page.waitForTimeout(800);
      }
      const dismiss = await findButtonsByText(page, 'dismiss');
      if (dismiss.length > 0) {
        await dismiss[0].el.click();
        await page.waitForTimeout(800);
      }
      // Click anywhere on overlay if present
      const overlay = page.locator('.modal-overlay, .event-overlay, .presentation-overlay');
      if (await overlay.count() > 0) {
        try { await overlay.click(); } catch(e) {}
        await page.waitForTimeout(500);
      }
    }
  }

  await screenshot(page, 'final_state');
  console.log('\n=== FINAL STATE ===');
  text = await page.textContent('body');
  console.log(text.substring(0, 2500));

  await browser.close();
  console.log('\nDone! All screenshots saved.');
}

playGame().catch(console.error);
