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
