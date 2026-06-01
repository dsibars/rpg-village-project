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

export const GLYPH_TABLET_DATA = {
    tablet_glyph_fire_1:        { glyphId: 'glyph_fire',        tier: 1 },
    tablet_glyph_water_1:       { glyphId: 'glyph_water',       tier: 1 },
    tablet_glyph_wind_1:        { glyphId: 'glyph_wind',        tier: 1 },
    tablet_glyph_storm_1:       { glyphId: 'glyph_storm',       tier: 1 },
    tablet_glyph_light_1:       { glyphId: 'glyph_light',       tier: 1 },
    tablet_glyph_dark_1:        { glyphId: 'glyph_dark',        tier: 1 },
    tablet_glyph_earth_1:       { glyphId: 'glyph_earth',       tier: 1 },
    tablet_glyph_potentiate_1:  { glyphId: 'glyph_potentiate',  tier: 1 },
    tablet_glyph_focus_1:       { glyphId: 'glyph_focus',       tier: 1 },
    tablet_glyph_extend_1:      { glyphId: 'glyph_extend',      tier: 1 },
    tablet_glyph_multi_1:       { glyphId: 'glyph_multi',       tier: 1 },
    tablet_glyph_pierce_1:      { glyphId: 'glyph_pierce',      tier: 1 },
    tablet_glyph_venom_1:       { glyphId: 'glyph_venom',       tier: 1 },
    tablet_glyph_slumber_1:     { glyphId: 'glyph_slumber',     tier: 1 },
    tablet_glyph_aegis_1:       { glyphId: 'glyph_aegis',       tier: 1 },
    tablet_glyph_celerity_1:    { glyphId: 'glyph_celerity',    tier: 1 },
    tablet_glyph_reflect_1:     { glyphId: 'glyph_reflect',     tier: 1 },
    tablet_glyph_leech_1:       { glyphId: 'glyph_leech',       tier: 1 },
    tablet_glyph_streamline_1:  { glyphId: 'glyph_streamline',  tier: 1 }
};

