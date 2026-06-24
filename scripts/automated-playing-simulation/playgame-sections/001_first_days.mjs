/**
 * Section 001: First Days
 *
 * Starts a new game and documents the very first in-game moments.
 */
import { createStepRecorder } from '../lib/runner.mjs'

export default async function runSection({ page, capture, log, stepNumber, args }) {
  const record = createStepRecorder({ page, capture, log })

  // Step 1: Click the first empty save slot to start a new game, then wait for
  // the book to open automatically and capture the initial history event.
  stepNumber = await record(
    stepNumber,
    'book_initial_history_event',
    'Clicked the first empty save slot. Expected to see the book with the initial history event.',
    async (page) => {
      await page.click('.slots-grid .slot-card.empty, .slots-grid .slot-card:first-child')
      await page.waitForSelector('.book-view', { timeout: 10000 })
      await page.waitForTimeout(400)
    }
  )

  return stepNumber
}
