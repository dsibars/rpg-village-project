/**
 * Playwright browser and page management.
 */
import { chromium } from 'playwright'
import { VIEWPORT } from '../config.mjs'

export async function launchBrowser() {
  return chromium.launch({ headless: true })
}

export async function createContext(browser) {
  return browser.newContext({ viewport: VIEWPORT })
}

export async function createPage(context, url) {
  const page = await context.newPage()
  await page.goto(url)
  return page
}

export async function clearStorage(page) {
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

export async function reloadPage(page) {
  await page.reload()
}
