/**
 * Browser bootstrap for Playwright.
 */
import { chromium } from 'playwright'

export async function launchBrowser({ contextConfig, headed = false }) {
  const browser = await chromium.launch({ headless: !headed })
  const context = await browser.newContext({
    viewport: contextConfig.viewport,
    ...contextConfig.browserContextOptions,
  })
  const page = await context.newPage()
  return { browser, context, page }
}

export async function closeBrowser({ browser }) {
  if (browser) {
    await browser.close()
  }
}
