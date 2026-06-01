export const reg_frozen_peaks = {
    id: 'reg_frozen_peaks',
    name: 'Frozen Peaks',
    branching: 'medium',
    minStages: 3,
    maxStages: 6,
    enemies: ['ice_elemental', 'young_drake', 'goblin_brute', 'frost_wolf', 'stone_golem'],
    baseLevel: 5,
    bossPool: ['young_drake', 'mountain_troll'],
    scaling: {
        levelPerClears: 2,
        statMultiplier: 1.12,
        maxLevelCap: 25
    },
    lootProfile: {
        materials: [
            { id: 'material_steel_ingot', min: 1, max: 3, chance: 1.0 },
            { id: 'material_iron_ore', min: 1, max: 3, chance: 0.4 },
            { id: 'material_mythril', min: 1, max: 1, chance: 0.1 }
        ],
        goldBase: 40,
        goldPerClear: 8
    },
    narrative: {
        firstClear: {
            titleKey: 'nar_frozen_peaks_first_clear_title',
            loreKey: 'nar_frozen_peaks_first_clear_lore',
            era: 3
        }
    },
    glyphDropTable: null,
    unlockRequirements: {
        any: [
            { minTotalClears: 8 },
            { minBuildingLevel: { building: 'explorer_guild', level: 3 } }
        ]
    },
    storyMissions: []
};
