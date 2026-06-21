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

  // --- book_spread_navigation ---
  // Navigate to next spread to show navigation in active state
  await clickElement(page, selectors.bookNavNext)
  await page.waitForTimeout(400)
  await snap({ flow: 'book', state: 'book_spread_navigation' })

  // Dismiss Book and go to village for next test
  await clickNav(page, selectors.navVillage)
  await waitForVisible(page, selectors.villagePage, 3000)

  // --- book_village_update ---
  // Advance a day to trigger a village update in the Book
  await page.evaluate(() => {
    const btn = document.querySelector('.btn-next-day')
    if (btn) btn.click()
  })
  await page.waitForTimeout(1500)

  // Book should auto-open with village update
  const bookVisible = await page.$(selectors.bookView)
  if (!bookVisible) {
    await clickNav(page, selectors.navBook)
    await waitForVisible(page, selectors.bookView, 3000)
  }
  await page.waitForTimeout(500)
  // Navigate to the spread with the village update (usually last spread)
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
  // Go to last spread where new content is
  for (let i = 1; i < totalSpreads; i++) {
    await clickElement(page, selectors.bookNavNext)
    await page.waitForTimeout(300)
  }
  await snap({ flow: 'book', state: 'book_village_update' })

  // --- book_milestone ---
  // Inject a milestone to trigger a milestone PCS
  await page.evaluate(() => {
    const e = window.__ENGINE__
    if (e?.chronicleService) {
      e.chronicleService.unlockEntry('hero_recruited', e.villageService?.getState?.()?.day || 1)
      e.chronicleService.save()
    }
  })
  await refreshUI(page)
  await page.waitForTimeout(500)
  // Navigate to Book to see the milestone
  const bookVisible2 = await page.$(selectors.bookView)
  if (!bookVisible2) {
    await clickNav(page, selectors.navBook)
    await waitForVisible(page, selectors.bookView, 3000)
  }
  // Navigate to last spread to find milestone
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
  // Chapter title is on the first page, navigate back to spread 1
  await page.evaluate(() => {
    const book = document.querySelector('.book-view')
    if (book) {
      // Click Previous until we're at spread 1
      const prevBtn = book.querySelector('.book-header .btn-nav:first-child')
      if (prevBtn) {
        // Keep clicking until disabled
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
