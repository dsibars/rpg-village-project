/**
 * LootService handles equipment and consumable drop generation for expeditions.
 * Pure logic — no state management. Stateless and deterministic per call.
 */
export class LootService {
    constructor(getRegionData) {
        this._getRegionData = getRegionData;
    }

    generateLootDrop(regionId) {
        // 40% chance for equipment drop
        if (Math.random() >= 0.40) return null;

        const rData = this._getRegionData(regionId);
        const materialTiers = ['wooden', 'iron', 'steel', 'gold', 'mythril'];
        const material = materialTiers[Math.min(rData.baseLevel || 1, materialTiers.length) - 1];

        const isWeapon = Math.random() < 0.5;
        let item = {
            type: isWeapon ? 'weapon' : 'armor',
            material: material,
            level: 0,
            affixes: []
        };

        if (isWeapon) {
            const families = ['dagger', 'broadsword', 'battle_axe', 'wand'];
            item.family = families[Math.floor(Math.random() * families.length)];
        } else {
            const archetypes = ['plate', 'leather', 'robes'];
            const slots = ['head', 'body', 'legs', 'rightHand'];
            item.archetype = archetypes[Math.floor(Math.random() * archetypes.length)];
            item.slot = slots[Math.floor(Math.random() * slots.length)];
        }

        // Affix roll
        const affixPool = ['vampire', 'sage', 'titan', 'assassin', 'phoenix'];
        const roll = Math.random();
        const numAffixes = roll < 0.02 ? 2 : (roll < 0.12 ? 1 : 0);
        for (let i = 0; i < numAffixes; i++) {
            const affix = affixPool[Math.floor(Math.random() * affixPool.length)];
            if (!item.affixes.includes(affix)) {
                item.affixes.push(affix);
            }
        }

        return item;
    }

    generateConsumableDrops(regionId) {
        const drops = [];
        const rData = this._getRegionData(regionId);
        const regionLevel = rData.baseLevel || 1;

        // Guaranteed 1 tiny_mp_potion, plus 50% chance for an extra one
        // Additional potion per region level above 1 (capped at +2)
        const baseQty = 1;
        const bonusQty = Math.random() < 0.5 ? 1 : 0;
        const levelBonus = Math.min(2, Math.max(0, regionLevel - 1));
        const totalMpPotions = baseQty + bonusQty + levelBonus;

        if (totalMpPotions > 0) {
            drops.push({ id: 'tiny_mp_potion', qty: totalMpPotions });
        }

        // Small chance for HP potion as well (30% for 1)
        if (Math.random() < 0.30) {
            drops.push({ id: 'tiny_hp_potion', qty: 1 });
        }

        return drops;
    }

    generateGlyphDrop(regionId, clears = 0) {
        const rData = this._getRegionData(regionId);
        if (!rData || !rData.glyphDropTable || rData.glyphDropTable.length === 0) {
            return null;
        }
        const baseChance = rData.glyphDropChance || 0;
        const dropChance = Math.min(1.0, baseChance + (clears * 0.02));
        if (Math.random() >= dropChance) {
            return null;
        }
        const totalWeight = rData.glyphDropTable.reduce((sum, entry) => sum + (entry.weight || 1), 0);
        let roll = Math.random() * totalWeight;
        for (const entry of rData.glyphDropTable) {
            roll -= (entry.weight || 1);
            if (roll <= 0) {
                const tier = entry.tier || 1;
                const type = entry.glyphId.replace('glyph_', '');
                const tabletId = `tablet_glyph_${type}_${tier}`;
                return { tabletId, glyphId: entry.glyphId, tier };
            }
        }
        return null;
    }
}

