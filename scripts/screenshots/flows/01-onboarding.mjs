/**
 * Onboarding flow: save slots, intro overlay, fresh village.
 */

import { waitForVisible, clickElement } from '../utils/nav.mjs'
import { selectors } from '../selectors/selectors.mjs'


async function resetSaveSlots(page) {
  // Direct localStorage wipe: the save-slot registry and all slot data use this prefix.
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('rpg_village_v1_'))
      .forEach((k) => localStorage.removeItem(k))
  })
  await page.reload({ waitUntil: 'networkidle' })
}

async function dismissIntroIfVisible(page) {
  const visible = await page.$(selectors.introOverlay)
  if (visible) {
    await clickElement(page, selectors.introSkip)
    await page.waitForTimeout(500)
  }
}

/**
 * Create an occupied slot by writing directly to localStorage.
 */
async function createOccupiedSlot(page, index) {
  await page.evaluate((idx) => {
    const prefix = `rpg_village_v1_slot${idx}_`
    localStorage.setItem(prefix + 'village_state', JSON.stringify({
      day: 1,
      gold: 100,
      population: { total: 2, assigned: 0, builders: 2, roles: { builder: 2, farmer: 0, miner: 0, scout: 0 } },
      infrastructure: { housing: 1, farm: 0, warehouse: 1 },
      constructionQueue: [],
      day: 1,
      lastUpdate: Date.now(),
      daysSinceLastRecruit: 0
    }))
    localStorage.setItem(prefix + 'heroes_data', JSON.stringify([{
      id: 'Arthur',
      name: 'Arthur',
      origin: 'origin_warrior',
      avatar: 'arthur.webp',
      level: 1,
      statPoints: 5,
      baseMaxHp: 30,
      baseMaxMp: 15,
      baseStrength: 8,
      baseSpeed: 4,
      baseDefense: 4,
      baseMagicPower: 4,
      hp: 30,
      mp: 15,
      status: 'resting',
      knownFamilies: ['single_strike'],
      skillPoints: 0,
      techniqueUses: {},
      techniqueTiers: {},
      magicXp: 0,
      magicTier: 1,
      knownGlyphs: [],
      glyphMastery: {},
      spellCodex: [],
      lifetimeStats: { enemiesDefeated: 0, damageDealt: 0, damageTaken: 0, expeditionsCompleted: 0, battlesWon: 0, battlesLost: 0, highestDamageDealt: 0 }
    }]))

    // Registry MUST be a full 10-element array
    const registryKey = 'rpg_village_v1_save_slots_metadata'
    const registry = Array.from({ length: 10 }, (_, i) => ({
      slotIndex: i,
      exists: i === idx,
      createdAt: i === idx ? new Date().toISOString() : null,
      lastPlayedAt: i === idx ? new Date().toISOString() : null
    }))
    localStorage.setItem(registryKey, JSON.stringify(registry))
  }, index)
}

export async function run({ page, snap }) {

  // --- save_slot_empty ---
  await resetSaveSlots(page)
  await waitForVisible(page, selectors.saveSlotScreen)
  await snap({ flow: 'onboarding', state: 'save_slot_empty' })

  // --- save_slot_occupied ---
  await createOccupiedSlot(page, 0)
  await page.reload({ waitUntil: 'networkidle' })
  await waitForVisible(page, selectors.saveSlotScreen)
  await snap({ flow: 'onboarding', state: 'save_slot_occupied' })

  // --- intro_prologue (requires new empty slot) ---
  await resetSaveSlots(page)
  await waitForVisible(page, selectors.saveSlotScreen)
  const emptySlot = await page.$(selectors.emptySlot)
  const slotBtn = emptySlot || (await page.$$(selectors.saveSlot))[0]
  if (slotBtn) await slotBtn.click()
  await waitForVisible(page, selectors.introOverlay, 3000)
  await page.waitForTimeout(400)
  await snap({ flow: 'onboarding', state: 'intro_prologue' })

  // --- intro_skip_visible ---
  await waitForVisible(page, selectors.introSkip, 2000)
  await snap({ flow: 'onboarding', state: 'intro_skip_visible' })

  // --- village_fresh ---
  await dismissIntroIfVisible(page)
  await page.waitForTimeout(500)
  await waitForVisible(page, selectors.mainView, 3000)
  await snap({ flow: 'onboarding', state: 'village_fresh' })
}
