/**
 * @fileoverview TutorialRegistry.js — Declarative tutorial definitions.
 *
 * All tutorials are defined here as pure data. The TutorialService consumes
 * these definitions to drive the tutorial state machine. No engine logic
 * lives in this file — only step sequences, triggers, and navigation targets.
 */

/** @typedef {import('./TutorialTypes.js').TutorialDefinition} TutorialDefinition */

/**
 * Day 1 tutorial chain:
 * 1. tutorial_hero_skills    → Learn a skill with Arthur
 * 2. tutorial_hero_stats     → Assign a stat point
 * 3. tutorial_build_farm     → Build the farm
 * 4. tutorial_expeditions    → Start an expedition and advance day
 *
 * Each tutorial auto-starts the next via nextTutorialId when completed.
 */

/** @type {Map<string, TutorialDefinition>} */
export const TutorialRegistry = new Map([
  // ── Day 1 Chain ──────────────────────────────────────────────────────────

  [
    'tutorial_hero_skills',
    {
      id: 'tutorial_hero_skills',
      trigger: { type: 'new_game' },
      prerequisites: [],
      steps: [
        {
          id: 'navigate_heroes',
          messages: ['tutorial_hero_skills_msg_navigate_heroes'],
          what: { target: 'footer_nav_heroes', flash: true },
          where: { page: 'heroes' },
          advanceOn: { event: 'tab_changed', page: 'heroes' }
        },
        {
          id: 'select_arthur',
          messages: ['tutorial_hero_skills_msg_select_arthur'],
          what: { target: 'hero_card_arthur', flash: true },
          where: { page: 'heroes', heroId: 'arthur' },
          advanceOn: { event: 'hero_selected', heroId: 'arthur' }
        },
        {
          id: 'learn_skill',
          messages: ['tutorial_hero_skills_msg_learn_skill'],
          what: { target: 'hero_action_skills', flash: true },
          where: { page: 'heroes', heroId: 'arthur', modal: 'skills' },
          modalLock: true,
          allowActions: ['learnHeroFamily'],
          advanceOn: { event: 'skill_learned', heroId: 'arthur' }
        }
      ],
      nextTutorialId: 'tutorial_hero_stats'
    }
  ],

  [
    'tutorial_hero_stats',
    {
      id: 'tutorial_hero_stats',
      trigger: { type: 'new_game' },
      prerequisites: ['tutorial_hero_skills'],
      steps: [
        {
          id: 'assign_stats',
          messages: ['tutorial_hero_stats_msg_assign_stats'],
          what: { target: 'hero_stats_grid', flash: false },
          where: { page: 'heroes', heroId: 'arthur' },
          allowActions: ['increaseHeroStat'],
          advanceOn: { event: 'stat_assigned', heroId: 'arthur' }
        }
      ],
      nextTutorialId: 'tutorial_build_farm'
    }
  ],

  [
    'tutorial_build_farm',
    {
      id: 'tutorial_build_farm',
      trigger: { type: 'new_game' },
      prerequisites: ['tutorial_hero_skills', 'tutorial_hero_stats'],
      steps: [
        {
          id: 'navigate_village',
          messages: ['tutorial_build_farm_msg_navigate_village'],
          what: { target: 'footer_nav_village', flash: true },
          where: { page: 'village' },
          advanceOn: { event: 'tab_changed', page: 'village' }
        },
        {
          id: 'construct_farm',
          messages: ['tutorial_build_farm_msg_construct_farm'],
          what: { target: 'building_farm', flash: true },
          where: { page: 'village' },
          allowActions: ['build'],
          advanceOn: { event: 'building_constructed', buildingId: 'farm' }
        }
      ],
      nextTutorialId: 'tutorial_expeditions'
    }
  ],

  [
    'tutorial_expeditions',
    {
      id: 'tutorial_expeditions',
      trigger: { type: 'new_game' },
      prerequisites: ['tutorial_hero_skills', 'tutorial_hero_stats', 'tutorial_build_farm'],
      steps: [
        {
          id: 'navigate_explore',
          messages: ['tutorial_expeditions_msg_navigate_explore'],
          what: { target: 'footer_nav_adventure', flash: true },
          where: { page: 'adventure', tab: 'explore' },
          advanceOn: { event: 'tab_changed', page: 'adventure', tab: 'explore' }
        },
        {
          id: 'select_region',
          messages: ['tutorial_expeditions_msg_select_region'],
          what: { target: 'region_card_reg_greenfields', flash: true },
          where: { page: 'adventure', tab: 'explore', regionId: 'reg_greenfields' },
          advanceOn: { event: 'region_selected', regionId: 'reg_greenfields' }
        },
        {
          id: 'select_expedition',
          messages: ['tutorial_expeditions_msg_select_expedition'],
          what: { target: 'expedition_node_exp_tutorial_cave', flash: true },
          where: {
            page: 'adventure',
            tab: 'explore',
            regionId: 'reg_greenfields',
            expeditionId: 'exp_tutorial_cave'
          },
          allowActions: ['startExpedition'],
          advanceOn: { event: 'expedition_started', nodeId: 'exp_tutorial_cave' }
        },
        {
          id: 'advance_day',
          messages: ['tutorial_expeditions_msg_advance_day'],
          what: { target: 'day_advance_button', flash: true },
          allowActions: ['advanceDay'],
          advanceOn: { event: 'day_advanced' }
        }
      ],
      nextTutorialId: null
    }
  ],

  // ── Future Tutorials (templates, not yet triggered) ──────────────────────

  [
    'tutorial_gambits',
    {
      id: 'tutorial_gambits',
      trigger: { type: 'feature_unlocked', feature: 'gambits' },
      prerequisites: [],
      steps: [
        /* gambit UI walkthrough — to be defined when feature is implemented */
      ],
      nextTutorialId: null
    }
  ],

  [
    'tutorial_magic_circle',
    {
      id: 'tutorial_magic_circle',
      trigger: { type: 'feature_unlocked', feature: 'magic_circle' },
      prerequisites: [],
      steps: [
        /* magic circle UI walkthrough — to be defined when feature is implemented */
      ],
      nextTutorialId: null
    }
  ]
]);

/**
 * Get a tutorial definition by ID.
 * @param {string} id
 * @returns {TutorialDefinition | undefined}
 */
export function getTutorial(id) {
  return TutorialRegistry.get(id);
}

/**
 * Iterate over all registered tutorials.
 * @returns {IterableIterator<[string, TutorialDefinition]>}
 */
export function getAllTutorials() {
  return TutorialRegistry.entries();
}

/**
 * Check if a tutorial exists in the registry.
 * @param {string} id
 * @returns {boolean}
 */
export function hasTutorial(id) {
  return TutorialRegistry.has(id);
}
