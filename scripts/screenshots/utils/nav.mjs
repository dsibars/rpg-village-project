/**
 * Navigation helpers for interacting with the UI.
 */

export async function clickElement(page, selector, options = {}) {
  if (!selector) return false
  const el = await page.$(selector)
  if (!el) {
    if (!options.optional) {
      console.log(`  ⚠ Not found: ${selector}`)
    }
    return false
  }

  try {
    await el.click({ timeout: options.timeout || 3000 })
    return true
  } catch (e) {
    await page.evaluate((sel) => {
      const element = document.querySelector(sel)
      if (element) element.click()
    }, selector)
    return true
  }
}

export async function waitForVisible(page, selector, timeout = 10000) {
  if (!selector) return false
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' })
    return true
  } catch (e) {
    console.log(`  ⚠ Timeout waiting for: ${selector}`)
    return false
  }
}

export async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function clickNav(page, selector) {
  return clickElement(page, selector)
}

export async function clickSubNav(page, selector) {
  return clickElement(page, selector)
}

/**
 * Close any open fullview overlay (combat, book, etc.) and wait for it to leave.
 * Uses Escape and a direct close-button click; retries a few times if needed.
 */
export async function closeFullViewOverlay(page, maxAttempts = 3) {
  for (let i = 0; i < maxAttempts; i++) {
    const hasOverlay = await page.evaluate(() => !!document.querySelector('.fullview-overlay'))
    if (!hasOverlay) return true

    await page.evaluate(() => {
      const e = window.__ENGINE__
      if (e?.battleService) {
        e.battleService.isOver = true
        e.battleService.winner = e.battleService.winner || 'heroes'
      }
      const closeBtn = document.querySelector('.fullview-overlay .btn-close')
      if (closeBtn && !closeBtn.disabled) closeBtn.click()
    })
    await page.keyboard.press('Escape')
    await page.waitForTimeout(400)
  }
  return !(await page.evaluate(() => !!document.querySelector('.fullview-overlay')))
}
