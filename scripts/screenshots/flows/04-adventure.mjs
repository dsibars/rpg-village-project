/**
 * Adventure flow: explore tree/list, expedition detail, bestiary, codex, chronicle.
 */

import { waitForVisible, clickNav, clickSubNav } from '../utils/nav.mjs'
import { startNewGame } from '../utils/setup.mjs'
import { refreshUI } from '../utils/state-injector.mjs'
import { v1Selectors as s1 } from '../selectors/v1.mjs'
import { v2Selectors as s2 } from '../selectors/v2.mjs'

function getSelectors(version) {
  return version === 'v1' ? s1 : s2
}

async function dismissAnyModal(page) {
  // Try close button first
  const closeBtn = await page.$('.modal-overlay .btn-close, .modal-frame .btn-close, .modal-close, button[aria-label="close"]')
  if (closeBtn) {
    await closeBtn.click().catch(() => {})
    await page.waitForTimeout(400)
  } else {
    // v1: many modals close by clicking the overlay backdrop itself
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

export async function run({ page, version, snap }) {
  const selectors = getSelectors(version)

  await startNewGame(page, version, selectors)

  // Pre-seed bestiary with some discovered enemies for "mixed" state
  const engineExpr = version === 'v1' ? 'window.engine' : 'window.__ENGINE__'
  await page.evaluate(({ engineExpr }) => {
    const getEngine = new Function(`return ${engineExpr}`)
    const e = getEngine()
    if (e?.expeditionService?.state) {
      e.expeditionService.state.bestiary = ['goblin_grunt', 'slime_green']
      e.expeditionService.save()
    }
    // Pre-seed some codex unlocks
    if (e?.unlockService?.state) {
      e.unlockService.state.shownNarratives = ['first_hero_level_5', 'first_building_complete']
      e.unlockService.state.unlockedCodexFeatures = ['shop', 'forge']
      e.unlockService.save()
    }
  }, { engineExpr })
  await refreshUI(page, version)

  await clickNav(page, selectors.navAdventure)
  await waitForVisible(page, selectors.adventureTab, 3000)

  // --- explore_tree_view ---
  await clickSubNav(page, selectors.adventureExploreTab)
  await waitForVisible(page, selectors.exploreTree, 2000)
  await snap({ flow: 'adventure', state: 'explore_tree_view' })

  // --- explore_available_detail ---
  // Click a node while still in tree view before switching to list view
  const node = await page.$(selectors.expeditionNodeAvailable)
  if (node) {
    await node.click()
    await waitForVisible(page, selectors.expeditionDetail, 2000)
    await snap({ flow: 'adventure', state: 'explore_available_detail' })
    await dismissAnyModal(page)
  }

  // --- explore_list_view ---
  const listToggle = await page.$(selectors.exploreListToggle)
  if (listToggle) {
    await listToggle.click()
    await waitForVisible(page, selectors.exploreList, 2000)
    await snap({ flow: 'adventure', state: 'explore_list_view' })
  }

  // --- bestiary_mixed ---
  await dismissAnyModal(page)
  await clickSubNav(page, selectors.adventureBestiaryTab)
  await waitForVisible(page, selectors.bestiaryList, 2000)
  await snap({ flow: 'adventure', state: 'bestiary_mixed' })

  // --- codex_unlocked ---
  await dismissAnyModal(page)
  await clickSubNav(page, selectors.adventureCodexTab)
  await waitForVisible(page, selectors.codexList, 2000)
  await snap({ flow: 'adventure', state: 'codex_unlocked' })

  // --- chronicle_milestones ---
  await dismissAnyModal(page)
  await clickSubNav(page, selectors.adventureChronicleTab)
  await waitForVisible(page, selectors.chronicleList, 2000)
  await snap({ flow: 'adventure', state: 'chronicle_milestones' })
}
