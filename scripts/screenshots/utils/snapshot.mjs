/**
 * Screenshot helper with semantic naming.
 */
import fs from 'fs'
import path from 'path'
import { OUT_DIR } from '../config.mjs'

export function ensureOutDir(outDir = OUT_DIR) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
}

export async function snap(page, { flow, state, dryRun = false, outDir = OUT_DIR }) {
  ensureOutDir(outDir)
  const fileName = `${flow}_${state}.png`
  const filePath = path.join(outDir, fileName)

  if (!dryRun) {
    await page.screenshot({ path: filePath, fullPage: false })
  }

  console.log(`[${flow}] ${state} ${dryRun ? '(dry-run)' : `→ ${fileName}`}`)
  return filePath
}

export function createSnapshot(page, outDir = OUT_DIR) {
  ensureOutDir(outDir)
  return ({ flow, state, dryRun = false }) =>
    snap(page, { flow, state, dryRun, outDir })
}
