/**
 * Playtest Script — Real User Playthrough at 1920x1080
 *
 * Plays through the first two chapters like a real user,
 * documenting issues: scrolling, UI/UX, bugs, mechanics.
 *
 * Usage: node scripts/playtest.mjs
 */

import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { startServer } from './screenshots/utils/server.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.resolve(process.cwd(), 'dist')
const OUT_DIR = path.resolve(process.cwd(), 'playtest-output')
const PORT = 8766

// Ensure output directory exists
fs.mkdirSync(OUT_DIR, { recursive: true })

const VIEWPORT = { width: 1920, height: 1080 }

// Issues found during playtest
const issues = []

function logIssue(category, description, screenshotPath = null) {
  const issue = { category, description, screenshotPath }
  issues.push(issue)
  console.log(`[${category}] ${description}`)
}

async function snap(page, name) {
  const filePath = path.join(OUT_DIR, `${name}.png`)
  await page.screenshot({ path: filePath, fullPage: false })
  return filePath
}

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function clickAndWait(page, selector, waitMs = 500) {
  const el = await page.$(selector)
  if (el) {
    await el.click()
    await wait(waitMs)
    return true
  }
  return false
}

async function findByText(page, text, tag = 'button') {
  return page.$(`${tag}:has-text("${text}")`)
}

async function clickByText(page, text, tag = 'button', waitMs = 500) {
  const el = await findByText(page, text, tag)
  if (el) {
    await el.click()
    await wait(waitMs)
    return true
  }
  return false
}

async function hasText(page, text) {
  const body = await page.$('body')
  const textContent = await body.textContent()
  return textContent.includes(text)
}

async function scrollIfNeeded(page, selector) {
  const el = await page.$(selector)
  if (el) {
    const isVisible = await el.isVisible().catch(() => false)
    if (!isVisible) {
      await el.scrollIntoViewIfNeeded()
      await wait(200)
    }
  }
}

// ============================================================
// PLAYTEST FLOW
// ============================================================

