import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Import the book flow
import { run as runBookFlow } from './flows/13-book.mjs'
import { createSnapshot } from './utils/snapshot.mjs'
import { startServer } from './utils/server.mjs'

const DIST_DIR = path.resolve(__dirname, '../../dist')
const OUT_DIR = path.resolve(__dirname, 'output')
const PORT = 8765

fs.mkdirSync(OUT_DIR, { recursive: true })

const server = await startServer(DIST_DIR, PORT)
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
const page = await context.newPage()

const snap = createSnapshot(page, OUT_DIR)

await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)

try {
  await runBookFlow({ page, snap })
  console.log('Book flow completed successfully')
} catch (err) {
  console.error('Book flow failed:', err)
}

await browser.close()
server.close()
console.log('Done')
