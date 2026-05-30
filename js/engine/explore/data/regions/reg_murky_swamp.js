export const reg_murky_swamp = {
    id: 'reg_murky_swamp',
    name: 'Murky Swamp',
    branching: 'high',
    minStages: 3,
    maxStages: 5,
    enemies: ['zombie_rotter', 'slime_earth', 'murloc_shore', 'goblin_shaman'],
    baseLevel: 3,
    bossPool: ['goblin_shaman'],
    unlockRequirements: {
        minRegionClears: { reg_dark_forest: 4 }
    },
    storyMissions: []
};
