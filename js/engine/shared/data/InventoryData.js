export const CONSUMABLES_DATA = {
    tiny_hp_potion: { id: 'tiny_hp_potion', type: 'HEAL_HP', amount: 0.3 },
    tiny_mp_potion: { id: 'tiny_mp_potion', type: 'HEAL_MP', amount: 0.3 },
    teleport_scroll: { id: 'teleport_scroll', type: 'ESCAPE', amount: 1.0 }
};

export const MEAL_RECIPES = {
    meal_bread: {
        id: 'meal_bread',
        name: 'meal_bread',
        ingredients: { food_raw_grain: 2 },
        buff: { maxHp: 0.05 },
        battles: 1,
        icon: '🍞'
    },
    meal_stew: {
        id: 'meal_stew',
        name: 'meal_stew',
        ingredients: { food_raw_grain: 3, material_wood: 1 },
        buff: { maxHp: 0.10, strength: 1 },
        battles: 1,
        icon: '🍲'
    },
    meal_pie: {
        id: 'meal_pie',
        name: 'meal_pie',
        ingredients: { food_raw_grain: 4, material_stone: 1 },
        buff: { maxHp: 0.10, defense: 1 },
        battles: 1,
        icon: '🥧'
    },
    meal_feast: {
        id: 'meal_feast',
        name: 'meal_feast',
        ingredients: { food_raw_grain: 5, material_wood: 2, material_stone: 1 },
        buff: { maxHp: 0.15, strength: 2, defense: 2 },
        battles: 2,
        icon: '🍖'
    }
};
