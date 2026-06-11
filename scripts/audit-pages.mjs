import { chromium } from 'playwright';
import fs from 'fs';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();

const errors = [];

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

// Pages to test via footer nav
const pages = [
  { id: 'village', label: 'Village', nav: 'Main' },
  { id: 'heroes', label: 'Heroes', nav: 'Heroes' },
  { id: 'adventure', label: 'Adventure', nav: 'Adventure' },
  { id: 'town', label: 'Town', nav: 'Town' },
];

const results = [];

for (const p of pages) {
  console.log(`\n=== Testing ${p.label} ===`);
  
  const navBtn = await page.locator(`nav.footer-nav button:has-text("${p.nav}")`);
  await navBtn.click();
  await page.waitForTimeout(2000);
  
  await skipPresentation();
  await page.waitForTimeout(1000);
  
  // Check body scroll (should be false now)
  const hasBodyScroll = await page.evaluate(() => {
    const html = document.documentElement;
    return html.scrollHeight > html.clientHeight;
  });
  
  // Check if app-main has scroll capability
  const appMainScroll = await page.evaluate(() => {
    const el = document.querySelector('.app-main');
    if (!el) return 'missing';
    return {
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      hasScroll: el.scrollHeight > el.clientHeight,
      overflow: getComputedStyle(el).overflowY
    };
  });
  
  // Check custom scrollbar styling
  const scrollbarStyle = await page.evaluate(() => {
    const el = document.querySelector('.app-main');
    if (!el) return 'missing';
    const styles = getComputedStyle(el);
    return {
      scrollbarWidth: styles.scrollbarWidth,
      scrollbarColor: styles.scrollbarColor
    };
  });
  
  const screenshotPath = `/tmp/audit-${p.id}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Screenshot: ${screenshotPath}`);
  
  results.push({
    page: p.id,
    hasBodyScroll,
    appMainScroll,
    scrollbarStyle,
    errors: errors.length
  });
  
  console.log(`  Body scroll: ${hasBodyScroll ? '⚠️ BAD' : '✅ OK'}`);
  console.log(`  App-main scroll: ${JSON.stringify(appMainScroll)}`);
  console.log(`  Scrollbar style: ${JSON.stringify(scrollbarStyle)}`);
}

// Test Settings via top-bar gear icon
console.log(`\n=== Testing Settings ===`);
const gearBtn = await page.locator('header.top-bar button[title*="Settings"], header.top-bar button:has-text("⚙️")');
if (await gearBtn.count() > 0) {
  await gearBtn.click();
  await page.waitForTimeout(2000);
  
  const hasBodyScroll = await page.evaluate(() => {
    const html = document.documentElement;
    return html.scrollHeight > html.clientHeight;
  });
  
  const screenshotPath = '/tmp/audit-settings.png';
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Screenshot: ${screenshotPath}`);
  console.log(`  Body scroll: ${hasBodyScroll ? '⚠️ BAD' : '✅ OK'}`);
  
  results.push({ page: 'settings', hasBodyScroll, errors: errors.length });
} else {
  console.log('  Settings gear button not found');
}

console.log('\n\n=== AUDIT SUMMARY ===');
for (const r of results) {
  console.log(`\n${r.page.toUpperCase()}:`);
  console.log(`  Body scroll: ${r.hasBodyScroll ? '❌ STILL SCROLLING' : '✅ Contained'}`);
  console.log(`  Errors: ${r.errors > 0 ? '❌ ' + r.errors : '✅ 0'}`);
}

await browser.close();
process.exit(0);
