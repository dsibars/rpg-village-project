export const reg_tiny_cave = {
    id: 'reg_tiny_cave',
    name: 'Tiny Cave',
    branching: 'medium',
    minStages: 2,
    maxStages: 4,
    enemies: ['bat_small', 'spider_minor', 'slime_green', 'goblin_scout'],
    baseLevel: 2,
    bossPool: ['goblin_brute'],
    scaling: {
        levelPerClears: 3,
        statMultiplier: 1.1,
        maxLevelCap: null
    },
    lootProfile: {
        materials: [
            { id: 'material_stone', min: 4, max: 8, chance: 1.0 },
            { id: 'material_iron_ore', min: 1, max: 3, chance: 0.5 },
            { id: 'material_steel_ingot', min: 1, max: 1, chance: 0.15 }
        ],
        goldBase: 40,
        goldPerClear: 8
    },
    narrative: null,
    glyphDropTable: null,
    unlockRequirements: {
        completedMissions: ['exp_tutorial_cave']
    },
    storyMissions: []
};
