/**
 * Shared configuration and CLI parsing for the automated play simulation.
 */
import fs from 'fs'
import path from 'path'

export const BASE_DIR = path.resolve(process.cwd(), 'scripts/automated-playing-simulation')
export const DIST_DIR = path.resolve(process.cwd(), 'dist')
export const BASE_PORT = 9876
export const DEFAULT_CONTEXT = 'desktop'
export const DEFAULT_LANGUAGE = 'en'
export const SUPPORTED_LANGUAGES = ['en', 'es', 'ca', 'eu', 'gl']
export const STORAGE_PREFIX = 'rpg_village_v1_'

export function contextOutputDir(contextName) {
  return path.join(BASE_DIR, 'context_outputs', contextName)
}

export function cleanContextOutput(contextName) {
  const outputDir = contextOutputDir(contextName)
  const screenshotsDir = path.join(outputDir, 'screenshots')
  const walkthroughPath = path.join(outputDir, 'walkthrough.txt')

  fs.mkdirSync(screenshotsDir, { recursive: true })

  // Remove previous screenshots but keep the folder structure and .gitkeep.
  for (const entry of fs.readdirSync(screenshotsDir)) {
    if (entry !== '.gitkeep') {
      fs.rmSync(path.join(screenshotsDir, entry), { recursive: true, force: true })
    }
  }

  if (fs.existsSync(walkthroughPath)) {
    fs.rmSync(walkthroughPath, { force: true })
  }

  return { outputDir, screenshotsDir }
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--context' || arg === '-c') {
      args.context = argv[++i]
    } else if (arg === '--language' || arg === '-l') {
      args.language = argv[++i]
    } else if (arg === '--port' || arg === '-p') {
      args.port = parseInt(argv[++i], 10)
    } else if (arg === '--headed') {
      args.headed = true
    } else if (arg === '--help' || arg === '-h') {
      args.help = true
    }
  }

  return {
    context: args.context || DEFAULT_CONTEXT,
    language: args.language || DEFAULT_LANGUAGE,
    port: Number.isFinite(args.port) ? args.port : BASE_PORT,
    headed: args.headed || false,
    help: args.help || false,
  }
}

export function printHelp() {
  console.log(`Usage: node playgame.mjs [options]

Options:
  -c, --context <name>    Context to run: desktop | mobile (default: ${DEFAULT_CONTEXT})
  -l, --language <lang>   Language to use: ${SUPPORTED_LANGUAGES.join(' | ')} (default: ${DEFAULT_LANGUAGE})
  -p, --port <number>     Static server port (default: ${BASE_PORT})
      --headed            Show the browser window (default: headless)
  -h, --help              Show this help

Examples:
  node playgame.mjs --context desktop --language en
  node playgame.mjs --context mobile --language es --headed
`)
}
