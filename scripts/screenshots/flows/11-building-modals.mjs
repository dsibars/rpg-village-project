/**
 * Building Modals flow: Trainer, Witch, Academy, Hall of Fame.
 *
 * These modals are opened from the hero profile action bar,
 * not from the buildings tab.
 */

import { waitForVisible, clickNav } from '../utils/nav.mjs'
import { startNewGame } from '../utils/setup.mjs'
import { injectHero, refreshUI } from '../utils/state-injector.mjs'
import { selectors } from '../selectors/selectors.mjs'


async function clickActionButton(page, labelSubstring) {
  return page.evaluate((label) => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const target = buttons.find((b) =>
      b.textContent.toLowerCase().includes(label.toLowerCase())
    )
    if (target) {
      target.click()
      return true
    }
    return false
  }, labelSubstring)
}

async function dismissAnyModal(page) {
  const closeBtn = await page.$('.modal-overlay .btn-close, .modal-frame .btn-close, .modal-close, button[aria-label="close"]')
  if (closeBtn) {
    await closeBtn.click().catch(() => {})
    await page.waitForTimeout(400)
  } else {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }
  try {
    await page.waitForSelector('.modal-overlay', { state: 'hidden', timeout: 2000 })
  } catch { /* ignore */ }
}

export async function run({ page, snap }) {

  await startNewGame(page, selectors)
  await injectHero(page, { name: 'Aria', origin: 'origin_arcane_initiate', level: 10 })
  await injectHero(page, { name: 'Bran', origin: 'origin_warrior', level: 10 })

  // Build required infrastructure for buttons to appear
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (e?.villageService?.state?.infrastructure) {
      e.villageService.state.infrastructure.training_grounds = 1
      e.villageService.state.infrastructure.arcane_sanctum = 2
      e.villageService.state.infrastructure.witchs_hut = 1
      e.villageService.save()
    }
  }, {})

  await refreshUI(page)

  // Navigate to heroes and select first hero
  await clickNav(page, selectors.navHeroes)
  await waitForVisible(page, selectors.heroList, 3000)
  const firstHero = await page.$(selectors.heroCard)
  if (firstHero) await firstHero.click()
  await page.waitForTimeout(400)

  // --- trainer_modal ---
  // v2 button text is "💪 Training Grounds"
  if (await clickActionButton(page, 'training')) {
    await page.waitForTimeout(400)
    await snap({ flow: 'building-modals', state: 'trainer_modal' })
    await dismissAnyModal(page)
  }

  // --- witch_modal ---
  if (await clickActionButton(page, 'witch')) {
    await page.waitForTimeout(400)
    await snap({ flow: 'building-modals', state: 'witch_modal' })
    await dismissAnyModal(page)
  }

  // --- academy_modal ---
  if (await clickActionButton(page, 'academy')) {
    await page.waitForTimeout(400)
    await snap({ flow: 'building-modals', state: 'academy_modal' })
    await dismissAnyModal(page)
  }

  // --- hall_of_fame_modal ---
  if (await clickActionButton(page, 'hall of fame')) {
    await page.waitForTimeout(400)
    await snap({ flow: 'building-modals', state: 'hall_of_fame_modal' })
    await dismissAnyModal(page)
  }
}
