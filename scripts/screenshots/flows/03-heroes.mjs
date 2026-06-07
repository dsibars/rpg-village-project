/**
 * Heroes flow: list, selection, detail, skills/equipment/consumables modals.
 */

import { waitForVisible, clickNav, clickElement } from '../utils/nav.mjs'
import { startNewGame } from '../utils/setup.mjs'
import { injectHero, refreshUI } from '../utils/state-injector.mjs'
import { v1Selectors as s1 } from '../selectors/v1.mjs'
import { v2Selectors as s2 } from '../selectors/v2.mjs'

function getSelectors(version) {
  return version === 'v1' ? s1 : s2
}

async function dismissAnyModal(page) {
  // v2 modals use .btn-close inside .modal-overlay; v1 uses various close buttons
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

export async function run({ page, version, snap }) {
  const selectors = getSelectors(version)

  await startNewGame(page, version, selectors)
  await clickNav(page, selectors.navHeroes)
  await waitForVisible(page, selectors.heroList, 3000)

  // Ensure at least 3 heroes exist
  await injectHero(page, version, { name: 'Aria', origin: 'origin_arcane_initiate', level: 1 })
  await injectHero(page, version, { name: 'Bran', origin: 'origin_warrior', level: 3 })
  await injectHero(page, version, { name: 'Cora', origin: 'origin_ranger', level: 5 })
  await refreshUI(page, version)
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

  // --- heroes_modal_skills ---
  if (await clickHeroAction('skills')) {
    await waitForVisible(page, selectors.heroSkillsModal, 2000)
    await snap({ flow: 'heroes', state: 'heroes_modal_skills' })
    await dismissAnyModal(page)
  }

  // --- heroes_modal_equipment ---
  if (await clickHeroAction('equipment')) {
    await waitForVisible(page, selectors.heroEquipmentModal, 2000)
    await snap({ flow: 'heroes', state: 'heroes_modal_equipment' })
    await dismissAnyModal(page)
  }

  // --- heroes_modal_consumables ---
  // v2 button text is "🧪 Use Item"; try both labels
  if (await clickHeroAction('use item') || await clickHeroAction('consumables')) {
    await waitForVisible(page, selectors.heroConsumablesModal, 2000)
    await snap({ flow: 'heroes', state: 'heroes_modal_consumables' })
    await dismissAnyModal(page)
  }
}
