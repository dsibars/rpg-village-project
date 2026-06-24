/**
 * Section 001: Tutorial and First Day
 *
 * Plays through the entire Day-1 tutorial chain for real. Every tutorial state
 * is screenshotted so tutorial bugs can be diagnosed step by step:
 *   - darkened overlay with the message bubble
 *   - darkening dismissed, target highlighted and ready to click
 *   - result after the user action
 *
 * The section ends after the first Tutorial Cave combat is resolved on Day 2.
 */
import { createStepRecorder } from '../lib/runner.mjs'
import {
  disableTutorialEnforcement,
  waitForTutorialStep,
  waitForTutorialInactive,
  dismissTutorialDarkening,
  clickTutorialTarget,
  closeBook,
  clearToasts,
  closeAnyOpenModal,
  waitForElementVisible,
} from '../lib/tutorial.mjs'

async function clickFirstByText(page, text, selector = 'button') {
  const el = await page.$(`${selector}:has-text("${text}")`)
  if (!el) throw new Error(`No ${selector} with text "${text}" found`)
  await page.evaluate((btn) => btn.click(), el)
}

async function clickElementSafe(page, selector) {
  const el = await page.$(selector)
  if (!el) throw new Error(`Element not found: ${selector}`)
  await page.evaluate((btn) => btn.click(), el)
}

