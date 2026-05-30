export const reg_forgotten_ruins = {
    id: 'reg_forgotten_ruins',
    name: 'Forgotten Ruins',
    branching: 'low',
    minStages: 3,
    maxStages: 6,
    enemies: ['skeleton_warrior', 'ghost_wisp', 'cultist_acolyte', 'stone_golem', 'lich_apprentice'],
    baseLevel: 5,
    bossPool: ['lich_apprentice', 'stone_golem'],
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
                special: { type: 'hero', value: 'Lyra' }
            },
            stages: [
                { type: 'battle', enemies: ['skeleton_warrior', 'ghost_wisp'] },
                { type: 'battle', enemies: ['cultist_acolyte', 'skeleton_warrior'] },
                { type: 'battle', enemies: ['lich_apprentice'], isBoss: true }
            ]
        }
    ]
};
