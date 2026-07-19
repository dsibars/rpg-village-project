/**
 * Section orchestration helpers.
 *
 * Sections are async functions that receive a shared context and return the next
 * step number. This keeps playgame.mjs as a thin orchestrator.
 */

/**
 * Creates a recorder that captures a screenshot, logs the step, and increments
 * the step counter. An optional action callback can mutate the page before the
 * screenshot is taken.
 *
 * @param {Object} deps
 * @param {import('playwright').Page} deps.page
 * @param {Function} deps.capture
 * @param {Function} deps.log
 * @returns {Function} record(stepNumber, slug, description, action?) => Promise<number>
 */
export function createStepRecorder({ page, capture, log }) {
  return async function record(stepNumber, slug, description, action) {
    if (typeof action === 'function') {
      await action(page)
    }

    const screenshotFile = await capture(page, slug)
    log(stepNumber, description, screenshotFile)
    console.log(`  Step ${stepNumber}: ${screenshotFile}`)

    return stepNumber + 1
  }
}
