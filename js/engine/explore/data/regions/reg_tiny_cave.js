export const reg_tiny_cave = {
    id: 'reg_tiny_cave',
    name: 'Tiny Cave',
    branching: 'medium',
    minStages: 2,
    maxStages: 4,
    enemies: ['bat_small', 'spider_minor', 'slime_green', 'goblin_scout'],
    baseLevel: 2,
    bossPool: ['goblin_brute'],
    unlockRequirements: {
        completedMissions: ['exp_tutorial_cave']
    },
    storyMissions: []
};
