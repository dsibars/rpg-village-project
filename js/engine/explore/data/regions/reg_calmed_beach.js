export const reg_calmed_beach = {
    id: 'reg_calmed_beach',
    name: 'Calmed Beach',
    branching: 'low',
    minStages: 2,
    maxStages: 4,
    enemies: ['crab_shell', 'water_spirit_minor', 'murloc_shore', 'slime_earth'],
    baseLevel: 2,
    bossPool: ['water_spirit_minor'],
    scaling: {
        levelPerClears: 3,
        statMultiplier: 1.1,
        maxLevelCap: null
    },
    lootProfile: {
        materials: [
            { id: 'material_stone', min: 3, max: 5, chance: 1.0 },
            { id: 'material_wood', min: 3, max: 5, chance: 1.0 },
            { id: 'material_iron_ore', min: 1, max: 1, chance: 0.2 }
        ],
        goldBase: 40,
        goldPerClear: 8
    },
    narrative: null,
    glyphDropTable: null,
    unlockRequirements: {
        all: [
            { minRegionClears: { reg_greenfields: 6 } },
            { minHeroes: 2 }
        ]
    },
    storyMissions: []
};
