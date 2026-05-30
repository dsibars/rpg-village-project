export const WEAPON_FAMILIES = {
    dagger: { id: 'dagger', spdBonus: 2, evaBonus: 5, dmgMult: 0.8 },
    broadsword: { id: 'broadsword', spdBonus: 0, evaBonus: 0, dmgMult: 1.0 },
    battle_axe: { id: 'battle_axe', spdBonus: -2, evaBonus: 0, dmgMult: 1.5 },
    wand: { id: 'wand', spdBonus: 0, evaBonus: 0, dmgMult: 0.4, magBonus: 5, mpCostReduction: 0.1 }
};

export const MATERIAL_TIERS = {
    wooden: { id: 'wooden', levelReq: 1, mult: 1.0 },
    iron: { id: 'iron', levelReq: 2, mult: 1.5 },
    steel: { id: 'steel', levelReq: 3, mult: 2.2 },
    gold: { id: 'gold', levelReq: 4, mult: 3.5 },
    mythril: { id: 'mythril', levelReq: 5, mult: 5.0 }
};

export const ARMOR_ARCHETYPES = {
    plate: { id: 'plate', defMult: 2.0, hpMult: 1.2, spdPenalty: -3, evaPenalty: -10 },
    leather: { id: 'leather', defMult: 1.0, evaBonus: 10, spdPenalty: 0 },
    robes: { id: 'robes', defMult: 0.5, mpMult: 1.5, magMult: 1.2, spdPenalty: 0 }
};

/**
 * Calculate equipment refinement cost based on material and current level.
 * @param {Object} item - Equipment item with `material` and `level`.
 * @returns {{gold:number,materials:Object<string,number>}}
 */
export const EQUIPMENT_SET_BONUSES = {
    wooden: {
        name: 'set_wooden',
        thresholds: [2, 4, 6],
        bonuses: {
            2: { maxHp: 5 },
            4: { maxHp: 10, strength: 1 },
            6: { maxHp: 15, strength: 2, defense: 1 }
        }
    },
    iron: {
        name: 'set_iron',
        thresholds: [2, 4, 6],
        bonuses: {
            2: { maxHp: 10, strength: 1 },
            4: { maxHp: 20, strength: 2, defense: 1 },
            6: { maxHp: 30, strength: 3, defense: 2, speed: 1 }
        }
    },
    steel: {
        name: 'set_steel',
        thresholds: [2, 4, 6],
        bonuses: {
            2: { maxHp: 15, strength: 2, defense: 1 },
            4: { maxHp: 30, strength: 3, defense: 2, speed: 1 },
            6: { maxHp: 45, strength: 5, defense: 3, speed: 2, magicPower: 1 }
        }
    },
    gold: {
        name: 'set_gold',
        thresholds: [2, 4, 6],
        bonuses: {
            2: { maxHp: 20, strength: 3, defense: 2 },
            4: { maxHp: 40, strength: 5, defense: 3, speed: 2 },
            6: { maxHp: 60, strength: 7, defense: 5, speed: 3, magicPower: 3 }
        }
    },
    mythril: {
        name: 'set_mythril',
        thresholds: [2, 4, 6],
        bonuses: {
            2: { maxHp: 30, strength: 5, defense: 3, speed: 2 },
            4: { maxHp: 60, strength: 8, defense: 5, speed: 4, magicPower: 3 },
            6: { maxHp: 100, strength: 12, defense: 8, speed: 6, magicPower: 5 }
        }
    }
};

export function getRefineCost(item) {
    const L = item.level || 0;
    const nextLevel = L + 1;
    const mat = item.material;

    const cost = { gold: 0, materials: {} };

    if (mat === 'wooden') {
        cost.gold = 30 * nextLevel;
        cost.materials.material_wood = 10 * nextLevel;
    } else if (mat === 'iron') {
        cost.gold = 75 * nextLevel;
        cost.materials.material_wood = 5 * nextLevel;
        cost.materials.material_stone = 5 * nextLevel;
        cost.materials.material_iron_ore = 3 * nextLevel;
    } else if (mat === 'steel') {
        cost.gold = 150 * nextLevel;
        cost.materials.material_stone = 10 * nextLevel;
        cost.materials.material_steel_ingot = 3 * nextLevel;
    } else if (mat === 'gold') {
        cost.gold = 300 * nextLevel;
        cost.materials.material_stone = 15 * nextLevel;
    } else if (mat === 'mythril') {
        cost.gold = 500 * nextLevel;
        cost.materials.material_mythril = 2 * nextLevel;
    }

    return cost;
}
