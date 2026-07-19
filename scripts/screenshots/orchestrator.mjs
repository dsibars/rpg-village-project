/**
 * Screenshot Orchestrator
 *
 * Captures app screenshots using a state-injection hybrid approach.
 * In continuous mode (--continuous) all selected flows run in a single browser
 * session sharing the same localStorage game state, simulating one continuous
 * playthrough. The first flow starts fresh; later flows continue from the
 * previous state.
 *
 * Usage:
 *   node scripts/screenshots/orchestrator.mjs
 *   node scripts/screenshots/orchestrator.mjs --flows onboarding,village
 *   node scripts/screenshots/orchestrator.mjs --continuous
 *   node scripts/screenshots/orchestrator.mjs --playthrough
 *   node scripts/screenshots/orchestrator.mjs --dry-run
 */

import path from 'path'
import fs from 'fs'
import { chromium } from 'playwright'
import { fileURLToPath } from 'url'

import { DIST_DIR, OUT_DIR, PORT, VIEWPORT, DRY_RUN, CONTINUOUS, PLAYTHROUGH, FLOWS_ARG, PLAYTHROUGH_FLOWS } from './config.mjs'
import { startServer } from './utils/server.mjs'
import { createSnapshot } from './utils/snapshot.mjs'
import { screenshotRegistry, getFlows } from './registry.mjs'
import { runFlow } from './flows/index.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const selectedFlows = FLOWS_ARG ? FLOWS_ARG.split(',').map((s) => s.trim()) : null

const flowsToRun = PLAYTHROUGH
  ? ['playthrough']
  : selectedFlows
    ? [...new Set(screenshotRegistry
        .filter((entry) => selectedFlows.includes(entry.flow))
        .map((entry) => entry.flow))]
    : (CONTINUOUS ? PLAYTHROUGH_FLOWS : getFlows())

if (flowsToRun.length === 0) {
  console.error('No flows matching the requested filters.')
  process.exit(1)
}

const registryEntries = selectedFlows
  ? screenshotRegistry.filter((entry) => selectedFlows.includes(entry.flow))
  : screenshotRegistry

console.log(`Orchestrator starting: dryRun=${DRY_RUN} continuous=${CONTINUOUS} playthrough=${PLAYTHROUGH} flows=${flowsToRun.join(',')} states=${registryEntries.length}`)

// Ensure output directory exists
fs.mkdirSync(OUT_DIR, { recursive: true })

const server = await startServer(DIST_DIR, PORT)
let browser = null
const results = []

try {
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: VIEWPORT })
  const page = await context.newPage()

  if (!DRY_RUN && CONTINUOUS) {
    // In continuous mode we load the app once and share state across all flows.
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle' })
    // Disable tutorial auto-enforcement so the Day-1 tutorial does not progress
    // on its own between flows; the interactive tutorial flow will drive it.
    // We use sessionStorage so the flag survives the page reloads some flows perform.
    await page.evaluate(() => {
      sessionStorage.setItem('__TUTORIAL_DISABLE_ENFORCE__', '1')
      window.__TUTORIAL_DISABLE_ENFORCE__ = true
    })
  }

  for (let i = 0; i < flowsToRun.length; i++) {
    const flowName = flowsToRun[i]
    const label = flowName
    console.log(`[${label}] start`)

    if (DRY_RUN) {
      console.log(`[${label}] dry-run skip`)
      results.push({ label, status: 'dry-run' })
      continue
    }

    try {
      if (!CONTINUOUS) {
        // Non-continuous mode: fresh app instance for each flow
        await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle' })
      }

      const snap = createSnapshot(page, OUT_DIR)
      const reset = !CONTINUOUS || i === 0

      await runFlow(flowName, {
        page,
        snap: ({ flow, state }) => snap({ flow, state }),
        reset,
      })

      console.log(`[${label}] captured`)
      results.push({ label, status: 'ok' })
    } catch (err) {
      console.error(`[${label}] FAILED: ${err.message}`)
      results.push({ label, status: 'fail', error: err.message })
      // Continue with next flow
    }
  }

  await page.close()
} finally {
  if (browser) await browser.close()
  server.close()
}

// Summary
const ok = results.filter((r) => r.status === 'ok' || r.status === 'dry-run').length
const fail = results.filter((r) => r.status === 'fail').length
console.log(`\nDone. ok=${ok} fail=${fail} total=${results.length}`)
if (fail > 0) {
  for (const r of results.filter((r) => r.status === 'fail')) {
    console.error(`  - ${r.label}: ${r.error}`)
  }
  process.exit(1)
}
