/**
 * Interactive Tutorial flow
 *
 * Plays through the Day 1 tutorial chain for real, taking a screenshot at
 * every step. This complements 14-tutorial.mjs (state injection) by validating
 * that the tutorial actually advances through player actions.
 */

import {
  resetSaveSlots,
  selectFirstSlot,
  closeBookAndWaitForTutorial,
  getTutorialState,
  waitForTutorialStep,
  waitForTutorialTutorial,
  waitForTutorialInactive,
  isTutorialOverlayVisible,
  assertTutorialOverlayVisible,
  clickTutorialTarget,
  clickTutorialTargetAfterDismiss,
  waitForElementVisible
} from '../utils/tutorial.mjs'

async function clickFirstByText(page, text, selector = 'button') {
  const el = await page.$(`${selector}:has-text("${text}")`)
  if (!el) throw new Error(`No ${selector} with text "${text}" found`)
  await el.click()
}

async function closeAnyOpenModal(page) {
  // Press Escape; modals listen for it and will close if not locked.
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
}

async function waitForTutorialUpdate(page, expectedStepId, timeout = 10000) {
  const state = await waitForTutorialStep(page, expectedStepId, timeout)
  await page.waitForTimeout(400)
  return state
}

export async function run({ page, snap }) {
  // ── Start fresh ──
  await resetSaveSlots(page)
  await selectFirstSlot(page)

  // ── Book prologue on fresh game ──
  await waitForElementVisible(page, '.book-view')
  await snap({ flow: 'tutorial-interactive', state: 'book_prologue' })

  // ── Close book → tutorial triggers ──
  const initialState = await closeBookAndWaitForTutorial(page)
  await assertTutorialOverlayVisible(page, 'after closing book')
  // Give overlay auto-navigation time to run
  await page.waitForTimeout(1500)
  const postAutoNav = await getTutorialState(page)
  console.log('  [debug] after auto-nav wait:', postAutoNav?.stepId)
  await snap({ flow: 'tutorial-interactive', state: 'tutorial_heroes_tab' })

  // ── Step 1: navigate to Heroes ──
  console.log('  [debug] before heroes click:', await getTutorialState(page))
  await clickTutorialTargetAfterDismiss(page, 'footer_nav_heroes')
  await page.waitForTimeout(1000)
  console.log('  [debug] after heroes click:', await getTutorialState(page))
  console.log('  [debug] currentPage:', await page.evaluate(() => document.querySelector('.app-main')?.className))
  console.log('  [debug] nav active:', await page.evaluate(() => {
    const active = document.querySelector('.footer-nav .nav-item.active')
    return active ? active.textContent : 'none'
  }))

  // Direct engine test: does the event path work?
  const directResult = await page.evaluate(() => {
    const e = window.__ENGINE__
    if (!e?.reportTutorialEvent) return 'no reportTutorialEvent'
    return e.reportTutorialEvent({ event: 'tab_changed', page: 'heroes' })
  })
  console.log('  [debug] direct reportTutorialEvent result:', directResult)
  console.log('  [debug] state after direct event:', await getTutorialState(page))
  await waitForTutorialUpdate(page, 'select_arthur')
  await snap({ flow: 'tutorial-interactive', state: 'tutorial_arthur_card' })

  // ── Step 2: select Arthur ──
  await clickTutorialTargetAfterDismiss(page, 'hero_card_arthur')
  await waitForTutorialUpdate(page, 'learn_skill')
  await snap({ flow: 'tutorial-interactive', state: 'tutorial_learn_skill' })

  // ── Step 3: open skills modal ──
  await clickTutorialTargetAfterDismiss(page, 'hero_action_skills')
  await waitForElementVisible(page, '.hero-skills-modal, .skills-modal', 5000)
  await page.waitForTimeout(400)
  await snap({ flow: 'tutorial-interactive', state: 'tutorial_skills_modal' })

  // ── Step 4: learn a skill ──
  await clickFirstByText(page, 'Learn', '.skills-list button, .skill-item button, button')
  await waitForTutorialTutorial(page, 'tutorial_hero_stats')
  await page.waitForTimeout(400)

  // The skills modal may still be open; the next step doesn't need it.
  await closeAnyOpenModal(page)
  await waitForTutorialUpdate(page, 'assign_stats')
  await snap({ flow: 'tutorial-interactive', state: 'tutorial_stat_grid' })

  // ── Step 5: assign a stat point ──
  await clickTutorialTargetAfterDismiss(page, 'hero_stat_assign_baseStrength')
  await waitForTutorialTutorial(page, 'tutorial_build_farm')
  await page.waitForTimeout(400)
  await snap({ flow: 'tutorial-interactive', state: 'tutorial_village_tab' })

  // ── Step 6: navigate to Village (overlay enforces town/buildings after farm click) ──
  // The registry now points to town/buildings for the farm step, but the message
  // tells the player to build a farm. First navigate to Village so the farm tile
  // is visible, then click it.
  await clickTutorialTargetAfterDismiss(page, 'footer_nav_village')
  await waitForTutorialUpdate(page, 'construct_farm')
  await snap({ flow: 'tutorial-interactive', state: 'tutorial_build_farm_tile' })

  // ── Step 7: click farm tile → goes to town/buildings ──
  await clickTutorialTargetAfterDismiss(page, 'building_farm')
  await waitForElementVisible(page, '.buildings-tab', 5000)
  await page.waitForTimeout(600)
  await snap({ flow: 'tutorial-interactive', state: 'tutorial_build_farm_detail' })

  // ── Step 8: click Build/Upgrade ──
  await clickFirstByText(page, 'Build', '.confirm-btn, .action-footer button')
  await waitForTutorialTutorial(page, 'tutorial_expeditions')
  await page.waitForTimeout(400)
  await snap({ flow: 'tutorial-interactive', state: 'tutorial_explore_tab' })

  // ── Step 9: navigate to Adventure / Explore ──
  await clickTutorialTargetAfterDismiss(page, 'footer_nav_adventure')
  await waitForTutorialUpdate(page, 'select_region')
  await snap({ flow: 'tutorial-interactive', state: 'tutorial_region_greenfields' })

  // ── Step 10: select Greenfields region ──
  await clickTutorialTargetAfterDismiss(page, 'region_card_reg_greenfields')
  await waitForTutorialUpdate(page, 'select_expedition')
  await snap({ flow: 'tutorial-interactive', state: 'tutorial_expedition_cave' })

  // ── Step 11: select Tutorial Cave node ──
  await clickTutorialTargetAfterDismiss(page, 'expedition_node_exp_tutorial_cave')
  await waitForElementVisible(page, '.expedition-detail', 5000)
  await page.waitForTimeout(400)
  await snap({ flow: 'tutorial-interactive', state: 'tutorial_expedition_detail' })

  // ── Step 12: assign Arthur and start expedition ──
  const arthurCheckbox = await page.$('.hero-checkbox-item input[type="checkbox"]')
  if (arthurCheckbox) await arthurCheckbox.click()
  await page.waitForTimeout(200)
  await clickFirstByText(page, 'Assign Heroes', '.btn-start-exp, button')

  // Handle defense advisory if it appears
  const confirmBtn = await page.$('button:has-text("Confirm"), .advisory-actions button:first-child')
  if (confirmBtn) {
    await confirmBtn.click()
    await page.waitForTimeout(300)
  }

  await waitForTutorialUpdate(page, 'advance_day')
  await snap({ flow: 'tutorial-interactive', state: 'tutorial_advance_day' })

  // ── Step 13: advance day → tutorial completes ──
  await clickTutorialTargetAfterDismiss(page, 'day_advance_button')
  await waitForTutorialInactive(page, 10000)
  await page.waitForTimeout(800)
  await snap({ flow: 'tutorial-interactive', state: 'tutorial_completed' })
}
