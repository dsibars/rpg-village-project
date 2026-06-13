import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const gamePath = 'file://' + join(__dirname, '../dist/index.html');

async function playGame() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  console.log('Opening game...');
  await page.goto(gamePath, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Screenshot 1: Initial state
  await page.screenshot({ path: '/tmp/game_01_initial.png', fullPage: false });
  console.log('Screenshot 1: Initial state saved');

  // Check what's on the page
  const text = await page.textContent('body');
  console.log('Page text (first 1000 chars):', text.substring(0, 1000));

  // Check for buttons and interactive elements
  const buttons = await page.locator('button').all();
  console.log(`Found ${buttons.length} buttons`);
  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    const btnText = await buttons[i].textContent();
    console.log(`  Button ${i}: "${btnText?.trim()}"`);
  }

  // Screenshot 2: After analyzing
  await page.screenshot({ path: '/tmp/game_02_buttons.png', fullPage: false });

  // Try clicking the first button if it exists
  if (buttons.length > 0) {
    try {
      await buttons[0].click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: '/tmp/game_03_after_click.png', fullPage: false });
      console.log('Screenshot 3: After first click saved');
    } catch (e) {
      console.log('Click failed:', e.message);
    }
  }

  // Check for any input fields or save slots
  const inputs = await page.locator('input').all();
  console.log(`Found ${inputs.length} inputs`);

  const links = await page.locator('a').all();
  console.log(`Found ${links.length} links`);

  const divs = await page.locator('div[class]').all();
  console.log(`Found ${divs.length} divs with classes`);
  for (let i = 0; i < Math.min(divs.length, 15); i++) {
    const cls = await divs[i].getAttribute('class');
    const txt = await divs[i].textContent();
    console.log(`  Div ${i}: class="${cls}" text="${txt?.trim().substring(0, 50)}"`);
  }

  await browser.close();
  console.log('Done! Screenshots saved to /tmp/game_*.png');
}

playGame().catch(console.error);
