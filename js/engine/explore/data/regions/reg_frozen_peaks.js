export const reg_frozen_peaks = {
    id: 'reg_frozen_peaks',
    name: 'Frozen Peaks',
    branching: 'medium',
    minStages: 3,
    maxStages: 6,
    enemies: ['ice_elemental', 'young_drake', 'goblin_brute', 'frost_wolf', 'stone_golem'],
    baseLevel: 5,
    bossPool: ['young_drake', 'mountain_troll'],
    unlockRequirements: {
        any: [
            { minTotalClears: 8 },
            { minBuildingLevel: { building: 'explorer_guild', level: 3 } }
        ]
    },
    storyMissions: []
};
