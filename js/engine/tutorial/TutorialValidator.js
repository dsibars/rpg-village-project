/**
 * @fileoverview TutorialValidator.js — Validates tutorial definitions and runtime state.
 *
 * This module provides static validation for the tutorial registry, ensuring:
 * - Tutorial definitions are well-formed
 * - advanceOn event types are from the known set
 * - Cross-references (prerequisites, nextTutorialId) resolve to existing tutorials
 * - i18n keys referenced in messages exist in all translation files
 * - data-tutorial-target IDs are from the canonical registry
 *
 * Used both at runtime (development builds) and in unit tests.
 */

import { TutorialRegistry } from './TutorialRegistry.js';

// ─── Known Event Types ─────────────────────────────────────────────────────

/** @type {Set<string>} */
export const KNOWN_EVENT_TYPES = new Set([
  'tab_changed',
  'hero_selected',
  'skill_learned',
  'skill_modal_opened',
  'skill_modal_closed',
  'stat_assigned',
  'building_constructed',
  'building_project_started',
  'region_selected',
  'expedition_started',
  'day_advanced',
  'book_first_closed',
  'tutorial_completed',
  'tutorial_ack'
]);

// ─── Known Spotlight Targets ───────────────────────────────────────────────

/** @type {Set<string>} */
export const KNOWN_TARGETS = new Set([
  // Footer navigation
  'footer_nav_village',
  'footer_nav_heroes',
  'footer_nav_adventure',
  'footer_nav_town',
  'footer_nav_book',

  // Tab navigation
  'tab_explore',
  'tab_bestiary',
  'tab_codex',
  'tab_chronicle',

  // Hero cards
  'hero_card_arthur',

  // Hero actions
  'hero_action_skills',
  'hero_action_trainer',

  // Skill modal
  'hero_first_locked_skill',
  'hero_skills_modal_close',

  // Stats
  'hero_stats_grid',
  'hero_stat_assign_baseStrength',
  'hero_stat_assign_baseDefense',
  'hero_stat_assign_baseMagicPower',
  'hero_stat_assign_baseSpeed',
  'hero_stat_assign_baseHP',
  'hero_stat_assign_baseMP',

  // Regions
  'region_card_reg_greenfields',

  // Expeditions
  'expedition_node_exp_tutorial_cave',

  // Buildings
  'building_farm',

  // Top bar
  'day_advance_button'
]);

// ─── Known Trigger Types ───────────────────────────────────────────────────

/** @type {Set<string>} */
const KNOWN_TRIGGER_TYPES = new Set([
  'new_game',
  'event',
  'feature_unlocked',
  'building_built',
  'hero_level',
  'tutorial_completed'
]);

// ─── Validation Result ─────────────────────────────────────────────────────

/**
 * @typedef {Object} ValidationError
 * @property {string} type - Error category: 'structure' | 'event' | 'reference' | 'i18n' | 'target'
 * @property {string} tutorialId - ID of the tutorial where the error was found
 * @property {string} [stepId] - Step ID, if applicable
 * @property {string} message - Human-readable error description
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - True if no errors found
 * @property {ValidationError[]} errors - All validation errors
 */

// ─── Validator ─────────────────────────────────────────────────────────────

