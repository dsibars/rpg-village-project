/**
 * Town flow: buildings, shop/forge locked+unlocked, inventory.
 */

import { waitForVisible, clickNav, clickSubNav } from '../utils/nav.mjs'
import { startNewGame } from '../utils/setup.mjs'
import { addInventoryItem, refreshUI } from '../utils/state-injector.mjs'
import { v1Selectors as s1 } from '../selectors/v1.mjs'
import { v2Selectors as s2 } from '../selectors/v2.mjs'

function getSelectors(version) {
  return version === 'v1' ? s1 : s2
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

async function unlockShop(page, version) {
  const engineExpr = version === 'v1' ? 'window.engine' : 'window.__ENGINE__'
  await page.evaluate(({ engineExpr }) => {
    const getEngine = new Function(`return ${engineExpr}`)
    const e = getEngine()
    if (!e?.expeditionService) return
    // v2 unlocks shop when tutorial cave is completed
    if (e.expeditionService.markCompleted) {
      e.expeditionService.markCompleted('exp_tutorial_cave')
    }
    // v1 may use a different mechanism; also try building merchant_stall
    if (e.villageService?.state?.infrastructure) {
      e.villageService.state.infrastructure.merchant_stall = 1
      e.villageService.save()
    }
  }, { engineExpr })
  await refreshUI(page, version)
}

async function unlockForge(page, version) {
  const engineExpr = version === 'v1' ? 'window.engine' : 'window.__ENGINE__'
  await page.evaluate(({ engineExpr }) => {
    const getEngine = new Function(`return ${engineExpr}`)
    const e = getEngine()
    if (e?.villageService?.state?.infrastructure) {
      e.villageService.state.infrastructure.blacksmith = 1
      e.villageService.save()
    }
  }, { engineExpr })
  await refreshUI(page, version)
}

export async function run({ page, version, snap }) {
  const selectors = getSelectors(version)

  await startNewGame(page, version, selectors)
  await clickNav(page, selectors.navTown)
  await waitForVisible(page, selectors.townTab, 3000)

  // --- buildings_list ---
  await clickSubNav(page, selectors.townBuildingsTab)
  await waitForVisible(page, selectors.buildingsList, 2000)
  await snap({ flow: 'town', state: 'buildings_list' })

  // --- buildings_detail_construct ---
  const building = await page.$(selectors.buildingCard)
  if (building) {
    await building.click()
    await waitForVisible(page, selectors.buildingDetail, 2000)
    await snap({ flow: 'town', state: 'buildings_detail_construct' })
    await dismissAnyModal(page)
  }

  // --- shop_locked ---
  await clickSubNav(page, selectors.townShopTab)
  await page.waitForTimeout(300)
  const locked = await page.$(selectors.shopLocked)
  if (locked) {
    await snap({ flow: 'town', state: 'shop_locked' })
  }

  // --- shop_unlocked ---
  await unlockShop(page, version)
  await page.waitForTimeout(300)
  const unlocked = await page.$(selectors.shopGrid)
  if (unlocked) {
    await snap({ flow: 'town', state: 'shop_unlocked' })
  }

  // --- forge_locked ---
  await clickSubNav(page, selectors.townForgeTab)
  await page.waitForTimeout(300)
  const forgeLocked = await page.$(selectors.forgeLocked)
  if (forgeLocked) {
    await snap({ flow: 'town', state: 'forge_locked' })
  }

  // --- forge_unlocked ---
  await unlockForge(page, version)
  await page.waitForTimeout(300)
  const forgeUnlocked = await page.$(selectors.forgeGrid)
  if (forgeUnlocked) {
    await snap({ flow: 'town', state: 'forge_unlocked' })
  }

  // --- inventory_with_items ---
  await addInventoryItem(page, version, { id: 'potion_small', type: 'consumable', quantity: 3 })
  await addInventoryItem(page, version, { id: 'iron_sword', type: 'equipment', quantity: 1 })
  await refreshUI(page, version)
  await clickSubNav(page, selectors.townInventoryTab)
  await waitForVisible(page, selectors.inventoryGrid, 2000)
  await snap({ flow: 'town', state: 'inventory_with_items' })
}
