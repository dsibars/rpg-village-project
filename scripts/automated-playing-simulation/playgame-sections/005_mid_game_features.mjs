/**
 * Section 005: Mid-Game Features
 *
 * Touches the major secondary systems that are unlocked in the first days:
 * heroes detail, inventory, shop, forge, magic circle simulator, book, chronicle,
 * settings, and (later) gambits.
 */
import { createStepRecorder } from '../lib/runner.mjs'

export default async function runSection({ page, capture, log, stepNumber, args }) {
  const record = createStepRecorder({ page, capture, log })

  // TODO: Heroes tab — inspect Arthur and Valen profiles, stats, skills.
  // TODO: Town → Inventory tab.
  // TODO: Town → Shop tab (if unlocked via Tavern).
  // TODO: Town → Forge tab (if unlocked).
  // TODO: Settings page — language switch, Magic Circle Simulator.
  // TODO: Magic Circle Simulator flow.
  // TODO: Book → read unlocked entries.
  // TODO: Adventure → Chronicle tab.
  // TODO: Gambits (move to a dedicated 006 if this file grows too large).

  return stepNumber
}
