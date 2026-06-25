/**
 * Shared configuration for the screenshot orchestrator.
 */
import path from 'path'

export const PORT = 8765
export const DIST_DIR = path.resolve(process.cwd(), 'dist')
export const OUT_DIR = path.resolve(process.cwd(), 'scripts/screenshots/output')

export const VIEWPORT = { width: 1600, height: 1300 }

export const SERVER_RETRY_MS = 100
export const SERVER_RETRY_MAX = 50

export const WAIT_SHORT = 300
export const WAIT_MEDIUM = 800
export const WAIT_LONG = 1500

// Order used when running the full suite in continuous (single playthrough) mode.
export const PLAYTHROUGH_FLOWS = [
  'onboarding',
  'tutorial-interactive',
  'village',
  'heroes',
  'hero-modals',
  'adventure',
  'town',
  'building-modals',
  'combat',
  'magic-circle',
  'missions',
  'post-day',
  'book',
  'settings',
]

function parseArgs() {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes('--dry-run'),
    continuous: args.includes('--continuous'),
    playthrough: args.includes('--playthrough'),
    flowsArg: args.includes('--flows') ? args[args.indexOf('--flows') + 1] : null,
  }
}

const parsed = parseArgs()
export const DRY_RUN = parsed.dryRun
export const CONTINUOUS = parsed.continuous
export const PLAYTHROUGH = parsed.playthrough
export const FLOWS_ARG = parsed.flowsArg
