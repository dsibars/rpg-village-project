/**
 * Magic Circle flow: empty simulator, core drawer, Fire selected, ring drawer, spell composed.
 */

import { waitForVisible, clickNav, clickSubNav } from '../utils/nav.mjs'
import { startNewGame } from '../utils/setup.mjs'
import { selectors } from '../selectors/selectors.mjs'


async function dismissAnyModal(page) {
  const closeBtn = await page.$('.modal-overlay .btn-close, .modal-frame .btn-close, .modal-close, button[aria-label="close"]')
  if (closeBtn) {
    await closeBtn.click().catch(() => {})
    await page.waitForTimeout(400)
  } else {
    const overlay = await page.$('.modal-overlay')
    if (overlay) {
      await overlay.click({ position: { x: 10, y: 10 } }).catch(() => {})
      await page.waitForTimeout(400)
    } else {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)
    }
  }
  try {
    await page.waitForSelector('.modal-overlay', { state: 'hidden', timeout: 2000 })
  } catch { /* ignore */ }
}

export async function run({ page, snap }) {

  await startNewGame(page, selectors)

  // Build arcane_sanctum so simulator button is visible
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (e?.villageService?.state?.infrastructure) {
      e.villageService.state.infrastructure.arcane_sanctum = 1
      e.villageService.save()
    }
  })

  // Open settings then magic simulator
  await clickNav(page, selectors.navSettings)
  await waitForVisible(page, selectors.settingsPanel, 3000)

  const simBtn = await page.$(selectors.openMagicCircleBtn)
  if (simBtn) {
    await simBtn.click()
    await waitForVisible(page, selectors.magicCircleOverlay, 3000)
  }

  // --- magic_circle_empty ---
  await snap({ flow: 'magic-circle', state: 'magic_circle_empty' })

  // --- magic_circle_core_drawer ---
  const coreSlot = await page.$(selectors.magicCircleCoreSlot)
  if (coreSlot) {
    await coreSlot.click()
    await page.waitForTimeout(400)
    await snap({ flow: 'magic-circle', state: 'magic_circle_core_drawer' })
  }

  // --- magic_circle_fire_selected ---
  const fireGlyph = await page.$(selectors.magicCircleFireGlyph)
  if (fireGlyph) {
    await fireGlyph.click()
    await page.waitForTimeout(400)
    await snap({ flow: 'magic-circle', state: 'magic_circle_fire_selected' })
  }

  // --- magic_circle_ring_drawer ---
  // Close current drawer first
  await dismissAnyModal(page)
  const closeBtn = await page.$('.close-btn')
  if (closeBtn) await closeBtn.click()
  await page.waitForTimeout(200)

  const ringSlot = await page.$(selectors.magicCircleRingSlot)
  if (ringSlot) {
    await ringSlot.click()
    await page.waitForTimeout(400)
    await snap({ flow: 'magic-circle', state: 'magic_circle_ring_drawer' })
  }

  // --- magic_circle_spell_composed ---
  // Close drawer and look for composed spell preview
  await dismissAnyModal(page)
  const closeBtn2 = await page.$('.close-btn')
  if (closeBtn2) await closeBtn2.click()
  await page.waitForTimeout(300)
  const composed = await page.$('.mc-element-display, .spell-composed, .composed-spell')
  if (composed) {
    await snap({ flow: 'magic-circle', state: 'magic_circle_spell_composed' })
  }
}
