/**
 * Combat flow: overlay open, main menu, skills menu, targeting, victory, defeat.
 */

import { waitForVisible } from '../utils/nav.mjs'
import { startNewGame } from '../utils/setup.mjs'
import { injectHero, injectBattle, refreshUI } from '../utils/state-injector.mjs'
import { selectors } from '../selectors/selectors.mjs'


async function setupBattle(page) {
  await injectHero(page, { name: 'Aria', origin: 'origin_arcane_initiate', level: 5 })
  // Give Aria extra skill families so the Skills button is enabled
  await page.evaluate(() => {
    const e = window.__ENGINE__
    const heroes = e?.heroService?.heroes || []
    const aria = heroes.find(h => h.name === 'Aria')
    if (aria && !aria.knownFamilies.includes('power_strike')) {
      aria.knownFamilies.push('power_strike')
      aria.techniqueTiers.power_strike = 1
      if (e.heroService.saveAll) e.heroService.saveAll()
    }
  }, {})
  await injectBattle(page, {
    enemies: [{ id: 'goblin_grunt', count: 2, level: 1 }],
    heroes: ['Aria'],
    location: 'forest_edge',
  })
  // Ensure it's the hero's turn and auto-battle is off
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (!e?.battleService) return
    e.battleService.autoBattle = false
    // Ensure hero goes first by setting current turn to the hero
    const heroIdx = e.battleService.turnOrder.findIndex(a => a.type === 'Hero' || a.origin !== undefined)
    if (heroIdx >= 0) e.battleService.currentTurnIndex = heroIdx
  }, {})
  await refreshUI(page)
}

export async function run({ page, snap, reset = true }) {

  await startNewGame(page, selectors, reset)
  await setupBattle(page)

  // --- combat_overlay_open ---
  await waitForVisible(page, selectors.combatOverlay, 3000)
  await snap({ flow: 'combat', state: 'combat_overlay_open' })

  // --- combat_main_menu ---
  await page.waitForTimeout(400)
  await waitForVisible(page, selectors.combatActionMenu, 2000)
  await snap({ flow: 'combat', state: 'combat_main_menu' })

  // --- combat_skills_menu ---
  const skillsBtn = await page.$(selectors.combatSkillsBtn)
  if (skillsBtn) {
    await skillsBtn.click()
    await waitForVisible(page, selectors.combatSkillsMenu, 2000)
    await snap({ flow: 'combat', state: 'combat_skills_menu' })
    // Go back to main menu
    const backBtn = await page.$(selectors.combatBackBtn)
    if (backBtn) await backBtn.click()
    await page.waitForTimeout(300)
  }

  // --- combat_targeting_enemy ---
  const attackBtn = await page.$(selectors.combatAttackBtn)
  if (attackBtn) {
    await attackBtn.click()
    await waitForVisible(page, selectors.combatTargetingCursor, 2000)
    await snap({ flow: 'combat', state: 'combat_targeting_enemy' })
    // Go back
    const backBtn = await page.$(selectors.combatBackBtn)
    if (backBtn) await backBtn.click()
    await page.waitForTimeout(300)
  }

  // --- combat_victory ---
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (!e?.battleService) return
    e.battleService.isOver = true
    e.battleService.winner = 'heroes'
    // Zero enemy HP for a realistic victory screen
    e.battleService.enemies.forEach(en => { en.hp = 0 })
    // Add a victory log entry so the UI has something to show
    e.battleService.log.push({ type: 'VICTORY', text: 'Victory!' })
  }, {})
  await refreshUI(page)
  await page.waitForTimeout(600)
  await snap({ flow: 'combat', state: 'combat_victory' })

  // --- combat_defeat ---
  // Start a new battle for defeat
  await setupBattle(page)
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (!e?.battleService) return
    // Kill all heroes
    e.battleService.heroes.forEach(h => { h.hp = 0 })
    e.battleService.isOver = true
    e.battleService.winner = 'enemies'
    e.battleService.log.push({ type: 'DEFEAT', text: 'Defeat...' })
  }, {})
  await refreshUI(page)
  await page.waitForTimeout(600)
  await snap({ flow: 'combat', state: 'combat_defeat' })
}
