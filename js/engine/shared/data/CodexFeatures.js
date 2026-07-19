/**
 * CodexFeatures - Static data and unlock logic for the Codex domain.
 * This is the single source of truth for all game feature documentation.
 */

export const CODEX_CATEGORIES = [
    { id: 'basics',    icon: '📖', nameKey: 'codex_category_basics' },
    { id: 'combat',    icon: '⚔️', nameKey: 'codex_category_combat' },
    { id: 'village',   icon: '🏘️', nameKey: 'codex_category_village' },
    { id: 'magic',     icon: '🔮', nameKey: 'codex_category_magic' }
];

export const CODEX_FEATURES = [
    // ─── BASICS ───
    {
        id: 'feature_day_cycle',
        categoryId: 'basics',
        icon: '☀️',
        nameKey: 'codex_feature_day_cycle',
        descKey: 'codex_feature_day_cycle_desc',
        unlockHintKey: 'codex_feature_day_cycle_unlock',
        isUnlocked: (state) => true
    },
    {
        id: 'feature_villagers',
        categoryId: 'basics',
        icon: '👤',
        nameKey: 'codex_feature_villagers',
        descKey: 'codex_feature_villagers_desc',
        unlockHintKey: 'codex_feature_villagers_unlock',
        isUnlocked: (state) => true
    },
    {
        id: 'feature_hero_attributes',
        categoryId: 'basics',
        icon: '🦸',
        nameKey: 'codex_feature_hero_attributes',
        descKey: 'codex_feature_hero_attributes_desc',
        unlockHintKey: 'codex_feature_hero_attributes_unlock',
        isUnlocked: (state) => true
    },
    {
        id: 'feature_equipment',
        categoryId: 'basics',
        icon: '🛡️',
        nameKey: 'codex_feature_equipment',
        descKey: 'codex_feature_equipment_desc',
        unlockHintKey: 'codex_feature_equipment_unlock',
        isUnlocked: (state) => true
    },

    {
        id: 'feature_fatigue',
        categoryId: 'combat',
        icon: '😫',
        nameKey: 'codex_feature_fatigue',
        descKey: 'codex_feature_fatigue_desc',
        unlockHintKey: 'codex_feature_fatigue_unlock',
        isUnlocked: (state) => (state.heroes || []).some(h => (h.fatigue || 0) > 0)
    },
    {
        id: 'feature_market_rotation',
        categoryId: 'village',
        icon: '🔄',
        nameKey: 'codex_feature_market_rotation',
        descKey: 'codex_feature_market_rotation_desc',
        unlockHintKey: 'codex_feature_market_rotation_unlock',
        isUnlocked: (state) => {
            const completed = state.completedExpeditions || [];
            return completed.includes('exp_tutorial_cave');
        }
    },
    {
        id: 'feature_village_events',
        categoryId: 'village',
        icon: '🎲',
        nameKey: 'codex_feature_village_events',
        descKey: 'codex_feature_village_events_desc',
        unlockHintKey: 'codex_feature_village_events_unlock',
        isUnlocked: (state) => (state.village?.day || 0) >= 5
    },
    {
        id: 'feature_daily_actions',
        categoryId: 'basics',
        icon: '📋',
        nameKey: 'codex_feature_daily_actions',
        descKey: 'codex_feature_daily_actions_desc',
        unlockHintKey: 'codex_feature_daily_actions_unlock',
        isUnlocked: (state) => {
            const tavern = state.village?.infrastructure?.tavern || 0;
            return tavern >= 1;
        }
    },
    {
        id: 'feature_chronicle',
        categoryId: 'basics',
        icon: '📜',
        nameKey: 'codex_feature_chronicle',
        descKey: 'codex_feature_chronicle_desc',
        unlockHintKey: 'codex_feature_chronicle_unlock',
        isUnlocked: (state) => {
            const completed = state.completedExpeditions || [];
            return completed.length > 0;
        }
    },
    // ─── COMBAT ───
    {
        id: 'feature_gambits',
        categoryId: 'combat',
        icon: '📜',
        nameKey: 'codex_feature_gambits',
        descKey: 'codex_feature_gambits_desc',
        unlockHintKey: 'codex_feature_gambits_unlock',
        isUnlocked: (state) => (state.heroes || []).some(h => h.level >= 5)
    },
    {
        id: 'feature_stamina_skills',
        categoryId: 'combat',
        icon: '⚔️',
        nameKey: 'codex_feature_stamina_skills',
        descKey: 'codex_feature_stamina_skills_desc',
        unlockHintKey: 'codex_feature_stamina_skills_unlock',
        isUnlocked: (state) => true
    },
    {
        id: 'feature_threats_defense',
        categoryId: 'combat',
        icon: '🛡️',
        nameKey: 'codex_feature_threats_defense',
        descKey: 'codex_feature_threats_defense_desc',
        unlockHintKey: 'codex_feature_threats_defense_unlock',
        isUnlocked: (state) => (state.calendar?.resolvedRaids || 0) >= 1
    },

    // ─── VILLAGE BUILDINGS ───
    {
        id: 'feature_expeditions',
        categoryId: 'village',
        icon: '🗺️',
        nameKey: 'codex_feature_expeditions',
        descKey: 'codex_feature_expeditions_desc',
        unlockHintKey: 'codex_feature_expeditions_unlock',
        isUnlocked: (state) => {
            const completed = state.completedExpeditions || [];
            return completed.includes('exp_tutorial_cave');
        }
    },



    // ─── VILLAGE BUILDINGS ───
    {
        id: 'feature_shop',
        categoryId: 'village',
        icon: '🛒',
        nameKey: 'codex_feature_shop',
        descKey: 'codex_feature_shop_desc',
        unlockHintKey: 'codex_feature_shop_unlock',
        isUnlocked: (state) => {
            const completed = state.completedExpeditions || [];
            return completed.includes('exp_tutorial_cave');
        }
    },
    {
        id: 'feature_forge',
        categoryId: 'village',
        icon: '⚒️',
        nameKey: 'codex_feature_forge',
        descKey: 'codex_feature_forge_desc',
        unlockHintKey: 'codex_feature_forge_unlock',
        isUnlocked: (state) => {
            const blacksmith = state.village?.infrastructure?.blacksmith || 0;
            return blacksmith >= 1;
        }
    },
    {
        id: 'feature_infirmary',
        categoryId: 'village',
        icon: '🏥',
        nameKey: 'codex_feature_infirmary',
        descKey: 'codex_feature_infirmary_desc',
        unlockHintKey: 'codex_feature_infirmary_unlock',
        isUnlocked: (state) => {
            const infirmary = state.village?.infrastructure?.infirmary || 0;
            return infirmary >= 1;
        }
    },
    {
        id: 'feature_tavern',
        categoryId: 'village',
        icon: '🍻',
        nameKey: 'codex_feature_tavern',
        descKey: 'codex_feature_tavern_desc',
        unlockHintKey: 'codex_feature_tavern_unlock',
        isUnlocked: (state) => {
            const tavern = state.village?.infrastructure?.tavern || 0;
            return tavern >= 1;
        }
    },
    {
        id: 'feature_explorer_guild',
        categoryId: 'village',
        icon: '🧭',
        nameKey: 'codex_feature_explorer_guild',
        descKey: 'codex_feature_explorer_guild_desc',
        unlockHintKey: 'codex_feature_explorer_guild_unlock',
        isUnlocked: (state) => {
            const explorer = state.village?.infrastructure?.explorer_guild || 0;
            return explorer >= 1;
        }
    },

    // ─── MAGIC ───
    {
        id: 'feature_magic_circle',
        categoryId: 'magic',
        icon: '🔮',
        nameKey: 'codex_feature_magic_circle',
        descKey: 'codex_feature_magic_circle_desc',
        unlockHintKey: 'codex_feature_magic_circle_unlock',
        isUnlocked: (state) => {
            const sanctum = state.village?.infrastructure?.arcane_sanctum || 0;
            return sanctum >= 1;
        }
    },
    {
        id: 'feature_witch_hut',
        categoryId: 'magic',
        icon: '🧙‍♀️',
        nameKey: 'codex_feature_witch_hut',
        descKey: 'codex_feature_witch_hut_desc',
        unlockHintKey: 'codex_feature_witch_hut_unlock',
        isUnlocked: (state) => {
            const witch = state.village?.infrastructure?.witchs_hut || 0;
            return witch >= 1;
        }
    },
    {
        id: 'feature_body_inscription',
        categoryId: 'magic',
        icon: '🧬',
        nameKey: 'codex_feature_body_inscription',
        descKey: 'codex_feature_body_inscription_desc',
        unlockHintKey: 'codex_feature_body_inscription_unlock',
        isUnlocked: (state) => {
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
        id: 'feature_spell_codex',
        categoryId: 'magic',
        icon: '📖',
        nameKey: 'codex_feature_spell_codex',
        descKey: 'codex_feature_spell_codex_desc',
        unlockHintKey: 'codex_feature_spell_codex_unlock',
        isUnlocked: (state) => (state.heroes || []).some(h => (h.spellCodex || []).length > 0)
    },
    {
        id: 'feature_glyph_academy',
        categoryId: 'magic',
        icon: '🏛️',
        nameKey: 'codex_feature_glyph_academy',
        descKey: 'codex_feature_glyph_academy_desc',
        unlockHintKey: 'codex_feature_glyph_academy_unlock',
        isUnlocked: (state) => {
            const sanctum = state.village?.infrastructure?.arcane_sanctum || 0;
            return sanctum >= 2;
        }
    }
];
