/**
 * PresentationCatalog — Defines all multi-page narrative presentations.
 *
 * Each entry specifies:
 * - id: Unique presentation identifier
 * - chapter: Metadata for collection/milestone tracking only (NOT a gate)
 * - pages: Array of { image, textKey } for each slide
 * - trigger: Gameplay event that queues this presentation
 *
 * Trigger types:
 * - new_game: Fires on fresh game initialization
 * - building_complete: Fires when a building reaches a level
 * - mission_complete: Fires when a story mission is completed
 * - hero_recruited: Fires when a hero with a specific origin is recruited
 * - first_event: Fires once for a named milestone (e.g., first_hero_level_5)
 * - chapter_milestones: Fires when enough chapter milestones are met
 */

export const PRESENTATION_CATALOG = [
    {
        id: 'pres_prologue',
        chapter: 1,
        pages: [
            { image: 'assets/story/prologue_valley_dawn.webp', textKey: 'pres_prologue_p1' },
            { image: 'assets/story/prologue_arthur_trail.webp', textKey: 'pres_prologue_p2' },
            { image: 'assets/story/prologue_first_stake.webp', textKey: 'pres_prologue_p3' }
        ],
        trigger: { type: 'new_game' }
    },
    {
        id: 'pres_first_harvest',
        chapter: 1,
        pages: [
            { image: 'assets/story/village_farm_dawn.webp', textKey: 'pres_first_harvest_p1' }
        ],
        trigger: { type: 'building_complete', buildingId: 'farm', level: 1 }
    },
    {
        id: 'pres_shield_dark',
        chapter: 1,
        pages: [
            { image: 'assets/story/char_valen_rubble.webp', textKey: 'pres_shield_dark_p1' },
            { image: 'assets/story/char_valen_arthur_together.webp', textKey: 'pres_shield_dark_p2' }
        ],
        trigger: { type: 'mission_complete', missionId: 'exp_rescue_mission' }
    },
    {
        id: 'pres_warm_fire',
        chapter: 1,
        pages: [
            { image: 'assets/story/village_tavern_dusk.webp', textKey: 'pres_warm_fire_p1' },
            { image: 'assets/story/village_tavern_inside.webp', textKey: 'pres_warm_fire_p2' }
        ],
        trigger: { type: 'building_complete', buildingId: 'tavern', level: 1 }
    },
    {
        id: 'pres_mission_board',
        chapter: 1,
        pages: [
            { image: 'assets/story/village_tavern_dusk.webp', textKey: 'pres_mission_board_p1' },
            { image: 'assets/story/village_village_above.webp', textKey: 'pres_mission_board_p2' }
        ],
        trigger: { type: 'building_complete', buildingId: 'mission_board', level: 1 }
    },
    {
        id: 'pres_discipline',
        chapter: 1,
        pages: [
            { image: 'assets/story/village_training_grounds.webp', textKey: 'pres_discipline_p1' },
            { image: 'assets/story/char_arthur_portrait.webp', textKey: 'pres_discipline_p2' }
        ],
        trigger: { type: 'first_event', eventId: 'first_hero_level_5' }
    },
    {
        id: 'pres_first_spark',
        chapter: 1,
        pages: [
            { image: 'assets/story/char_elara_twilight.webp', textKey: 'pres_first_spark_p1' },
            { image: 'assets/story/char_elara_glyph.webp', textKey: 'pres_first_spark_p2' },
            { image: 'assets/story/finale_chapter1_village_glow.webp', textKey: 'pres_first_spark_p3' }
        ],
        trigger: { type: 'hero_recruited', origin: 'origin_arcane_initiate' }
    },
    {
        id: 'pres_first_victory',
        chapter: 1,
        pages: [
            { image: 'assets/story/combat_first_victory.webp', textKey: 'pres_first_victory_p1' }
        ],
        trigger: { type: 'first_event', eventId: 'first_expedition_victory' }
    },
    {
        id: 'pres_first_equip',
        chapter: 1,
        pages: [
            { image: 'assets/story/char_arthur_portrait.webp', textKey: 'pres_first_equip_p1' }
        ],
        trigger: { type: 'first_event', eventId: 'first_item_equipped' }
    },
    {
        id: 'pres_first_defeat',
        chapter: 1,
        pages: [
            { image: 'assets/story/combat_first_defeat.webp', textKey: 'pres_first_defeat_p1' }
        ],
        trigger: { type: 'first_event', eventId: 'first_expedition_defeat' }
    },
    {
        id: 'pres_chapter1_finale',
        chapter: 1,
        pages: [
            { image: 'assets/story/village_village_above.webp', textKey: 'pres_chapter1_finale_p1' },
            { image: 'assets/story/finale_chapter1_elara_window.webp', textKey: 'pres_chapter1_finale_p2' }
        ],
        trigger: { type: 'chapter_milestones', chapter: 1, required: 3, total: 4 }
    },
    {
        id: 'pres_language_world',
        chapter: 2,
        pages: [
            { image: 'assets/story/magic_sanctum_hum.webp', textKey: 'pres_language_world_p1' },
            { image: 'assets/story/char_arthur_portrait.webp', textKey: 'pres_language_world_p2' },
            { image: 'assets/story/magic_circle_first.webp', textKey: 'pres_language_world_p3' }
        ],
        trigger: { type: 'building_complete', buildingId: 'arcane_sanctum', level: 1 }
    },
    {
        id: 'pres_name_flame',
        chapter: 2,
        pages: [
            { image: 'assets/story/magic_circle_flare.webp', textKey: 'pres_name_flame_p1' },
            { image: 'assets/story/magic_hero_awe.webp', textKey: 'pres_name_flame_p2' }
        ],
        trigger: { type: 'first_event', eventId: 'first_spell_inscribed' }
    },
    {
        id: 'pres_veil_thins',
        chapter: 2,
        pages: [
            { image: 'assets/story/witch_appears.webp', textKey: 'pres_veil_thins_p1' },
            { image: 'assets/story/witch_reading.webp', textKey: 'pres_veil_thins_p2' }
        ],
        trigger: { type: 'building_complete', buildingId: 'witchs_hut', level: 1 }
    },
    {
        id: 'pres_world_opens',
        chapter: 2,
        pages: [
            { image: 'assets/story/explore_guild_maps.webp', textKey: 'pres_world_opens_p1' },
            { image: 'assets/story/explore_map_table.webp', textKey: 'pres_world_opens_p2' }
        ],
        trigger: { type: 'building_complete', buildingId: 'explorer_guild', level: 1 }
    },
    {
        id: 'pres_first_spell_cast',
        chapter: 2,
        pages: [
            { image: 'assets/story/char_elara_glyph.webp', textKey: 'pres_first_spell_cast_p1' }
        ],
        trigger: { type: 'first_event', eventId: 'first_spell_cast_combat' }
    },
    {
        id: 'pres_first_boss_defeated',
        chapter: 2,
        pages: [
            { image: 'assets/story/combat_boss_defeated.webp', textKey: 'pres_first_boss_defeated_p1' }
        ],
        trigger: { type: 'first_event', eventId: 'first_boss_defeated' }
    },
    {
        id: 'pres_first_raid_victory',
        chapter: 2,
        pages: [
            { image: 'assets/story/combat_raid_defense.webp', textKey: 'pres_first_raid_victory_p1' }
        ],
        trigger: { type: 'first_event', eventId: 'first_raid_victory' }
    },
    {
        id: 'pres_chapter2_finale',
        chapter: 2,
        pages: [
            { image: 'assets/story/finale_chapter2_night_colors.webp', textKey: 'pres_chapter2_finale_p1' },
            { image: 'assets/story/finale_chapter2_sky_rift.webp', textKey: 'pres_chapter2_finale_p2' }
        ],
        trigger: { type: 'chapter_milestones', chapter: 2, required: 3, total: 5 }
    }
];

export function getPresentationById(id) {
    return PRESENTATION_CATALOG.find(p => p.id === id);
}
