/**
 * ShopUtils - Shared presentation utilities for the Shop domain.
 */

/**
 * Gets a unique key identifying a shop item type.
 * @param {Object} item - Shop item catalog object
 * @returns {string} Unique key
 */
export function getItemKey(item) {
    if (!item) return '';
    return item.id || `${item.type}_${item.material}_${item.family || item.archetype}_${item.slot || ''}`;
}

/**
 * Calculates how many of a shop item type are currently owned by the player,
 * breaking it down into inventory storage vs. equipped on heroes.
 * @param {Object} item - Shop item catalog object
 * @param {Object} state - Global state tree
 * @returns {{total: number, inventory: number, equipped: number}}
 */
export function getOwnedBreakdown(item, state) {
    if (!item) return { total: 0, inventory: 0, equipped: 0 };
    
    if (item.type === 'consumable') {
        const count = (state.inventory && state.inventory.consumables) ? (state.inventory.consumables[item.id] || 0) : 0;
        return { total: count, inventory: count, equipped: 0 };
    }

    let inventory = 0;
    let equipped = 0;

    if (state.inventory) {
        inventory = (state.inventory.equipment || []).filter(eq =>
            eq.type === item.type &&
            eq.material === item.material &&
            (item.type === 'weapon' ? eq.family === item.family : (eq.archetype === item.archetype && eq.slot === item.slot))
        ).length;
    }

    if (state.heroes) {
        state.heroes.forEach(h => {
            if (h.equipment) {
                Object.values(h.equipment).forEach(eq => {
                    if (eq &&
                        eq.type === item.type &&
                        eq.material === item.material &&
                        (item.type === 'weapon' ? eq.family === item.family : (eq.archetype === item.archetype && eq.slot === item.slot))
                    ) {
                        equipped++;
                    }
                });
            }
        });
    }

    return { total: inventory + equipped, inventory, equipped };
}
