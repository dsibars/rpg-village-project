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

// Inject strong hero
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

for (let attempt = 0; attempt < 5; attempt++) {
  // Click next day
  await page.evaluate(() => {
    const btn = document.querySelector('.btn-next-day')
    if (btn) btn.click()
  })
  await page.waitForTimeout(1500)
  
  // If combat overlay open, enable auto-battle and wait
  const combatOverlay = await page.$('.fullview-overlay')
  if (combatOverlay) {
    console.log(`Attempt ${attempt + 1}: Combat open, enabling auto-battle...`)
    
    // Click auto-combat toggle
    await page.evaluate(() => {
      const toggle = document.querySelector('.auto-combat-toggle, button:has-text("Auto-Combat")')
      if (toggle) toggle.click()
    })
    
    // Wait for battle to resolve
    let waited = 0
    while (waited < 5000) {
      await page.waitForTimeout(500)
      waited += 500
      const overlayGone = await page.evaluate(() => !document.querySelector('.fullview-overlay'))
      if (overlayGone) {
        console.log(`Combat resolved after ${waited}ms`)
        break
      }
    }
    
    // Resolve battle in engine
    await page.evaluate(() => {
      const e = window.__ENGINE__
      if (e?.resolveBattle) e.resolveBattle()
    })
    await page.waitForTimeout(500)
  }
  
  // Check for expedition result
  const resultModal = await page.$('.modal-overlay')
  if (resultModal) {
    const text = await resultModal.evaluate(el => el.textContent.slice(0, 200))
    console.log(`Modal found: ${text}`)
    if (text.includes('Expedition') || text.includes('expedition')) {
      console.log('Expedition result modal found!')
      break
    }
  }
  
  const expState = await page.evaluate(() => {
    const e = window.__ENGINE__
    return {
      active: e?.expeditionService?.state?.activeExpeditions?.length,
    }
  })
  console.log(`Attempt ${attempt + 1}: active=${expState.active}`)
}

await browser.close()
server.close()
