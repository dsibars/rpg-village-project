/**
 * Section 001: Tutorial and First Day
 *
 * Plays through the entire Day-1 tutorial chain. Each tutorial step is captured
 * as a sequence of distinct, player-visible states:
 *   - _ready: darkening dismissed, target highlighted, message still visible
 *   - _after_<action>: result of the player's action; this is also the dark
 *     state of the next tutorial step, so we never capture the same frame twice.
 *
 * Intermediate states that are visually distinct (e.g. a modal opening) are
 * captured explicitly.
 *
 * The section ends after the first Tutorial Cave combat is resolved on Day 2.
 */
import { createStepRecorder } from '../lib/runner.mjs'
import {
  disableTutorialEnforcement,
  waitForTutorialStep,
  waitForTutorialInactive,
  dismissTutorialDarkening,
  acknowledgeTutorialStep,
  clickTutorialTarget,
  closeBook,
  clearToasts,
  closeAnyOpenModal,
  waitForElementVisible,
  getTutorialState,
} from '../lib/tutorial.mjs'

async function clickElementSafe(page, selector) {
  const el = await page.$(selector)
  if (!el) throw new Error(`Element not found: ${selector}`)
  await page.evaluate((btn) => btn.click(), el)
}

export default async function runSection({ page, capture, log, stepNumber }) {
  const record = createStepRecorder({ page, capture, log })

  // Disable overlay auto-enforcement so this flow exercises genuine user clicks
  // one at a time and can capture each intermediate state.
  await disableTutorialEnforcement(page)

  // Step 1: Click the first empty save slot to start a new game.
  stepNumber = await record(
    stepNumber,
    'just_starting_new_game',
    'Clicked the first empty save slot. Expected to see the book with the initial history event.',
    async () => {
      await page.click('.slots-grid .slot-card.empty, .slots-grid .slot-card:first-child')
      await page.waitForSelector('.book-view', { timeout: 10000 })
      await page.waitForTimeout(400)
    }
  )

  // Step 2: Close the prologue book. This triggers the Day-1 tutorial chain and
  // lands on the select_arthur dark state.
  stepNumber = await record(
    stepNumber,
    'closed_prologue_book',
    'Closed the prologue book. The Day-1 tutorial started on the Heroes tab in the "select_arthur" dark state.',
    async () => {
      await closeBook(page)
      await waitForTutorialStep(page, 'select_arthur')
    }
  )

  // ── Tutorial step: select_arthur ──
  // Dark state was captured as closed_prologue_book.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_select_arthur_ready',
    'Tutorial step "select_arthur": darkening dismissed, Arthur card highlighted and ready to click.'
  )

  stepNumber = await record(
    stepNumber,
    'after_selecting_arthur',
    'Clicked Arthur\'s hero card. Arthur details opened and the tutorial advanced to "open_skills".',
    async () => {
      await clickTutorialTarget(page, 'hero_card_arthur')
      await waitForTutorialStep(page, 'open_skills')
    }
  )

  // ── Tutorial step: open_skills ──
  // Dark state was captured as after_selecting_arthur.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_open_skills_ready',
    'Tutorial step "open_skills": darkening dismissed, Skills button highlighted and ready to click.'
  )

  stepNumber = await record(
    stepNumber,
    'after_learning_first_skill',
    'Clicked the Skills button, then clicked a locked technique to learn it. Arthur unlocked it, the skills modal closed, and after acknowledging the closing message the tutorial advanced to "assign_stats".',
    async () => {
      await clickTutorialTarget(page, 'hero_action_skills')
      await waitForTutorialStep(page, 'learn_skill')
      await waitForElementVisible(page, '.hero-skills-modal, .skills-modal', 5000)
      await page.waitForTimeout(300)
      const lockedBtn = await page.$('.skill-item.locked button')
      if (!lockedBtn) throw new Error('No learnable locked skill button found')
      await page.evaluate((btn) => btn.click(), lockedBtn)
      await waitForTutorialStep(page, 'skills_done')
      await acknowledgeTutorialStep(page)
      await waitForTutorialStep(page, 'assign_stats')
      await closeAnyOpenModal(page)
      await page.waitForTimeout(300)
    }
  )

  // ── Tutorial step: assign_stats ──
  // Dark state was captured as after_learning_first_skill.
  // The skills modal may still be open; close it to see the stat grid clearly.
  await closeAnyOpenModal(page)
  await page.waitForTimeout(300)
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_assign_stats_ready',
    'Tutorial step "assign_stats": darkening dismissed, stat grid highlighted and ready.'
  )

  stepNumber = await record(
    stepNumber,
    'after_assigning_stat',
    'Spent all remaining stat points on Strength and acknowledged the closing message. The tutorial advanced to "navigate_village".',
    async () => {
      let safety = 20
      while (safety-- > 0) {
        const state = await getTutorialState(page)
        if (state?.stepId === 'stats_done') break
        await clickTutorialTarget(page, 'hero_stat_assign_baseStrength')
        await page.waitForTimeout(200)
      }
      await waitForTutorialStep(page, 'stats_done')
      await acknowledgeTutorialStep(page)
      await waitForTutorialStep(page, 'navigate_village')
    }
  )

  // ── Tutorial step: navigate_village ──
  // Dark state was captured as after_assigning_stat.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_navigate_village_ready',
    'Tutorial step "navigate_village": darkening dismissed, Village footer nav highlighted and ready.'
  )

  stepNumber = await record(
    stepNumber,
    'after_navigating_to_village',
    'Clicked the Village footer nav. The tutorial advanced to "construct_farm".',
    async () => {
      await clickTutorialTarget(page, 'footer_nav_village')
      await waitForTutorialStep(page, 'construct_farm')
    }
  )

  // ── Tutorial step: construct_farm ──
  // Dark state was captured as after_navigating_to_village.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_construct_farm_ready',
    'Tutorial step "construct_farm": darkening dismissed, Farm building highlighted and ready.'
  )

  // The Village canvas Farm tile is visually locked and not clickable, so the
  // real player path is Town → Buildings → Farm → Build.
  stepNumber = await record(
    stepNumber,
    'tutorial_farm_building_detail',
    'Navigated to Town → Buildings and selected the Farm. The building detail panel shows the Build button.',
    async () => {
      await clickTutorialTarget(page, 'footer_nav_town')
      await waitForElementVisible(page, '.buildings-tab', 5000)
      await page.waitForTimeout(300)
      await clickTutorialTarget(page, 'building_farm')
      await page.waitForTimeout(400)
    }
  )

  stepNumber = await record(
    stepNumber,
    'after_starting_farm_construction',
    'Clicked the Build button for the Farm. Construction started and after acknowledging the closing message the tutorial advanced to "navigate_explore".',
    async () => {
      const buildBtn = await page.$('.action-footer .confirm-btn button')
      if (!buildBtn) throw new Error('Build/Upgrade button not found')
      await page.evaluate((btn) => btn.click(), buildBtn)
      await waitForTutorialStep(page, 'farm_done')
      await acknowledgeTutorialStep(page)
      await waitForTutorialStep(page, 'navigate_explore')
    }
  )

  // ── Tutorial step: navigate_explore ──
  // Dark state was captured as after_starting_farm_construction.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_navigate_explore_ready',
    'Tutorial step "navigate_explore": darkening dismissed, Adventure footer nav highlighted and ready.'
  )

  stepNumber = await record(
    stepNumber,
    'after_navigating_to_adventure',
    'Clicked the Adventure footer nav. The Explore tab opened and the tutorial advanced to "select_region".',
    async () => {
      await clickTutorialTarget(page, 'footer_nav_adventure')
      await waitForTutorialStep(page, 'select_region')
    }
  )

  // ── Tutorial step: select_region ──
  // Dark state was captured as after_navigating_to_adventure.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_select_region_ready',
    'Tutorial step "select_region": darkening dismissed, Greenfields region card highlighted and ready.'
  )

  stepNumber = await record(
    stepNumber,
    'after_selecting_greenfields',
    'Clicked the Greenfields region card. The region view opened and the tutorial advanced to "select_expedition".',
    async () => {
      await clickTutorialTarget(page, 'region_card_reg_greenfields')
      await waitForTutorialStep(page, 'select_expedition')
    }
  )

  // ── Tutorial step: select_expedition ──
  // Dark state was captured as after_selecting_greenfields.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_select_expedition_ready',
    'Tutorial step "select_expedition": darkening dismissed, Tutorial Cave node highlighted and ready.'
  )

  stepNumber = await record(
    stepNumber,
    'after_starting_tutorial_cave_expedition',
    'Clicked the Tutorial Cave node, assigned Arthur, and started the expedition. The expedition became active and the tutorial advanced to "advance_day".',
    async () => {
      await clickTutorialTarget(page, 'expedition_node_exp_tutorial_cave')
      await waitForElementVisible(page, '.expedition-detail', 5000)
      await page.waitForTimeout(400)
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

  // ── Tutorial step: advance_day ──
  // Dark state was captured as after_starting_tutorial_cave_expedition.
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  stepNumber = await record(
    stepNumber,
    'tutorial_advance_day_ready',
    'Tutorial step "advance_day": darkening dismissed, Next Day button highlighted and ready.'
  )

  stepNumber = await record(
    stepNumber,
    'after_advancing_day',
    'Clicked the Next Day button. The day advanced, the tutorial completed, and combat started.',
    async () => {
      await clickTutorialTarget(page, 'day_advance_button')
      await waitForTutorialInactive(page, 10000)
    }
  )

  // Step: Tutorial completed.
  // This frame is the same as after_advancing_day, so we skip a separate capture.

  // Step: First combat overlay opens.
  stepNumber = await record(
    stepNumber,
    'combat_overlay_first_battle',
    'Combat overlay opened for the first Tutorial Cave battle. Expected Arthur\'s turn.'
  )

  // Step: Skip combat to resolve the battle.
  stepNumber = await record(
    stepNumber,
    'combat_first_battle_victory',
    'Clicked Skip Battle. Expected the first battle to resolve to victory.',
    async () => {
      await page.waitForSelector('.combat-overlay', { timeout: 10000 })
      const skipBtn = await page.$('.combat-header .header-controls button:last-child')
      if (!skipBtn) throw new Error('Skip Battle button not found')
      await page.evaluate((btn) => btn.click(), skipBtn)
      await page.waitForSelector('.resolution-pane', { timeout: 10000 })
      await page.waitForTimeout(400)
    }
  )

  // Step: Close combat resolution and any auto-opened Book scene.
  stepNumber = await record(
    stepNumber,
    'after_combat_resolution',
    'Closed the combat resolution pane. A Book chapter may auto-open after the first victory; it is closed here to leave a clean main UI.',
    async () => {
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

  return stepNumber
}
