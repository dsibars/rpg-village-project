import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 8766;
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const OUT_DIR = path.resolve(process.cwd(), 'scripts/screenshots/output');

const server = http.createServer((req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url;
  const filePath = path.join(DIST_DIR, url.split('?')[0]);
  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html', '.js': 'application/javascript',
    '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp',
  };
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

async function takeMagicCircleScreenshot(page, url, prefix, selectors) {
  await page.goto(url);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();

  // Wait for save slot screen and click first empty slot
  await page.waitForSelector(selectors.saveSlotScreen, { timeout: 15000 });
  const emptySlot = await page.$(selectors.emptySlot);
  if (emptySlot) {
    const actionBtn = await emptySlot.$(selectors.emptySlotAction);
    if (actionBtn) await actionBtn.click();
    else await emptySlot.click();
  }

  // Skip intro
  await page.waitForSelector(selectors.introOverlay, { timeout: 15000 });
  const skipBtn = await page.$(selectors.introSkip);
  if (skipBtn) await skipBtn.click();
  await page.waitForTimeout(500);

  // Wait for village and navigate to settings
  await page.waitForSelector(selectors.villagePage, { timeout: 15000 });

  if (selectors.navSettings) {
    await clickNav(page, selectors.navSettings);
  }
  await page.waitForTimeout(800);

  // Take settings screenshot
  await page.screenshot({ path: path.join(OUT_DIR, `${prefix}_magic_circle_001_settings.png`), fullPage: false });

  // Click Magic Circle Simulator button
  const simBtn = await page.$(selectors.magicSimulatorBtn);
  if (simBtn) {
    await simBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT_DIR, `${prefix}_magic_circle_002_simulator.png`), fullPage: false });

    // Click core slot to open drawer
    const coreSlot = await page.$(selectors.coreSlot);
    if (coreSlot) {
      await coreSlot.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(OUT_DIR, `${prefix}_magic_circle_003_drawer_core.png`), fullPage: false });

      // Select a core glyph (Fire)
      const fireGlyph = await page.$(selectors.fireGlyphCard);
      if (fireGlyph) {
        await fireGlyph.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(OUT_DIR, `${prefix}_magic_circle_004_fire_selected.png`), fullPage: false });
      }
    }

    // Click a ring slot
    const ringSlot = await page.$(selectors.ringSlot);
    if (ringSlot) {
      await ringSlot.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(OUT_DIR, `${prefix}_magic_circle_005_drawer_ring.png`), fullPage: false });
    }
  } else {
    console.log(`[${prefix}] Magic Circle Simulator button NOT FOUND`);
  }
}

async function clickNav(page, selector) {
  const el = await page.$(selector);
  if (el) {
    try { await el.click({ timeout: 3000 }); }
    catch (e) {
      await page.evaluate((sel) => { const element = document.querySelector(sel); if (element) element.click(); }, selector);
    }
  } else {
    console.log(`  Nav not found: ${selector}`);
  }
}

server.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1300 } });

  const page = await context.newPage();
  await takeMagicCircleScreenshot(page, `http://localhost:${PORT}/index.html`, 'app', {
    saveSlotScreen: '.save-slot-page, .slot-card',
    emptySlot: '.slot-card.empty',
    emptySlotAction: '.slot-action-new, button',
    introOverlay: '.presentation-overlay',
    introSkip: '.presentation-skip',
    villagePage: '.village-page, .dashboard-row',
    navSettings: '.top-bar-right .btn-quick:last-child',
    magicSimulatorBtn: 'button:has(.btn-icon:has-text("🔮"))',
    coreSlot: '.mandala-slot.core-slot',
    fireGlyphCard: '.mc-palette-card',
    ringSlot: '.mandala-slots button:not(.core-slot):not(.locked)',
  });
  await page.close();

  await browser.close();
  server.close();
  console.log('Done!');
});
