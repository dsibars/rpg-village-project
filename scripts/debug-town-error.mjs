import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();

const errors = [];
page.on('pageerror', err => {
  console.log('PAGE ERROR:', err.message);
  console.log('STACK:', err.stack);
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
const skipBtn = await page.locator('.presentation-skip');
if (await skipBtn.count() > 0) {
  console.log('Presentation detected, skipping...');
  await skipBtn.click();
  await page.waitForTimeout(1000);
}

// Navigate to Town page
const townNav = await page.locator('nav.footer-nav button:has-text("Town")');
await townNav.click();
await page.waitForTimeout(5000);

// Take screenshot of Town page
await page.screenshot({ path: '/tmp/town-error.png', fullPage: false });

console.log('--- RESULTS ---');
if (errors.length === 0) {
  console.log('No JS errors detected on Town page.');
} else {
  console.log(`Found ${errors.length} error(s):`);
  for (const e of errors) {
    console.log('Message:', e.message);
    console.log('Stack:', e.stack);
  }
}

await browser.close();
process.exit(errors.length > 0 ? 1 : 0);
