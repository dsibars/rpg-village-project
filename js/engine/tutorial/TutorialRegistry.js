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
      trigger: { type: 'event', event: 'book_first_closed', day: 1 },
      prerequisites: [],
      steps: [
        {
          id: 'select_arthur',
          messages: ['tutorial_hero_skills_msg_select_arthur'],
          what: { target: 'hero_card_arthur', flash: true },
          where: { page: 'heroes', heroId: 'arthur' },
          advanceOn: { event: 'hero_selected', heroId: 'arthur' }
        },
        {
          id: 'open_skills',
          messages: ['tutorial_hero_skills_msg_open_skills'],
          what: { target: 'hero_action_skills', flash: true },
          where: { page: 'heroes', heroId: 'arthur' },
          advanceOn: { event: 'skill_modal_opened', heroId: 'arthur' }
        },
        {
          id: 'learn_skill',
          messages: ['tutorial_hero_skills_msg_learn_skill'],
          what: { target: 'hero_first_locked_skill', flash: true },
          where: { page: 'heroes', heroId: 'arthur' },
          modalLock: true,
          allowActions: ['hero.learnFamily'],
          advanceOn: { event: 'skill_learned', heroId: 'arthur' }
        },
        {
          id: 'close_skills',
          messages: ['tutorial_hero_skills_msg_close_modal'],
          what: { target: 'hero_skills_modal_close', flash: true },
          where: { page: 'heroes', heroId: 'arthur', modal: 'skills' },
          advanceOn: { event: 'skill_modal_closed', heroId: 'arthur' }
        },
        {
          id: 'skills_done',
          messages: ['tutorial_hero_skills_msg_done'],
          where: { page: 'heroes', heroId: 'arthur' },
          advanceOn: { event: 'tutorial_ack' }
        }
      ],
      nextTutorialId: 'tutorial_hero_stats'
    }
  ],

  [
    'tutorial_hero_stats',
    {
      id: 'tutorial_hero_stats',
      trigger: { type: 'event', event: 'book_first_closed', day: 1 },
      prerequisites: ['tutorial_hero_skills'],
      steps: [
        {
          id: 'assign_stats',
          messages: ['tutorial_hero_stats_msg_assign_stats'],
          what: { target: 'hero_stats_grid', flash: false },
          where: { page: 'heroes', heroId: 'arthur' },
          allowActions: ['hero.increaseStat'],
          advanceOn: { event: 'stat_assigned', heroId: 'arthur', remainingPoints: 0 }
        },
        {
          id: 'stats_done',
          messages: ['tutorial_hero_stats_msg_done'],
          where: { page: 'heroes', heroId: 'arthur' },
          advanceOn: { event: 'tutorial_ack' }
        }
      ],
      nextTutorialId: 'tutorial_build_farm'
    }
  ],

  [
    'tutorial_build_farm',
    {
      id: 'tutorial_build_farm',
      trigger: { type: 'event', event: 'book_first_closed', day: 1 },
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
          where: { page: 'town', tab: 'buildings' },
          allowActions: ['buildings.startProject'],
          advanceOn: { event: 'building_project_started', buildingId: 'farm' }
        },
        {
          id: 'farm_done',
          messages: ['tutorial_build_farm_msg_done'],
          where: { page: 'town', tab: 'buildings' },
          advanceOn: { event: 'tutorial_ack' }
        }
      ],
      nextTutorialId: 'tutorial_expeditions'
    }
  ],

  [
    'tutorial_expeditions',
    {
      id: 'tutorial_expeditions',
      trigger: { type: 'event', event: 'book_first_closed', day: 1 },
      prerequisites: ['tutorial_hero_skills', 'tutorial_hero_stats', 'tutorial_build_farm'],
      steps: [
        {
          id: 'navigate_explore',
          messages: ['tutorial_expeditions_msg_navigate_explore'],
          what: { target: 'footer_nav_adventure', flash: true },
          where: { page: 'adventure', tab: 'explore' },
          advanceOn: { event: 'tab_changed', page: 'adventure' }
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
          allowActions: ['explore.assignExpedition'],
          advanceOn: { event: 'expedition_started', nodeId: 'exp_tutorial_cave' }
        },
        {
          id: 'advance_day',
          messages: ['tutorial_expeditions_msg_advance_day'],
          what: { target: 'day_advance_button', flash: true },
          allowActions: ['village.nextDay'],
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
