/**
 * Sequential screenshot capture with deterministic naming.
 */
import fs from 'fs'
import path from 'path'

export function createScreenshotter(screenshotsDir) {
  let counter = 1

  fs.mkdirSync(screenshotsDir, { recursive: true })

  return async function capture(page, slug) {
    const fileName = `${String(counter).padStart(6, '0')}_${slug}.png`
    const filePath = path.join(screenshotsDir, fileName)

    await page.screenshot({ path: filePath, fullPage: false })

    counter += 1
    return fileName
  }
}
