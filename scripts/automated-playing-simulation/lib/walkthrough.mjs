/**
 * Walkthrough logger: numbered human-readable action log with screenshot references.
 */
import fs from 'fs'
import path from 'path'

export function createWalkthroughLogger(outputDir) {
  const filePath = path.join(outputDir, 'walkthrough.txt')

  // Start with a clean file and a header.
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(
    filePath,
    `Automated Playing Simulation - Walkthrough\nGenerated: ${new Date().toISOString()}\n\n`
  )

  return function log(stepNumber, description, screenshotFileName) {
    const line = `${stepNumber}. ${description} (screenshot: ${screenshotFileName})\n`
    fs.appendFileSync(filePath, line)
    return line.trim()
  }
}
