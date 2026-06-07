import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 } });

await page.goto('http://localhost:4173/index_v2.html');
await page.waitForLoadState('networkidle');

// Clear localStorage
await page.evaluate(() => {
  Object.keys(localStorage)
    .filter((k) => k.startsWith('rpg_village_v1_'))
    .forEach((k) => localStorage.removeItem(k));
});

await page.reload({ waitUntil: 'networkidle' });

// Wait for save slot screen
await page.waitForSelector('.slot-card', { timeout: 10000 });

// Click first empty slot
const emptySlot = await page.$('.slot-card.empty');
const slotBtn = emptySlot || (await page.$$('.slot-card'))[0];
if (slotBtn) await slotBtn.click();

// Wait for presentation overlay and skip
await page.waitForSelector('.presentation-overlay', { timeout: 10000 });
await page.waitForTimeout(400);
const skipBtn = await page.$('.presentation-skip');
if (skipBtn) await skipBtn.click();

// Wait for overlay to hide
await page.waitForSelector('.presentation-overlay', { state: 'hidden', timeout: 5000 });
await page.waitForTimeout(300);

// Wait for main view
await page.waitForSelector('.app-main', { timeout: 10000 });

// Pre-seed bestiary
await page.evaluate(() => {
  const e = window.__ENGINE__;
  if (e?.expeditionService?.state) {
    e.expeditionService.state.bestiary = ['goblin_grunt', 'slime_green'];
    e.expeditionService.save();
  }
  if (e?.unlockService?.state) {
    e.unlockService.state.shownNarratives = ['first_hero_level_5', 'first_building_complete'];
    e.unlockService.state.unlockedCodexFeatures = ['shop', 'forge'];
    e.unlockService.save();
  }
});

// Refresh UI
await page.evaluate(() => {
  if (window.__ENGINE__) {
    const state = window.__ENGINE__.update();
    if (window.__VUE_APP__) {
      const gs = window.__VUE_APP__._instance?.provides?.gameState;
      if (gs) gs.value = state;
    }
  }
});

// Click navAdventure
await page.click('.footer-nav .nav-item:nth-child(3)');
await page.waitForSelector('.adventure-page', { timeout: 3000 });
await page.waitForTimeout(300);

// Click explore tab
await page.click('.adventure-page .tab-nav .tab-btn:nth-child(1)');
await page.waitForTimeout(500);

// Take tree view screenshot
await page.screenshot({ path: '/home/dsibars/development/rpg-village-project/ux/_migration_screenshots/test_tree_orchestrator.png' });

// Click available node
const node = await page.$('.explore-tab .tree-node.available, .tree-node.available');
console.log('Node found:', !!node);
if (node) {
  const className = await node.evaluate(el => el.className);
  console.log('Node class:', className);
  await node.click();
  await page.waitForTimeout(500);
  
  // Check for modal
  const modal = await page.$('.modal-overlay');
  console.log('Modal found after click:', !!modal);
  
  // Check for detail pane content
  const detail = await page.$('.explore-tab .detail-pane');
  console.log('Detail pane found:', !!detail);
  
  await page.screenshot({ path: '/home/dsibars/development/rpg-village-project/ux/_migration_screenshots/test_detail_orchestrator.png' });
}

await browser.close();
