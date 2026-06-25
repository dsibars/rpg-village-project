/**
 * Shared setup helper: start a fresh new game and dismiss the intro.
 */

import { waitForVisible, clickElement } from './nav.mjs'
import { refreshUI } from './state-injector.mjs'

export async function startNewGame(page, selectors, reset = true) {
  if (!reset) {
    // Continuing from a previous flow: assume we are already in-game.
    return
  }

  // Direct localStorage wipe: the save-slot registry and all slot data use this prefix.
  // We do this BEFORE reload so the page boots into a clean state.
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('rpg_village_v1_'))
      .forEach((k) => localStorage.removeItem(k))
  })
  await page.reload({ waitUntil: 'networkidle' })
  await waitForVisible(page, selectors.saveSlotScreen, 10000)

  // Click first empty slot
  const emptySlot = await page.$(selectors.emptySlot)
  const slotBtn = emptySlot || (await page.$$(selectors.saveSlot))[0]
  if (slotBtn) await slotBtn.click()

  // Book auto-opens on new game (prologue content is a history_block)
  await waitForVisible(page, selectors.bookView, 10000)
  await page.waitForTimeout(400)

  // Close the book via its own close control; App.vue lands on Heroes and the
  // Day-1 tutorial starts. Screenshot flows other than the dedicated tutorial
  // flow need a clean UI, so mark the Day-1 chain as completed.
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.book-view .btn-close')
    if (closeBtn) closeBtn.click()

    const e = window.__ENGINE__
    if (e?.tutorialService) {
      const day1Ids = ['tutorial_hero_skills', 'tutorial_hero_stats', 'tutorial_build_farm', 'tutorial_expeditions']
      day1Ids.forEach((tid) => e.tutorialService.markCompleted(tid))
      // Make sure no tutorial remains active so the overlay does not block UI
      e.tutorialService.state.activeTutorialId = null
      e.tutorialService.state.currentStepIndex = 0
      e.tutorialService.state.stepData = {}
      if (e.tutorialService._save) e.tutorialService._save()
    }
  })
  await page.waitForTimeout(600)
  await refreshUI(page)
  await page.waitForTimeout(200)

  // Most non-tutorial flows expect to start from the village view.
  await clickElement(page, selectors.navVillage)
  await page.waitForTimeout(500)

  await waitForVisible(page, selectors.mainView, 10000)
}
