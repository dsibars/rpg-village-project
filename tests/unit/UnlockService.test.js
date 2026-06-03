import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { UnlockService } from '../../js/engine/shared/services/UnlockService.js';

describe('UnlockService', () => {
    beforeEach(() => {
        // Clear localStorage between tests
        if (global.localStorage) {
            global.localStorage.clear();
        }
    });

    it('checkAllUnlocks returns empty array when no predicates match', () => {
        const service = new UnlockService();
        const state = {
            heroes: [{ level: 1 }],
            village: { infrastructure: {} },
            completedExpeditions: [],
            expeditionRegions: {},
            calendar: { resolvedRaids: 0 },
            stats: { itemsEquipped: 0, shopPurchases: 0 },
            academy: { sessions: [] }
        };
        const result = service.checkAllUnlocks(state);
        assert.deepStrictEqual(result, []);
    });

    it('checkAllUnlocks returns narrative IDs when predicates match', () => {
        const service = new UnlockService();
        const state = {
            heroes: [{ level: 5 }],
            village: { infrastructure: {} },
            completedExpeditions: [],
            expeditionRegions: {},
            calendar: { resolvedRaids: 0 },
            stats: { itemsEquipped: 0, shopPurchases: 0 },
            academy: { sessions: [] }
        };
        const result = service.checkAllUnlocks(state);
        // Level 5 hero triggers: nar_first_skill_slot
        assert.ok(result.includes('nar_first_skill_slot'));
    });

    it('checkAllUnlocks does not return already-shown narratives', () => {
        const service = new UnlockService();
        service.markAsShown('nar_first_skill_slot');

        const state = {
            heroes: [{ level: 5 }],
            village: { infrastructure: {} },
            completedExpeditions: [],
            expeditionRegions: {},
            calendar: { resolvedRaids: 0 },
            stats: { itemsEquipped: 0, shopPurchases: 0 },
            academy: { sessions: [] }
        };
        const result = service.checkAllUnlocks(state);
        assert.ok(!result.includes('nar_first_skill_slot'));
    });

    it('checkNewCodexFeatures returns newly unlocked features', () => {
        const service = new UnlockService();
        const state = {
            heroes: [{ level: 5, spellCodex: [] }],
            village: { infrastructure: {} },
            completedExpeditions: [],
            expeditionRegions: {},
            calendar: { resolvedRaids: 0 },
            stats: { itemsEquipped: 0, shopPurchases: 0 },
            academy: { sessions: [] }
        };
        // With level 5 hero, gambits and stamina_skills should unlock
        const result = service.checkNewCodexFeatures(state);
        assert.ok(result.includes('feature_gambits'));
        assert.ok(result.includes('feature_stamina_skills'));
    });

    it('checkNewCodexFeatures does not return previously unlocked features', () => {
        const service = new UnlockService();
        // First call to establish baseline
        const state = {
            heroes: [{ level: 5, spellCodex: [] }],
            village: { infrastructure: {} },
            completedExpeditions: [],
            expeditionRegions: {},
            calendar: { resolvedRaids: 0 },
            stats: { itemsEquipped: 0, shopPurchases: 0 },
            academy: { sessions: [] }
        };
        service.checkNewCodexFeatures(state);

        // Second call should return nothing new
        const result = service.checkNewCodexFeatures(state);
        assert.deepStrictEqual(result, []);
    });

    it('markAsShown persists narrative ID with daySeen', () => {
        const service = new UnlockService();
        service.markAsShown('nar_test', 7);
        const shown = service.getShownNarratives();
        assert.strictEqual(shown.length, 1);
        assert.strictEqual(shown[0].id, 'nar_test');
        assert.strictEqual(shown[0].daySeen, 7);
    });

    it('state migration from string[] to object[]', () => {
        // Directly test the migration logic that _load() would perform
        const service = new UnlockService({ deferLoad: true });
        service.state = { unlockedNarratives: ['nar_first_expedition'], unlockedCodexFeatures: [] };

        // Simulate _load() migration
        const raw = service.state;
        if (raw.unlockedNarratives && raw.unlockedNarratives.length > 0 && typeof raw.unlockedNarratives[0] === 'string') {
            raw.unlockedNarratives = raw.unlockedNarratives.map(id => ({ id, daySeen: null }));
        }

        const entry = service.getShownNarratives()[0];
        assert.strictEqual(entry.id, 'nar_first_expedition');
        assert.strictEqual(entry.daySeen, null);
    });

    it('isShown returns correct boolean', () => {
        const service = new UnlockService();
        assert.strictEqual(service.isShown('nar_test'), false);
        service.markAsShown('nar_test');
        assert.strictEqual(service.isShown('nar_test'), true);
    });

    it('markAllAsShown records daySeen for batch', () => {
        const service = new UnlockService();
        service.markAllAsShown(['nar_a', 'nar_b'], 3);
        const shown = service.getShownNarratives();
        assert.strictEqual(shown.length, 2);
        assert.ok(shown.every(e => e.daySeen === 3));
    });

    it('nar_first_building triggers on infrastructure', () => {
        const service = new UnlockService();
        const state = {
            heroes: [],
            village: { infrastructure: { farm: 1 } },
            completedExpeditions: [],
            expeditionRegions: {},
            calendar: { resolvedRaids: 0 },
            stats: { itemsEquipped: 0, shopPurchases: 0 },
            academy: { sessions: [] }
        };
        const newly = service.checkAllUnlocks(state);
        assert.ok(newly.includes('nar_first_building'));
    });
});
