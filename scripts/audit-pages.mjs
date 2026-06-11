import { chromium } from 'playwright';
import fs from 'fs';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();

const errors = [];
const warnings = [];

page.on('pageerror', err => {
  errors.push({ message: err.message, stack: err.stack });
});
page.on('console', msg => {
  if (msg.type() === 'error') {
    console.log('CONSOLE ERROR:', msg.text());
  }
});

await page.goto('http://127.0.0.1:3456');
await page.waitForTimeout(3000);

// Click first save slot
await page.click('.slot-card');
await page.waitForTimeout(3000);

// Skip presentation if shown
async function skipPresentation() {
  const skipBtn = await page.locator('.presentation-skip');
  if (await skipBtn.count() > 0) {
    console.log('Presentation detected, skipping...');
    await skipBtn.click();
    await page.waitForTimeout(1000);
  }
}

await skipPresentation();

// Pages to test
const pages = [
  { id: 'village', label: 'Village', nav: 'Main' },
  { id: 'heroes', label: 'Heroes', nav: 'Heroes' },
  { id: 'adventure', label: 'Adventure', nav: 'Adventure' },
  { id: 'town', label: 'Town', nav: 'Town' },
  { id: 'settings', label: 'Settings', nav: 'Settings' },
];

const results = [];

for (const p of pages) {
  console.log(`\n=== Testing ${p.label} ===`);
  
  // Navigate to page
  const navBtn = await page.locator(`nav.footer-nav button:has-text("${p.nav}")`);
  await navBtn.click();
  await page.waitForTimeout(2000);
  
  await skipPresentation();
  await page.waitForTimeout(1000);
  
  // Check for scroll on the whole document
  const hasBodyScroll = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    return html.scrollHeight > html.clientHeight || body.scrollHeight > body.clientHeight;
  });
  
  // Check for app-main scroll
  const appMain = await page.locator('.app-main');
  const hasAppMainScroll = await appMain.evaluate(el => el.scrollHeight > el.clientHeight).catch(() => false);
  
  // Check for styled scrollbar (check if custom scrollbar styles exist)
  const hasCustomScrollbar = await page.evaluate(() => {
    const styles = getComputedStyle(document.documentElement);
    return styles.getPropertyValue('--scrollbar-width') !== '' || 
           document.querySelector('style[data-scrollbar]') !== null;
  });
  
  // Take screenshot
  const screenshotPath = `/tmp/page-${p.id}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Screenshot: ${screenshotPath}`);
  
  // Check for presentation modal
  const hasPresentation = await page.locator('.presentation-overlay').count() > 0;
  
  results.push({
    page: p.id,
    hasBodyScroll,
    hasAppMainScroll,
    hasCustomScrollbar,
    hasPresentation,
    errors: errors.length,
    screenshot: screenshotPath
  });
  
  console.log(`  Body scroll: ${hasBodyScroll}`);
  console.log(`  App-main scroll: ${hasAppMainScroll}`);
  console.log(`  Custom scrollbar: ${hasCustomScrollbar}`);
  console.log(`  Presentation active: ${hasPresentation}`);
}

console.log('\n\n=== AUDIT RESULTS ===');
for (const r of results) {
  console.log(`\n${r.page.toUpperCase()}:`);
  console.log(`  Body scroll: ${r.hasBodyScroll ? '⚠️ YES (bad - should be app-main)' : '✅ No'}`);
  console.log(`  App-main scroll: ${r.hasAppMainScroll ? '✅ Yes (good)' : 'ℹ️ No'}`);
  console.log(`  Custom scrollbar: ${r.hasCustomScrollbar ? '✅ Yes' : '⚠️ No (vanilla scrollbar)'}`);
  console.log(`  Presentation: ${r.hasPresentation ? '⚠️ Still showing!' : '✅ None'}`);
  console.log(`  Errors: ${r.errors > 0 ? '❌ ' + r.errors : '✅ 0'}`);
}

await browser.close();
process.exit(0);
