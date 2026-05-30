/**
 * Region: Greenfields (Tutorial Region)
 * Tier 1, Low branching, simple enemies.
 */
export const reg_greenfields = {
    id: 'reg_greenfields',
    name: 'Greenfields',
    branching: 'low',
    minStages: 1,
    maxStages: 3,
    enemies: ['slime_green', 'wild_boar', 'rabbit_horned', 'slime_earth'],
    baseLevel: 1,
    bossPool: ['slime_fire'],
    // Greenfields is the starting region; no unlock requirements.

    storyMissions: [
        {
            id: 'exp_tutorial_cave',
            name: 'Tutorial Cave',
            regionId: 'reg_greenfields',
            isStory: true,
            status: 'available',
            parentId: null,
            reward: {
                gold: 100,
                items: { material_wood: 20, material_stone: 10 }
            },
            stages: [
                { type: 'battle', enemies: ['slime_green'] },
                { type: 'battle', enemies: ['slime_fire'], isBoss: true }
            ]
        },
        {
            id: 'exp_rescue_mission',
            name: 'The Captured Guard',
            regionId: 'reg_greenfields',
            isStory: true,
            status: 'available',
            parentId: 'exp_tutorial_cave',
            requirements: {
                completedMissions: ['exp_tutorial_cave']
            },
            reward: {
                gold: 200,
                items: { material_wood: 15, material_stone: 5 },
                special: { type: 'hero', value: 'Sir Valen' }
            },
            stages: [
                { type: 'battle', enemies: ['slime_green', 'slime_green'] },
                { type: 'battle', enemies: ['slime_fire'], isBoss: true }
            ]
        }
    ]
};
