/**
 * Magic Circle flow: empty simulator, core drawer, Fire selected, ring drawer, spell composed.
 */

import { waitForVisible, clickNav } from '../utils/nav.mjs'
import { startNewGame } from '../utils/setup.mjs'
import { selectors } from '../selectors/selectors.mjs'

export async function run({ page, snap, reset = true }) {

  await startNewGame(page, selectors, reset)

  // Build arcane_sanctum so simulator button is visible
  await page.evaluate(() => {
    localStorage.setItem('rpgv_debug', '1')
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
    await page.waitForTimeout(400)
  }

  // --- magic_circle_empty ---
  await snap({ flow: 'magic-circle', state: 'magic_circle_empty' })

  // --- magic_circle_core_drawer ---
  const coreSlot = await page.$(selectors.magicCircleCoreSlot)
  if (coreSlot) {
    await coreSlot.click()
    await page.waitForTimeout(600)
    await snap({ flow: 'magic-circle', state: 'magic_circle_core_drawer' })
  }

  // --- magic_circle_fire_selected ---
  const fireGlyph = await page.$(selectors.magicCircleFireGlyph)
  if (fireGlyph) {
    await fireGlyph.click()
    await page.waitForTimeout(600)
    await snap({ flow: 'magic-circle', state: 'magic_circle_fire_selected' })
  }

  // --- magic_circle_ring_drawer ---
  // Close the glyph palette drawer first, then click a ring slot
  const closeBtn = await page.$('.mc-focused-drawer .close-btn')
  if (closeBtn) {
    await closeBtn.click()
    await page.waitForTimeout(400)
  }

  const ringSlot = await page.$(selectors.magicCircleRingSlot)
  if (ringSlot) {
    await ringSlot.click()
    await page.waitForTimeout(600)
    await snap({ flow: 'magic-circle', state: 'magic_circle_ring_drawer' })
  }

  // --- magic_circle_spell_composed ---
  // Close the ring drawer and take a screenshot of the composed spell
  const closeBtn2 = await page.$('.mc-focused-drawer .close-btn')
  if (closeBtn2) {
    await closeBtn2.click()
    await page.waitForTimeout(400)
  }
  const composed = await page.$('.mc-element-display, .spell-composed, .composed-spell')
  if (composed) {
    await snap({ flow: 'magic-circle', state: 'magic_circle_spell_composed' })
  }
}
