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

async function getAllButtons(page) {
  return await page.locator('button, [role="button"], .nav-btn, .tab-btn, .action-btn, .btn, .slot-card').all();
}

async function playGame() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  await page.goto(gamePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // 1. Save slot screen
  await screenshot(page, '01_save_slots');
  console.log('--- Save Slot Screen ---');
  let btns = await getAllButtons(page);
  console.log(`Buttons: ${btns.length}`);
  for (let i = 0; i < Math.min(btns.length, 10); i++) {
    const t = await btns[i].textContent();
    console.log(`  [${i}] "${t?.trim().substring(0, 40)}"`);
  }

  // Click slot 0
  console.log('\nClicking slot 0...');
  await btns[0].click();
  await page.waitForTimeout(2000);
  await screenshot(page, '02_after_slot');

  // Check for story overlay
  let overlay = page.locator('.presentation-overlay.visible, .presentation-overlay');
  let pageNum = 1;
  while (await overlay.count() > 0 && await overlay.isVisible()) {
    console.log(`\n--- Story overlay page ${pageNum} ---`);
    const text = await page.textContent('.presentation-overlay');
    console.log('Overlay text:', text?.substring(0, 300));
    await screenshot(page, `02_story_${pageNum}`);

    // Find the real "Next" button (not Next Day)
    const nextBtn = page.locator('.presentation-overlay button.btn-primary, .presentation-overlay .presentation-next');
    if (await nextBtn.count() > 0) {
      console.log('Clicking Next...');
      await nextBtn.click();
      await page.waitForTimeout(1200);
      pageNum++;
      if (pageNum > 10) break;
    } else {
      break;
    }
  }

  await screenshot(page, '03_main_game');
  console.log('\n=== Main Game ===');
  btns = await getAllButtons(page);
  console.log(`Total buttons: ${btns.length}`);
  for (let i = 0; i < Math.min(btns.length, 25); i++) {
    const t = await btns[i].textContent();
    const c = await btns[i].getAttribute('class');
    console.log(`  [${i}] "${t?.trim().substring(0, 45)}" (class: ${c?.substring(0, 30)})`);
  }

  const bodyText = await page.textContent('body');
  console.log('\n--- Body text (first 3000) ---');
  console.log(bodyText.substring(0, 3000));

  // Find footer nav
  const navBtns = await page.locator('.footer-nav .nav-btn').all();
  console.log(`\nFooter nav buttons: ${navBtns.length}`);
  for (let i = 0; i < navBtns.length; i++) {
    const t = await navBtns[i].textContent();
    console.log(`  [${i}] "${t?.trim()}"`);
  }

  // Click each nav
  for (let i = 0; i < navBtns.length; i++) {
    const t = await navBtns[i].textContent();
    console.log(`\n--- Clicking nav [${i}]: "${t?.trim()}" ---`);
    await navBtns[i].click();
    await page.waitForTimeout(1500);
    await screenshot(page, `04_nav_${i}_${t?.trim().replace(/[^a-zA-Z]/g, '_')}`);

    // Log buttons on this page
    const pageBtns = await getAllButtons(page);
    console.log(`  Buttons: ${pageBtns.length}`);
    for (let j = 0; j < Math.min(pageBtns.length, 15); j++) {
      const txt = await pageBtns[j].textContent();
      console.log(`    [${j}] "${txt?.trim().substring(0, 40)}"`);
    }

    // Check for tabs
    const tabs = await page.locator('.tab-nav .tab-btn').all();
    if (tabs.length > 0) {
      console.log(`  Tabs: ${tabs.length}`);
      for (let t = 0; t < tabs.length; t++) {
        const tabText = await tabs[t].textContent();
        console.log(`    Tab [${t}]: "${tabText?.trim()}"`);
      }
    }
  }

  // Go to first page and try Next Day
  if (navBtns.length > 0) {
    await navBtns[0].click();
    await page.waitForTimeout(1000);
  }
  const nextDay = page.locator('.btn-next-day');
  if (await nextDay.count() > 0) {
    console.log('\n--- Clicking Next Day ---');
    await nextDay.click();
    await page.waitForTimeout(1500);
    await screenshot(page, '05_after_next_day');
  }

  await browser.close();
  console.log('\nDone!');
}

playGame().catch(console.error);
