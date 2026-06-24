/**
 * Tutorial automation helpers.
 *
 * These helpers drive the Day-1 tutorial chain manually by disabling the
 * overlay's auto-enforcement, so every intermediate state can be screenshotted.
 */

export async function disableTutorialEnforcement(page) {
  await page.evaluate(() => {
    window.__TUTORIAL_DISABLE_ENFORCE__ = true
  })
}

export async function getTutorialState(page) {
  return page.evaluate(() => window.__ENGINE__?.getTutorialState?.() || null)
}

export async function waitForTutorialStep(page, expectedStepId, timeout = 10000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const state = await getTutorialState(page)
    if (state?.stepId === expectedStepId) {
      await page.waitForTimeout(300)
      return state
    }
    await page.waitForTimeout(100)
  }
  const final = await getTutorialState(page)
  throw new Error(
    `Timeout waiting for tutorial step "${expectedStepId}". Last state: ${JSON.stringify(final)}`
  )
}

export async function waitForTutorialInactive(page, timeout = 10000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const state = await getTutorialState(page)
    if (!state?.active) {
      await page.waitForTimeout(300)
      return
    }
    await page.waitForTimeout(100)
  }
  throw new Error('Timeout waiting for tutorial to become inactive')
}

export async function isTutorialOverlayVisible(page) {
  return page.evaluate(() => !!document.querySelector('.tutorial-overlay'))
}

export async function dismissTutorialDarkening(page) {
  const overlay = await page.$('.tutorial-overlay')
  if (!overlay) return

  const capture = await page.$('.tutorial-overlay .click-capture')
  if (capture) {
    // Use evaluate so the click reaches the capture layer even when the
    // tutorial message bubble is positioned on top of it on small screens.
    await page.evaluate((el) => el.click(), capture)
    await page.waitForTimeout(300)
  }
}

export async function acknowledgeTutorialStep(page) {
  const continueBtn = await page.$('.tutorial-message-continue')
  if (continueBtn) {
    await page.evaluate((el) => el.click(), continueBtn)
    await page.waitForTimeout(300)
    return
  }

  // Fallback: click the message bubble if no button is rendered.
  const bubble = await page.$('.tutorial-message-bubble')
  if (bubble) {
    await page.evaluate((el) => el.click(), bubble)
    await page.waitForTimeout(300)
  }
}

export async function isDarkeningDismissed(page) {
  return page.evaluate(() =>
    document.querySelector('.tutorial-overlay')?.classList.contains('darkening-dismissed')
  )
}

export async function clickTutorialTarget(page, target) {
  const el = await page.$(`[data-tutorial-target="${target}"]`)
  if (!el) {
    throw new Error(`Tutorial target not found: ${target}`)
  }
  // Use evaluate to click so the click reaches the target even when the
  // mobile responsive layout has overlay/pointer-event issues.
  await page.evaluate((btn) => btn.click(), el)
  await page.waitForTimeout(300)
}

export async function closeBook(page) {
  const closeBtn = await page.$('.book-view .btn-close, .book-header .btn-close')
  if (closeBtn) {
    await closeBtn.click()
    await page.waitForTimeout(400)
  }
}

export async function clearToasts(page) {
  const toasts = await page.$$('.toast, .toast--narrative, .narrative-toast')
  for (const toast of toasts) {
    try {
      const isVisible = await toast.isVisible()
      if (isVisible) {
        await page.evaluate((el) => el.click(), toast)
      }
    } catch {
      // Toast may have been removed from the DOM between query and click.
    }
  }
  await page.waitForTimeout(100)
}

export async function closeAnyOpenModal(page) {
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
}

export async function waitForElementVisible(page, selector, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout })
}
