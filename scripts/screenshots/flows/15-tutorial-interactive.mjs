/**
 * Interactive Tutorial flow
 *
 * Plays through the Day 1 tutorial chain for real, taking a screenshot at
 * every step. The overlay's auto-enforcement is disabled so the flow exercises
 * genuine user clicks one at a time and can capture each intermediate state.
 */

import {
  resetSaveSlots,
  selectFirstSlot,
  closeBookAndWaitForTutorial,
  waitForTutorialStep,
  waitForTutorialInactive,
  waitForElementVisible,
  dismissTutorialDarkening,
  clearToasts,
} from '../utils/tutorial.mjs'
import { closeFullViewOverlay } from '../utils/nav.mjs'

async function clickFirstByText(page, text, selector = 'button') {
  const el = await page.$(`${selector}:has-text("${text}")`)
  if (!el) throw new Error(`No ${selector} with text "${text}" found`)
  await page.evaluate((btn) => btn.click(), el)
}

async function clickTarget(page, target) {
  const el = await page.$(`[data-tutorial-target="${target}"]`)
  if (!el) throw new Error(`Tutorial target not found: ${target}`)
  await page.evaluate((btn) => btn.click(), el)
}

async function closeAnyOpenModal(page) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
}

async function waitForTutorialUpdate(page, expectedStepId, timeout = 10000) {
  const state = await waitForTutorialStep(page, expectedStepId, timeout)
  await page.waitForTimeout(400)
  return state
}

async function snapshotTutorialStep({ page, snap, state }) {
  await dismissTutorialDarkening(page)
  await clearToasts(page)
  await page.waitForTimeout(300)
  await snap({ flow: 'tutorial-interactive', state })
}

export async function run({ page, snap, reset = true }) {
  // ── Start fresh ──
  await resetSaveSlots(page, reset)
  await selectFirstSlot(page, reset)

  // Disable overlay auto-enforcement so this flow exercises real user clicks
  // step by step and can screenshot each intermediate state.
  await page.evaluate(() => {
    window.__TUTORIAL_DISABLE_ENFORCE__ = true
  })

  if (reset) {
    // ── Book prologue on fresh game ──
    await waitForElementVisible(page, '.book-view')
    await snap({ flow: 'tutorial-interactive', state: 'book_prologue' })

    // ── Close book → lands on Heroes and triggers tutorial ──
    await closeBookAndWaitForTutorial(page)
  } else {
    // Continuing from a previous flow (e.g. onboarding in continuous mode).
    // The book is closed and earlier flows may have skipped the Day-1 tutorial.
    // Reset tutorial progress, move to Heroes, and re-trigger the chain.
    await page.evaluate(() => {
      const e = window.__ENGINE__
      if (e?.tutorialService) {
        e.tutorialService.state.completedTutorialIds = []
        e.tutorialService.state.activeTutorialId = null
        e.tutorialService.state.currentStepIndex = 0
        e.tutorialService.state.stepData = {}
        e.tutorialService._save?.()
      }
    })
    await clickTarget(page, 'footer_nav_heroes')
    await page.waitForTimeout(400)
    await page.evaluate(() => {
      const e = window.__ENGINE__
      e?.recordEvent?.('book_first_closed', { day: e?.villageService?.state?.day || 1 })
    })
    await waitForTutorialUpdate(page, 'select_arthur')
  }

  // Step 1: select Arthur
  await snapshotTutorialStep({ page, snap, state: 'tutorial_arthur_card' })
  await clickTarget(page, 'hero_card_arthur')

  // Step 3: open skills modal and learn a skill
  await waitForTutorialUpdate(page, 'learn_skill')
  await snapshotTutorialStep({ page, snap, state: 'tutorial_skills_modal' })
  await clickTarget(page, 'hero_action_skills')
  await waitForElementVisible(page, '.hero-skills-modal, .skills-modal', 5000)
  await page.waitForTimeout(300)
  const lockedBtn = await page.$('.skill-item.locked button')
  if (!lockedBtn) throw new Error('No learnable locked skill button found')
  await page.evaluate((btn) => btn.click(), lockedBtn)

  // ── tutorial_hero_stats ──
  await waitForTutorialUpdate(page, 'assign_stats')
  await closeAnyOpenModal(page)
  await page.waitForTimeout(300)
  await snapshotTutorialStep({ page, snap, state: 'tutorial_stat_grid' })
  await clickTarget(page, 'hero_stat_assign_baseStrength')

  // ── tutorial_build_farm ──
  await waitForTutorialUpdate(page, 'navigate_village')
  await snapshotTutorialStep({ page, snap, state: 'tutorial_village_tab' })
  await clickTarget(page, 'footer_nav_village')

  await waitForTutorialUpdate(page, 'construct_farm')
  await snapshotTutorialStep({ page, snap, state: 'tutorial_build_farm_tile' })
  // With auto-enforcement disabled we must navigate to Town/Buildings manually.
  await clickTarget(page, 'footer_nav_town')
  await waitForElementVisible(page, '.buildings-tab', 5000)
  await page.waitForTimeout(300)
  await clickTarget(page, 'building_farm')
  await page.waitForTimeout(400)
  await snapshotTutorialStep({ page, snap, state: 'tutorial_build_farm_detail' })
  const buildBtn = await page.$('.action-footer .confirm-btn button')
  if (!buildBtn) throw new Error('Build/Upgrade button not found')
  await page.evaluate((btn) => btn.click(), buildBtn)

  // ── tutorial_expeditions ──
  await waitForTutorialUpdate(page, 'navigate_explore')
  await snapshotTutorialStep({ page, snap, state: 'tutorial_explore_tab' })
  await clickTarget(page, 'footer_nav_adventure')

  await waitForTutorialUpdate(page, 'select_region')
  await snapshotTutorialStep({ page, snap, state: 'tutorial_region_greenfields' })
  await clickTarget(page, 'region_card_reg_greenfields')

  await waitForTutorialUpdate(page, 'select_expedition')
  await snapshotTutorialStep({ page, snap, state: 'tutorial_expedition_cave' })
  await clickTarget(page, 'expedition_node_exp_tutorial_cave')
  await waitForElementVisible(page, '.expedition-detail', 5000)
  await page.waitForTimeout(400)
  await snapshotTutorialStep({ page, snap, state: 'tutorial_expedition_detail' })

  // Assign Arthur and start the expedition
  await page.evaluate(() => {
    const checkbox = document.querySelector('.hero-checkbox-item input[type="checkbox"]')
    if (checkbox) checkbox.click()
  })
  await page.waitForTimeout(200)
  const startBtn = await page.$('.btn-start-exp button')
  if (!startBtn) throw new Error('Start expedition button not found')
  await page.evaluate((btn) => btn.click(), startBtn)

  // Handle defense advisory if it appears
  const confirmBtn = await page.$('button:has-text("Confirm"), .advisory-actions button:first-child')
  if (confirmBtn) {
    await page.evaluate((btn) => btn.click(), confirmBtn)
    await page.waitForTimeout(300)
  }

  await waitForTutorialUpdate(page, 'advance_day')
  await snapshotTutorialStep({ page, snap, state: 'tutorial_advance_day' })

  // Advance day → tutorial completes
  await clickTarget(page, 'day_advance_button')
  await waitForTutorialInactive(page, 10000)
  await page.waitForTimeout(800)
  await snap({ flow: 'tutorial-interactive', state: 'tutorial_completed' })

  // Expedition resolution may have opened a combat overlay; close it so later
  // continuous flows are not blocked.
  await closeFullViewOverlay(page)
}
