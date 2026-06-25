/**
 * Post-Day Sequence flow: expedition result, narrative unlock toast.
 */

import { waitForVisible, clickElement, clickNav, clickSubNav } from '../utils/nav.mjs'
import { startNewGame } from '../utils/setup.mjs'
import { injectHero, refreshUI } from '../utils/state-injector.mjs'
import { selectors } from '../selectors/selectors.mjs'


export async function run({ page, snap, reset = true }) {

  await startNewGame(page, selectors, reset)

  // Inject a hero and assign to tutorial cave expedition
  await injectHero(page, { name: 'Aria', origin: 'origin_arcane_initiate', level: 5 })

  // Get actual hero ID for assignment
  const heroId = await page.evaluate(() => {
    const e = window.__ENGINE__
    const hero = e?.heroService?.heroes?.find(h => h.name === 'Aria')
    return hero?.id || 'Aria'
  }, {})

  await page.evaluate((heroId) => {
    const e = window.__ENGINE__
    if (!e?.expeditionService?.assignExpedition) return
    e.expeditionService.assignExpedition('exp_tutorial_cave', [heroId])
  }, heroId)

  await refreshUI(page)

  // Advance days until expedition completes
  // v2 tutorial cave has 2 stages; each day triggers combat that must be won
  let expeditionCompleted = false
  for (let day = 1; day <= 5; day++) {
    // Use evaluate-based click to bypass any overlay interception
    await page.evaluate(() => {
      const btn = document.querySelector('.btn-next-day')
      if (btn) btn.click()
    })
    await page.waitForTimeout(1200)

    // If combat overlay is open, force victory and close resolution pane
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
      await refreshUI(page)
      await page.waitForTimeout(300)

      // Click close on combat resolution pane if shown
      const hasResolution = await page.evaluate(() => !!document.querySelector('.combat-resolution'))
      if (hasResolution) {
        await page.evaluate(() => {
          const btn = document.querySelector('.combat-resolution button')
          if (btn) btn.click()
        })
        await page.waitForTimeout(800)
      }
    }

    // Check if expedition result modal appeared (async rendering)
    const hasExpResult = await page.evaluate(() => {
      const modal = document.querySelector('.modal-overlay')
      return modal && modal.textContent.toLowerCase().includes('expedition')
    })
    if (hasExpResult) {
      expeditionCompleted = true
      break
    }
  }

  // --- expedition_result ---
  const resultVisible = await page.$(selectors.expeditionResultModal)
  if (resultVisible) {
    await snap({ flow: 'post-day', state: 'expedition_result' })
    // Close expedition result modal
    await page.evaluate(() => {
      const modal = document.querySelector('.modal-overlay')
      if (modal) {
        const closeBtn = modal.querySelector('.btn-close, .modal-close')
        if (closeBtn) closeBtn.click()
      }
    })
    await page.waitForTimeout(600)
  }

  // Presentations now live in the Book — no overlay to dismiss.
  // Book auto-opens if there are new history_block/milestone entries,
  // but the flow continues without blocking.
  await page.waitForTimeout(400)

  // --- narrative_unlock_toast ---
  // Advance one more day to trigger narrative toasts from unlock service
  await page.evaluate(() => {
    const btn = document.querySelector('.btn-next-day')
    if (btn) btn.click()
  })
  await page.waitForTimeout(1500)

  // Capture narrative toast immediately before it auto-dismisses (8s duration)
  const narrative = await page.$(selectors.narrativeToast)
  if (narrative) {
    await snap({ flow: 'post-day', state: 'narrative_unlock_toast' })
  }

  // Clean up any remaining modals
  for (let attempt = 0; attempt < 15; attempt++) {
    const action = await page.evaluate(() => {
      const modal = document.querySelector('.modal-overlay')
      if (modal) {
        const closeBtn = modal.querySelector('.btn-close, .modal-close')
        if (closeBtn) { closeBtn.click(); return 'modal' }
      }
      return 'none'
    })
    if (action === 'none') break
    await page.waitForTimeout(400)
  }
}
