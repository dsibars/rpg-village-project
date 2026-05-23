/**
 * CodexFeatures - Static data and unlock logic for the Codex domain.
 * This is the single source of truth for all game feature documentation.
 */

export const CODEX_FEATURES = [
    {
        id: 'feature_day_cycle',
        icon: '☀️',
        nameKey: 'codex_feature_day_cycle',
        descKey: 'codex_feature_day_cycle_desc',
        unlockHintKey: 'codex_feature_day_cycle_unlock',
        isUnlocked: (state) => true
    },
    {
        id: 'feature_villagers',
        icon: '👤',
        nameKey: 'codex_feature_villagers',
        descKey: 'codex_feature_villagers_desc',
        unlockHintKey: 'codex_feature_villagers_unlock',
        isUnlocked: (state) => true
    },
    {
        id: 'feature_hero_attributes',
        icon: '🦸',
        nameKey: 'codex_feature_hero_attributes',
        descKey: 'codex_feature_hero_attributes_desc',
        unlockHintKey: 'codex_feature_hero_attributes_unlock',
        isUnlocked: (state) => true
    },
    {
        id: 'feature_physical_skills_combat',
        icon: '🤺',
        nameKey: 'codex_feature_physical_skills_combat',
        descKey: 'codex_feature_physical_skills_combat_desc',
        unlockHintKey: 'codex_feature_physical_skills_combat_unlock',
        isUnlocked: (state) => true
    },
    {
        id: 'feature_threats_defense',
        icon: '🛡️',
        nameKey: 'codex_feature_threats_defense',
        descKey: 'codex_feature_threats_defense_desc',
        unlockHintKey: 'codex_feature_threats_defense_unlock',
        isUnlocked: (state) => true
    },
    {
        id: 'feature_gambits',
        icon: '📜',
        nameKey: 'codex_feature_gambits',
        descKey: 'codex_feature_gambits_desc',
        unlockHintKey: 'codex_feature_gambits_unlock',
        isUnlocked: (state) => true
    },
    {
        id: 'feature_shop',
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
        id: 'feature_skills',
        icon: '⚔️',
        nameKey: 'codex_feature_skills',
        descKey: 'codex_feature_skills_desc',
        unlockHintKey: 'codex_feature_skills_unlock',
        isUnlocked: (state) => {
            const training = state.village?.infrastructure?.training_grounds || 0;
            return training >= 1;
        }
    },
    {
        id: 'feature_magic_circle',
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
        id: 'feature_hybrid',
        icon: '🧬',
        nameKey: 'codex_feature_hybrid',
        descKey: 'codex_feature_hybrid_desc',
        unlockHintKey: 'codex_feature_hybrid_unlock',
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
        id: 'feature_infirmary',
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
        id: 'feature_explorer',
        icon: '🧭',
        nameKey: 'codex_feature_explorer',
        descKey: 'codex_feature_explorer_desc',
        unlockHintKey: 'codex_feature_explorer_unlock',
        isUnlocked: (state) => {
            const explorer = state.village?.infrastructure?.explorer_guild || 0;
            return explorer >= 1;
        }
    }
];
