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
            { id: 'material_wood', min: 4, max: 8, chance: 1.0 },
            { id: 'material_herb', min: 2, max: 4, chance: 0.6 },
            { id: 'material_stone', min: 1, max: 2, chance: 0.3 }
        ],
        goldBase: 40,
        goldPerClear: 8
    },
    narrative: null,
    glyphDropTable: null,
    unlockRequirements: {
        any: [
            { minRegionClears: { reg_greenfields: 5 } },
            { minBuildingLevel: { building: 'explorer_guild', level: 1 } }
        ]
    },
    storyMissions: []
};
