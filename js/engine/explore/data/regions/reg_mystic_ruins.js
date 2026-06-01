export const reg_mystic_ruins = {
    id: 'reg_mystic_ruins',
    name: 'Mystic Ruins',
    branching: 'low',
    minStages: 2,
    maxStages: 5,
    enemies: ['skeleton_warrior', 'ghost_wisp', 'water_spirit_minor', 'zombie_rotter', 'cultist_acolyte'],
    baseLevel: 4,
    bossPool: ['lich_apprentice'],
    scaling: {
        levelPerClears: 3,
        statMultiplier: 1.1,
        maxLevelCap: null
    },
    lootProfile: {
        materials: [
            { id: 'material_iron_ore', min: 2, max: 4, chance: 1.0 },
            { id: 'material_stone', min: 2, max: 4, chance: 0.4 },
            { id: 'material_mythril', min: 1, max: 1, chance: 0.15 }
        ],
        goldBase: 40,
        goldPerClear: 8
    },
    narrative: null,
    glyphDropTable: null,
    unlockRequirements: {
        any: [
            { minTotalClears: 5 },
            { minBuildingLevel: { building: 'explorer_guild', level: 2 } }
        ]
    },
    storyMissions: []
};
