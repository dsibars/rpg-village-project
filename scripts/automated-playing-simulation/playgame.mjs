#!/usr/bin/env node
/**
 * Automated Playing Simulation
 *
 * Simulates a real user playing the game in a specific browser context and language.
 * Every action is logged to walkthrough.txt and paired with a numbered screenshot.
 *
 * Usage:
 *   node scripts/automated-playing-simulation/playgame.mjs --context desktop --language en
 *   node scripts/automated-playing-simulation/playgame.mjs --context mobile --language es --headed
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import {
  DIST_DIR,
  SUPPORTED_LANGUAGES,
  parseArgs,
  printHelp,
  cleanContextOutput,
} from './lib/config.mjs'
import { startServer } from './lib/server.mjs'
import { launchBrowser, closeBrowser } from './lib/browser.mjs'
import { createScreenshotter } from './lib/screenshot.mjs'
import { createWalkthroughLogger } from './lib/walkthrough.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SECTIONS_DIR = path.join(__dirname, 'playgame-sections')
const CONTEXTS_DIR = path.join(__dirname, 'contexts')

// Sections are loaded explicitly so their execution order is obvious and stable.
const SECTION_FILES = [
  '000_before_starting_game.mjs',
  '001_tutorial_and_first_day.mjs',
  '002_rescue_valen.mjs',
  '003_hero_level_five.mjs',
  '004_village_development.mjs',
  '005_mid_game_features.mjs',
]

async function loadContext(contextName) {
  const contextPath = path.join(CONTEXTS_DIR, `${contextName}.mjs`)
  try {
    const module = await import(contextPath)
    return module.default
  } catch (err) {
    throw new Error(`Unknown context "${contextName}". Expected one of: desktop, mobile. (${err.message})`)
  }
}

async function loadSection(fileName) {
  const sectionPath = path.join(SECTIONS_DIR, fileName)
  try {
    const module = await import(sectionPath)
    return module.default
  } catch (err) {
    throw new Error(`Failed to load section "${fileName}". (${err.message})`)
  }
}

async function main() {
  const args = parseArgs()

  if (args.help) {
    printHelp()
    process.exit(0)
  }

  if (!SUPPORTED_LANGUAGES.includes(args.language)) {
    console.error(`Unsupported language "${args.language}". Supported: ${SUPPORTED_LANGUAGES.join(', ')}`)
    process.exit(1)
  }

  if (!fs.existsSync(DIST_DIR)) {
    console.error(`Error: dist/ folder does not exist. Run \`npm run build\` first.`)
    process.exit(1)
  }

  const { outputDir, screenshotsDir } = cleanContextOutput(args.context)
  const capture = createScreenshotter(screenshotsDir)
  const log = createWalkthroughLogger(outputDir)

  console.log(`Starting automated play simulation`)
  console.log(`  Context : ${args.context}`)
  console.log(`  Language: ${args.language}`)
  console.log(`  Output  : ${outputDir}`)

  const contextConfig = await loadContext(args.context)

  console.log(`  Viewport : ${contextConfig.viewport.width}x${contextConfig.viewport.height}`)

  const server = await startServer(DIST_DIR, args.port)
  let browser = null
  let stepNumber = 1

  try {
    const { browser: bw, page } = await launchBrowser({ contextConfig, headed: args.headed })
    browser = bw

    for (const fileName of SECTION_FILES) {
      const section = await loadSection(fileName)
      console.log(`\n[section] ${fileName}`)
      stepNumber = await section({ page, capture, log, stepNumber, args })
    }

    console.log(`\nSimulation complete. ${stepNumber - 1} step(s) recorded.`)
    console.log(`Walkthrough: ${path.join(outputDir, 'walkthrough.txt')}`)
    console.log(`Screenshots: ${screenshotsDir}`)
  } catch (err) {
    console.error(`\nSimulation failed: ${err.message}`)
    console.error(err.stack)
    process.exitCode = 1
  } finally {
    await closeBrowser({ browser })
    server.close()
  }
}

main().catch((err) => {
  console.error(`\nSimulation failed: ${err.message}`)
  process.exit(1)
})
