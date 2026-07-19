/**
 * Section 003: Hero Level Five
 *
 * Runs additional expeditions (Tiny Cave / Greenfields procedural nodes) and/or
 * training until Arthur reaches level 5. Gambits unlock at this point.
 */
import { createStepRecorder } from '../lib/runner.mjs'

export default async function runSection({ page, capture, log, stepNumber, args }) {
  const record = createStepRecorder({ page, capture, log })

  // TODO: Open Adventure → Explore, select Tiny Cave or an available procedural node.
  // TODO: Assign Arthur (solo for max XP), start expedition.
  // TODO: Loop: advance day → skip combat → close result.
  // TODO: Take milestone screenshots at Arthur levels 2, 3, 4.

  // TODO: On reaching level 5:
  //   - Screenshot level-up / narrative toast "Awakening".
  //   - Screenshot Book "Discipline" scene if it auto-opens.
  //   - Screenshot hero profile showing the Gambits action button.

  return stepNumber
}
