export const reg_mystic_ruins = {
    id: 'reg_mystic_ruins',
    name: 'Mystic Ruins',
    branching: 'low',
    minStages: 2,
    maxStages: 5,
    enemies: ['skeleton_warrior', 'ghost_wisp', 'water_spirit_minor', 'zombie_rotter', 'cultist_acolyte'],
    baseLevel: 4,
    bossPool: ['lich_apprentice'],
    unlockRequirements: {
        any: [
            { minTotalClears: 5 },
            { minBuildingLevel: { building: 'explorer_guild', level: 2 } }
        ]
    },
    storyMissions: []
};
