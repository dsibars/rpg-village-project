/**
 * Audit helper: list captured screenshots against the registry.
 *
 * Usage:
 *   node scripts/screenshots/audit.mjs
 *
 * Reports missing screenshots and orphan files.
 */

import fs from 'fs'
import path from 'path'
import { OUT_DIR } from './config.mjs'
import { screenshotRegistry } from './registry.mjs'

const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.png'))

const expected = new Set()
for (const entry of screenshotRegistry) {
  expected.add(`${entry.flow}_${entry.state}.png`)
}

let captured = 0
let missing = 0
const issues = []

for (const fileName of expected) {
  if (files.includes(fileName)) {
    captured++
  } else {
    missing++
    issues.push(fileName)
  }
}

console.log(`Screenshot audit (${OUT_DIR})`)
console.log(`Registry entries : ${expected.size}`)
console.log(`Captured         : ${captured}`)
console.log(`Missing          : ${missing}`)
console.log(`Total files      : ${files.length}`)

if (issues.length > 0) {
  console.log('\nMissing:')
  for (const name of issues) {
    console.log(`  - ${name}`)
  }
}

// Orphan files (not in registry)
const orphans = files.filter((f) => !expected.has(f))
if (orphans.length) {
  console.log('\nOrphan files (not in registry):')
  for (const f of orphans) console.log(`  ${f}`)
}

process.exit(issues.length > 0 ? 1 : 0)
