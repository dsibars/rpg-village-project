/**
 * Tutorial helpers for interactive screenshot flows.
 *
 * These read and manipulate the live app via page.evaluate() so the flow
 * exercises the real tutorial event path, not state injection.
 */

export async function getTutorialState(page) {
  return page.evaluate(() => {
    const e = window.__ENGINE__
    if (!e?.getTutorialState) return null
    return e.getTutorialState()
  })
}

export async function waitForTutorialStep(page, stepId, timeout = 10000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const state = await getTutorialState(page)
    if (state?.stepId === stepId) return state
    await page.waitForTimeout(100)
  }
  const final = await getTutorialState(page)
  throw new Error(
    `Timed out waiting for tutorial step "${stepId}". Current: ${final?.stepId ?? 'null'}`
  )
}

export async function waitForTutorialTutorial(page, tutorialId, timeout = 10000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const state = await getTutorialState(page)
    if (state?.tutorialId === tutorialId) return state
    await page.waitForTimeout(100)
  }
  const final = await getTutorialState(page)
  throw new Error(
    `Timed out waiting for tutorial "${tutorialId}". Current: ${final?.tutorialId ?? 'null'}`
  )
}

export async function waitForTutorialInactive(page, timeout = 10000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const state = await getTutorialState(page)
    if (!state) return true
    await page.waitForTimeout(100)
  }
  throw new Error('Tutorial did not become inactive in time')
}

export async function isTutorialOverlayVisible(page) {
  return page.evaluate(() => {
    const overlay = document.querySelector('.tutorial-overlay')
    return overlay && window.getComputedStyle(overlay).display !== 'none'
  })
}

export async function assertTutorialOverlayVisible(page, context = '') {
  const visible = await isTutorialOverlayVisible(page)
  if (!visible) {
    throw new Error(`Tutorial overlay not visible${context ? ` (${context})` : ''}`)
  }
}

export async function getSpotlightTarget(page) {
  return page.evaluate(() => {
    const overlay = document.querySelector('.tutorial-overlay')
    if (!overlay) return null
    const bubble = overlay.querySelector('.tutorial-message-bubble')
    if (bubble?.dataset?.target) return bubble.dataset.target
    // Spotlight config is computed; we can read the current step from engine instead
    const e = window.__ENGINE__
    return e?.getTutorialState?.()?.what?.target || null
  })
}

export async function clickTutorialTarget(page, target, options = {}) {
  const selector = `[data-tutorial-target="${target}"]`
  const el = await page.$(selector)
  if (!el) {
    if (options.optional) return false
    throw new Error(`Tutorial target not found: ${target}`)
  }
  await el.click()
  return true
}

export async function clickTutorialTargetAfterDismiss(page, target, options = {}) {
  await dismissTutorialDarkening(page)
  return clickTutorialTarget(page, target, options)
}

export async function waitForElementVisible(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' })
    return true
  } catch (e) {
    return false
  }
}

export async function resetSaveSlots(page) {
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('rpg_village_'))
      .forEach((k) => localStorage.removeItem(k))
  })
  await page.reload({ waitUntil: 'networkidle' })
}

export async function selectFirstSlot(page) {
  const selectors = (await import('../selectors/selectors.mjs')).selectors
  await waitForElementVisible(page, selectors.saveSlotScreen)
  const emptySlot = await page.$(selectors.emptySlot)
  const slotBtn = emptySlot || (await page.$$(selectors.saveSlot))[0]
  if (slotBtn) await slotBtn.click()
  await waitForElementVisible(page, selectors.mainView)
  await page.waitForTimeout(600)
}

export async function dismissTutorialDarkening(page) {
  // Click the darkening capture layer directly to dismiss it.
  // This is the same as the user clicking anywhere outside the spotlight/message.
  const capture = await page.$('.tutorial-overlay .click-capture')
  if (capture) {
    await capture.click()
  } else {
    // Fallback: click the overlay itself
    await page.click('.tutorial-overlay')
  }
  await page.waitForTimeout(200)
}

export async function closeBookAndWaitForTutorial(page) {
  // Book should auto-open on a fresh game. Wait for it, then navigate away.
  await waitForElementVisible(page, '.book-view', 10000)
  await page.waitForTimeout(600)

  // Click village nav to close the book and trigger book_first_closed
  const villageNav = await page.$('[data-tutorial-target="footer_nav_village"]')
  if (villageNav) await villageNav.click()

  // Wait for tutorial overlay
  const start = Date.now()
  while (Date.now() - start < 10000) {
    const visible = await isTutorialOverlayVisible(page)
    const state = await getTutorialState(page)
    if (visible && state) return state
    await page.waitForTimeout(100)
  }
  throw new Error('Tutorial did not start after closing book')
}
