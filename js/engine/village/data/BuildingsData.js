/**
 * Building Costs — single source of truth for construction balance.
 * Mirrors docs/village/buildings_data.md. Keep both in sync.
 *
 * Consumed by: GameEngine.startProject (authoritative cost lookup — the UI
 * displays these values but the engine re-derives them) and, via
 * ux/core/data, BuildingsTab.vue for display.
 *
 * Cost shape: { gold, materials: { <materialId>: amount }, duration (days) }.
 */
export const BUILDING_COSTS = {
    farm: {
        1: { gold: 30, materials: { material_wood: 10 }, duration: 1 },
        2: { gold: 80, materials: { material_wood: 30, material_stone: 10 }, duration: 3 }
    },
    housing: {
        2: { gold: 150, materials: { material_wood: 40, material_stone: 10 }, duration: 4 },
        3: { gold: 300, materials: { material_wood: 90, material_stone: 45 }, duration: 6 }
    },
    warehouse: {
        2: { gold: 120, materials: { material_wood: 50, material_stone: 30 }, duration: 4 }
    },
    blacksmith: {
        1: { gold: 150, materials: { material_wood: 50, material_stone: 30 }, duration: 3 }
    },
    training_grounds: {
        1: { gold: 300, materials: { material_stone: 150, material_iron_ore: 50 }, duration: 5 }
    },
    infirmary: {
        1: { gold: 150, materials: { material_wood: 100 }, duration: 3 },
        2: { gold: 400, materials: { material_wood: 200, material_stone: 100 }, duration: 5 },
        3: { gold: 800, materials: { material_wood: 300, material_stone: 200 }, duration: 7 }
    },
    tavern: {
        1: { gold: 200, materials: { material_wood: 100, material_stone: 50 }, duration: 3 }
    },
    mission_board: {
        1: { gold: 50, materials: { material_wood: 30, material_stone: 10 }, duration: 1 },
        2: { gold: 120, materials: { material_wood: 60, material_stone: 25 }, duration: 1 },
        3: { gold: 250, materials: { material_wood: 100, material_stone: 50 }, duration: 2 },
        4: { gold: 400, materials: { material_wood: 150, material_stone: 80 }, duration: 2 }
    },
    witchs_hut: {
        1: { gold: 200, materials: { material_wood: 80, material_stone: 30 }, duration: 2 }
    },
    arcane_sanctum: {
        1: { gold: 500, materials: { material_wood: 100, material_stone: 50 }, duration: 3 },
        2: { gold: 1500, materials: { material_wood: 200, material_stone: 100 }, duration: 5 },
        3: { gold: 3000, materials: { material_wood: 400, material_stone: 200 }, duration: 7 },
        4: { gold: 6000, materials: { material_wood: 800, material_stone: 400 }, duration: 10 }
    },
    explorer_guild: {
        1: { gold: 300, materials: { material_wood: 200, material_stone: 100 }, duration: 4 },
        2: { gold: 800, materials: { material_wood: 400, material_iron_ore: 200 }, duration: 7 }
    }
};

/**
 * Authoritative cost lookup. Falls back to the generic formula for
 * building/level pairs without an explicit entry.
 */
export function getBuildingCost(buildingId, level) {
    const explicit = BUILDING_COSTS[buildingId]?.[level];
    if (explicit) return explicit;
    return {
        gold: level * 100,
        materials: { material_wood: level * 50, material_stone: level * 25 },
        duration: level * 2
    };
}
