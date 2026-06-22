/**
 * Adventure flow: explore tree/list, expedition detail, bestiary, codex, chronicle.
 */

import { waitForVisible, clickNav, clickSubNav } from '../utils/nav.mjs'
import { startNewGame } from '../utils/setup.mjs'
import { refreshUI } from '../utils/state-injector.mjs'
import { selectors } from '../selectors/selectors.mjs'


async function dismissAnyModal(page) {
  // Try close button first
  const closeBtn = await page.$('.modal-overlay .btn-close, .modal-frame .btn-close, .modal-close, button[aria-label="close"]')
  if (closeBtn) {
    await closeBtn.click().catch(() => {})
    await page.waitForTimeout(400)
  } else {
    // Try clicking the overlay backdrop
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

  // Pre-seed bestiary with some discovered enemies for "mixed" state
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (e?.expeditionService?.state) {
      e.expeditionService.state.bestiary = ['goblin_grunt', 'slime_green']
      e.expeditionService.save()
    }
    // Pre-seed some codex unlocks
    if (e?.unlockService?.state) {
      e.unlockService.state.unlockedNarratives = [
        { id: 'nar_first_building', daySeen: 1 },
        { id: 'nar_tavern_built', daySeen: 1 }
      ]
      e.unlockService.state.unlockedCodexFeatures = ['shop', 'forge']
      e.unlockService.save()
    }
  }, {})
  await refreshUI(page)

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
    await page.waitForTimeout(300) // allow modal transition
    await waitForVisible(page, selectors.expeditionDetail, 2000)
    await page.waitForTimeout(200) // allow modal content to render
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

  // --- chronicle_to_book ---
  // Unlock a Chronicle entry linked to the prologue Book section and click through
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (e?.chronicleService && e?.bookService) {
      const bookState = e.bookService.getState()
      const pageSection = bookState.pageSections[0]
      if (pageSection) {
        const firstPage = pageSection.pages[0] || 1
        const chapterNumber = e.bookService.getPage(firstPage)?.chapterNumber || 1
        e.chronicleService.unlockEntry('chronicle_screenshot_test', e.villageService?.getState?.()?.day || 1, {
          pageSectionId: pageSection.id,
          pageNumber: firstPage,
          chapterNumber
        })
        e.chronicleService.save()
      }
    }
    if (typeof window.__REFRESH_UI__ === 'function') window.__REFRESH_UI__()
  })
  await page.waitForTimeout(500)
  const chronicleRow = await page.$('.chronicle-tab .catalog-row:not(.catalog-locked)')
  if (chronicleRow) {
    await chronicleRow.click()
    await page.waitForTimeout(800)
    await waitForVisible(page, selectors.bookView, 3000)
    await page.waitForTimeout(400)
    await snap({ flow: 'adventure', state: 'chronicle_to_book' })
  }
}
