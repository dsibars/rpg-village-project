/**
 * @fileoverview TutorialTypes.js — JSDoc type definitions for the tutorial system.
 *
 * Zero runtime cost. Imported only for documentation and IDE autocompletion.
 * All tutorial data structures are declared here; no actual JavaScript is exported.
 */

/**
 * Navigation context that defines where the player must be for a tutorial step.
 * @typedef {Object} TutorialWhere
 * @property {string} [page] - App.vue currentPage (e.g. 'heroes', 'village', 'adventure')
 * @property {string} [tab] - Page-specific active tab (e.g. 'explore', 'bestiary')
 * @property {string} [heroId] - Selected hero ID on the Heroes page
 * @property {string} [modal] - Active modal ID (e.g. 'skills', 'trainer')
 * @property {string} [regionId] - Selected region ID on the Adventure/Explore page
 * @property {string} [expeditionId] - Selected expedition node ID
 * @property {string} [buildingId] - Target building ID on the Village page
 */

/**
 * Spotlight configuration that defines which DOM element to highlight.
 * @typedef {Object} TutorialWhat
 * @property {string} target - data-tutorial-target attribute value to query
 * @property {boolean} [flash=true] - Whether to apply a pulsing animation
 * @property {number} [padding=8] - Spotlight padding around the target element in px
 * @property {boolean} [rounded=true] - Whether the spotlight hole has rounded corners
 */

/**
 * Event condition that causes a tutorial step to auto-advance to the next.
 * @typedef {Object} TutorialAdvanceOn
 * @property {string} event - Event type to match (e.g. 'skill_learned', 'stat_assigned')
 * @property {string} [heroId] - Optional filter: specific hero ID must match
 * @property {string} [buildingId] - Optional filter: specific building ID must match
 * @property {string} [nodeId] - Optional filter: specific expedition node ID must match
 * @property {string} [statId] - Optional filter: specific stat ID must match
 * @property {string} [familyId] - Optional filter: specific skill family ID must match
 */

/**
 * A single step within a tutorial.
 * @typedef {Object} TutorialStep
 * @property {string} id - Unique step ID within the tutorial
 * @property {TutorialWhere} [where] - Navigation context required for this step
 * @property {TutorialWhat} [what] - Spotlight target configuration
 * @property {string[]} [messages] - Array of i18n keys shown sequentially
 * @property {TutorialAdvanceOn} [advanceOn] - Event that auto-advances this step
 * @property {string[]} [allowActions] - Whitelist of engine actions permitted during this step
 * @property {boolean} [modalLock=false] - Whether the modal cannot be closed during this step
 */

/**
 * Trigger condition that determines when a tutorial should start automatically.
 * @typedef {Object} TutorialTrigger
 * @property {'new_game'|'event'|'feature_unlocked'|'building_built'|'hero_level'|'tutorial_completed'} type - Trigger type
 * @property {string} [event] - For 'event' type: the event name to match
 * @property {number} [day] - For 'event' type: optional day number filter
 * @property {string} [feature] - For 'feature_unlocked' type: the feature flag name
 * @property {string} [buildingId] - For 'building_built' type: the building ID
 * @property {number} [minLevel=1] - For 'building_built' or 'hero_level' type: minimum level required
 * @property {string} [heroId] - For 'hero_level' type: the hero ID
 * @property {string} [id] - For 'tutorial_completed' type: the prerequisite tutorial ID
 */

/**
 * A complete tutorial definition with all its steps and metadata.
 * @typedef {Object} TutorialDefinition
 * @property {string} id - Unique tutorial identifier (e.g. 'tutorial_hero_skills')
 * @property {TutorialTrigger} trigger - Condition that auto-starts this tutorial
 * @property {string[]} [prerequisites] - Tutorial IDs that must be completed before this can trigger
 * @property {TutorialStep[]} steps - Ordered sequence of tutorial steps
 * @property {string} [nextTutorialId] - Next tutorial to auto-start after this one completes
 */

/**
 * Persistent tutorial state stored per save slot.
 * @typedef {Object} TutorialState
 * @property {string|null} activeTutorialId - Currently running tutorial, or null if none
 * @property {number} currentStepIndex - 0-based index within the active tutorial
 * @property {string[]} completedTutorialIds - Tutorials that have been fully completed
 * @property {Record<string, any>} stepData - Arbitrary per-step data passed between steps
 */

/**
 * Runtime view of the current tutorial step, exposed to the presentation layer.
 * @typedef {Object} TutorialStepView
 * @property {string} tutorialId - Active tutorial ID
 * @property {number} stepIndex - Current step index (0-based)
 * @property {number} totalSteps - Total number of steps in the tutorial
 * @property {string} stepId - Current step ID
 * @property {TutorialWhere|null} where - Navigation context for this step
 * @property {TutorialWhat|null} what - Spotlight target for this step
 * @property {string[]} messages - i18n keys to display
 * @property {TutorialAdvanceOn|null} advanceOn - Event that advances this step
 * @property {string[]} allowActions - Whitelisted engine actions
 * @property {Record<string, any>} stepData - Per-step data
 */

/**
 * Event payload emitted by components to report tutorial-relevant actions.
 * @typedef {Object} TutorialEventPayload
 * @property {string} event - Event type (e.g. 'skill_learned', 'stat_assigned')
 * @property {string} [heroId] - Hero ID associated with the event
 * @property {string} [familyId] - Skill family ID for skill-related events
 * @property {string} [buildingId] - Building ID for construction events
 * @property {string} [nodeId] - Expedition node ID for expedition events
 * @property {string} [statId] - Stat ID for stat assignment events
 * @property {number} [fromDay] - Previous day number for day advancement events
 * @property {number} [toDay] - New day number for day advancement events
 * @property {number} [level] - Building or hero level for level-related events
 */

// No runtime exports — this file is purely for type documentation.
