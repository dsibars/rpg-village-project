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
            { id: 'material_herb', min: 3, max: 6, chance: 1.0 },
            { id: 'material_wood', min: 2, max: 4, chance: 0.5 },
            { id: 'material_iron_ore', min: 1, max: 2, chance: 0.3 }
        ],
        goldBase: 40,
        goldPerClear: 8
    },
    narrative: null,
    glyphDropTable: null,
    unlockRequirements: {
        minRegionClears: { reg_dark_forest: 4 }
    },
    storyMissions: []
};
