/**
 * Book translation key registry.
 * These keys are used by the BookService to render PageContentSections.
 * All keys must be present in every language file.
 */

export const BOOK_KEYS = {
    // Chapter titles
    CHAPTER_DEFAULT_TITLE: 'book_chapter_default_title',
    CHAPTER_1_TITLE: 'book_chapter_1_title',
    CHAPTER_2_TITLE: 'book_chapter_2_title',
    CHAPTER_3_TITLE: 'book_chapter_3_title',
    CHAPTER_4_TITLE: 'book_chapter_4_title',
    CHAPTER_5_TITLE: 'book_chapter_5_title',

    // Village updates
    VILLAGE_UPDATES_TITLE: 'book_village_updates_title',
    UPDATE_FOOD_CONSUMED: 'book_update_food_consumed',
    UPDATE_VILLAGER_JOINED: 'book_update_villager_joined',
    UPDATE_HERO_RESTED: 'book_update_hero_rested',
    UPDATE_HERO_TRAINED: 'book_update_hero_trained',
    UPDATE_HERO_SCOUTED: 'book_update_hero_scouted',
    UPDATE_HERO_CRAFTED: 'book_update_hero_crafted',
    UPDATE_HERO_SOCIALIZED: 'book_update_hero_socialized',
    UPDATE_BUILDING_COMPLETED: 'book_update_building_completed',
    UPDATE_REGION_UNLOCKED: 'book_update_region_unlocked',
    UPDATE_EXPEDITION_STARTED: 'book_update_expedition_started',
    UPDATE_EXPEDITION_COMPLETED: 'book_update_expedition_completed',
    UPDATE_COMBAT_VICTORY: 'book_update_combat_victory',
    UPDATE_COMBAT_DEFEAT: 'book_update_combat_defeat',
    UPDATE_HERO_RECRUITED: 'book_update_hero_recruited',
    UPDATE_MARKET_ROTATION: 'book_update_market_rotation',
    UPDATE_RAID_DEFENDED: 'book_update_raid_defended',
    UPDATE_RAID_LOST: 'book_update_raid_lost',
    UPDATE_QUIET_DAY: 'book_update_quiet_day',

    // History events (narrative blocks)
    HISTORY_COMBAT_VICTORY: 'book_history_combat_victory',
    HISTORY_COMBAT_DEFEAT: 'book_history_combat_defeat',

    // Milestones
    MILESTONE_FIRST_VICTORY: 'book_milestone_first_victory',
    MILESTONE_FIRST_BOSS: 'book_milestone_first_boss',
    MILESTONE_FIRST_REGION: 'book_milestone_first_region',
    MILESTONE_FIRST_BUILDING: 'book_milestone_first_building',
    MILESTONE_FIRST_SPELL: 'book_milestone_first_spell',
    MILESTONE_FIRST_ACADEMY: 'book_milestone_first_academy',
    MILESTONE_FIRST_BODY_INSCRIPTION: 'book_milestone_first_body_inscription',
};

// Convenience: list all keys for validation
export const ALL_BOOK_KEYS = Object.values(BOOK_KEYS);
