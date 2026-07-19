import { chromium } from 'playwright';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { extname, join } from 'path';

const distDir = 'dist';
const server = createServer((req, res) => {
  const file = req.url === '/' ? 'index.html' : req.url;
  const path = join(distDir, file);
  try {
    const data = readFileSync(path);
    const ct = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' }[extname(path)] || 'text/plain';
    res.writeHead(200, { 'Content-Type': ct });
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});

server.listen(3457, async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://localhost:3457/index.html', { waitUntil: 'networkidle' });
  
  await page.waitForTimeout(1000);
  await page.click('text=Empty Slot');
  await page.waitForTimeout(500);
  await page.click('text=Start');
  await page.waitForTimeout(2000);
  
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  
  // Use proper injectHero approach
  await page.evaluate(() => {
    const e = window.__ENGINE__;
    if (!e?.heroService?.add) return false;
    e.heroService.add({ name: 'Aria', origin: 'origin_arcane_initiate', level: 10 });
    const h = e.heroService.heroes[e.heroService.heroes.length - 1];
    h.knownFamilies = ['basic_attack', 'power_strike', 'single_strike', 'double_strike'];
    h.techniqueTiers = { basic_attack: 3, power_strike: 2, single_strike: 1, double_strike: 1 };
    h.spellCodex = ['fireball', 'heal'];
    h.gambits = [
      { id: 'g1', conditions: [{ op: 'SINGLE', left: { type: 'ally_hp', operator: '<', value: 0.5 }, right: null }], action: { type: 'skill', payload: 'heal', tier: 1 }, target: 'lowest_hp_ally', enabled: true },
      { id: 'g2', conditions: [{ op: 'SINGLE', left: { type: 'self_hp', operator: '<', value: 0.5 }, right: null }], action: { type: 'defend', payload: 'defend' }, target: 'self', enabled: true },
      { id: 'g3', conditions: [{ op: 'SINGLE', left: { type: 'always', operator: '=', value: true }, right: null }], action: { type: 'skill', payload: 'power_strike', tier: 2 }, target: 'weakest_enemy', enabled: false }
    ];
    h.fallbackAction = 'single_strike';
    if (e.heroService.saveAll) e.heroService.saveAll();
    if (e.update) e.update();
    return true;
  });
  await page.waitForTimeout(400);
  
  const btns = await page.$$('button');
  for (const b of btns) {
    const text = await b.textContent();
    if (text && text.includes('Heroes')) { await b.click(); break; }
  }
  await page.waitForTimeout(400);
  
  const cards = await page.$$('.hero-card');
  if (cards[0]) await cards[0].click();
  await page.waitForTimeout(400);
  
  const allBtns = await page.$$('button');
  for (const b of allBtns) {
    const text = await b.textContent();
    if (text && text.toLowerCase().includes('gambit')) { await b.click(); break; }
  }
  await page.waitForTimeout(600);
  
  await page.screenshot({ path: '/tmp/gambit-editor.png', fullPage: false });
  await browser.close();
  server.close();
  console.log('Screenshot saved to /tmp/gambit-editor.png');
});
