export const reg_whispering_forest = {
    id: 'reg_whispering_forest',
    name: 'Whispering Forest',
    branching: 'medium',
    minStages: 2,
    maxStages: 4,
    enemies: ['rabbit_horned', 'wolf_alpha', 'slime_earth', 'goblin_scout'],
    baseLevel: 2,
    bossPool: ['wolf_alpha'],
    scaling: {
        levelPerClears: 3,
        statMultiplier: 1.1,
        maxLevelCap: null
    },
    lootProfile: {
        materials: [
            { id: 'material_wood', min: 10, max: 18, chance: 1.0 },
            { id: 'material_herb', min: 4, max: 8, chance: 0.6 },
            { id: 'material_stone', min: 3, max: 6, chance: 0.4 }
        ],
        goldBase: 80,
        goldPerClear: 16
    },
    narrative: null,
    glyphDropTable: null,
    unlockRequirements: {
        all: [
            { minRegionClears: { reg_greenfields: 10 } },
            { minHeroes: 2 }
        ]
    },
    storyMissions: []
};
