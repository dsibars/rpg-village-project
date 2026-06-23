/**
 * Screenshot Orchestrator
 *
 * Captures app screenshots using a state-injection hybrid approach.
 *
 * Usage:
 *   node scripts/screenshots/orchestrator.mjs
 *   node scripts/screenshots/orchestrator.mjs --flows onboarding,village
 *   node scripts/screenshots/orchestrator.mjs --dry-run
 */

import path from 'path'
import fs from 'fs'
import { chromium } from 'playwright'
import { fileURLToPath } from 'url'

import { DIST_DIR, OUT_DIR, PORT, VIEWPORT, DRY_RUN, FLOWS_ARG } from './config.mjs'
import { startServer } from './utils/server.mjs'
import { createSnapshot } from './utils/snapshot.mjs'
import { screenshotRegistry, getFlows } from './registry.mjs'
import { runFlow } from './flows/index.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const selectedFlows = FLOWS_ARG ? FLOWS_ARG.split(',').map((s) => s.trim()) : null

const flowsToRun = selectedFlows
  ? [...new Set(screenshotRegistry
      .filter((entry) => selectedFlows.includes(entry.flow))
      .map((entry) => entry.flow))]
  : getFlows()

if (flowsToRun.length === 0) {
  console.error('No flows matching the requested filters.')
  process.exit(1)
}

const registryEntries = selectedFlows
  ? screenshotRegistry.filter((entry) => selectedFlows.includes(entry.flow))
  : screenshotRegistry

console.log(`Orchestrator starting: dryRun=${DRY_RUN} flows=${flowsToRun.join(',')} states=${registryEntries.length}`)

// Ensure output directory exists
fs.mkdirSync(OUT_DIR, { recursive: true })

const server = await startServer(DIST_DIR, PORT)
let browser = null
const results = []

try {
  browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: VIEWPORT })
  const page = await context.newPage()
  page.on('console', msg => console.log('[browser]', msg.text()))

  for (const flowName of flowsToRun) {
    const label = flowName
    console.log(`[${label}] start`)

    if (DRY_RUN) {
      console.log(`[${label}] dry-run skip`)
      results.push({ label, status: 'dry-run' })
      continue
    }

    try {
      // Navigate to fresh app instance for each flow
      await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle' })

      const snap = createSnapshot(page, OUT_DIR)

      await runFlow(flowName, {
        page,
        snap: ({ flow, state }) => snap({ flow, state }),
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
