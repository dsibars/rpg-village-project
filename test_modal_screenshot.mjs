import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1300 } });

page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

await page.goto('file://' + process.cwd() + '/dist/index_v2.html');
await page.waitForTimeout(2000);

// Start new game
const emptySlot = await page.$('.slot-card.empty');
if (emptySlot) {
  await emptySlot.click();
  await page.waitForTimeout(2000);
  for (let i = 0; i < 5; i++) {
    const skipBtn = await page.$('.presentation-skip');
    if (skipBtn) {
      await skipBtn.click();
      await page.waitForTimeout(500);
      break;
    }
    const nextBtn = await page.$('.presentation-next');
    if (nextBtn) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    } else {
      break;
    }
  }
  await page.waitForTimeout(1000);
}

// Navigate to adventure
const navAdventure = await page.$('.footer-nav .nav-item:nth-child(3)');
if (navAdventure) await navAdventure.click();
await page.waitForTimeout(1000);

// Click explore tab
const exploreTab = await page.$('.adventure-page .tab-nav .tab-btn:nth-child(1)');
if (exploreTab) await exploreTab.click();
await page.waitForTimeout(1000);

// Click tree node
const node = await page.$('.tree-node.available');
console.log('Node found:', !!node);
if (node) {
  await node.click();
  console.log('Clicked node');
  
  // Wait for modal
  try {
    await page.waitForSelector('.modal-overlay .expedition-detail', { state: 'visible', timeout: 2000 });
    console.log('Modal detail visible');
  } catch (e) {
    console.log('Modal detail NOT visible:', e.message);
  }
  
  // Check if modal overlay exists
  const modal = await page.$('.modal-overlay');
  console.log('Modal overlay found:', !!modal);
  
  const modalDetail = await page.$('.modal-overlay .expedition-detail');
  console.log('Modal detail found:', !!modalDetail);
  
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'ux/_migration_screenshots/test_modal_screenshot.png' });
}

await browser.close();
