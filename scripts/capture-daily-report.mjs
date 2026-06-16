import { chromium } from 'playwright'
import { startServer } from './screenshots/utils/server.mjs'
import { DIST_DIR, OUT_DIR, PORT } from './screenshots/config.mjs'
import fs from 'fs'

fs.mkdirSync(OUT_DIR, { recursive: true })

const server = await startServer(DIST_DIR, PORT)
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
const page = await context.newPage()

await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle' })

// Start new game by selecting slot 1 (empty)
await page.evaluate(() => {
  const slots = document.querySelectorAll('.save-slot-card')
  if (slots.length > 0) slots[0].click()
})
await page.waitForTimeout(1200)

// Skip prologue if it appears
for (let i = 0; i < 5; i++) {
  const hasSkip = await page.evaluate(() => !!document.querySelector('.presentation-skip'))
  if (!hasSkip) break
  await page.evaluate(() => {
    const btn = document.querySelector('.presentation-skip')
    if (btn) btn.click()
  })
  await page.waitForTimeout(400)
}
await page.waitForTimeout(600)

// Advance a few days to trigger various report sections
for (let day = 1; day <= 3; day++) {
  await page.evaluate(() => {
    const btn = document.querySelector('.btn-next-day')
    if (btn) btn.click()
  })
  await page.waitForTimeout(1200)

  // Handle combat if any
  let hasOverlay = await page.evaluate(() => !!document.querySelector('.fullview-overlay'))
  if (hasOverlay) {
    await page.evaluate(() => {
      const e = window.__ENGINE__
      if (e?.battleService) {
        e.battleService.autoBattle = true
        for (let i = 0; i < 50; i++) {
          if (e.battleService.isOver) break
          try { e.battleService.nextTurn() } catch (err) { break }
        }
      }
    })
    await page.waitForTimeout(500)
    await page.evaluate(() => {
      const btn = document.querySelector('.combat-resolution button')
      if (btn) btn.click()
    })
    await page.waitForTimeout(600)
  }

  // Close expedition result modal if shown
  const hasExpResult = await page.evaluate(() => {
    const modal = document.querySelector('.modal-overlay')
    return modal && modal.textContent.toLowerCase().includes('expedition')
  })
  if (hasExpResult) {
    await page.evaluate(() => {
      const modal = document.querySelector('.modal-overlay')
      if (modal) {
        const closeBtn = modal.querySelector('.btn-close, .modal-close, button')
        if (closeBtn) closeBtn.click()
      }
    })
    await page.waitForTimeout(600)
  }

  // Skip presentations
  for (let i = 0; i < 10; i++) {
    const hasPres = await page.evaluate(() => !!document.querySelector('.presentation-overlay'))
    if (!hasPres) break
    await page.evaluate(() => {
      const btn = document.querySelector('.presentation-skip')
      if (btn) btn.click()
    })
    await page.waitForTimeout(400)
  }

  // Capture daily report modal if visible
  const hasDailyReport = await page.evaluate(() => {
    const modal = document.querySelector('.modal-overlay')
    return modal && modal.textContent.toLowerCase().includes('daily report')
  })
  if (hasDailyReport) {
    await page.screenshot({ path: `${OUT_DIR}/daily-report-day-${day}.png`, fullPage: false })
    await page.evaluate(() => {
      const modal = document.querySelector('.modal-overlay')
      if (modal) {
        const closeBtn = modal.querySelector('.btn-close, .modal-close, button')
        if (closeBtn) closeBtn.click()
      }
    })
    await page.waitForTimeout(400)
  }
}

// Inject a rich daily report and force the modal to show
await page.evaluate(() => {
  const e = window.__ENGINE__
  if (!e) return
  e.villageService.setDailyReport({
    day: 10,
    consumed: 5,
    starvation: false,
    growth: 1,
    minerYield: { wood: 3, stone: 2 },
    completed: ['farm', 'warehouse'],
    recovery: [
      { heroName: 'Arthur', amount: 2 },
      { heroName: 'Merlin', amount: 8 },
      { heroName: 'Lancelot', amount: 2 },
      { heroName: 'Gwen', amount: 5 }
    ],
    training: [
      { heroName: 'Arthur', leveledUp: false, xpGain: 12 },
      { heroName: 'Merlin', leveledUp: true, xpGain: 45 },
      { heroName: 'Lancelot', leveledUp: false, xpGain: 12 }
    ],
    expedition: {
      status: 'completed',
      expId: 'exp_tutorial_cave',
      expName: 'Tiny Cave',
      reward: { gold: 50, items: { material_wood: 3, material_iron: 1 } },
      drops: {
        loot: { material: 'iron', type: 'sword' },
        consumables: [{ id: 'potion_health', qty: 2 }],
        glyphs: [{ tabletId: 'tablet_fire' }]
      }
    },
    tavernRecruit: { name: 'Robin', origin: 'origin_ranger' },
    raid: { isVictory: true, defensePower: 150, raidPower: 80, goldReward: 25 }
  })
})

// Trigger the modal to show by dispatching recallDailyReport
await page.evaluate(() => {
  const app = document.querySelector('.app-root')
  if (!app) return
  // Find the Vue instance and trigger the modal
  const vueApp = app.__vue_app__ || app.__VUE__
  if (!vueApp) return
  // Look for a button or nav that triggers recallDailyReport
  const villagePage = document.querySelector('.village-page')
  if (villagePage) {
    const btn = villagePage.querySelector('.btn-recall-report')
    if (btn) btn.click()
  }
})

await page.waitForTimeout(300)

// Check if modal is visible
const hasModal = await page.evaluate(() => {
  const modal = document.querySelector('.modal-overlay')
  return modal && modal.textContent.toLowerCase().includes('daily report')
})
if (hasModal) {
  await page.screenshot({ path: `${OUT_DIR}/daily-report-injected.png`, fullPage: false })
}

await browser.close()
server.close()
console.log('Screenshots captured in', OUT_DIR)
