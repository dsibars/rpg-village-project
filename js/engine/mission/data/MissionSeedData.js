export const MISSION_SEEDS = {
    defeat_enemies: {
        id: 'defeat_enemies',
        nameKey: 'mission_seed_defeat_enemies',
        descriptionKey: 'mission_seed_defeat_enemies_desc',
        unlockCondition: {
            type: 'building_level',
            building: 'tavern',
            level: 1
        },
        action: {
            type: 'defeat',
            targetType: 'enemy',
            baseCount: 3,
            countScaling: 0.3
        },
        rewards: [
            { type: 'gold', baseAmount: 50, scaling: 10, probability: 1.0, isGuaranteed: true },
            { type: 'material_wood', baseAmount: 10, scaling: 2, probability: 0.6 },
            { type: 'material_stone', baseAmount: 5, scaling: 1, probability: 0.4 }
        ],
        category: 'combat',
        difficulty: 'easy',
        icon: '⚔️'
    },
    recruit_heroes: {
        id: 'recruit_heroes',
        nameKey: 'mission_seed_recruit_heroes',
        descriptionKey: 'mission_seed_recruit_heroes_desc',
        unlockCondition: {
            type: 'building_level',
            building: 'tavern',
            level: 1
        },
        action: {
            type: 'recruit',
            targetType: 'hero',
            baseCount: 1,
            countScaling: 0.2
        },
        rewards: [
            { type: 'gold', baseAmount: 100, scaling: 15, probability: 1.0, isGuaranteed: true },
            { type: 'material_wood', baseAmount: 20, scaling: 3, probability: 0.7 }
        ],
        category: 'progression',
        difficulty: 'medium',
        icon: '👥'
    },
    spend_gold: {
        id: 'spend_gold',
        nameKey: 'mission_seed_spend_gold',
        descriptionKey: 'mission_seed_spend_gold_desc',
        unlockCondition: {
            type: 'building_level',
            building: 'tavern',
            level: 1
        },
        action: {
            type: 'spend',
            targetType: 'gold',
            baseCount: 200,
            countScaling: 0.25
        },
        rewards: [
            { type: 'material_stone', baseAmount: 15, scaling: 3, probability: 1.0, isGuaranteed: true },
            { type: 'material_iron', baseAmount: 5, scaling: 1, probability: 0.5 }
        ],
        category: 'economy',
        difficulty: 'easy',
        icon: '💰'
    },
    equip_gear: {
        id: 'equip_gear',
        nameKey: 'mission_seed_equip_gear',
        descriptionKey: 'mission_seed_equip_gear_desc',
        unlockCondition: {
            type: 'building_level',
            building: 'blacksmith',
            level: 1
        },
        action: {
            type: 'equip',
            targetType: 'equipment',
            baseCount: 1,
            countScaling: 0.2
        },
        rewards: [
            { type: 'gold', baseAmount: 30, scaling: 5, probability: 1.0, isGuaranteed: true },
            { type: 'material_iron', baseAmount: 3, scaling: 1, probability: 0.6 }
        ],
        category: 'progression',
        difficulty: 'easy',
        icon: '🛡️'
    },
    use_magic: {
        id: 'use_magic',
        nameKey: 'mission_seed_use_magic',
        descriptionKey: 'mission_seed_use_magic_desc',
        unlockCondition: {
            type: 'chapter',
            chapter: 2
        },
        action: {
            type: 'cast',
            targetType: 'spell',
            baseCount: 5,
            countScaling: 0.3
        },
        rewards: [
            { type: 'gold', baseAmount: 80, scaling: 12, probability: 1.0, isGuaranteed: true },
            { type: 'material_crystal', baseAmount: 2, scaling: 0.5, probability: 0.4 }
        ],
        category: 'combat',
        difficulty: 'medium',
        icon: '✨'
    },
    upgrade_buildings: {
        id: 'upgrade_buildings',
        nameKey: 'mission_seed_upgrade_buildings',
        descriptionKey: 'mission_seed_upgrade_buildings_desc',
        unlockCondition: {
            type: 'building_level',
            building: 'town_hall',
            level: 1
        },
        action: {
            type: 'upgrade',
            targetType: 'building',
            baseCount: 1,
            countScaling: 0.15
        },
        rewards: [
            { type: 'gold', baseAmount: 150, scaling: 20, probability: 1.0, isGuaranteed: true },
            { type: 'material_wood', baseAmount: 30, scaling: 5, probability: 0.8 },
            { type: 'material_stone', baseAmount: 15, scaling: 3, probability: 0.6 }
        ],
        category: 'economy',
        difficulty: 'medium',
        icon: '🏗️'
    },
    complete_expeditions: {
        id: 'complete_expeditions',
        nameKey: 'mission_seed_complete_expeditions',
        descriptionKey: 'mission_seed_complete_expeditions_desc',
        unlockCondition: {
            type: 'building_level',
            building: 'tavern',
            level: 1
        },
        action: {
            type: 'complete',
            targetType: 'expedition',
            baseCount: 1,
            countScaling: 0.2
        },
        rewards: [
            { type: 'gold', baseAmount: 120, scaling: 15, probability: 1.0, isGuaranteed: true },
            { type: 'material_iron', baseAmount: 8, scaling: 2, probability: 0.5 }
        ],
        category: 'progression',
        difficulty: 'medium',
        icon: '🗺️'
    },
    craft_items: {
        id: 'craft_items',
        nameKey: 'mission_seed_craft_items',
        descriptionKey: 'mission_seed_craft_items_desc',
        unlockCondition: {
            type: 'building_level',
            building: 'forge',
            level: 1
        },
        action: {
            type: 'craft',
            targetType: 'item',
            baseCount: 2,
            countScaling: 0.25
        },
        rewards: [
            { type: 'gold', baseAmount: 60, scaling: 8, probability: 1.0, isGuaranteed: true },
            { type: 'material_iron', baseAmount: 5, scaling: 1, probability: 0.7 }
        ],
        category: 'economy',
        difficulty: 'easy',
        icon: '⚒️'
    },
    defeat_elite: {
        id: 'defeat_elite',
        nameKey: 'mission_seed_defeat_elite',
        descriptionKey: 'mission_seed_defeat_elite_desc',
        unlockCondition: {
            type: 'chapter',
            chapter: 2
        },
        action: {
            type: 'defeat',
            targetType: 'elite',
            baseCount: 1,
            countScaling: 0.15
        },
        rewards: [
            { type: 'gold', baseAmount: 200, scaling: 25, probability: 1.0, isGuaranteed: true },
            { type: 'material_crystal', baseAmount: 3, scaling: 0.5, probability: 0.6 },
            { type: 'material_gold_ore', baseAmount: 1, scaling: 0.2, probability: 0.3 }
        ],
        category: 'combat',
        difficulty: 'hard',
        icon: '👑'
    },
    train_heroes: {
        id: 'train_heroes',
        nameKey: 'mission_seed_train_heroes',
        descriptionKey: 'mission_seed_train_heroes_desc',
        unlockCondition: {
            type: 'building_level',
            building: 'training_ground',
            level: 1
        },
        action: {
            type: 'train',
            targetType: 'hero',
            baseCount: 3,
            countScaling: 0.3
        },
        rewards: [
            { type: 'gold', baseAmount: 40, scaling: 6, probability: 1.0, isGuaranteed: true },
            { type: 'material_wood', baseAmount: 10, scaling: 2, probability: 0.5 }
        ],
        category: 'progression',
        difficulty: 'easy',
        icon: '📚'
    }
};

export const MISSION_SEED_IDS = Object.keys(MISSION_SEEDS);
