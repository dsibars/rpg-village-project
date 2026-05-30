export const reg_calmed_beach = {
    id: 'reg_calmed_beach',
    name: 'Calmed Beach',
    branching: 'low',
    minStages: 2,
    maxStages: 4,
    enemies: ['crab_shell', 'water_spirit_minor', 'murloc_shore', 'slime_earth'],
    baseLevel: 2,
    bossPool: ['water_spirit_minor'],
    unlockRequirements: {
        any: [
            { minRegionClears: { reg_greenfields: 3 } },
            { minBuildingLevel: { building: 'explorer_guild', level: 1 } }
        ]
    },
    storyMissions: []
};
