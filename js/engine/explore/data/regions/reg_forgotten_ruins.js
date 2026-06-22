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
            { id: 'material_stone', min: 6, max: 12, chance: 1.0 },
            { id: 'material_iron_ore', min: 4, max: 8, chance: 0.6 },
            { id: 'material_mythril', min: 1, max: 3, chance: 0.3 }
        ],
        goldBase: 180,
        goldPerClear: 36
    },
    narrative: null,
    glyphDropChance: 0.25,
    glyphDropTable: [
        { glyphId: 'glyph_pierce', weight: 10, tier: 1 },
        { glyphId: 'glyph_multi',  weight: 8,  tier: 1 },
        { glyphId: 'glyph_dark',   weight: 6,  tier: 1 }
    ],

    unlockRequirements: {
        all: [
            { minRegionClears: { reg_mystic_ruins: 12 } },
            { minBuildingLevel: { building: 'explorer_guild', level: 3 } },
            { minHeroes: 5 }
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
