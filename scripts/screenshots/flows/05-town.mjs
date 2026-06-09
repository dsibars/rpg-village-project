/**
 * Town flow: buildings, shop/forge locked+unlocked, inventory.
 */

import { waitForVisible, clickNav, clickSubNav } from '../utils/nav.mjs'
import { startNewGame } from '../utils/setup.mjs'
import { addInventoryItem, refreshUI } from '../utils/state-injector.mjs'
import { selectors } from '../selectors/selectors.mjs'


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

async function unlockShop(page) {
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (!e?.expeditionService) return
    // Unlock shop when tutorial cave is completed
    if (e.expeditionService.markCompleted) {
      e.expeditionService.markCompleted('exp_tutorial_cave')
    }
    if (e.villageService?.state?.infrastructure) {
      e.villageService.state.infrastructure.merchant_stall = 1
      e.villageService.save()
    }
  }, {})
  await refreshUI(page)
}

async function unlockForge(page) {
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (e?.villageService?.state?.infrastructure) {
      e.villageService.state.infrastructure.blacksmith = 1
      e.villageService.save()
    }
  }, {})
  await refreshUI(page)
}

export async function run({ page, snap }) {

  await startNewGame(page, selectors)
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
  await unlockShop(page)
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
  await unlockForge(page)
  await page.waitForTimeout(300)
  const forgeUnlocked = await page.$(selectors.forgeGrid)
  if (forgeUnlocked) {
    await snap({ flow: 'town', state: 'forge_unlocked' })
  }

  // --- inventory_with_items ---
  await addInventoryItem(page, { id: 'potion_small', type: 'consumable', quantity: 3 })
  await addInventoryItem(page, { id: 'iron_sword', type: 'equipment', quantity: 1 })
  await refreshUI(page)
  await clickSubNav(page, selectors.townInventoryTab)
  await waitForVisible(page, selectors.inventoryGrid, 2000)
  await snap({ flow: 'town', state: 'inventory_with_items' })
}
