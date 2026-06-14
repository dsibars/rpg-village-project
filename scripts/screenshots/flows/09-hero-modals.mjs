/**
 * Hero Modals flow: skills, equipment, consumables, inscription, gambits.
 */

import { waitForVisible, clickNav } from '../utils/nav.mjs'
import { startNewGame } from '../utils/setup.mjs'
import { injectHero, refreshUI, addInventoryItem } from '../utils/state-injector.mjs'
import { selectors } from '../selectors/selectors.mjs'


async function dismissModal(page, selectors) {
  const closeBtn = await page.$(selectors.modalCloseBtn)
  if (closeBtn) {
    await closeBtn.click().catch(() => {})
    await page.waitForTimeout(400)
  } else {
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)
  }
  // Wait for overlay to actually leave the DOM
  try {
    await page.waitForSelector('.modal-overlay', { state: 'hidden', timeout: 2000 })
  } catch { /* ignore */ }
}

async function clickActionButton(page, labelSubstring) {
  // Click any click any button whose text includes the label (case-insensitive)
  return page.evaluate((label) => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const target = buttons.find((b) =>
      b.textContent.toLowerCase().includes(label.toLowerCase())
    )
    if (target) {
      target.click()
      return true
    }
    return false
  }, labelSubstring)
}

export async function run({ page, snap }) {

  await startNewGame(page, selectors)
  await injectHero(page, { name: 'Aria', origin: 'origin_arcane_initiate', level: 10 })
  await injectHero(page, { name: 'Bran', origin: 'origin_warrior', level: 5 })

  // Build required infrastructure for buttons to appear
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (e?.villageService?.state?.infrastructure) {
      e.villageService.state.infrastructure.arcane_sanctum = 2
      e.villageService.state.infrastructure.witchs_hut = 1
      e.villageService.save()
    }
  }, {})

  await refreshUI(page)

  // Navigate to heroes and select first hero
  await clickNav(page, selectors.navHeroes)
  await waitForVisible(page, selectors.heroList, 3000)
  const firstHero = await page.$(selectors.heroCard)
  if (firstHero) await firstHero.click()
  await page.waitForTimeout(400)

  // --- heroes_modal_skills ---
  if (await clickActionButton(page, 'skills')) {
    await page.waitForTimeout(400)
    await snap({ flow: 'hero-modals', state: 'heroes_modal_skills' })
    await dismissModal(page, selectors)
  }

  // --- heroes_modal_equipment ---
  if (await clickActionButton(page, 'equipment')) {
    await page.waitForTimeout(400)
    await snap({ flow: 'hero-modals', state: 'heroes_modal_equipment' })
    await dismissModal(page, selectors)
  }

  // --- heroes_modal_consumables ---
  // Inject consumables so we can see the actual UI state
  await addInventoryItem(page, { id: 'tiny_hp_potion', quantity: 3 })
  await addInventoryItem(page, { id: 'tiny_mp_potion', quantity: 2 })
  await refreshUI(page)

  // button text is "🧪 Use Item"; try both labels
  if (await clickActionButton(page, 'use item') || await clickActionButton(page, 'consumables')) {
    await page.waitForTimeout(400)
    await snap({ flow: 'hero-modals', state: 'heroes_modal_consumables' })
    await dismissModal(page, selectors)
  }

  // --- heroes_modal_inscription ---
  // Make first hero inscription-eligible: skillTierPoints >= 12 and magicTier >= 7
  await page.evaluate(() => {
    const e = window.__ENGINE__
    const hero = e?.heroService?.heroes?.[0]
    if (hero) {
      hero.magicTier = 7
      // Ensure enough known families for getSkillTierPoints() >= 12
      // Each tier-1 family contributes 2 points, so need at least 6 families
      const needed = ['single_strike', 'double_strike', 'triple_strike', 'area_strike', 'heal', 'buff']
      for (const fam of needed) {
        if (!hero.knownFamilies.includes(fam)) {
          hero.knownFamilies.push(fam)
          hero.techniqueTiers[fam] = 1
        }
      }
      if (e.heroService.saveAll) e.heroService.saveAll()
    }
  })
  await refreshUI(page)
  await page.waitForTimeout(300)
  if (await clickActionButton(page, 'inscription')) {
    await page.waitForTimeout(400)
    await snap({ flow: 'hero-modals', state: 'heroes_modal_inscription' })
    await dismissModal(page, selectors)
  }

  // --- heroes_modal_gambits ---
  // Give first hero known families, a spell, and a sample gambit for a richer screenshot
  await page.evaluate(() => {
    const e = window.__ENGINE__
    const hero = e?.heroService?.heroes?.[0]
    if (hero) {
      if (!hero.knownFamilies.includes('power_strike')) {
        hero.knownFamilies.push('power_strike')
        hero.techniqueTiers['power_strike'] = 1
      }
      if (hero.spellCodex.length === 0) {
        hero.spellCodex.push({ name: 'fireball', mpCost: 8, targetType: 'single_enemy' })
      }
      if (!hero.gambits || hero.gambits.length === 0) {
        hero.gambits = [
          { id: crypto.randomUUID(), enabled: true, conditions: [{ left: { type: 'enemy_count', operator: '>', value: 2 } }], action: { type: 'skill', payload: 'cleave' }, target: 'all_enemies' },
          { id: crypto.randomUUID(), enabled: true, conditions: [{ left: { type: 'self_hp', operator: '<', value: 0.5 } }], action: { type: 'defend' }, target: 'self' },
          { id: crypto.randomUUID(), enabled: true, conditions: [{ left: { type: 'always' } }], action: { type: 'skill', payload: 'power_strike' }, target: 'weakest_enemy' }
        ]
      }
      if (e.heroService.saveAll) e.heroService.saveAll()
    }
  })
  await refreshUI(page)
  await page.waitForTimeout(300)

  if (await clickActionButton(page, 'gambits')) {
    await page.waitForTimeout(400)
    await snap({ flow: 'hero-modals', state: 'heroes_modal_gambits' })
    await dismissModal(page, selectors)
  }
}
