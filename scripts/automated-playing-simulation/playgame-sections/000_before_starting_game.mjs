/**
 * Section 000: Before Starting Game
 *
 * Covers everything that happens on the save-slot screen before a new game is
 * actually started: opening the game, checking the language switcher, etc.
 */
import { STORAGE_PREFIX, SUPPORTED_LANGUAGES } from '../lib/config.mjs'
import { createStepRecorder } from '../lib/runner.mjs'

function pickAlternateLanguage(currentLanguage) {
  const index = SUPPORTED_LANGUAGES.indexOf(currentLanguage)
  const nextIndex = (index + 1) % SUPPORTED_LANGUAGES.length
  return SUPPORTED_LANGUAGES[nextIndex]
}

export default async function runSection({ page, capture, log, stepNumber, args }) {
  const record = createStepRecorder({ page, capture, log })

  // Step 1: Open the game and land on the save-slot screen.
  await page.goto(`http://localhost:${args.port}/index.html`, { waitUntil: 'networkidle' })

  // Wipe all game data and pre-set the requested language before the engine
  // initializes its persistence layer.
  await page.evaluate(
    ({ prefix, lang }) => {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(prefix))
        .forEach((key) => localStorage.removeItem(key))
      localStorage.setItem(`${prefix}settings_lang`, JSON.stringify(lang))
    },
    { prefix: STORAGE_PREFIX, lang: args.language }
  )

  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.save-slot-page, .slot-list, .slot-card', { timeout: 10000 })

  stepNumber = await record(
    stepNumber,
    'just_opening_game',
    'Game opened. Expected to see the list of available save slots.'
  )

  // Step 2: Switch the language to a different one via the save-slot language
  // selector and verify the UI updates immediately.
  const alternateLanguage = pickAlternateLanguage(args.language)
  stepNumber = await record(
    stepNumber,
    'check_savelots_language_change',
    `Changed save-slot language to "${alternateLanguage}" to verify localization.`,
    async (page) => {
      await page.selectOption('#slots-lang-select', alternateLanguage)
      await page.waitForTimeout(400)
    }
  )

  // Restore the execution language so the rest of the playthrough uses the
  // requested one. No separate screenshot is needed here; the previous step
  // already documented the language-switching behavior.
  await page.selectOption('#slots-lang-select', args.language)
  await page.waitForTimeout(400)

  return stepNumber
}
