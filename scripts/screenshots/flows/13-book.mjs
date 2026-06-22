/**
 * Book flow: captures various Book states.
 */

import { waitForVisible, clickElement, clickNav } from '../utils/nav.mjs'
import { refreshUI } from '../utils/state-injector.mjs'
import { selectors } from '../selectors/selectors.mjs'


export async function run({ page, snap }) {

  // --- book_fresh_prologue ---
  // Start a fresh game and capture the Book BEFORE it gets dismissed
  // (startNewGame dismisses the Book, so we do our own setup here)
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('rpg_village_v1_'))
      .forEach((k) => localStorage.removeItem(k))
  })
  await page.reload({ waitUntil: 'networkidle' })
  await waitForVisible(page, selectors.saveSlotScreen, 10000)

  // Click first empty slot - Book will auto-open with prologue
  const emptySlot = await page.$(selectors.emptySlot)
  const slotBtn = emptySlot || (await page.$$(selectors.saveSlot))[0]
  if (slotBtn) await slotBtn.click()

  // Wait for Book to auto-open and render
  await waitForVisible(page, selectors.bookView, 10000)
  await page.waitForTimeout(600)
  await snap({ flow: 'book', state: 'book_fresh_prologue' })

  // --- book_village_update ---
  // Advance a day to trigger a second village update in the Book
  await page.evaluate(() => {
    const btn = document.querySelector('.btn-next-day')
    if (btn) btn.click()
  })
  await page.waitForTimeout(1500)

  const bookVisible = await page.$(selectors.bookView)
  if (!bookVisible) {
    await clickNav(page, selectors.navBook)
    await waitForVisible(page, selectors.bookView, 3000)
  }
  await page.waitForTimeout(500)
  await snap({ flow: 'book', state: 'book_village_update' })

  // --- book_spread_navigation ---
  // Inject a second chapter event so a new spread exists, then navigate to it
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (e?.bookService) {
      e.bookService.addSection({
        id: 'screenshot_chapter_2',
        category: 'chapter_history_event',
        day: e.villageService?.getState?.()?.day || 1,
        blocks: [
          { textKey: 'book_chapter_2_event_block', values: {}, weight: 6 },
        ],
        metadata: { titleKey: 'book_chapter_2_title' },
      })
      e.bookService.save()
    }
  })
  await refreshUI(page)
  await page.waitForTimeout(400)
  // Move to the last spread (the new chapter)
  const totalSpreads = await page.evaluate(() => {
    const book = document.querySelector('.book-view')
    if (!book) return 1
    const label = book.querySelector('.progress-label')
    if (label) {
      const match = label.textContent.match(/(\d+)\s*\/\s*(\d+)/)
      return match ? parseInt(match[2]) : 1
    }
    return 1
  })
  for (let i = 1; i < totalSpreads; i++) {
    await clickElement(page, selectors.bookNavNext)
    await page.waitForTimeout(300)
  }
  await snap({ flow: 'book', state: 'book_spread_navigation' })

  // --- book_milestone ---
  // Inject a real milestone section into the Book (not just a Chronicle unlock)
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (e?.bookService) {
      e.bookService.addSection({
        id: 'screenshot_milestone_first_victory',
        category: 'milestone',
        day: e.villageService?.getState?.()?.day || 1,
        entry: { key: 'book_milestone_first_victory', values: {}, weight: 4 },
      })
      e.bookService.save()
    }
  })
  await refreshUI(page)
  await page.waitForTimeout(400)
  // Navigate to the spread containing the milestone (usually the last spread)
  const totalSpreads2 = await page.evaluate(() => {
    const book = document.querySelector('.book-view')
    if (!book) return 1
    const label = book.querySelector('.progress-label')
    if (label) {
      const match = label.textContent.match(/(\d+)\s*\/\s*(\d+)/)
      return match ? parseInt(match[2]) : 1
    }
    return 1
  })
  for (let i = 1; i < totalSpreads2; i++) {
    await clickElement(page, selectors.bookNavNext)
    await page.waitForTimeout(300)
  }
  await snap({ flow: 'book', state: 'book_milestone' })

  // --- book_chapter_title ---
  // Navigate back to spread 1 to highlight the first chapter title page
  await page.evaluate(() => {
    const book = document.querySelector('.book-view')
    if (book) {
      const prevBtn = book.querySelector('.book-header .btn-nav:first-child')
      if (prevBtn) {
        for (let i = 0; i < 10; i++) {
          if (prevBtn.disabled) break
          prevBtn.click()
        }
      }
    }
  })
  await page.waitForTimeout(500)
  await snap({ flow: 'book', state: 'book_chapter_title' })
}
