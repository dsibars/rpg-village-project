export const reg_murky_swamp = {
    id: 'reg_murky_swamp',
    name: 'Murky Swamp',
    branching: 'high',
    minStages: 3,
    maxStages: 5,
    enemies: ['zombie_rotter', 'slime_earth', 'murloc_shore', 'goblin_shaman'],
    baseLevel: 3,
    bossPool: ['goblin_shaman'],
    scaling: {
        levelPerClears: 3,
        statMultiplier: 1.1,
        maxLevelCap: null
    },
    lootProfile: {
        materials: [
            { id: 'material_herb', min: 5, max: 10, chance: 1.0 },
            { id: 'material_wood', min: 4, max: 8, chance: 0.6 },
            { id: 'material_iron_ore', min: 2, max: 4, chance: 0.4 }
        ],
        goldBase: 100,
        goldPerClear: 20
    },
    narrative: null,
    glyphDropTable: null,
    unlockRequirements: {
        all: [
            { minRegionClears: { reg_dark_forest: 8 } },
            { minHeroes: 3 }
        ]
    },
    storyMissions: []
};
