/**
 * Stub region: Iron Peaks
 * Not yet unlockable in-game. Reserved for future expansion.
 */
export const reg_iron_peaks = {
    id: 'reg_iron_peaks',
    name: 'Iron Peaks',
    branching: 'medium',
    minStages: 3,
    maxStages: 6,
    enemies: ['orc_grunt', 'orc_shaman', 'rock_golem', 'harpy_scout'],
    baseLevel: 5,
    bossPool: ['mountain_troll'],

    storyMissions: [
        {
            id: 'exp_orc_stronghold',
            name: 'Orc Stronghold',
            regionId: 'reg_iron_peaks',
            isStory: true,
            status: 'available',
            parentId: null,
            requirements: {
                minBuildingLevel: { building: 'explorer_guild', level: 2 }
            },
            reward: {
                gold: 5000,
                items: { material_steel_ingot: 20 },
                special: { type: 'hero', value: 'Brog' }
            },
            stages: [
                { type: 'battle', enemies: ['orc_grunt', 'orc_grunt', 'orc_shaman'] },
                { type: 'battle', enemies: ['rock_golem', 'orc_shaman'] },
                { type: 'battle', enemies: ['mountain_troll'], isBoss: true }
            ]
        }
    ]
};
