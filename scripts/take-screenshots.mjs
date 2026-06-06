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
 *   ux/_migration_screenshots/v1_<flow>_<nnn>_<name>.png
 *   ux/_migration_screenshots/v2_<flow>_<nnn>_<name>.png
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

let screenshotCounter = 1;

async function snap(page, name, prefix) {
  const num = String(screenshotCounter++).padStart(3, '0');
  const fileName = `${prefix}_start_new_game_${num}_${name}.png`;
  await page.screenshot({ path: path.join(OUT_DIR, fileName), fullPage: false });
  console.log(`[${prefix}] Screenshot ${num} (${name}) saved`);
}

async function takeScreenshots(page, selectors, prefix) {
  screenshotCounter = 1;

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
  await page.waitForTimeout(1200);

  // 001: intro dialog
  await snap(page, 'intro', prefix);

  // Dismiss intro
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

  // 002: village main screen
  await snap(page, 'village', prefix);

  // ── Heroes ──
  await clickNav(page, selectors.navHeroes);
  await page.waitForTimeout(800);
  await snap(page, 'heroes', prefix);

  // Hero detail (click first hero)
  await clickElement(page, selectors.heroCard);
  await page.waitForTimeout(800);
  await snap(page, 'heroes_detail', prefix);

  // ── Adventure / Explore ──
  await clickNav(page, selectors.navAdventure);
  await page.waitForTimeout(800);
  await snap(page, 'explore', prefix);

  // Expedition detail (click first node/card)
  await clickElement(page, selectors.expeditionNode);
  await page.waitForTimeout(800);
  await snap(page, 'explore_detail', prefix);
  // Dismiss any modal that may have opened
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  // Also try clicking modal close button or overlay for v1
  if (prefix === 'v1') {
    // v1 BaseModal uses .btn-close-modal inside .modal-overlay
    const closeBtn = await page.$('.btn-close-modal');
    if (closeBtn) {
      await closeBtn.click().catch(() => {});
      await page.waitForTimeout(400);
    }
    // Also try clicking the overlay edge (not center where modal-body is)
    const overlay = await page.$('.modal-overlay');
    if (overlay) {
      // Click at top-left corner of overlay to ensure we hit the overlay itself
      const box = await overlay.boundingBox();
      if (box) {
        await page.mouse.click(box.x + 5, box.y + 5);
        await page.waitForTimeout(400);
      }
    }
  }

  // Bestiary
  await clickSubNav(page, selectors.subNavBestiary);
  await page.waitForTimeout(800);
  await snap(page, 'bestiary', prefix);

  // Codex
  await clickSubNav(page, selectors.subNavCodex);
  await page.waitForTimeout(800);
  await snap(page, 'codex', prefix);

  // Chronicle
  await clickSubNav(page, selectors.subNavChronicle);
  await page.waitForTimeout(800);
  await snap(page, 'chronicle', prefix);

  // ── Town / Buildings ──
  await clickNav(page, selectors.navTown);
  await page.waitForTimeout(800);
  await snap(page, 'buildings', prefix);

  // Building detail (click first building)
  await clickElement(page, selectors.buildingCard);
  await page.waitForTimeout(800);
  await snap(page, 'buildings_detail', prefix);

  // Shop
  await clickSubNav(page, selectors.subNavShop);
  await page.waitForTimeout(800);
  await snap(page, 'shop', prefix);

  // Forge
  await clickSubNav(page, selectors.subNavForge);
  await page.waitForTimeout(800);
  await snap(page, 'forge', prefix);

  // Inventory
  await clickSubNav(page, selectors.subNavInventory);
  await page.waitForTimeout(800);
  await snap(page, 'inventory', prefix);

  // Settings (sub-nav in v1 town, separate nav in v2)
  if (selectors.subNavSettings) {
    await clickSubNav(page, selectors.subNavSettings);
    await page.waitForTimeout(800);
    await snap(page, 'settings', prefix);
  } else if (selectors.navSettings) {
    await clickNav(page, selectors.navSettings);
    await page.waitForTimeout(800);
    await snap(page, 'settings', prefix);
  }
}

async function clickNav(page, selector) {
  const el = await page.$(selector);
  if (el) {
    try {
      await el.click({ timeout: 3000 });
    } catch (e) {
      await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (element) element.click();
      }, selector);
    }
  } else {
    console.log(`  Nav not found: ${selector}`);
  }
}

async function clickSubNav(page, selector) {
  if (!selector) return;
  const el = await page.$(selector);
  if (el) {
    // Try normal click first; if blocked by overlay, force via evaluate
    try {
      await el.click({ timeout: 3000 });
    } catch (e) {
      // Click directly via JS to bypass overlay interception
      await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (element) element.click();
      }, selector);
    }
  } else {
    console.log(`  Sub-nav not found: ${selector}`);
  }
}

async function clickElement(page, selector) {
  if (!selector) return;
  const el = await page.$(selector);
  if (el) {
    try {
      await el.click({ timeout: 3000 });
    } catch (e) {
      await page.evaluate((sel) => {
        const element = document.querySelector(sel);
        if (element) element.click();
      }, selector);
    }
  } else {
    console.log(`  Element not found: ${selector}`);
  }
}

server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1300 } });

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
      villagePage: '.village-dashboard-grid, #main-content',
      navHeroes: '.nav-item[data-category="heroes"]',
      navAdventure: '.nav-item[data-category="adventure"]',
      navTown: '.nav-item[data-category="town"]',
      subNavBestiary: '.sub-nav-tab[data-subview="bestiary"]',
      subNavCodex: '.sub-nav-tab[data-subview="codex"]',
      subNavChronicle: '.sub-nav-tab[data-subview="chronicle"]',
      subNavShop: '.sub-nav-tab[data-subview="shop"]',
      subNavForge: '.sub-nav-tab[data-subview="forge"]',
      subNavInventory: '.sub-nav-tab[data-subview="inventory"]',
      subNavSettings: '.sub-nav-tab[data-subview="settings"]',
      heroCard: '#heroes-list-container .hero-card',
      buildingCard: '.building-card',
      expeditionNode: '.tree-node, .expedition-card',
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
      villagePage: '.village-page, .dashboard-row',
      navHeroes: '.footer-nav .nav-item:nth-child(2), .nav-item:nth-child(2)',
      navAdventure: '.footer-nav .nav-item:nth-child(3), .nav-item:nth-child(3)',
      navTown: '.footer-nav .nav-item:nth-child(4), .nav-item:nth-child(4)',
      subNavBestiary: '.tab-nav .tab-btn:nth-child(2)',
      subNavCodex: '.tab-nav .tab-btn:nth-child(3)',
      subNavChronicle: '.tab-nav .tab-btn:nth-child(4)',
      subNavShop: '.tab-nav .tab-btn:nth-child(2)',
      subNavForge: '.tab-nav .tab-btn:nth-child(3)',
      subNavInventory: '.tab-nav .tab-btn:nth-child(4)',
      subNavSettings: null,
      navSettings: '.top-bar-right .btn-quick:last-child',
      heroCard: '.hero-list-item',
      buildingCard: '.building-card',
      expeditionNode: '.tree-node, .expedition-card',
    }, 'v2');
    await page.close();
  }

  await browser.close();
  server.close();
  console.log('All screenshots done!');
});
