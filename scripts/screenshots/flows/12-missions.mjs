/**
 * Missions flow: locked state, active missions, progress, completion, reroll.
 */

import { startNewGame } from '../utils/setup.mjs'
import { refreshUI } from '../utils/state-injector.mjs'
import { selectors } from '../selectors/selectors.mjs'

export async function run({ page, snap, reset = true }) {
  await startNewGame(page, selectors, reset)

  // --- mission_locked ---
  // No mission board built — the DailyObjectives component shows locked state
  await snap({ flow: 'missions', state: 'mission_locked' })

  // --- mission_active_1slot ---
  // Build mission board level 1, unlock seeds, generate 1 mission
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (!e?.missionSeedService) return

    // Build mission board via village service
    const vs = e.villageService
    if (vs?.buildInfrastructure) {
      vs.buildInfrastructure('mission_board', 1)
    } else if (vs?.getState && vs.setState) {
      const state = vs.getState()
      state.infrastructure = state.infrastructure || {}
      state.infrastructure.mission_board = 1
      vs.setState(state)
    }

    // Unlock seeds (tavern level 1 is already met in new game)
    const ms = e.missionSeedService
    ms.checkUnlocks(1, { tavern: 1, town_hall: 1 })

    // Force unlock common seeds
    ms.forceUnlock('defeat_enemies')
    ms.forceUnlock('recruit_heroes')
    ms.forceUnlock('spend_gold')
    ms.forceUnlock('complete_expeditions')

    // Fill slots (level 1 = 1 slot)
    ms.fillSlots(1)

    e.update()
  })
  await refreshUI(page)
  await snap({ flow: 'missions', state: 'mission_active_1slot' })

  // --- mission_active_progress ---
  // Add progress to the active mission
  await page.evaluate(() => {
    const e = window.__ENGINE__
    const ms = e?.missionSeedService
    if (!ms) return

    const missions = ms.getActiveMissions()
    if (missions.length > 0) {
      const mission = missions[0]
      // Set progress to half of target (but not completed)
      const progress = Math.max(1, Math.floor(mission.target / 2))
      // Find the active mission in state and set progress
      const state = ms.state
      const active = state.activeMissions.find(m => m.id === mission.id)
      if (active) {
        active.progress = progress
        active.completed = false
        active.claimed = false
        ms.save()
      }
    }
    e.update()
  })
  await refreshUI(page)
  await snap({ flow: 'missions', state: 'mission_active_progress' })

  // --- mission_completed ---
  // Mark mission as completed (ready to claim)
  await page.evaluate(() => {
    const e = window.__ENGINE__
    const ms = e?.missionSeedService
    if (!ms) return

    const missions = ms.getActiveMissions()
    if (missions.length > 0) {
      const mission = missions[0]
      const state = ms.state
      const active = state.activeMissions.find(m => m.id === mission.id)
      if (active) {
        active.progress = active.target
        active.completed = true
        active.claimed = false
        ms.save()
      }
    }
    e.update()
  })
  await refreshUI(page)
  await snap({ flow: 'missions', state: 'mission_completed' })

  // --- mission_reroll ---
  // Reset to a fresh mission with reroll available
  await page.evaluate(() => {
    const e = window.__ENGINE__
    const ms = e?.missionSeedService
    if (!ms) return

    // Clear reroll cooldown
    const state = ms.state
    state.lastRerollTimestamp = null
    state.dailyRerollUsed = false

    // Regenerate a fresh mission (not completed)
    if (state.activeMissions.length > 0) {
      const newMission = ms.generateMission(state.activeMissions[0].seedId)
      if (newMission) {
        state.activeMissions[0] = newMission
      }
    }
    ms.save()
    e.update()
  })
  await refreshUI(page)
  await snap({ flow: 'missions', state: 'mission_reroll' })
}
