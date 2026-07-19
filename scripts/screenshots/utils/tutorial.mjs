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

export async function resetSaveSlots(page, reset = true) {
  if (!reset) return
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('rpg_village_'))
      .forEach((k) => localStorage.removeItem(k))
  })
  await page.reload({ waitUntil: 'networkidle' })
}

export async function selectFirstSlot(page, reset = true) {
  if (!reset) return
  const selectors = (await import('../selectors/selectors.mjs')).selectors
  await waitForElementVisible(page, selectors.saveSlotScreen)
  const emptySlot = await page.$(selectors.emptySlot)
  const slotBtn = emptySlot || (await page.$$(selectors.saveSlot))[0]
  if (slotBtn) await slotBtn.click()
  await waitForElementVisible(page, selectors.mainView)
  await page.waitForTimeout(600)
}

export async function clearToasts(page) {
  // Dismiss visible toasts by clicking them. This uses the app's own click
  // handler so Vue's DOM state stays consistent (unlike innerHTML clearing).
  await page.evaluate(() => {
    document.querySelectorAll('.toast-container .toast').forEach((toast) => toast.click())
  })
}

export async function dismissTutorialDarkening(page) {
  // Dispatch a click on the darkening capture layer to dismiss it. We use a
  // JS click because the tutorial message bubble may overlap the layer and
  // Playwright's actionability hit-test does not always honour its
  // pointer-events: none state.
  const captured = await page.evaluate(() => {
    const capture = document.querySelector('.tutorial-overlay .click-capture')
    if (capture) {
      capture.click()
      return true
    }
    const overlay = document.querySelector('.tutorial-overlay')
    if (overlay) {
      overlay.click()
      return true
    }
    return false
  })
  if (!captured) {
    throw new Error('Tutorial overlay/capture layer not found')
  }
  await page.waitForTimeout(200)
}

export async function closeBookAndWaitForTutorial(page) {
  // Book should auto-open on a fresh game. Wait for it, then close it.
  await waitForElementVisible(page, '.book-view', 10000)
  await page.waitForTimeout(600)

  // Click the book's own close control; App.vue will land on Heroes and start
  // the Day-1 tutorial at its first step.
  await page.evaluate(() => {
    const closeBtn = document.querySelector('.book-view .btn-close')
    if (closeBtn) closeBtn.click()
  })

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
