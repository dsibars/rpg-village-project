import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();

const errors = [];
const pageErrors = [];

page.on('pageerror', err => {
  pageErrors.push({ message: err.message, stack: err.stack });
});
page.on('console', msg => {
  if (msg.type() === 'error') {
    console.log('CONSOLE ERROR:', msg.text());
  }
});

await page.goto('http://127.0.0.1:3456');
await page.waitForTimeout(3000);

// Screenshot save slot page
await page.screenshot({ path: '/tmp/audit-00-save-slot.png' });

// Click first save slot
await page.click('.slot-card');
await page.waitForTimeout(3000);

// Check for presentation modal
const hasPresentation = await page.locator('.presentation-overlay').count() > 0;
if (hasPresentation) {
  console.log('✅ Presentation modal detected');
  await page.screenshot({ path: '/tmp/audit-01-presentation.png' });
  
  // Check presentation modal styling
  const presStyles = await page.evaluate(() => {
    const overlay = document.querySelector('.presentation-overlay');
    const modal = document.querySelector('.presentation-modal');
    if (!overlay || !modal) return null;
    return {
      overlayPosition: getComputedStyle(overlay).position,
      overlayZIndex: getComputedStyle(overlay).zIndex,
      modalMaxWidth: getComputedStyle(modal).maxWidth,
      modalOverflow: getComputedStyle(modal).overflow
    };
  });
  console.log('Presentation styles:', presStyles);
  
  // Skip presentation
  await page.click('.presentation-skip');
  await page.waitForTimeout(1000);
} else {
  console.log('ℹ️ No presentation modal shown');
}

// Test each page
const pages = [
  { id: 'village', label: 'Village', nav: 'Main' },
  { id: 'heroes', label: 'Heroes', nav: 'Heroes' },
  { id: 'adventure', label: 'Adventure', nav: 'Adventure' },
  { id: 'town', label: 'Town', nav: 'Town' },
];

const results = [];

for (const p of pages) {
  console.log(`\n=== Testing ${p.label} ===`);
  
  await page.click(`nav.footer-nav button:has-text("${p.nav}")`);
  await page.waitForTimeout(2000);
  
  // Check for presentation
  const hasPres = await page.locator('.presentation-overlay').count() > 0;
  if (hasPres) {
    console.log('  Presentation detected, skipping...');
    await page.click('.presentation-skip');
    await page.waitForTimeout(1000);
  }
  
  await page.waitForTimeout(1000);
  
  // Scroll audit
  const scrollInfo = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const appMain = document.querySelector('.app-main');
    const topBar = document.querySelector('header.top-bar');
    const footerNav = document.querySelector('nav.footer-nav');
    
    return {
      bodyScrollHeight: body.scrollHeight,
      bodyClientHeight: body.clientHeight,
      bodyScroll: body.scrollHeight > body.clientHeight,
      htmlScrollHeight: html.scrollHeight,
      htmlClientHeight: html.clientHeight,
      htmlScroll: html.scrollHeight > html.clientHeight,
      appMainScrollHeight: appMain?.scrollHeight || 0,
      appMainClientHeight: appMain?.clientHeight || 0,
      appMainScroll: appMain ? appMain.scrollHeight > appMain.clientHeight : false,
      topBarFixed: topBar ? getComputedStyle(topBar).position === 'fixed' : false,
      footerFixed: footerNav ? getComputedStyle(footerNav).position === 'fixed' : false,
      scrollbarWidth: window.innerWidth - document.documentElement.clientWidth
    };
  });
  
  const screenshotPath = `/tmp/audit-${p.id}.png`;
  await page.screenshot({ path: screenshotPath, fullPage: false });
  
  results.push({ page: p.id, scrollInfo, errors: pageErrors.length });
  pageErrors.length = 0; // reset for next page
  
  console.log(`  Body scroll: ${scrollInfo.bodyScroll ? '❌ YES' : '✅ No'}`);
  console.log(`  HTML scroll: ${scrollInfo.htmlScroll ? '❌ YES' : '✅ No'}`);
  console.log(`  App-main scroll: ${scrollInfo.appMainScroll ? '✅ Yes (expected)' : 'ℹ️ No'}`);
  console.log(`  Top bar fixed: ${scrollInfo.topBarFixed ? '✅ Yes' : '❌ No'}`);
  console.log(`  Footer fixed: ${scrollInfo.footerFixed ? '✅ Yes' : '❌ No'}`);
  console.log(`  Scrollbar width: ${scrollInfo.scrollbarWidth}px`);
}

// Test Settings via gear icon
console.log(`\n=== Testing Settings ===`);
const gearBtn = await page.locator('header.top-bar button:has-text("⚙️")');
if (await gearBtn.count() > 0) {
  await gearBtn.click();
  await page.waitForTimeout(2000);
  
  const scrollInfo = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const appMain = document.querySelector('.app-main');
    return {
      bodyScroll: body.scrollHeight > body.clientHeight,
      htmlScroll: html.scrollHeight > html.clientHeight,
      appMainScroll: appMain ? appMain.scrollHeight > appMain.clientHeight : false
    };
  });
  
  await page.screenshot({ path: '/tmp/audit-settings.png' });
  console.log(`  Body scroll: ${scrollInfo.bodyScroll ? '❌ YES' : '✅ No'}`);
  console.log(`  HTML scroll: ${scrollInfo.htmlScroll ? '❌ YES' : '✅ No'}`);
  console.log(`  App-main scroll: ${scrollInfo.appMainScroll ? '✅ Yes' : 'ℹ️ No'}`);
  
  results.push({ page: 'settings', scrollInfo, errors: pageErrors.length });
} else {
  console.log('  Settings gear button not found');
}

console.log('\n\n=== FINAL AUDIT REPORT ===');
let hasIssues = false;
for (const r of results) {
  console.log(`\n${r.page.toUpperCase()}:`);
  if (r.scrollInfo.bodyScroll || r.scrollInfo.htmlScroll) {
    console.log(`  ❌ BODY SCROLL DETECTED - page scrolls instead of app-main!`);
    hasIssues = true;
  } else {
    console.log(`  ✅ Scroll contained to app-main`);
  }
  if (r.errors > 0) {
    console.log(`  ❌ ${r.errors} JS errors`);
    hasIssues = true;
  }
}

if (!hasIssues) {
  console.log('\n✅ ALL PAGES PASS - No scroll or JS issues detected');
}

await browser.close();
process.exit(0);
