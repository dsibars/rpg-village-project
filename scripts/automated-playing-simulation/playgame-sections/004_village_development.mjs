/**
 * Section 004: Village Development
 *
 * Builds and inspects early village infrastructure (Farm completion, Lumber Mill,
 * maybe Tavern/Infirmary after Valen blueprints).
 */
import { createStepRecorder } from '../lib/runner.mjs'

export default async function runSection({ page, capture, log, stepNumber, args }) {
  const record = createStepRecorder({ page, capture, log })

  // TODO: Navigate to Village → inspect Farm construction progress.
  // TODO: Advance days until Farm completes; screenshot completion toast/modal.
  // TODO: Open Town → Buildings, inspect available buildings.
  // TODO: Start Lumber Mill / other early building projects.
  // TODO: Check daily objectives and mission board if unlocked.

  return stepNumber
}
