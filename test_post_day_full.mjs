import { chromium } from 'playwright'
import { startServer } from './scripts/screenshots/utils/server.mjs'
import { DIST_DIR } from './scripts/screenshots/config.mjs'
import { startNewGame } from './scripts/screenshots/utils/setup.mjs'
import { injectHero, refreshUI } from './scripts/screenshots/utils/state-injector.mjs'

const server = await startServer(DIST_DIR, 8765)
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1600, height: 1300 } })
const page = await context.newPage()

await page.goto('http://localhost:8765/index_v2.html', { waitUntil: 'networkidle' })

const selectors = {
  saveSlotScreen: '.save-slot-page, .slot-card',
  emptySlot: '.slot-card.empty',
  saveSlot: '.slot-card',
  introOverlay: '.presentation-overlay',
  introSkip: '.presentation-skip',
  mainView: '.app-main',
}

await startNewGame(page, 'v2', selectors)

await injectHero(page, 'v2', { name: 'Aria', origin: 'origin_arcane_initiate', level: 10 })
await page.waitForTimeout(500)

const heroId = await page.evaluate(() => {
  const e = window.__ENGINE__
  const hero = e?.heroService?.heroes?.find(h => h.name === 'Aria')
  return hero?.id
})

await page.evaluate(({ heroId }) => {
  const e = window.__ENGINE__
  if (e?.expeditionService?.assignExpedition) {
    e.expeditionService.assignExpedition('exp_tutorial_cave', [heroId])
  }
}, { heroId })

await refreshUI(page, 'v2')

// Loop: nextDay -> if battle -> skip + resolve -> repeat
for (let day = 1; day <= 10; day++) {
  await page.evaluate(() => {
    const e = window.__ENGINE__
    e.nextDay()
  })
  await page.waitForTimeout(1200)
  
  // Check if combat overlay is open
  const combatOverlay = await page.$('.fullview-overlay')
  if (combatOverlay) {
    console.log(`Day ${day}: Combat detected, skipping...`)
    await page.evaluate(() => {
      const e = window.__ENGINE__
      e.skipBattle()
      e.resolveBattle()
    })
    await page.waitForTimeout(800)
  }
  
  // Check for expedition result modal
  const resultModal = await page.$('.modal-overlay .expedition-result-content, .expedition-result')
  if (resultModal) {
    console.log(`Day ${day}: Expedition result modal found!`)
    break
  }
  
  // Also check if expedition is no longer active
  const expState = await page.evaluate(() => {
    const e = window.__ENGINE__
    return {
      active: e?.expeditionService?.state?.activeExpeditions?.length,
      completed: e?.expeditionService?.state?.completedExpeditions?.length,
    }
  })
  console.log(`Day ${day}: active=${expState.active}, completed=${expState.completed}`)
}

// Check final overlays
const overlays = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('.modal-overlay')).map(el => ({
    className: el.className,
    text: el.textContent.slice(0, 300),
  }))
})
console.log('Final overlays:', JSON.stringify(overlays, null, 2))

await browser.close()
server.close()
