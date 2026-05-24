/**
 * UnlockNarratives - Pure static data catalog for narrative unlock moments.
 * Zero logic beyond pure (state) => boolean predicates.
 */

export const UNLOCK_NARRATIVES = [
    // ─── ERA I: The Spark ───
    {
        id: 'nar_first_expedition',
        titleKey: 'nar_first_expedition_title',
        loreKey: 'nar_first_expedition_lore',
        era: 1,
        checkPredicate: (state) => (state.completedExpeditions || []).includes('exp_tutorial_cave')
    },
    {
        id: 'nar_tiny_cave_found',
        titleKey: 'nar_tiny_cave_found_title',
        loreKey: 'nar_tiny_cave_found_lore',
        era: 1,
        checkPredicate: (state) => !!state.expeditionRegions?.reg_tiny_cave
    },
    {
        id: 'nar_sir_valen_joins',
        titleKey: 'nar_sir_valen_joins_title',
        loreKey: 'nar_sir_valen_joins_lore',
        era: 1,
        checkPredicate: (state) => (state.heroes || []).some(h => h.name === 'Sir Valen')
    },
    {
        id: 'nar_first_skill_slot',
        titleKey: 'nar_first_skill_slot_title',
        loreKey: 'nar_first_skill_slot_lore',
        era: 1,
        checkPredicate: (state) => (state.heroes || []).some(h => h.level >= 5)
    },
    {
        id: 'nar_shop_unlocked',
        titleKey: 'nar_shop_unlocked_title',
        loreKey: 'nar_shop_unlocked_lore',
        era: 1,
        checkPredicate: (state) => (state.completedExpeditions || []).includes('exp_tutorial_cave')
    },
    {
        id: 'nar_tavern_built',
        titleKey: 'nar_tavern_built_title',
        loreKey: 'nar_tavern_built_lore',
        era: 1,
        checkPredicate: (state) => (state.village?.infrastructure?.tavern || 0) >= 1
    },

    // ─── ERA II: The Flood ───
    {
        id: 'nar_dark_forest_found',
        titleKey: 'nar_dark_forest_found_title',
        loreKey: 'nar_dark_forest_found_lore',
        era: 2,
        checkPredicate: (state) => !!state.expeditionRegions?.reg_dark_forest
    },
    {
        id: 'nar_elara_arrives',
        titleKey: 'nar_elara_arrives_title',
        loreKey: 'nar_elara_arrives_lore',
        era: 2,
        checkPredicate: (state) => (state.heroes || []).some(h => h.origin === 'origin_arcane_initiate')
    },
    {
        id: 'nar_magic_circle_unlocked',
        titleKey: 'nar_magic_circle_unlocked_title',
        loreKey: 'nar_magic_circle_unlocked_lore',
        era: 2,
        checkPredicate: (state) => (state.village?.infrastructure?.arcane_sanctum || 0) >= 1
    },
    {
        id: 'nar_witch_hut_built',
        titleKey: 'nar_witch_hut_built_title',
        loreKey: 'nar_witch_hut_built_lore',
        era: 2,
        checkPredicate: (state) => (state.village?.infrastructure?.witchs_hut || 0) >= 1
    },
    {
        id: 'nar_first_spell_composed',
        titleKey: 'nar_first_spell_composed_title',
        loreKey: 'nar_first_spell_composed_lore',
        era: 2,
        checkPredicate: (state) => (state.heroes || []).some(h => (h.spellCodex || []).length > 0)
    },
    {
        id: 'nar_defense_first_raid',
        titleKey: 'nar_defense_first_raid_title',
        loreKey: 'nar_defense_first_raid_lore',
        era: 2,
        checkPredicate: (state) => (state.calendar?.resolvedRaids || 0) >= 1
    },
    {
        id: 'nar_undefended_raid',
        titleKey: 'nar_undefended_raid_title',
        loreKey: 'nar_undefended_raid_lore',
        era: 2,
        checkPredicate: (state) => state.calendar?.lastRaidHadZeroDefenders === true
    },
    {
        id: 'nar_explorer_guild_built',
        titleKey: 'nar_explorer_guild_built_title',
        loreKey: 'nar_explorer_guild_built_lore',
        era: 2,
        checkPredicate: (state) => (state.village?.infrastructure?.explorer_guild || 0) >= 1
    },

    // ─── ERA III: The Web ───
    {
        id: 'nar_mystic_ruins_found',
        titleKey: 'nar_mystic_ruins_found_title',
        loreKey: 'nar_mystic_ruins_found_lore',
        era: 3,
        checkPredicate: (state) => !!state.expeditionRegions?.reg_mystic_ruins
    },
    {
        id: 'nar_academy_unlocked',
        titleKey: 'nar_academy_unlocked_title',
        loreKey: 'nar_academy_unlocked_lore',
        era: 3,
        checkPredicate: (state) => (state.village?.infrastructure?.arcane_sanctum || 0) >= 2
    },
    {
        id: 'nar_body_inscription_unlocked',
        titleKey: 'nar_body_inscription_unlocked_title',
        loreKey: 'nar_body_inscription_unlocked_lore',
        era: 3,
        checkPredicate: (state) => {
            const heroes = state.heroes || [];
            return heroes.some(hero => {
                const magicTier = hero.magicTier || 1;
                const knownFamilies = hero.knownFamilies || [];
                const techniqueTiers = hero.techniqueTiers || {};
                const skillTierPoints = knownFamilies.reduce((sum, family) => {
                    const tier = techniqueTiers[family] || 1;
                    return sum + (tier + 1);
                }, 0);
                return magicTier >= 7 && skillTierPoints >= 12;
            });
        }
    },
    {
        id: 'nar_frozen_peaks_found',
        titleKey: 'nar_frozen_peaks_found_title',
        loreKey: 'nar_frozen_peaks_found_lore',
        era: 3,
        checkPredicate: (state) => !!state.expeditionRegions?.reg_frozen_peaks
    },

    // ─── ERA IV: The Infinite ───
    {
        id: 'nar_astral_plane_found',
        titleKey: 'nar_astral_plane_found_title',
        loreKey: 'nar_astral_plane_found_lore',
        era: 4,
        checkPredicate: (state) => !!state.expeditionRegions?.reg_astral_plane
    }
];
