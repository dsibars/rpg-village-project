export const reg_forgotten_ruins = {
    id: 'reg_forgotten_ruins',
    name: 'Forgotten Ruins',
    branching: 'low',
    minStages: 3,
    maxStages: 6,
    enemies: ['skeleton_warrior', 'ghost_wisp', 'cultist_acolyte', 'stone_golem', 'lich_apprentice'],
    baseLevel: 5,
    bossPool: ['lich_apprentice', 'stone_golem'],
    scaling: {
        levelPerClears: 3,
        statMultiplier: 1.1,
        maxLevelCap: null
    },
    lootProfile: {
        materials: [
            { id: 'material_stone', min: 4, max: 7, chance: 1.0 },
            { id: 'material_iron_ore', min: 2, max: 4, chance: 0.5 },
            { id: 'material_mythril', min: 1, max: 1, chance: 0.15 }
        ],
        goldBase: 40,
        goldPerClear: 8
    },
    narrative: null,
    glyphDropTable: null,
    unlockRequirements: {
        any: [
            { minRegionClears: { reg_mystic_ruins: 6 } },
            { minBuildingLevel: { building: 'explorer_guild', level: 3 } }
        ]
    },

    storyMissions: [
        {
            id: 'exp_forgotten_tomb',
            name: 'The Forgotten Tomb',
            regionId: 'reg_forgotten_ruins',
            isStory: true,
            status: 'available',
            parentId: null,
            requirements: {
                minRegionClears: { reg_whispering_forest: 5 }
            },
            reward: {
                gold: 800,
                items: { material_iron_ore: 10 },
                effects: [
                    {
                        type: 'hero',
                        name: 'Lyra',
                        origin: 'origin_poet',
                        level: 1,
                        avatar: 'lyra.png'
                    },
                    { type: 'building_blueprint', buildingId: 'witchs_hut' },
                    { type: 'building_blueprint', buildingId: 'training_grounds' }
                ]
            },
            stages: [
                { type: 'battle', enemies: ['skeleton_warrior', 'ghost_wisp'] },
                { type: 'battle', enemies: ['cultist_acolyte', 'skeleton_warrior'] },
                { type: 'battle', enemies: ['lich_apprentice'], isBoss: true }
            ]
        }
    ]
};
