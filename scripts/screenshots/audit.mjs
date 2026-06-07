/**
 * Audit helper: compare generated v1/v2 screenshot pairs.
 *
 * Usage:
 *   node scripts/screenshots/audit.mjs
 *
 * Reports missing pairs, mismatched counts, and pair coverage.
 */

import fs from 'fs'
import path from 'path'
import { OUT_DIR } from './config.mjs'
import { screenshotRegistry } from './registry.mjs'

const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.png'))

const pairs = new Map()
for (const entry of screenshotRegistry) {
  const base = `${entry.flow}_${entry.state}`
  pairs.set(base, { v1: `v1_${base}.png`, v2: `v2_${base}.png`, entry })
}

const v1Files = new Set(files.filter((f) => f.startsWith('v1_')))
const v2Files = new Set(files.filter((f) => f.startsWith('v2_')))

let complete = 0
let partial = 0
let missing = 0
const issues = []

for (const [base, { v1, v2 }] of pairs) {
  const hasV1 = v1Files.has(v1)
  const hasV2 = v2Files.has(v2)
  if (hasV1 && hasV2) {
    complete++
  } else if (hasV1 || hasV2) {
    partial++
    issues.push({ base, v1: hasV1, v2: hasV2 })
  } else {
    missing++
    issues.push({ base, v1: false, v2: false })
  }
}

console.log(`Screenshot pair audit (${OUT_DIR})`)
console.log(`Registry entries : ${pairs.size}`)
console.log(`Complete pairs   : ${complete}`)
console.log(`Partial pairs    : ${partial}`)
console.log(`Missing pairs    : ${missing}`)
console.log(`Total v1 files   : ${v1Files.size}`)
console.log(`Total v2 files   : ${v2Files.size}`)

if (issues.length > 0) {
  console.log('\nIssues:')
  for (const issue of issues) {
    const status = !issue.v1 && !issue.v2 ? 'both missing' : issue.v1 ? 'v2 missing' : 'v1 missing'
    console.log(`  - ${issue.base}: ${status}`)
  }
}

// Orphan files (not in registry)
const expectedV1 = new Set([...pairs.values()].map((p) => p.v1))
const expectedV2 = new Set([...pairs.values()].map((p) => p.v2))
const orphanV1 = [...v1Files].filter((f) => !expectedV1.has(f))
const orphanV2 = [...v2Files].filter((f) => !expectedV2.has(f))
if (orphanV1.length || orphanV2.length) {
  console.log('\nOrphan files (not in registry):')
  for (const f of orphanV1) console.log(`  v1 ${f}`)
  for (const f of orphanV2) console.log(`  v2 ${f}`)
}

process.exit(issues.length > 0 ? 1 : 0)
