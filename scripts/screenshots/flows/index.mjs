import * as onboarding from './01-onboarding.mjs'
import * as village from './02-village.mjs'
import * as heroes from './03-heroes.mjs'
import * as adventure from './04-adventure.mjs'
import * as town from './05-town.mjs'
import * as combat from './06-combat.mjs'
import * as magicCircle from './07-magic-circle.mjs'
import * as settings from './08-settings.mjs'
import * as heroModals from './09-hero-modals.mjs'
import * as postDay from './10-post-day.mjs'
import * as buildingModals from './11-building-modals.mjs'
import * as missions from './12-missions.mjs'
import * as book from './13-book.mjs'
import * as tutorial from './14-tutorial.mjs'
import * as tutorialInteractive from './15-tutorial-interactive.mjs'

import * as playthrough from './99-playthrough.mjs'

export const flowModules = {
  onboarding,
  village,
  heroes,
  adventure,
  town,
  combat,
  'magic-circle': magicCircle,
  settings,
  'hero-modals': heroModals,
  'post-day': postDay,
  'building-modals': buildingModals,
  missions,
  book,
  tutorial,
  'tutorial-interactive': tutorialInteractive,
  playthrough,
}


export async function runFlow(flowName, ctx) {
  const mod = flowModules[flowName]
  if (!mod || typeof mod.run !== 'function') {
    throw new Error(`Unknown flow: ${flowName}`)
  }
  return mod.run(ctx)
}
