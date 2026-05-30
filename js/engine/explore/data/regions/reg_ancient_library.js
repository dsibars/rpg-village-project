/**
 * Stub region: Ancient Library
 * Not yet unlockable in-game. Reserved for future expansion.
 */
export const reg_ancient_library = {
    id: 'reg_ancient_library',
    name: 'Ancient Library',
    branching: 'low',
    minStages: 4,
    maxStages: 7,
    enemies: ['cultist_acolyte', 'ghost_wisp', 'lich_apprentice', 'skeleton_archer'],
    baseLevel: 6,
    bossPool: ['lich_apprentice'],

    storyMissions: [
        {
            id: 'exp_ancient_archives',
            name: 'The Golem Chambers',
            regionId: 'reg_ancient_library',
            isStory: true,
            status: 'available',
            parentId: null,
            requirements: {
                minBuildingLevel: { building: 'explorer_guild', level: 3 }
            },
            reward: {
                gold: 7000,
                special: { type: 'unlock', value: 'advanced_logistics' }
            },
            stages: [
                { type: 'battle', enemies: ['skeleton_archer', 'skeleton_archer', 'ghost_wisp'] },
                { type: 'battle', enemies: ['cultist_acolyte', 'lich_apprentice'] },
                { type: 'battle', enemies: ['stone_golem'], isBoss: true }
            ]
        }
    ]
};
