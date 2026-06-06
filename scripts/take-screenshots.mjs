/**
 * Screenshot Automation for RPG Village Migration Review
 *
 * Usage:
 *   node scripts/take-screenshots.mjs [v1|v2|both]
 *
 * Defaults to 'both' if no argument is provided.
 *
 * Prerequisites:
 *   1. Both v1 and v2 must be built:
 *        npx vite build              # builds v1 → dist/index.html
 *        npx vite build --config vite.v2.config.js  # builds v2 → dist/index_v2.html
 *   2. Playwright + Chromium must be installed:
 *        npm install --save-dev playwright
 *        npx playwright install chromium
 *
 * Outputs:
 *   ux/_migration_screenshots/v1_<flow>_001.png
 *   ux/_migration_screenshots/v1_<flow>_002.png
 *   ux/_migration_screenshots/v2_<flow>_001.png
 *   ux/_migration_screenshots/v2_<flow>_002.png
 */

import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 8765;
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const OUT_DIR = path.resolve(process.cwd(), 'ux/_migration_screenshots');

const version = process.argv[2] || 'both';

// ── Simple static file server ─────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(DIST_DIR, url.split('?')[0]);
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.json': 'application/json',
  };

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

async function takeScreenshots(page, selectors, prefix) {
  // Clear storage for clean state
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();

  // Wait for save slot screen
  await page.waitForSelector(selectors.saveSlotScreen, { timeout: 15000 });
  await page.waitForTimeout(500);

  // Click first empty slot
  const emptySlot = await page.$(selectors.emptySlot);
  if (emptySlot) {
    const actionBtn = await emptySlot.$(selectors.emptySlotAction);
    if (actionBtn) await actionBtn.click();
    else await emptySlot.click();
  } else {
    console.log(`[${prefix}] WARNING: no empty slot found`);
    const firstSlot = await page.$(selectors.anySlot);
    if (firstSlot) await firstSlot.click();
  }

  // Wait for intro dialog
  await page.waitForSelector(selectors.introOverlay, { timeout: 15000 });
  await page.waitForTimeout(1200); // let fade-in animation finish

  // Screenshot 001: intro dialog
  await page.screenshot({ path: path.join(OUT_DIR, `${prefix}_start_new_game_001.png`), fullPage: false });
  console.log(`[${prefix}] Screenshot 001 saved`);

  // Dismiss intro (Skip if available, otherwise click through)
  const skipBtn = await page.$(selectors.introSkip);
  if (skipBtn) {
    await skipBtn.click();
  } else {
    for (let i = 0; i < 5; i++) {
      const nextBtn = await page.$(selectors.introNext);
      if (nextBtn) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      } else break;
    }
  }

  // Wait for village page
  await page.waitForSelector(selectors.villagePage, { timeout: 15000 });
  await page.waitForTimeout(800);

  // Screenshot 002: village main screen
  await page.screenshot({ path: path.join(OUT_DIR, `${prefix}_start_new_game_002.png`), fullPage: false });
  console.log(`[${prefix}] Screenshot 002 saved`);
}

server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1300 } });

  // Ensure output directory exists
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  // ── v1 (Vanilla JS) ────────────────────────────────────────────────
  if (version === 'v1' || version === 'both') {
    const page = await context.newPage();
    await page.goto(`http://localhost:${PORT}/index.html`);
    await takeScreenshots(page, {
      saveSlotScreen: '.save-slots-screen',
      emptySlot: '.save-slot-card.empty',
      emptySlotAction: '.slot-action',
      anySlot: '.save-slot-card',
      introOverlay: '.presentation-overlay',
      introSkip: '.presentation-skip',
      introNext: '.presentation-next',
      villagePage: '.village-dashboard-grid, #main-content'
    }, 'v1');
    await page.close();
  }

  // ── v2 (Vue 3) ─────────────────────────────────────────────────────
  if (version === 'v2' || version === 'both') {
    const page = await context.newPage();
    await page.goto(`http://localhost:${PORT}/index_v2.html`);
    await takeScreenshots(page, {
      saveSlotScreen: '.save-slot-page, .slot-card',
      emptySlot: '.slot-card.empty',
      emptySlotAction: '.slot-action-new, button',
      anySlot: '.slot-card',
      introOverlay: '.presentation-overlay',
      introSkip: '.presentation-skip',
      introNext: '.presentation-next',
      villagePage: '.village-page, .dashboard-row'
    }, 'v2');
    await page.close();
  }

  await browser.close();
  server.close();
  console.log('All screenshots done!');
});
