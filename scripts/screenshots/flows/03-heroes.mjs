/**
 * Heroes flow: list, selection, detail, skills/equipment/consumables modals.
 */

import { waitForVisible, clickNav, clickElement } from '../utils/nav.mjs'
import { startNewGame } from '../utils/setup.mjs'
import { injectHero, refreshUI } from '../utils/state-injector.mjs'
import { selectors } from '../selectors/selectors.mjs'


async function dismissAnyModal(page) {
  // modals use .btn-close inside .modal-overlay
  const closeBtn = await page.$('.modal-overlay .btn-close, .modal-frame .btn-close, .modal-close, button[aria-label="close"]')
  if (closeBtn) {
    await closeBtn.click().catch(() => {})
    await page.waitForTimeout(400)
  } else {
    // Fallback: press Escape
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }
  // Wait for overlay to actually disappear (v2)
  try {
    await page.waitForSelector('.modal-overlay', { state: 'hidden', timeout: 2000 })
  } catch { /* ignore */ }
}

export async function run({ page, snap }) {

  await startNewGame(page, selectors)
  await clickNav(page, selectors.navHeroes)
  await waitForVisible(page, selectors.heroList, 3000)

  // Ensure at least 3 heroes exist
  await injectHero(page, { name: 'Aria', origin: 'origin_arcane_initiate', level: 1 })
  await injectHero(page, { name: 'Bran', origin: 'origin_warrior', level: 3 })
  await injectHero(page, { name: 'Cora', origin: 'origin_guard', level: 5 })
  await refreshUI(page)
  await page.waitForTimeout(300)

  // Dismiss any stray modal before interacting with hero list
  await dismissAnyModal(page)

  // Helper: click a button in hero-quick-links by its label text
  async function clickHeroAction(labelSubstring) {
    return page.evaluate((label) => {
      const buttons = Array.from(document.querySelectorAll('.hero-quick-links button'))
      const target = buttons.find((b) => b.textContent.toLowerCase().includes(label.toLowerCase()))
      if (target) { target.click(); return true }
      return false
    }, labelSubstring)
  }

  // --- heroes_list_no_selection ---
  await snap({ flow: 'heroes', state: 'heroes_list_no_selection' })

  // --- heroes_list_selected ---
  const firstHero = await page.$(selectors.heroCard)
  if (firstHero) {
    await firstHero.click()
    await page.waitForTimeout(300)
  }
  await snap({ flow: 'heroes', state: 'heroes_list_selected' })

  // --- heroes_detail_stats ---
  const detailTab = await page.$(selectors.heroDetailTab)
  if (detailTab) {
    await detailTab.click()
    await page.waitForTimeout(300)
  }
  await snap({ flow: 'heroes', state: 'heroes_detail_stats' })
}
