import test from 'node:test';
import assert from 'node:assert';
import { LootService } from '../../js/engine/explore/services/LootService.js';

test('LootService: generateGlyphDrop', () => {
    // Mock getRegionData
    const mockRegions = {
        reg_test_empty: {
            id: 'reg_test_empty',
            glyphDropTable: null
        },
        reg_test_ruins: {
            id: 'reg_test_ruins',
            glyphDropChance: 0.5,
            glyphDropTable: [
                { glyphId: 'glyph_fire', weight: 1, tier: 1 }
            ]
        }
    };
    const getRegionData = (id) => mockRegions[id];

    const lootService = new LootService(getRegionData);

    // Empty table returns null
    assert.strictEqual(lootService.generateGlyphDrop('reg_test_empty', 0), null);

    // Drop chance roll
    const originalRandom = Math.random;
    try {
        // Force drop chance failure
        Math.random = () => 0.99;
        assert.strictEqual(lootService.generateGlyphDrop('reg_test_ruins', 0), null);

        // Force drop chance success
        Math.random = () => 0.01;
        const drop = lootService.generateGlyphDrop('reg_test_ruins', 0);
        assert.deepStrictEqual(drop, {
            tabletId: 'tablet_glyph_fire_1',
            glyphId: 'glyph_fire',
            tier: 1
        });
    } finally {
        Math.random = originalRandom;
    }
});
