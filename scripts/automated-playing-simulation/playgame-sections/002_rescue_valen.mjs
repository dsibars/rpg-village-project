/**
 * Section 002: Rescue Valen
 *
 * Completes the Tutorial Cave boss fight, then runs "The Captured Guard"
 * rescue mission to recruit Sir Valen.
 */
import { createStepRecorder } from '../lib/runner.mjs'

export default async function runSection({ page, capture, log, stepNumber, args }) {
  const record = createStepRecorder({ page, capture, log })

  // TODO: Advance day to trigger Tutorial Cave stage 2 (boss).
  // TODO: Screenshot combat overlay, skip/auto combat, screenshot victory.
  // TODO: Close combat resolution and expedition result modal.

  // TODO: Select The Captured Guard node (exp_rescue_mission).
  // TODO: Assign Arthur, start expedition, advance day.
  // TODO: Screenshot combat, skip/auto, screenshot victory.
  // TODO: Close result modal.

  // TODO: Screenshot Valen unlock narrative toast / Book scene "A Shield in the Dark".
  // TODO: Close Valen book scene.

  return stepNumber
}
