export const reg_goblin_camp = {
    id: 'reg_goblin_camp',
    name: 'Goblin Camp',
    branching: 'high',
    minStages: 3,
    maxStages: 6,
    enemies: ['goblin_scout', 'goblin_grunt', 'goblin_brute', 'goblin_shaman', 'goblin_slinger', 'goblin_king'],
    baseLevel: 4,
    bossPool: ['goblin_king', 'goblin_shaman'],
    unlockRequirements: {
        any: [
            { minRegionClears: { reg_dark_forest: 3 } },
            { minBuildingLevel: { building: 'explorer_guild', level: 2 } }
        ]
    },
    storyMissions: []
};
