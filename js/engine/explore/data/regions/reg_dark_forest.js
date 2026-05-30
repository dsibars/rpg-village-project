export const reg_dark_forest = {
    id: 'reg_dark_forest',
    name: 'Dark Forest',
    branching: 'medium',
    minStages: 2,
    maxStages: 5,
    enemies: ['goblin_scout', 'goblin_grunt', 'wild_boar', 'wolf_alpha', 'goblin_slinger'],
    baseLevel: 3,
    bossPool: ['goblin_king'],
    unlockRequirements: {
        minRegionClears: { reg_tiny_cave: 2 }
    },
    storyMissions: []
};
