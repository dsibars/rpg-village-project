export const reg_goblin_camp = {
    id: 'reg_goblin_camp',
    name: 'Goblin Camp',
    branching: 'high',
    minStages: 3,
    maxStages: 6,
    enemies: ['goblin_scout', 'goblin_grunt', 'goblin_brute', 'goblin_shaman', 'goblin_slinger', 'goblin_king'],
    baseLevel: 4,
    bossPool: ['goblin_king', 'goblin_shaman'],
    scaling: {
        levelPerClears: 3,
        statMultiplier: 1.1,
        maxLevelCap: null
    },
    lootProfile: {
        materials: [
            { id: 'material_iron_ore', min: 3, max: 6, chance: 1.0 },
            { id: 'material_stone', min: 2, max: 4, chance: 0.4 },
            { id: 'material_steel_ingot', min: 1, max: 1, chance: 0.15 }
        ],
        goldBase: 40,
        goldPerClear: 8
    },
    narrative: null,
    glyphDropTable: null,
    unlockRequirements: {
        all: [
            { minRegionClears: { reg_dark_forest: 6 } },
            { minBuildingLevel: { building: 'explorer_guild', level: 2 } },
            { minHeroes: 3 }
        ]
    },
    storyMissions: []
};
