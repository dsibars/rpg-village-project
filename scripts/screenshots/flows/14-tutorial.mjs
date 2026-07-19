/**
 * Tutorial flow: captures tutorial overlay screenshots for each Day 1 step.
 *
 * Uses state injection to start tutorials directly, avoiding the full
 * interactive flow. Each screenshot shows the spotlight + message bubble.
 */

import { waitForVisible, wait } from '../utils/nav.mjs'
import { selectors } from '../selectors/selectors.mjs'

// Tutorial step definitions for screenshot capture
// Each entry: { tutorialId, advanceCount, state, description }
const tutorialSteps = [
  { tutorialId: 'tutorial_hero_skills', advanceCount: 0, state: 'tutorial_arthur_card', description: 'Tutorial overlay highlighting Arthur card' },
  { tutorialId: 'tutorial_hero_skills', advanceCount: 1, state: 'tutorial_learn_skill', description: 'Tutorial overlay highlighting Learn Skill button' },
  { tutorialId: 'tutorial_hero_stats', advanceCount: 0, state: 'tutorial_stat_grid', description: 'Tutorial overlay highlighting stat grid' },
  { tutorialId: 'tutorial_build_farm', advanceCount: 0, state: 'tutorial_village_tab', description: 'Tutorial overlay highlighting Village tab' },
  { tutorialId: 'tutorial_build_farm', advanceCount: 1, state: 'tutorial_build_farm', description: 'Tutorial overlay highlighting Farm building' },
  { tutorialId: 'tutorial_expeditions', advanceCount: 0, state: 'tutorial_explore_tab', description: 'Tutorial overlay highlighting Adventure tab' },
  { tutorialId: 'tutorial_expeditions', advanceCount: 1, state: 'tutorial_region_greenfields', description: 'Tutorial overlay highlighting Greenfields region' },
  { tutorialId: 'tutorial_expeditions', advanceCount: 2, state: 'tutorial_expedition_cave', description: 'Tutorial overlay highlighting Tutorial Cave expedition' },
  { tutorialId: 'tutorial_expeditions', advanceCount: 3, state: 'tutorial_advance_day', description: 'Tutorial overlay highlighting day advance button' },
]

async function resetSaveSlots(page) {
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('rpg_village_v1_'))
      .forEach((k) => localStorage.removeItem(k))
  })
  await page.reload({ waitUntil: 'networkidle' })
}

async function selectFirstSlot(page) {
  await waitForVisible(page, selectors.saveSlotScreen, 10000)
  const emptySlot = await page.$(selectors.emptySlot)
  const slotBtn = emptySlot || (await page.$$(selectors.saveSlot))[0]
  if (slotBtn) await slotBtn.click()
  await waitForVisible(page, selectors.mainView, 10000)
  await wait(600)
}

async function startTutorialStep(page, tutorialId, advanceCount) {
  // Reset tutorial state and start the requested tutorial
  await page.evaluate(({ tid, advances }) => {
    const e = window.__ENGINE__
    if (!e?.tutorialService) return false

    // Clear any active tutorial state
    e.tutorialService.state.activeTutorialId = null
    e.tutorialService.state.currentStepIndex = 0
    e.tutorialService.state.stepData = {}
    e.tutorialService._save()

    // Start the tutorial (force = true to bypass completed check)
    const started = e.startTutorial(tid, true)
    if (!started) return false

    // Advance to the desired step
    for (let i = 0; i < advances; i++) {
      e.tutorialService.advance()
    }
    e.tutorialService._save()

    // Refresh UI so Vue picks up the new tutorial state
    if (typeof window.__REFRESH_UI__ === 'function') {
      window.__REFRESH_UI__()
    } else if (e.update) {
      e.update()
    }

    return true
  }, { tid: tutorialId, advances: advanceCount })

  // Allow Vue to render the tutorial overlay and enforceWhere to run
  await wait(800)
}

export async function run({ page, snap, reset = true }) {
  // Start fresh
  await resetSaveSlots(page, reset)
  await selectFirstSlot(page, reset)

  for (const step of tutorialSteps) {
    await startTutorialStep(page, step.tutorialId, step.advanceCount)

    // Verify overlay is present before capturing
    const overlay = await page.$('.tutorial-overlay')
    if (!overlay) {
      console.log(`  ⚠ Tutorial overlay not found for ${step.state}, capturing anyway`)
    }

    await snap({ flow: 'tutorial', state: step.state })
  }
}
