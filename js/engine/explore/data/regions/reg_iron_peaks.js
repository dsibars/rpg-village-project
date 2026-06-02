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
    scaling: {
        levelPerClears: 3,
        statMultiplier: 1.1,
        maxLevelCap: null
    },
    lootProfile: {
        materials: [
            { id: 'material_iron_ore', min: 3, max: 6, chance: 1.0 },
            { id: 'material_steel_ingot', min: 1, max: 3, chance: 0.4 }
        ],
        goldBase: 40,
        goldPerClear: 8
    },
    narrative: null,
    glyphDropTable: null,

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
                effects: [
                    {
                        type: 'hero',
                        name: 'Brog',
                        origin: 'origin_warrior',
                        level: 1,
                        avatar: 'brog.png'
                    }
                ]
            },
            stages: [
                { type: 'battle', enemies: ['orc_grunt', 'orc_grunt', 'orc_shaman'] },
                { type: 'battle', enemies: ['rock_golem', 'orc_shaman'] },
                { type: 'battle', enemies: ['mountain_troll'], isBoss: true }
            ]
        }
    ]
};
