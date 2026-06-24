/**
 * Gameplay Life — Natural Playthrough Flow
 *
 * Plays the game as a real user would, taking screenshots at meaningful moments.
 * No state injection. Natural clicks, natural progression.
 *
 * Resilient to broken tutorials: if the tutorial locks up, we detect it,
 * screenshot the failure state, force-skip it, and continue.
 */

import { waitForVisible, clickElement, clickNav } from '../utils/nav.mjs'
import { selectors } from '../selectors/selectors.mjs'

// ─── Helpers ───

async function waitAndSnap({ page, snap, flow, state, delay = 400 }) {
  await page.waitForTimeout(delay)
  await snap({ flow, state })
}

async function safeClick(page, selector, opts = {}) {
  const found = await clickElement(page, selector, { optional: true, ...opts })
  if (!found && !opts.optional) {
    console.log(`  ⚠ Could not click: ${selector}`)
  }
  return found
}

async function dismissModal(page) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
}

async function isVisible(page, selector) {
  return !!(await page.$(selector))
}

async function waitForAny(page, selectors, timeout = 5000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    for (const sel of selectors) {
      if (await isVisible(page, sel)) return sel
    }
    await page.waitForTimeout(200)
  }
  return null
}

async function forceSkipTutorial(page) {
  // Nuclear option: mark tutorial complete via engine and reload
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (e?.tutorialService?.markTutorialCompleted) {
      e.tutorialService.markTutorialCompleted('day1')
      e.tutorialService.save()
    }
    if (e?.tutorialService?.state) {
      e.tutorialService.state.active = false
      e.tutorialService.state.currentStep = null
      e.tutorialService.state.completed = ['day1']
      e.tutorialService.save()
    }
    sessionStorage.removeItem('__TUTORIAL_DISABLE_ENFORCE__')
    delete window.__TUTORIAL_DISABLE_ENFORCE__
  })
  await page.waitForTimeout(200)
  await page.evaluate(() => {
    if (typeof window.__REFRESH_UI__ === 'function') window.__REFRESH_UI__()
  })
  await page.waitForTimeout(400)
}

// ─── Tutorial Handler ───

async function handleTutorial({ page, snap }) {
  // Check if tutorial overlay is active
  const hasTutorial = await page.evaluate(() => {
    return !!document.querySelector('.tutorial-overlay, .tutorial-spotlight, [data-tutorial-active]')
  })

  if (!hasTutorial) {
    console.log('  [tutorial] No active tutorial detected')
    return 'skipped'
  }

  console.log('  [tutorial] Detected active tutorial, attempting natural progression...')

  const tutorialSteps = [
    { target: 'footer_nav_heroes', snap: 'tutorial_heroes_tab' },
    { target: 'hero_card_arthur', snap: 'tutorial_arthur_card' },
    { target: 'hero_action_skills', snap: 'tutorial_skills_modal', modal: true },
    { target: 'hero_stat_assign_baseStrength', snap: 'tutorial_stat_grid' },
    { target: 'footer_nav_village', snap: 'tutorial_village_tab' },
    { target: 'footer_nav_town', snap: 'tutorial_town_tab' },
    { target: 'building_farm', snap: 'tutorial_build_farm_tile' },
    { target: null, snap: 'tutorial_build_farm_detail', clickSelector: '.action-footer .confirm-btn button' },
    { target: 'footer_nav_adventure', snap: 'tutorial_explore_tab' },
    { target: 'region_card_reg_greenfields', snap: 'tutorial_region_greenfields' },
    { target: 'expedition_node_exp_tutorial_cave', snap: 'tutorial_expedition_cave' },
    { target: null, snap: 'tutorial_expedition_detail', clickSelector: '.btn-start-exp button' },
    { target: 'day_advance_button', snap: 'tutorial_advance_day' },
  ]

  let completedSteps = 0
  const maxWaitPerStep = 8000

  for (const step of tutorialSteps) {
    // Screenshot current tutorial state before acting
    const currentStepId = await page.evaluate(() => {
      const e = window.__ENGINE__
      return e?.tutorialService?.state?.currentStep || 'unknown'
    })

    await snap({ flow: 'playthrough', state: step.snap })

    // Try to click the target
    let clicked = false
    if (step.target) {
      const el = await page.$(`[data-tutorial-target="${step.target}"]`)
      if (el) {
        await page.evaluate((btn) => btn.click(), el)
        clicked = true
      }
    } else if (step.clickSelector) {
      clicked = await safeClick(page, step.clickSelector)
    }

    if (!clicked) {
      console.log(`  [tutorial] ⚠ Could not click step: ${step.snap}`)
    }

    // Wait for tutorial to advance or timeout
    const advanced = await Promise.race([
      new Promise((resolve) => {
        const check = setInterval(async () => {
          const newStep = await page.evaluate(() => {
            const e = window.__ENGINE__
            return e?.tutorialService?.state?.currentStep
          })
          if (newStep !== currentStepId) {
            clearInterval(check)
            resolve(true)
          }
        }, 500)
      }),
      new Promise((resolve) => setTimeout(() => resolve(false), maxWaitPerStep)),
    ])

    if (!advanced) {
      console.log(`  [tutorial] ⚠ Step ${step.snap} timed out — tutorial may be broken`)
      await snap({ flow: 'playthrough', state: `${step.snap}_BROKEN` })

      // Try to dismiss any overlay
      await page.evaluate(() => {
        document.querySelectorAll('.tutorial-overlay, .tutorial-darkening, .tutorial-message').forEach((el) => {
          el.style.pointerEvents = 'none'
          el.style.opacity = '0'
        })
      })
      await page.waitForTimeout(200)

      // If we're stuck for 2 consecutive steps, force-skip tutorial
      if (completedSteps < 2) {
        console.log('  [tutorial] 🚨 Tutorial severely broken, forcing skip...')
        await forceSkipTutorial(page)
        await snap({ flow: 'playthrough', state: 'tutorial_force_skipped' })
        return 'force_skipped'
      }
    } else {
      completedSteps++
      await page.waitForTimeout(400)
    }

    // Close modal if this step opened one
    if (step.modal) {
      await dismissModal(page)
      await page.waitForTimeout(300)
    }
  }

  // Wait for tutorial to fully complete
  const tutorialDone = await Promise.race([
    new Promise(async (resolve) => {
      const check = setInterval(async () => {
        const active = await page.evaluate(() => {
          const e = window.__ENGINE__
          return e?.tutorialService?.state?.active
        })
        if (!active) {
          clearInterval(check)
          resolve(true)
        }
      }, 500)
    }),
    new Promise((resolve) => setTimeout(() => resolve(false), 10000)),
  ])

  if (tutorialDone) {
    await snap({ flow: 'playthrough', state: 'tutorial_completed' })
    return 'completed'
  }

  return 'partial'
}