export default async function runSection({ page, capture, log, stepNumber, args }) {
  const record = createStepRecorder({ page, capture, log })

  // Disable overlay auto-enforcement so this flow exercises genuine user clicks
  // one at a time and can capture each intermediate state.
  await disableTutorialEnforcement(page)

  // Step 1: Click the first empty save slot to start a new game.
  stepNumber = await record(
    stepNumber,
    'just_starting_new_game',
    'Clicked the first empty save slot. Expected to see the book with the initial history event.',
    async (page) => {
      await page.click('.slots-grid .slot-card.empty, .slots-grid .slot-card:first-child')
      await page.waitForSelector('.book-view', { timeout: 10000 })
      await page.waitForTimeout(400)
    }
  )

  // Step 2: Close the prologue book; this triggers the Day-1 tutorial chain.
  stepNumber = await record(
    stepNumber,
    'closed_prologue_book',
    'Closed the prologue book. Expected the Day-1 tutorial to start on the Heroes tab.',
    async (page) => {
      await closeBook(page)
      await waitForTutorialStep(page, 'select_arthur')
    }
  )

  // ── Tutorial: tutorial_hero_skills ──

  // Step 3: select_arthur — overlay darkening active.
  stepNumber = await record(
    stepNumber,
    'tutorial_select_arthur_dark',
    'Tutorial step "select_arthur" appeared with overlay darkening active.'
  )

  // Step 4: select_arthur — darkening dismissed, target ready.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_select_arthur_ready',
    'Tutorial step "select_arthur": darkening dismissed, Arthur card highlighted and ready to click.'
  )

  // Step 5: select_arthur — click Arthur.
  stepNumber = await record(
    stepNumber,
    'after_selecting_arthur',
    'Clicked Arthur\'s hero card. Expected the tutorial to advance to "learn_skill".',
    async (page) => {
      await clickTutorialTarget(page, 'hero_card_arthur')
      await waitForTutorialStep(page, 'learn_skill')
    }
  )

  // Step 6: learn_skill — overlay darkening active.
  stepNumber = await record(
    stepNumber,
    'tutorial_learn_skill_dark',
    'Tutorial step "learn_skill" appeared with overlay darkening active.'
  )

  // Step 7: learn_skill — darkening dismissed, Skills button ready.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_learn_skill_ready',
    'Tutorial step "learn_skill": darkening dismissed, Skills button highlighted and ready to click.'
  )

  // Step 8: learn_skill — click Skills button, modal opens.
  stepNumber = await record(
    stepNumber,
    'tutorial_skills_modal_open',
    'Clicked the Skills button. Expected Arthur\'s skills modal to open while the tutorial still points at the button.',
    async (page) => {
      await clickTutorialTarget(page, 'hero_action_skills')
      await waitForElementVisible(page, '.hero-skills-modal, .skills-modal', 5000)
      await page.waitForTimeout(300)
    }
  )

  // Step 9: learn_skill — click first locked skill to learn it.
  stepNumber = await record(
    stepNumber,
    'after_learning_first_skill',
    'Clicked the first locked skill in the modal. Expected Arthur to learn it and the tutorial to advance.',
    async (page) => {
      const lockedBtn = await page.$('.skill-item.locked button')
      if (!lockedBtn) throw new Error('No learnable locked skill button found')
      await page.evaluate((btn) => btn.click(), lockedBtn)
      await waitForTutorialStep(page, 'assign_stats')
    }
  )

  // ── Tutorial: tutorial_hero_stats ──

  // The skills modal may still be open; close it to see the stat grid clearly.
  await closeAnyOpenModal(page)
  await page.waitForTimeout(300)

  // Step 10: assign_stats — overlay darkening active.
  stepNumber = await record(
    stepNumber,
    'tutorial_assign_stats_dark',
    'Tutorial step "assign_stats" appeared with overlay darkening active.'
  )

  // Step 11: assign_stats — darkening dismissed, stat grid ready.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_assign_stats_ready',
    'Tutorial step "assign_stats": darkening dismissed, stat grid highlighted and ready.'
  )

  // Step 12: assign_stats — click Strength assignment.
  stepNumber = await record(
    stepNumber,
    'after_assigning_stat',
    'Clicked the Strength stat assignment. Expected the tutorial to advance to "navigate_village".',
    async (page) => {
      await clickTutorialTarget(page, 'hero_stat_assign_baseStrength')
      await waitForTutorialStep(page, 'navigate_village')
    }
  )

  // ── Tutorial: tutorial_build_farm ──

  // Step 13: navigate_village — overlay darkening active.
  stepNumber = await record(
    stepNumber,
    'tutorial_navigate_village_dark',
    'Tutorial step "navigate_village" appeared with overlay darkening active.'
  )

  // Step 14: navigate_village — darkening dismissed, Village nav ready.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_navigate_village_ready',
    'Tutorial step "navigate_village": darkening dismissed, Village footer nav highlighted and ready.'
  )

  // Step 15: navigate_village — click Village nav.
  stepNumber = await record(
    stepNumber,
    'after_navigating_to_village',
    'Clicked the Village footer nav. Expected the tutorial to advance to "construct_farm".',
    async (page) => {
      await clickTutorialTarget(page, 'footer_nav_village')
      await waitForTutorialStep(page, 'construct_farm')
    }
  )

  // Step 16: construct_farm — overlay darkening active.
  stepNumber = await record(
    stepNumber,
    'tutorial_construct_farm_dark',
    'Tutorial step "construct_farm" appeared with overlay darkening active.'
  )

  // Step 17: construct_farm — darkening dismissed, Farm building ready.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_construct_farm_ready',
    'Tutorial step "construct_farm": darkening dismissed, Farm building highlighted and ready. Note: with enforcement disabled the page may still be on Village.'
  )

  // Step 18: construct_farm — navigate to Town → Buildings and select Farm.
  stepNumber = await record(
    stepNumber,
    'tutorial_farm_building_detail',
    'Navigated to Town → Buildings and selected the Farm. Expected the building detail panel with the Build button.',
    async (page) => {
      await clickTutorialTarget(page, 'footer_nav_town')
      await waitForElementVisible(page, '.buildings-tab', 5000)
      await page.waitForTimeout(300)
      await clickTutorialTarget(page, 'building_farm')
      await page.waitForTimeout(400)
    }
  )

  // Step 19: construct_farm — click Build/Upgrade.
  stepNumber = await record(
    stepNumber,
    'after_starting_farm_construction',
    'Clicked the Build button for the Farm. Expected construction to start and the tutorial to advance to "navigate_explore".',
    async (page) => {
      const buildBtn = await page.$('.action-footer .confirm-btn button')
      if (!buildBtn) throw new Error('Build/Upgrade button not found')
      await page.evaluate((btn) => btn.click(), buildBtn)
      await waitForTutorialStep(page, 'navigate_explore')
    }
  )

  // ── Tutorial: tutorial_expeditions ──

  // Step 20: navigate_explore — overlay darkening active.
  stepNumber = await record(
    stepNumber,
    'tutorial_navigate_explore_dark',
    'Tutorial step "navigate_explore" appeared with overlay darkening active.'
  )

  // Step 21: navigate_explore — darkening dismissed, Adventure nav ready.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_navigate_explore_ready',
    'Tutorial step "navigate_explore": darkening dismissed, Adventure footer nav highlighted and ready.'
  )

  // Step 22: navigate_explore — click Adventure nav.
  stepNumber = await record(
    stepNumber,
    'after_navigating_to_adventure',
    'Clicked the Adventure footer nav. Expected the Explore tab to open and the tutorial to advance to "select_region".',
    async (page) => {
      await clickTutorialTarget(page, 'footer_nav_adventure')
      await waitForTutorialStep(page, 'select_region')
    }
  )

  // Step 23: select_region — overlay darkening active.
  stepNumber = await record(
    stepNumber,
    'tutorial_select_region_dark',
    'Tutorial step "select_region" appeared with overlay darkening active.'
  )

  // Step 24: select_region — darkening dismissed, Greenfields card ready.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_select_region_ready',
    'Tutorial step "select_region": darkening dismissed, Greenfields region card highlighted and ready.'
  )

  // Step 25: select_region — click Greenfields.
  stepNumber = await record(
    stepNumber,
    'after_selecting_greenfields',
    'Clicked the Greenfields region card. Expected the expedition tree and the tutorial to advance to "select_expedition".',
    async (page) => {
      await clickTutorialTarget(page, 'region_card_reg_greenfields')
      await waitForTutorialStep(page, 'select_expedition')
    }
  )

  // Step 26: select_expedition — overlay darkening active.
  stepNumber = await record(
    stepNumber,
    'tutorial_select_expedition_dark',
    'Tutorial step "select_expedition" appeared with overlay darkening active.'
  )

  // Step 27: select_expedition — darkening dismissed, Tutorial Cave node ready.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_select_expedition_ready',
    'Tutorial step "select_expedition": darkening dismissed, Tutorial Cave node highlighted and ready.'
  )

  // Step 28: select_expedition — click Tutorial Cave node, detail opens.
  stepNumber = await record(
    stepNumber,
    'tutorial_expedition_detail',
    'Clicked the Tutorial Cave node. Expected the expedition detail panel to open.',
    async (page) => {
      await clickTutorialTarget(page, 'expedition_node_exp_tutorial_cave')
      await waitForElementVisible(page, '.expedition-detail', 5000)
      await page.waitForTimeout(400)
    }
  )

  // Step 29: select_expedition — assign Arthur and start the expedition.
  stepNumber = await record(
    stepNumber,
    'after_starting_tutorial_cave_expedition',
    'Assigned Arthur and clicked Start. Expected the expedition to become active and the tutorial to advance to "advance_day".',
    async (page) => {
      await page.evaluate(() => {
        const checkbox = document.querySelector('.hero-checkbox-item input[type="checkbox"]')
        if (checkbox) checkbox.click()
      })
      await page.waitForTimeout(200)
      const startBtn = await page.$('.btn-start-exp button')
      if (!startBtn) throw new Error('Start expedition button not found')
      await page.evaluate((btn) => btn.click(), startBtn)

      // Handle defense advisory if it appears.
      const confirmBtn = await page.$('button:has-text("Confirm"), .advisory-actions button:first-child')
      if (confirmBtn) {
        await page.evaluate((btn) => btn.click(), confirmBtn)
        await page.waitForTimeout(300)
      }

      await waitForTutorialStep(page, 'advance_day')
    }
  )

  // Step 30: advance_day — overlay darkening active.
  stepNumber = await record(
    stepNumber,
    'tutorial_advance_day_dark',
    'Tutorial step "advance_day" appeared with overlay darkening active.'
  )

  // Step 31: advance_day — darkening dismissed, Next Day button ready.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_advance_day_ready',
    'Tutorial step "advance_day": darkening dismissed, Next Day button highlighted and ready.'
  )

  // Step 32: advance_day — click Next Day.
  stepNumber = await record(
    stepNumber,
    'after_advancing_day',
    'Clicked the Next Day button. Expected the day to advance, the tutorial to complete, and combat to start.',
    async (page) => {
      await clickTutorialTarget(page, 'day_advance_button')
      await waitForTutorialInactive(page, 10000)
    }
  )

  // Step 33: Tutorial completed.
  stepNumber = await record(
    stepNumber,
    'tutorial_completed',
    'Day-1 tutorial chain completed. Expected the tutorial overlay to be gone.'
  )

  // Step 34: First combat overlay opens.
  stepNumber = await record(
    stepNumber,
    'combat_overlay_first_battle',
    'Combat overlay opened for the first Tutorial Cave battle. Expected Arthur\'s turn.'
  )

  // Step 35: Skip combat to resolve the battle.
  stepNumber = await record(
    stepNumber,
    'combat_first_battle_victory',
    'Clicked Skip Battle. Expected the first battle to resolve to victory.',
    async (page) => {
      await page.waitForSelector('.combat-overlay', { timeout: 10000 })
      const skipBtn = await page.$('.combat-header .header-controls button:last-child')
      if (!skipBtn) throw new Error('Skip Battle button not found')
      await page.evaluate((btn) => btn.click(), skipBtn)
      await page.waitForSelector('.resolution-pane', { timeout: 10000 })
      await page.waitForTimeout(400)
    }
  )

  // Step 36: Close combat resolution and any auto-opened Book scene.
  stepNumber = await record(
    stepNumber,
    'after_combat_resolution',
    'Closed the combat resolution pane. A Book chapter may auto-open after the first victory; it is closed here to leave a clean main UI.',
    async (page) => {
      const closeBtn = await page.$('.resolution-pane button, .combat-resolution button:has-text("Close"), .combat-resolution button:has-text("Continue")')
      if (closeBtn) {
        await page.evaluate((btn) => btn.click(), closeBtn)
      } else {
        await page.keyboard.press('Escape')
      }
      await page.waitForTimeout(500)

      // First victory may trigger an auto-open Book presentation.
      const bookClose = await page.$('.book-view .btn-close, .book-header .btn-close')
      if (bookClose) {
        await bookClose.click()
        await page.waitForTimeout(400)
      }
    }
  )

  // Step 37: First day fully complete.
  stepNumber = await record(
    stepNumber,
    'first_day_complete',
    'First day complete. Expected to be back on the main UI with the Tutorial Cave expedition at stage 2.'
  )

  return stepNumber
}
