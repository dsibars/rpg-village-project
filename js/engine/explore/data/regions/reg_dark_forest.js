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
            { id: 'material_wood', min: 4, max: 7, chance: 1.0 },
            { id: 'material_iron_ore', min: 2, max: 3, chance: 0.5 },
            { id: 'material_steel_ingot', min: 1, max: 1, chance: 0.15 }
        ],
        goldBase: 40,
        goldPerClear: 8
    },
    narrative: null,
    glyphDropTable: null,
    unlockRequirements: {
        minRegionClears: { reg_tiny_cave: 2 }
    },
    storyMissions: []
};