export class TutorialValidator {
  /**
   * Validate the entire TutorialRegistry against all rules.
   * @param {Object} [options]
   * @param {Record<string, Record<string, string>>} [options.translations] - Map of lang → key → string
   * @param {string[]} [options.requiredLangs] - Languages that must have all keys
   * @returns {ValidationResult}
   */
  static validateRegistry(options = {}) {
    const errors = [];
    const knownTutorialIds = new Set(TutorialRegistry.keys());

    for (const [tutorialId, tutorial] of TutorialRegistry.entries()) {
      errors.push(...this._validateTutorial(tutorialId, tutorial, knownTutorialIds));
    }

    // Check i18n keys if translations provided
    if (options.translations && options.requiredLangs) {
      const allKeys = new Set();
      for (const tutorial of TutorialRegistry.values()) {
        for (const step of tutorial.steps || []) {
          if (step.messages) {
            for (const key of step.messages) allKeys.add(key);
          }
        }
      }
      errors.push(...this._validateI18nKeys(options.translations, options.requiredLangs, allKeys));
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a single tutorial definition.
   * @param {string} tutorialId
   * @param {import('./TutorialTypes.js').TutorialDefinition} tutorial
   * @param {Set<string>} knownIds
   * @returns {ValidationError[]}
   */
  static _validateTutorial(tutorialId, tutorial, knownIds) {
    const errors = [];

    // ── Structure checks ──
    if (!tutorial.id) {
      errors.push({ type: 'structure', tutorialId, message: 'Tutorial missing id' });
    }
    if (tutorial.id !== tutorialId) {
      errors.push({
        type: 'structure',
        tutorialId,
        message: `Tutorial id mismatch: registry key is "${tutorialId}" but definition.id is "${tutorial.id}"`
      });
    }
    if (!tutorial.trigger) {
      errors.push({ type: 'structure', tutorialId, message: 'Tutorial missing trigger' });
    }
    if (!Array.isArray(tutorial.steps)) {
      errors.push({ type: 'structure', tutorialId, message: 'Tutorial steps must be an array' });
    }

    // ── Trigger checks ──
    if (tutorial.trigger) {
      if (!KNOWN_TRIGGER_TYPES.has(tutorial.trigger.type)) {
        errors.push({
          type: 'structure',
          tutorialId,
          message: `Unknown trigger type: "${tutorial.trigger.type}"`
        });
      }
    }

    // ── Reference checks ──
    if (tutorial.prerequisites) {
      for (const prereq of tutorial.prerequisites) {
        if (!knownIds.has(prereq)) {
          errors.push({
            type: 'reference',
            tutorialId,
            message: `Prerequisite references unknown tutorial: "${prereq}"`
          });
        }
      }
    }
    if (tutorial.nextTutorialId && !knownIds.has(tutorial.nextTutorialId)) {
      errors.push({
        type: 'reference',
        tutorialId,
        message: `nextTutorialId references unknown tutorial: "${tutorial.nextTutorialId}"`
      });
    }

    // ── Step checks ──
    if (tutorial.steps) {
      const stepIds = new Set();
      for (const step of tutorial.steps) {
        errors.push(...this._validateStep(tutorialId, step, knownIds));

        // Duplicate step ID check
        if (stepIds.has(step.id)) {
          errors.push({
            type: 'structure',
            tutorialId,
            stepId: step.id,
            message: `Duplicate step id: "${step.id}"`
          });
        }
        stepIds.add(step.id);
      }
    }

    return errors;
  }

  /**
   * Validate a single tutorial step.
   * @param {string} tutorialId
   * @param {import('./TutorialTypes.js').TutorialStep} step
   * @param {Set<string>} knownIds
   * @returns {ValidationError[]}
   */
  static _validateStep(tutorialId, step, knownIds) {
    const errors = [];

    if (!step.id) {
      errors.push({ type: 'structure', tutorialId, message: 'Step missing id' });
    }

    // ── advanceOn event validation ──
    if (step.advanceOn) {
      if (!step.advanceOn.event) {
        errors.push({
          type: 'structure',
          tutorialId,
          stepId: step.id,
          message: 'advanceOn missing event field'
        });
      } else if (!KNOWN_EVENT_TYPES.has(step.advanceOn.event)) {
        errors.push({
          type: 'event',
          tutorialId,
          stepId: step.id,
          message: `Unknown advanceOn event type: "${step.advanceOn.event}"`
        });
      }
    }

    // ── Spotlight target validation ──
    if (step.what?.target) {
      if (!KNOWN_TARGETS.has(step.what.target)) {
        errors.push({
          type: 'target',
          tutorialId,
          stepId: step.id,
          message: `Unknown spotlight target: "${step.what.target}"`
        });
      }
    }

    // ── Messages validation ──
    if (step.messages) {
      if (!Array.isArray(step.messages)) {
        errors.push({
          type: 'structure',
          tutorialId,
          stepId: step.id,
          message: 'messages must be an array of i18n keys'
        });
      } else {
        for (const msg of step.messages) {
          if (typeof msg !== 'string' || msg.length === 0) {
            errors.push({
              type: 'structure',
              tutorialId,
              stepId: step.id,
              message: `Invalid message key: "${msg}"`
            });
          }
        }
      }
    }

    // ── allowActions validation ──
    if (step.allowActions && !Array.isArray(step.allowActions)) {
      errors.push({
        type: 'structure',
        tutorialId,
        stepId: step.id,
        message: 'allowActions must be an array of action keys'
      });
    }

    return errors;
  }

  /**
   * Validate that all i18n keys referenced in the registry exist in all required languages.
   * @param {Record<string, Record<string, string>>} translations
   * @param {string[]} requiredLangs
   * @param {Set<string>} [keys] - Optional set of keys to validate. If omitted, reads from TutorialRegistry.
   * @returns {ValidationError[]}
   */
  static _validateI18nKeys(translations, requiredLangs, keys) {
    const errors = [];

    // Collect all unique message keys from the registry if not provided
    const allKeys = keys || new Set();
    if (!keys) {
      for (const tutorial of TutorialRegistry.values()) {
        for (const step of tutorial.steps || []) {
          if (step.messages) {
            for (const key of step.messages) {
              allKeys.add(key);
            }
          }
        }
      }
    }

    // Check each key in each required language
    for (const lang of requiredLangs) {
      const langData = translations[lang];
      if (!langData) {
        errors.push({
          type: 'i18n',
          tutorialId: 'global',
          message: `Missing translation data for language: "${lang}"`
        });
        continue;
      }

      for (const key of allKeys) {
        if (typeof langData[key] !== 'string') {
          errors.push({
            type: 'i18n',
            tutorialId: 'global',
            message: `Missing translation for key "${key}" in language "${lang}"`
          });
        }
      }
    }

    return errors;
  }

  /**
   * Check for ghost keys — translation keys defined but never referenced in the registry.
   * @param {Record<string, Record<string, string>>} translations
   * @param {string} lang
   * @returns {string[]} Array of ghost keys
   */
  static findGhostKeys(translations, lang) {
    const langData = translations[lang];
    if (!langData) return [];

    // Collect all referenced keys
    const referencedKeys = new Set();
    for (const tutorial of TutorialRegistry.values()) {
      for (const step of tutorial.steps) {
        if (step.messages) {
          for (const key of step.messages) {
            referencedKeys.add(key);
          }
        }
      }
    }

    // Find ghost keys (tutorial_ prefix only)
    const ghosts = [];
    for (const key of Object.keys(langData)) {
      if (key.startsWith('tutorial_') && !referencedKeys.has(key)) {
        ghosts.push(key);
      }
    }

    return ghosts;
  }

  /**
   * Validate a reported event payload against a step's advanceOn configuration.
   * @param {import('./TutorialTypes.js').TutorialAdvanceOn} advanceOn
   * @param {import('./TutorialTypes.js').TutorialEventPayload} payload
   * @returns {boolean}
   */
  static matchesEvent(advanceOn, payload) {
    if (!advanceOn || !payload) return false;
    if (advanceOn.event !== payload.event) return false;

    // Check optional filters
    const filters = ['heroId', 'buildingId', 'nodeId', 'statId', 'remainingPoints', 'familyId', 'page', 'tab', 'regionId'];
    for (const filter of filters) {
      if (advanceOn[filter] !== undefined && advanceOn[filter] !== payload[filter]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Assert that the registry is valid. Throws if not.
   * @param {Object} [options]
   * @param {Record<string, Record<string, string>>} [options.translations]
   * @param {string[]} [options.requiredLangs]
   * @throws {Error}
   */
  static assertValid(options) {
    const result = this.validateRegistry(options);
    if (!result.valid) {
      const messages = result.errors.map(e =>
        `[${e.type}] ${e.tutorialId}${e.stepId ? `/${e.stepId}` : ''}: ${e.message}`
      );
      throw new Error(`TutorialRegistry validation failed:\n${messages.join('\n')}`);
    }
  }
}
