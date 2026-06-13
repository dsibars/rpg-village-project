import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const gamePath = 'file://' + join(__dirname, '../dist/index.html');
const screenshotDir = join(__dirname, '../screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function takeScreenshot(page, name) {
  const path = join(screenshotDir, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log(`Screenshot: ${name}.png`);
  return path;
}

async function logPageInfo(page, label) {
  console.log(`\n=== ${label} ===`);
  const buttons = await page.locator('button, [role="button"], .nav-btn, .tab-btn, .action-btn, .footer-btn').all();
  console.log(`Buttons/interactables: ${buttons.length}`);
  for (let i = 0; i < Math.min(buttons.length, 15); i++) {
    const text = await buttons[i].textContent();
    const cls = await buttons[i].getAttribute('class');
    console.log(`  [${i}] "${text?.trim().substring(0, 40)}" (class: ${cls?.substring(0, 30)})`);
  }

  const headings = await page.locator('h1, h2, h3, .page-title, .top-bar-brand, .top-bar-day').all();
  for (const h of headings) {
    const text = await h.textContent();
    if (text?.trim()) console.log(`  Heading: "${text.trim().substring(0, 50)}"`);
  }
}

async function playGame() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  console.log('Opening game...');
  await page.goto(gamePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 1. Save slot screen
  await takeScreenshot(page, '01_save_slots');
  await logPageInfo(page, 'Save Slot Screen');

  // Click first slot to start new game
  const slotButtons = await page.locator('button').all();
  console.log('\nClicking first save slot...');
  await slotButtons[0].click();
  await page.waitForTimeout(1500);
  await takeScreenshot(page, '02_after_slot_click');
  await logPageInfo(page, 'After Slot Click');

  // Check if we're on intro story screen
  const hasNext = await page.locator('button:has-text("Next"), .next-btn').count() > 0;
  if (hasNext) {
    console.log('\n--- Story intro detected, clicking Next ---');
    // Click through all story pages
    let pageNum = 1;
    while (true) {
      const nextBtn = page.locator('button:has-text("Next"), .next-btn');
      if (await nextBtn.count() === 0) break;
      await takeScreenshot(page, `03_intro_page_${pageNum}`);
      await nextBtn.click();
      await page.waitForTimeout(1000);
      pageNum++;
      if (pageNum > 5) break; // Safety
    }
  }

  await takeScreenshot(page, '04_main_game');
  await logPageInfo(page, 'Main Game Screen');

  // Get full page text for analysis
  const bodyText = await page.textContent('body');
  console.log('\n--- Full page text (first 2000 chars) ---');
  console.log(bodyText.substring(0, 2000));

  // Try to find and click footer nav buttons to explore pages
  const navButtons = await page.locator('.footer-nav .nav-btn, .nav-btn, [class*="nav"]').all();
  console.log(`\nFound ${navButtons.length} nav buttons`);

  for (let i = 0; i < Math.min(navButtons.length, 6); i++) {
    const text = await navButtons[i].textContent();
    console.log(`\n--- Clicking nav [${i}]: "${text?.trim()}" ---`);
    try {
      await navButtons[i].click();
      await page.waitForTimeout(1200);
      await takeScreenshot(page, `05_nav_${i}_${text?.trim().replace(/\s+/g, '_').substring(0, 20)}`);
      await logPageInfo(page, `Nav ${i}: ${text?.trim()}`);
    } catch (e) {
      console.log(`Click failed: ${e.message}`);
    }
  }

  // Try clicking "Next Day" button if it exists
  const nextDayBtn = page.locator('button:has-text("Next Day"), .next-day-btn, [class*="next-day"]').first();
  if (await nextDayBtn.count() > 0) {
    console.log('\n--- Clicking Next Day ---');
    await nextDayBtn.click();
    await page.waitForTimeout(1500);
    await takeScreenshot(page, '06_after_next_day');
  }

  // Try to find and click on heroes or any tabs
  const tabs = await page.locator('.tab-btn, [class*="tab"]').all();
  console.log(`\nFound ${tabs.length} tabs`);
  for (let i = 0; i < Math.min(tabs.length, 5); i++) {
    const text = await tabs[i].textContent();
    console.log(`\n--- Clicking tab [${i}]: "${text?.trim()}" ---`);
    try {
      await tabs[i].click();
      await page.waitForTimeout(1000);
      await takeScreenshot(page, `07_tab_${i}_${text?.trim().replace(/\s+/g, '_').substring(0, 20)}`);
    } catch (e) {
      console.log(`Tab click failed: ${e.message}`);
    }
  }

  await browser.close();
  console.log('\nDone! All screenshots saved to screenshots/');
}

playGame().catch(console.error);
