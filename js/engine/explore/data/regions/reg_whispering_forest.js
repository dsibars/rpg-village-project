export const reg_whispering_forest = {
    id: 'reg_whispering_forest',
    name: 'Whispering Forest',
    branching: 'medium',
    minStages: 2,
    maxStages: 4,
    enemies: ['rabbit_horned', 'wolf_alpha', 'slime_earth', 'goblin_scout'],
    baseLevel: 2,
    bossPool: ['wolf_alpha'],
    unlockRequirements: {
        any: [
            { minRegionClears: { reg_greenfields: 5 } },
            { minBuildingLevel: { building: 'explorer_guild', level: 1 } }
        ]
    },
    storyMissions: []
};