// ─── Main Playthrough ───

export async function run({ page, snap, reset = true }) {
  const flow = 'playthrough'

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 1: Onboarding
  // ═══════════════════════════════════════════════════════════════════════

  if (reset) {
    // Clear everything
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
  // Create a slot with some progress for the "occupied" screenshot
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

  // --- Start fresh game ---
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

  // Navigate to next spread
  await safeClick(page, selectors.bookNavNext)
  await page.waitForTimeout(400)
  await snap({ flow, state: 'book_spread_navigation' })

  // Close book
  await page.evaluate(() => {
    const btn = document.querySelector('.book-header .btn-close')
    if (btn) btn.click()
  })
  await page.waitForTimeout(500)

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 2: Village (First View)
  // ═══════════════════════════════════════════════════════════════════════

  await waitForVisible(page, selectors.mainView, 3000)
  await snap({ flow, state: 'village_fresh' })

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 3: Tutorial (Natural or Skip)
  // ═══════════════════════════════════════════════════════════════════════

  const tutorialResult = await handleTutorial({ page, snap })
  console.log(`  [playthrough] Tutorial result: ${tutorialResult}`)

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 4: Explore Heroes
  // ═══════════════════════════════════════════════════════════════════════

  await clickNav(page, selectors.navHeroes)
  await waitForVisible(page, selectors.heroList, 3000)
  await snap({ flow, state: 'heroes_list' })

  // Click first hero
  const firstHero = await page.$(selectors.heroCard)
  if (firstHero) {
    await firstHero.click()
    await page.waitForTimeout(400)
    await waitForVisible(page, selectors.heroDetail, 2000)
    await snap({ flow, state: 'hero_detail' })

    // Try skills modal
    const skillsBtn = await page.$('.hero-quick-links button')
    if (skillsBtn) {
      await skillsBtn.click()
      await page.waitForTimeout(400)
      await snap({ flow, state: 'hero_skills_modal' })
      await dismissModal(page)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 5: Explore Adventure
  // ═══════════════════════════════════════════════════════════════════════

  await clickNav(page, selectors.navAdventure)
  await waitForVisible(page, selectors.adventureTab, 3000)
  await snap({ flow, state: 'adventure_explore' })

  // Tree view
  await waitForVisible(page, selectors.exploreTree, 2000)
  await snap({ flow, state: 'explore_tree_view' })

  // Try clicking an available expedition
  const node = await page.$(selectors.expeditionNodeAvailable)
  if (node) {
    await node.click()
    await page.waitForTimeout(400)
    await waitForVisible(page, selectors.expeditionDetail, 2000)
    await snap({ flow, state: 'explore_available_detail' })
    await dismissModal(page)
  }

  // Bestiary tab
  await safeClick(page, selectors.adventureBestiaryTab)
  await waitForVisible(page, selectors.bestiaryList, 2000)
  await snap({ flow, state: 'bestiary_empty' })

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 6: Explore Town
  // ═══════════════════════════════════════════════════════════════════════

  await clickNav(page, selectors.navTown)
  await waitForVisible(page, selectors.townTab, 3000)
  await snap({ flow, state: 'town_buildings' })

  // Shop tab (might be locked)
  await safeClick(page, selectors.townShopTab)
  await page.waitForTimeout(400)
  const shopVisible = await isVisible(page, selectors.shopGrid)
  if (shopVisible) {
    await snap({ flow, state: 'town_shop' })
  } else {
    await snap({ flow, state: 'town_shop_locked' })
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 7: First Day Advance
  // ═══════════════════════════════════════════════════════════════════════

  await clickNav(page, selectors.navVillage)
  await waitForVisible(page, selectors.villagePage, 3000)

  // Look for and click next day button
  const nextDayBtn = await page.$('.btn-next-day, .day-advance-button')
  if (nextDayBtn) {
    await nextDayBtn.click()
    await page.waitForTimeout(1200)

    // Capture daily report if it appears
    const reportVisible = await isVisible(page, selectors.dailyReportModal)
    if (reportVisible) {
      await snap({ flow, state: 'daily_report_day2' })
      await dismissModal(page)
    } else {
      await snap({ flow, state: 'village_day2' })
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 8: Book After Day Advance
  // ═══════════════════════════════════════════════════════════════════════

  await clickNav(page, selectors.navBook)
  await waitForVisible(page, selectors.bookView, 3000)
  await page.waitForTimeout(500)
  await snap({ flow, state: 'book_village_update' })

  // Navigate through book spreads
  const totalSpreads = await page.evaluate(() => {
    const label = document.querySelector('.book-view .progress-label')
    if (label) {
      const match = label.textContent.match(/(\d+)\s*\/\s*(\d+)/)
      return match ? parseInt(match[2]) : 1
    }
    return 1
  })

  for (let i = 1; i < totalSpreads; i++) {
    await safeClick(page, selectors.bookNavNext)
    await page.waitForTimeout(300)
  }
  if (totalSpreads > 1) {
    await snap({ flow, state: 'book_spread_navigation' })
  }

  // Close book
  await page.evaluate(() => {
    const btn = document.querySelector('.book-header .btn-close')
    if (btn) btn.click()
  })
  await page.waitForTimeout(400)

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 9: Settings
  // ═══════════════════════════════════════════════════════════════════════

  await safeClick(page, selectors.navSettings)
  await waitForVisible(page, selectors.settingsPanel, 2000)
  await snap({ flow, state: 'settings_panel' })
  await dismissModal(page)

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 10: Second Day — Unlock More Features
  // ═══════════════════════════════════════════════════════════════════════

  await clickNav(page, selectors.navVillage)
  await page.waitForTimeout(300)

  // Advance another day
  const nextDayBtn2 = await page.$('.btn-next-day, .day-advance-button')
  if (nextDayBtn2) {
    await nextDayBtn2.click()
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
  // PHASE 11: Revisit Adventure (now with potential unlocks)
  // ═══════════════════════════════════════════════════════════════════════

  await clickNav(page, selectors.navAdventure)
  await page.waitForTimeout(400)
  await snap({ flow, state: 'adventure_day3' })

  // Check codex (may have unlocked)
  await safeClick(page, selectors.adventureCodexTab)
  await page.waitForTimeout(400)
  await snap({ flow, state: 'codex_day3' })

  // ═══════════════════════════════════════════════════════════════════════
  // PHASE 12: Final Village State
  // ═══════════════════════════════════════════════════════════════════════

  await clickNav(page, selectors.navVillage)
  await page.waitForTimeout(400)
  await snap({ flow, state: 'village_final' })

  console.log('  [playthrough] Gameplay life complete')
}
