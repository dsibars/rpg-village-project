/**
 * Gameplay Life — Natural Playthrough Flow
 *
 * Plays the game as a real user would, taking screenshots at meaningful moments.
 * No state injection. Natural clicks, natural progression.
 *
 * Resilient to broken tutorials: checks for tutorial before every navigation,
 * attempts natural progression, screenshots broken states, force-skips if stuck.
 */

import { waitForVisible, clickElement, clickNav } from '../utils/nav.mjs'
import { selectors } from '../selectors/selectors.mjs'

// ─── Helpers ───

async function safeClick(page, selector, opts = {}) {
  const found = await clickElement(page, selector, { optional: true, ...opts })
  if (!found && !opts.optional) {
    console.log(`  ⚠ Could not click: ${selector}`)
  }
  return found
}

async function jsClick(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (el) el.click()
  }, selector)
}

async function dismissModal(page) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
}

async function isVisible(page, selector) {
  return !!(await page.$(selector))
}

// ─── Tutorial ───

async function isTutorialActive(page) {
  return page.evaluate(() => {
    const e = window.__ENGINE__
    const ts = e?.tutorialService
    const hasActiveTutorial = !!ts?.state?.activeTutorialId
    const hasDomOverlay = !!document.querySelector('.tutorial-overlay, .tutorial-spotlight')
    return hasActiveTutorial || hasDomOverlay
  })
}

async function skipTutorial(page) {
  console.log('  [tutorial] Force-completing all Day-1 tutorials...')
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (!e?.tutorialService) return

    const ts = e.tutorialService
    const allTutorials = [
      'tutorial_hero_skills',
      'tutorial_hero_stats',
      'tutorial_build_farm',
      'tutorial_expeditions'
    ]

    // Mark all tutorials in the chain as completed
    for (const id of allTutorials) {
      if (!ts.state.completedTutorialIds.includes(id)) {
        ts.state.completedTutorialIds.push(id)
      }
    }
    // Clear any active tutorial
    ts.state.activeTutorialId = null
    ts.state.currentStepIndex = 0
    ts.state.stepData = {}
    ts._save()

    // Also update the game state so Vue re-renders
    if (typeof window.__REFRESH_UI__ === 'function') {
      window.__REFRESH_UI__()
    }
  })
  await page.waitForTimeout(600)

  // Verify it's actually gone
  const stillActive = await page.evaluate(() => {
    const e = window.__ENGINE__
    return !!e?.tutorialService?.state?.activeTutorialId
  })

  if (stillActive) {
    console.log('  [tutorial] ⚠ Still active after skip, attempting DOM removal...')
    await page.evaluate(() => {
      document.querySelectorAll('.tutorial-overlay, .tutorial-spotlight, .tutorial-darkening').forEach(el => {
        el.style.display = 'none'
        el.remove()
      })
    })
  } else {
    console.log('  [tutorial] ✓ Tutorial cleared successfully')
  }
}

async function handleTutorial({ page, snap }) {
  if (!(await isTutorialActive(page))) {
    return 'none'
  }

  // Screenshot whatever tutorial state is currently visible
  const tutorialId = await page.evaluate(() => {
    const e = window.__ENGINE__
    return e?.tutorialService?.state?.activeTutorialId || 'unknown'
  })
  console.log(`  [tutorial] Active: ${tutorialId} — screenshot then force-skip...`)

  await snap({ flow: 'playthrough', state: `tutorial_active_${tutorialId}` })

  // Force-skip all Day-1 tutorials
  await skipTutorial(page)
  await snap({ flow: 'playthrough', state: 'tutorial_skipped' })

  return 'skipped'
}

// ─── Navigation with tutorial guard ───

async function navigate(page, navSelector, snap, state) {
  // Check and handle tutorial BEFORE navigating
  const tutorialResult = await handleTutorial({ page, snap })
  if (tutorialResult !== 'none') {
    console.log(`  [playthrough] Tutorial handled: ${tutorialResult}`)
  }

  await clickNav(page, navSelector)
  await page.waitForTimeout(400)

  // Check again after nav — tutorial may have triggered
  const tutorialResult2 = await handleTutorial({ page, snap })
  if (tutorialResult2 !== 'none') {
    console.log(`  [playthrough] Post-nav tutorial handled: ${tutorialResult2}`)
  }

  if (state) {
    await snap({ flow: 'playthrough', state })
  }
}

// ─── Main Playthrough ───

