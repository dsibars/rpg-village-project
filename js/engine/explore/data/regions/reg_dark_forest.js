export const reg_dark_forest = {
    id: 'reg_dark_forest',
    name: 'Dark Forest',
    branching: 'medium',
    minStages: 2,
    maxStages: 5,
    enemies: ['goblin_scout', 'goblin_grunt', 'wild_boar', 'wolf_alpha', 'goblin_slinger'],
    baseLevel: 3,
    bossPool: ['goblin_king'],
    scaling: {
        levelPerClears: 3,
        statMultiplier: 1.1,
        maxLevelCap: null
    },
    lootProfile: {
        materials: [
            { id: 'material_wood', min: 8, max: 14, chance: 1.0 },
            { id: 'material_iron_ore', min: 3, max: 6, chance: 0.6 },
            { id: 'material_steel_ingot', min: 1, max: 2, chance: 0.25 }
        ],
        goldBase: 100,
        goldPerClear: 20
    },
    narrative: null,
    glyphDropTable: null,
    unlockRequirements: {
        all: [
            { minRegionClears: { reg_tiny_cave: 4 } },
            { minHeroes: 2 }
        ]
    },
    storyMissions: []
};
