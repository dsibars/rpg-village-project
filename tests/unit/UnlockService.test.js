import { describe, it } from 'node:test';
import assert from 'node:assert';
import { UnlockService } from '../../js/engine/shared/services/UnlockService.js';

describe('UnlockService', () => {
    it('checkAllUnlocks returns empty array when no predicates match', () => {
        const service = new UnlockService();
        const state = {
            heroes: [{ level: 1 }],
            village: { infrastructure: {} },
            completedExpeditions: [],
            expeditionRegions: {},
            calendar: { resolvedRaids: 0 }
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
            calendar: { resolvedRaids: 0 }
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
            calendar: { resolvedRaids: 0 }
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
            calendar: { resolvedRaids: 0 }
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
            calendar: { resolvedRaids: 0 }
        };
        service.checkNewCodexFeatures(state);

        // Second call should return nothing new
        const result = service.checkNewCodexFeatures(state);
        assert.deepStrictEqual(result, []);
    });

    it('markAsShown persists narrative ID', () => {
        const service = new UnlockService();
        service.markAsShown('nar_test');
        assert.ok(service.getShownNarratives().includes('nar_test'));
    });
});