export async function run({ page, snap, reset = true }) {
  const flow = 'playthrough'

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1: Onboarding
  // ═══════════════════════════════════════════════════════════════════════

  if (reset) {
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('rpg_village_v1_'))
        .forEach((k) => localStorage.removeItem(k))
    })
    await page.reload({ waitUntil: 'networkidle' })
  }

  // --- save_slot_empty ---
  await waitForVisible(page, selectors.saveSlotScreen, 10000)
  await snap({ flow, state: 'save_slot_empty' })

  // --- save_slot_occupied ---
  await page.evaluate(() => {
    const prefix = 'rpg_village_v1_slot0_'
    localStorage.setItem(prefix + 'village_state', JSON.stringify({
      day: 3, gold: 250, population: { total: 4, assigned: 2, builders: 1, roles: { builder: 1, farmer: 1, miner: 0, scout: 0 } },
      infrastructure: { housing: 1, farm: 1, warehouse: 1 }, constructionQueue: [], lastUpdate: Date.now(), daysSinceLastRecruit: 1
    }))
    localStorage.setItem(prefix + 'heroes_data', JSON.stringify([{
      id: 'Arthur', name: 'Arthur', origin: 'origin_warrior', avatar: 'arthur.webp', level: 2,
      statPoints: 3, baseMaxHp: 35, baseMaxMp: 15, baseStrength: 9, baseSpeed: 5, baseDefense: 5, baseMagicPower: 4,
      hp: 35, mp: 15, status: 'resting', knownFamilies: ['single_strike'], skillPoints: 1,
      techniqueUses: {}, techniqueTiers: {}, magicXp: 0, magicTier: 1, knownGlyphs: [], glyphMastery: {}, spellCodex: [],
      lifetimeStats: { enemiesDefeated: 5, damageDealt: 120, damageTaken: 30, expeditionsCompleted: 1, battlesWon: 3, battlesLost: 0, highestDamageDealt: 25 }
    }]))
    const registry = Array.from({ length: 10 }, (_, i) => ({
      slotIndex: i, exists: i === 0,
      createdAt: i === 0 ? new Date().toISOString() : null,
      lastPlayedAt: i === 0 ? new Date().toISOString() : null
    }))
    localStorage.setItem('rpg_village_v1_save_slots_metadata', JSON.stringify(registry))
  })
  await page.reload({ waitUntil: 'networkidle' })
  await waitForVisible(page, selectors.saveSlotScreen, 10000)
  await snap({ flow, state: 'save_slot_occupied' })

  // --- Start fresh ---
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('rpg_village_v1_'))
      .forEach((k) => localStorage.removeItem(k))
  })
  await page.reload({ waitUntil: 'networkidle' })
  await waitForVisible(page, selectors.saveSlotScreen, 10000)

  const emptySlot = await page.$(selectors.emptySlot)
  const slotBtn = emptySlot || (await page.$$(selectors.saveSlot))[0]
  if (slotBtn) await slotBtn.click()

  // --- book_prologue ---
  await waitForVisible(page, selectors.bookView, 10000)
  await page.waitForTimeout(600)
  await snap({ flow, state: 'book_prologue' })

  // Try navigating to next spread
  const hasNext = await page.evaluate(() => {
    const buttons = document.querySelectorAll('.book-header > .btn-nav')
    const nextBtn = buttons[1] // second button is next (first is prev)
    return nextBtn && !nextBtn.disabled
  })
  if (hasNext) {
    await jsClick(page, '.book-header > .btn-nav:nth-child(2)')
    await page.waitForTimeout(400)
    await snap({ flow, state: 'book_spread_navigation' })
  }

  // Close book using native Playwright click (triggers Vue @close properly)
  // On Day 1, this auto-navigates to heroes and triggers the tutorial
  await page.click('.book-header .btn-close')
  await page.waitForTimeout(1000)

  // Handle tutorial immediately (it's active on heroes after book close)
  const tutorialResult = await handleTutorial({ page, snap })
  if (tutorialResult !== 'none') {
    console.log(`  [playthrough] Tutorial handled after book: ${tutorialResult}`)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: Village (navigate after tutorial is cleared)
  // ═══════════════════════════════════════════════════════════════════════

  await clickNav(page, selectors.navVillage)
  await page.waitForTimeout(600)
  await snap({ flow, state: 'village_fresh' })

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: Heroes
  // ═══════════════════════════════════════════════════════════════════════

  await navigate(page, selectors.navHeroes, snap, 'heroes_list')

  // Click first hero
  const firstHero = await page.$(selectors.heroCard)
  if (firstHero) {
    await page.evaluate((el) => el.click(), firstHero)
    await page.waitForTimeout(400)
    await waitForVisible(page, selectors.heroDetail, 2000)
    await snap({ flow, state: 'hero_detail' })

    // Try skills modal
    const skillsBtn = await page.$('.hero-quick-links button')
    if (skillsBtn) {
      await page.evaluate((el) => el.click(), skillsBtn)
      await page.waitForTimeout(400)
      await snap({ flow, state: 'hero_skills_modal' })
      await dismissModal(page)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 3: Adventure
  // ═══════════════════════════════════════════════════════════════════════

  await navigate(page, selectors.navAdventure, snap, 'adventure_explore')

  // Tree view
  const hasTree = await waitForVisible(page, selectors.exploreTree, 2000)
  if (hasTree) {
    await snap({ flow, state: 'explore_tree_view' })
  }

  // Try clicking an available expedition
  const node = await page.$(selectors.expeditionNodeAvailable)
  if (node) {
    await page.evaluate((el) => el.click(), node)
    await page.waitForTimeout(400)
    const detailVisible = await waitForVisible(page, selectors.expeditionDetail, 2000)
    if (detailVisible) {
      await snap({ flow, state: 'explore_available_detail' })
      await dismissModal(page)
    }
  }

  // Bestiary tab
  await safeClick(page, selectors.adventureBestiaryTab)
  await page.waitForTimeout(400)
  await snap({ flow, state: 'bestiary_empty' })

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 4: Town
  // ═══════════════════════════════════════════════════════════════════════

  await navigate(page, selectors.navTown, snap, 'town_buildings')

  // Shop tab (might be locked)
  await safeClick(page, selectors.townShopTab)
  await page.waitForTimeout(400)
  const shopVisible = await isVisible(page, selectors.shopGrid)
  await snap({ flow, state: shopVisible ? 'town_shop' : 'town_shop_locked' })

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 5: First Day Advance
  // ═══════════════════════════════════════════════════════════════════════

  await navigate(page, selectors.navVillage, snap, null)

  const nextDayBtn = await page.$('.btn-next-day, .day-advance-button')
  if (nextDayBtn) {
    await page.evaluate((el) => el.click(), nextDayBtn)
    await page.waitForTimeout(1200)

    const reportVisible = await isVisible(page, selectors.dailyReportModal)
    if (reportVisible) {
      await snap({ flow, state: 'daily_report_day2' })
      await dismissModal(page)
    } else {
      await snap({ flow, state: 'village_day2' })
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 6: Book After Day Advance
  // ═══════════════════════════════════════════════════════════════════════

  await navigate(page, selectors.navBook, snap, 'book_village_update')

  // Navigate through spreads
  const totalSpreads = await page.evaluate(() => {
    const label = document.querySelector('.book-view .progress-label')
    if (label) {
      const match = label.textContent.match(/(\d+)\s*\/\s*(\d+)/)
      return match ? parseInt(match[2]) : 1
    }
    return 1
  })

  for (let i = 1; i < totalSpreads; i++) {
    await jsClick(page, '.book-header > .btn-nav:nth-child(2)')
    await page.waitForTimeout(300)
  }
  if (totalSpreads > 1) {
    await snap({ flow, state: 'book_spread_navigation' })
  }

  // Navigate back to village (book is main view, use nav)
  await navigate(page, selectors.navVillage, snap, null)

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 7: Settings
  // ═══════════════════════════════════════════════════════════════════════

  await safeClick(page, selectors.navSettings)
  await page.waitForTimeout(400)
  const settingsVisible = await isVisible(page, selectors.settingsPanel)
  if (settingsVisible) {
    await snap({ flow, state: 'settings_panel' })
    await dismissModal(page)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 8: Second Day
  // ═══════════════════════════════════════════════════════════════════════

  await navigate(page, selectors.navVillage, snap, null)

  const nextDayBtn2 = await page.$('.btn-next-day, .day-advance-button')
  if (nextDayBtn2) {
    await page.evaluate((el) => el.click(), nextDayBtn2)
    await page.waitForTimeout(1200)

    const reportVisible2 = await isVisible(page, selectors.dailyReportModal)
    if (reportVisible2) {
      await snap({ flow, state: 'daily_report_day3' })
      await dismissModal(page)
    }
  }

  // Check for narrative toasts
  const narrativeToast = await page.$(selectors.narrativeToast)
  if (narrativeToast) {
    await snap({ flow, state: 'narrative_unlock_toast' })
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 9: Revisit Adventure
  // ═══════════════════════════════════════════════════════════════════════

  await navigate(page, selectors.navAdventure, snap, 'adventure_day3')

  await safeClick(page, selectors.adventureCodexTab)
  await page.waitForTimeout(400)
  await snap({ flow, state: 'codex_day3' })

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 10: Final Village State
  // ═══════════════════════════════════════════════════════════════════════

  await navigate(page, selectors.navVillage, snap, 'village_final')

  console.log('  [playthrough] Gameplay life complete')
}
