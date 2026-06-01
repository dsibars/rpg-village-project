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
    scaling: {
        levelPerClears: 5,
        statMultiplier: 1.08,
        maxLevelCap: 10
    },
    lootProfile: {
        materials: [
            { id: 'material_wood', min: 3, max: 6, chance: 1.0 },
            { id: 'material_stone', min: 1, max: 2, chance: 0.5 },
            { id: 'material_iron_ore', min: 1, max: 1, chance: 0.2 }
        ],
        goldBase: 40,
        goldPerClear: 8
    },
    narrative: {
        firstClear: {
            titleKey: 'nar_greenfields_first_clear_title',
            loreKey: 'nar_greenfields_first_clear_lore',
            era: 1
        }
    },
    glyphDropTable: null,

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
                items: { material_wood: 20, material_stone: 10 },
                effects: [
                    { type: 'building_blueprint', buildingId: 'blacksmith' },
                    { type: 'building_blueprint', buildingId: 'explorer_guild' }
                ]
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
                effects: [
                    {
                        type: 'hero',
                        name: 'Sir Valen',
                        origin: 'origin_guard',
                        level: 1,
                        avatar: 'valen.webp'
                    },
                    { type: 'building_blueprint', buildingId: 'tavern' },
                    { type: 'building_blueprint', buildingId: 'infirmary' },
                    {
                        type: 'narrative',
                        id: 'nar_rescue_mission',
                        titleKey: 'nar_rescue_mission_title',
                        loreKey: 'nar_rescue_mission_lore',
                        era: 1
                    }
                ]
            },
            stages: [
                { type: 'battle', enemies: ['slime_green', 'slime_green'] },
                { type: 'battle', enemies: ['slime_fire'], isBoss: true }
            ]
        }
    ]
};