async function runPlaytest(page) {
  console.log('\n=== PLAYTEST START ===\n')

  // === 1. SAVE SLOT SCREEN ===
  console.log('--- Save Slot Screen ---')
  await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle' })
  await wait(1000)
  await snap(page, '01_save_slots')

  // Check for visual issues on save slot screen
  const slotCards = await page.$$('.slot-card')
  console.log(`Found ${slotCards.length} save slot cards`)

  // Click "New Game" on first empty slot
  const newGameBtn = await page.$('.slot-action-new, .slot-card.empty button, .slot-card button')
  if (newGameBtn) {
    await newGameBtn.click()
    await wait(1000)
    await snap(page, '02_after_slot_click')
  } else {
    logIssue('BUG', 'Could not find "New Game" button on save slot screen')
  }

  // === 2. PROLOGUE / INTRO ===
  console.log('--- Prologue / Intro ---')
  await wait(2000)
  await snap(page, '03_intro_page_1')

  // Check if skip button is available
  const skipBtn = await page.$('.presentation-skip, button:has-text("Skip")')
  if (skipBtn) {
    console.log('Skip button found in prologue')
  }

  // Click through prologue (Next buttons) — handle overlay intercepting clicks
  let nextCount = 0
  while (nextCount < 10) {
    // Try clicking the Next button with force to bypass overlay
    const nextBtn = await page.$('.presentation-next, button:has-text("Next"), button:has-text("Continue")')
    if (!nextBtn) break
    const isVisible = await nextBtn.isVisible().catch(() => false)
    if (!isVisible) break

    try {
      await nextBtn.click({ force: true })
    } catch (e) {
      // If force click fails, try pressing Enter or clicking the overlay itself
      await page.keyboard.press('Enter')
    }
    await wait(1000)
    nextCount++
  }
  console.log(`Clicked through ${nextCount} prologue screens`)
  await snap(page, '04_after_prologue')

  // === 3. MAIN GAME — VILLAGE ===
  console.log('--- Village (Main Screen) ---')
  await wait(2000)
  await snap(page, '05_village_main')

  // Check for daily report modal
  const dailyReport = await page.$('.modal-overlay, .daily-report-modal')
  if (dailyReport) {
    const isVisible = await dailyReport.isVisible().catch(() => false)
    if (isVisible) {
      console.log('Daily report modal shown on first load')
      await snap(page, '06_daily_report_day1')
      // Close it
      const closeBtn = await page.$('.modal-close, .btn-close, button[aria-label="close"]')
      if (closeBtn) await closeBtn.click()
      await wait(500)
    }
  }

  // Check Village page layout
  const villagePage = await page.$('.village-page')
  if (villagePage) {
    console.log('Village page visible')

    // Check for scrollbars — at 1920x1080 there should be minimal scrolling
    const bodyScrollHeight = await page.evaluate(() => document.body.scrollHeight)
    const windowHeight = await page.evaluate(() => window.innerHeight)
    if (bodyScrollHeight > windowHeight * 1.1) {
      logIssue('SCROLLING', `Village page requires scrolling: body=${bodyScrollHeight}px vs window=${windowHeight}px`, await snap(page, '07_village_scroll_issue'))
    }
  }

  // === 4. HEROES PAGE ===
  console.log('--- Heroes Page ---')
  const heroesNav = await page.$('.footer-nav .nav-item:nth-child(2)')
  if (heroesNav) {
    await heroesNav.click()
    await wait(1000)
    await snap(page, '08_heroes_page')

    // Check hero list
    const heroCards = await page.$$('.hero-list-item, .hero-card')
    console.log(`Found ${heroCards.length} heroes`)

    // Check for unnecessary scrolling
    const heroesScroll = await page.evaluate(() => {
      const list = document.querySelector('.hero-list, .heroes-list')
      return list ? { scrollHeight: list.scrollHeight, clientHeight: list.clientHeight } : null
    })
    if (heroesScroll && heroesScroll.scrollHeight > heroesScroll.clientHeight * 1.2) {
      logIssue('SCROLLING', `Heroes list requires scrolling: ${heroesScroll.scrollHeight}px vs ${heroesScroll.clientHeight}px`, await snap(page, '09_heroes_scroll_issue'))
    }

    // Click on first hero
    if (heroCards.length > 0) {
      await heroCards[0].click()
      await wait(800)
      await snap(page, '10_hero_detail')

      // Check hero detail tabs
      const tabs = await page.$$('.hero-profile .tab-btn, .hero-profile .section-tab, .tab-btn')
      console.log(`Hero detail has ${tabs.length} tabs`)

      // Check for empty tabs (Arthur should have some hidden)
      for (let i = 0; i < Math.min(tabs.length, 5); i++) {
        await tabs[i].click()
        await wait(500)
      }
      await snap(page, '11_hero_tabs_checked')
    }
  }

  // === 5. ADVENTURE / EXPLORE PAGE ===
  console.log('--- Adventure Page ---')
  const adventureNav = await page.$('.footer-nav .nav-item:nth-child(3)')
  if (adventureNav) {
    await adventureNav.click()
    await wait(1000)
    await snap(page, '12_adventure_page')

    // Check expedition tree
    const exploreTree = await page.$('.expedition-tree, .explore-tab .expedition-tree')
    if (exploreTree) {
      console.log('Expedition tree visible')
    } else {
      logIssue('UI', 'Expedition tree not visible on adventure page', await snap(page, '13_adventure_no_tree'))
    }

    // Check for scrolling issues
    const adventureScroll = await page.evaluate(() => {
      const content = document.querySelector('.app-content, .adventure-page, .explore-tab')
      return content ? { scrollHeight: content.scrollHeight, clientHeight: content.clientHeight } : null
    })
    if (adventureScroll && adventureScroll.scrollHeight > adventureScroll.clientHeight * 1.2) {
      logIssue('SCROLLING', `Adventure page requires scrolling: ${adventureScroll.scrollHeight}px vs ${adventureScroll.clientHeight}px`, await snap(page, '14_adventure_scroll_issue'))
    }
  }

  // === 6. TOWN PAGE ===
  console.log('--- Town Page ---')
  const townNav = await page.$('.footer-nav .nav-item:nth-child(4)')
  if (townNav) {
    await townNav.click()
    await wait(1000)
    await snap(page, '15_town_page')

    // Check tabs
    const buildingsTab = await page.$('.town-page .tab-nav .tab-btn:nth-child(1)')
    const shopTab = await page.$('.town-page .tab-nav .tab-btn:nth-child(2)')
    const forgeTab = await page.$('.town-page .tab-nav .tab-btn:nth-child(3)')
    const inventoryTab = await page.$('.town-page .tab-nav .tab-btn:nth-child(4)')

    console.log(`Town tabs: buildings=${!!buildingsTab}, shop=${!!shopTab}, forge=${!!forgeTab}, inventory=${!!inventoryTab}`)

    // Check buildings
    if (buildingsTab) {
      await buildingsTab.click()
      await wait(800)
      await snap(page, '16_town_buildings')

      const buildingCards = await page.$$('.building-card')
      console.log(`Found ${buildingCards.length} building cards`)

      // Check for horizontal scrolling on buildings
      const buildingsScroll = await page.evaluate(() => {
        const list = document.querySelector('.building-list, .buildings-tab')
        return list ? { scrollWidth: list.scrollWidth, clientWidth: list.clientWidth } : null
      })
      if (buildingsScroll && buildingsScroll.scrollWidth > buildingsScroll.clientWidth * 1.1) {
        logIssue('SCROLLING', `Town buildings require horizontal scrolling: ${buildingsScroll.scrollWidth}px vs ${buildingsScroll.clientWidth}px`, await snap(page, '17_town_buildings_scroll'))
      }
    }

    // Check shop (if unlocked)
    if (shopTab) {
      await shopTab.click()
      await wait(800)
      await snap(page, '18_town_shop')

      const lockOverlay = await page.$('.lock-overlay')
      if (lockOverlay) {
        const isVisible = await lockOverlay.isVisible().catch(() => false)
        if (isVisible) {
          console.log('Shop is locked (expected early game)')
        }
      }
    }

    // Check inventory
    if (inventoryTab) {
      await inventoryTab.click()
      await wait(800)
      await snap(page, '19_town_inventory')
    }
  }

  // === 7. NEXT DAY — CHECK DAILY REPORT ===
  console.log('--- Next Day Cycle ---')
  const nextDayBtn = await page.$('button:has-text("Next Day"), .next-day-btn, .btn-next-day')
  if (nextDayBtn) {
    await nextDayBtn.click()
    await wait(2000)
    await snap(page, '20_after_next_day')

    // Check for expedition result modal
    const expeditionResult = await page.$('.expedition-result, .modal-overlay')
    if (expeditionResult) {
      const isVisible = await expeditionResult.isVisible().catch(() => false)
      if (isVisible) {
        console.log('Expedition result modal shown')
        await snap(page, '21_expedition_result')
        const closeBtn = await page.$('.modal-close, .btn-close, button[aria-label="close"]')
        if (closeBtn) await closeBtn.click()
        await wait(500)
      }
    }

    // Check for daily report
    const dailyReport2 = await page.$('.daily-report-modal, .modal-overlay')
    if (dailyReport2) {
      const isVisible = await dailyReport2.isVisible().catch(() => false)
      if (isVisible) {
        console.log('Daily report shown after next day')
        await snap(page, '22_daily_report_day2')
        const closeBtn = await page.$('.modal-close, .btn-close, button[aria-label="close"]')
        if (closeBtn) await closeBtn.click()
        await wait(500)
      }
    }
  }

  // === 8. CHECK FOR NARRATIVE TOASTS / CHAPTER PROGRESS ===
  console.log('--- Narrative / Chronicle Check ---')
  const narrativeToast = await page.$('.narrative-toast, .toast--narrative, .unlock-narrative-toast')
  if (narrativeToast) {
    const isVisible = await narrativeToast.isVisible().catch(() => false)
    if (isVisible) {
      console.log('Narrative toast visible')
      await snap(page, '23_narrative_toast')
    }
  }

  // Go to adventure > chronicle tab
  if (adventureNav) {
    await adventureNav.click()
    await wait(800)
    const chronicleTab = await page.$('.adventure-page .tab-nav .tab-btn:nth-child(4)')
    if (chronicleTab) {
      await chronicleTab.click()
      await wait(800)
      await snap(page, '24_chronicle_tab')

      const chronicleItems = await page.$$('.chronicle-list .chronicle-item, .recent-list .item')
      console.log(`Chronicle has ${chronicleItems.length} entries`)
    }
  }

  // === 9. SETTINGS / CODEX CHECK ===
  console.log('--- Settings Page ---')
  const settingsBtn = await page.$('.top-bar-right .btn-quick:last-child')
  if (settingsBtn) {
    await settingsBtn.click()
    await wait(1000)
    await snap(page, '25_settings_page')

    // Check for Magic Circle Simulator
    const magicCircleBtn = await page.$('button:has-text("Magic Circle Simulator")')
    if (magicCircleBtn) {
      console.log('Magic Circle Simulator button found')
    }
  }

  // === 10. FINAL CHECKS ===
  console.log('--- Final Checks ---')
  // Go back to village
  const villageNav = await page.$('.footer-nav .nav-item:nth-child(1)')
  if (villageNav) {
    await villageNav.click()
    await wait(1000)
    await snap(page, '26_final_village')
  }

  // Check overall scroll state
  const finalScrollCheck = await page.evaluate(() => {
    return {
      bodyScrollHeight: document.body.scrollHeight,
      windowHeight: window.innerHeight,
      bodyScrollWidth: document.body.scrollWidth,
      windowWidth: window.innerWidth,
    }
  })
  console.log(`Final viewport: ${finalScrollCheck.windowWidth}x${finalScrollCheck.windowHeight}`)
  console.log(`Body size: ${finalScrollCheck.bodyScrollWidth}x${finalScrollCheck.bodyScrollHeight}`)

  if (finalScrollCheck.bodyScrollHeight > finalScrollCheck.windowHeight * 1.05) {
    logIssue('SCROLLING', `Final village page has vertical overflow: ${finalScrollCheck.bodyScrollHeight}px vs ${finalScrollCheck.windowHeight}px`)
  }
  if (finalScrollCheck.bodyScrollWidth > finalScrollCheck.windowWidth * 1.05) {
    logIssue('SCROLLING', `Final village page has horizontal overflow: ${finalScrollCheck.bodyScrollWidth}px vs ${finalScrollCheck.windowWidth}px`)
  }

  console.log('\n=== PLAYTEST COMPLETE ===\n')
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  // Check if dist exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error('Error: dist/ folder does not exist. Run `npm run build` first.')
    process.exit(1)
  }

  const server = await startServer(DIST_DIR, PORT)
  let browser = null

  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({ viewport: VIEWPORT })
    const page = await context.newPage()

    await runPlaytest(page)

    // Write report
    const reportPath = path.join(OUT_DIR, 'playtest-report.md')
    const reportLines = [
      '# Playtest Report — 1920x1080',
      `Date: ${new Date().toISOString()}`,
      `Viewport: ${VIEWPORT.width}x${VIEWPORT.height}`,
      '',
      `## Issues Found (${issues.length})`,
      '',
    ]

    if (issues.length === 0) {
      reportLines.push('No issues found. ✅')
    } else {
      for (const issue of issues) {
        reportLines.push(`### ${issue.category}: ${issue.description}`)
        if (issue.screenshotPath) {
          reportLines.push(`Screenshot: ${path.basename(issue.screenshotPath)}`)
        }
        reportLines.push('')
      }
    }

    reportLines.push('')
    reportLines.push('## Screenshots')
    const screenshots = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.png'))
    for (const screenshot of screenshots.sort()) {
      reportLines.push(`- ${screenshot}`)
    }

    fs.writeFileSync(reportPath, reportLines.join('\n'))
    console.log(`Report written to: ${reportPath}`)

    await page.close()
  } catch (err) {
    console.error('Playtest failed:', err.message)
    console.error(err.stack)
  } finally {
    if (browser) await browser.close()
    server.close()
  }
}

main()
