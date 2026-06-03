import { describe, it } from 'node:test';
import assert from 'node:assert';
import { PresentationService } from '../../js/engine/shared/services/PresentationService.js';
import { PRESENTATION_CATALOG } from '../../js/engine/shared/data/PresentationCatalog.js';

describe('PresentationService', () => {
    it('initializes with default state when no state is passed', () => {
        const service = new PresentationService();
        const state = service.getState();
        assert.deepStrictEqual(state.seenPresentations, []);
        assert.deepStrictEqual(state.pendingPresentations, []);
    });

    it('initializes with loaded state when passed', () => {
        const initialState = {
            seenPresentations: [{ id: 'pres_prologue', daySeen: 1 }],
            pendingPresentations: ['pres_first_harvest']
        };
        const service = new PresentationService(initialState);
        const state = service.getState();
        assert.deepStrictEqual(state.seenPresentations, [{ id: 'pres_prologue', daySeen: 1 }]);
        assert.deepStrictEqual(state.pendingPresentations, ['pres_first_harvest']);
    });

    it('evaluates and queues new_game triggers', () => {
        const service = new PresentationService();
        const triggered = service.checkTriggers({ type: 'new_game' });
        assert.ok(triggered.includes('pres_prologue'));
        assert.ok(service.hasPendingPresentations());
        assert.strictEqual(service.peekNextPresentation(), 'pres_prologue');
    });

    it('evaluates and queues building_complete triggers', () => {
        const service = new PresentationService();
        const triggered = service.checkTriggers({
            type: 'building_complete',
            buildingId: 'farm',
            level: 1
        });
        assert.ok(triggered.includes('pres_first_harvest'));
    });

    it('evaluates and queues mission_complete triggers', () => {
        const service = new PresentationService();
        const triggered = service.checkTriggers({
            type: 'mission_complete',
            missionId: 'exp_rescue_mission'
        });
        assert.ok(triggered.includes('pres_shield_dark'));
    });

    it('evaluates and queues hero_recruited triggers', () => {
        const service = new PresentationService();
        const triggered = service.checkTriggers({
            type: 'hero_recruited',
            origin: 'origin_arcane_initiate'
        });
        assert.ok(triggered.includes('pres_first_spark'));
    });

    it('evaluates and queues first_event triggers', () => {
        const service = new PresentationService();
        const triggered = service.checkTriggers({
            type: 'first_event',
            eventId: 'first_hero_level_5'
        });
        assert.ok(triggered.includes('pres_discipline'));
    });

    it('evaluates and queues chapter_milestones triggers', () => {
        const service = new PresentationService();
        const triggered = service.checkTriggers({
            type: 'chapter_milestones',
            chapter: 1,
            met: 3
        });
        assert.ok(triggered.includes('pres_chapter1_finale'));
    });

    it('does not re-trigger seen or already pending presentations', () => {
        const service = new PresentationService();
        
        // 1. Trigger new_game
        service.checkTriggers({ type: 'new_game' });
        assert.strictEqual(service.state.pendingPresentations.length, 1);
        
        // 2. Triggering it again should not add it to queue
        service.checkTriggers({ type: 'new_game' });
        assert.strictEqual(service.state.pendingPresentations.length, 1);

        // 3. Pop and mark as seen
        const popped = service.popNextPresentation();
        service.markAsSeen(popped, 1);
        assert.ok(service.isSeen('pres_prologue'));

        // 4. Triggering it again now that it is seen should do nothing
        service.checkTriggers({ type: 'new_game' });
        assert.ok(!service.hasPendingPresentations());
    });

    it('correctly tracks seen days', () => {
        const service = new PresentationService();
        service.markAsSeen('pres_prologue', 12);
        assert.strictEqual(service.getDaySeen('pres_prologue'), 12);
        assert.strictEqual(service.getDaySeen('non_existent'), null);
    });

    it('replays a presentation successfully', () => {
        const service = new PresentationService();
        const pres = service.replayPresentation('pres_prologue');
        assert.strictEqual(pres.id, 'pres_prologue');
        assert.strictEqual(pres.pages.length, 3);
    });

    it('first_event triggers new milestone presentations', () => {
        const service = new PresentationService();
        const victory = service.checkTriggers({ type: 'first_event', eventId: 'first_expedition_victory' });
        assert.ok(victory.includes('pres_first_victory'));

        const defeat = service.checkTriggers({ type: 'first_event', eventId: 'first_expedition_defeat' });
        assert.ok(defeat.includes('pres_first_defeat'));

        const equip = service.checkTriggers({ type: 'first_event', eventId: 'first_item_equipped' });
        assert.ok(equip.includes('pres_first_equip'));

        const spell = service.checkTriggers({ type: 'first_event', eventId: 'first_spell_cast_combat' });
        assert.ok(spell.includes('pres_first_spell_cast'));

        const boss = service.checkTriggers({ type: 'first_event', eventId: 'first_boss_defeated' });
        assert.ok(boss.includes('pres_first_boss_defeated'));

        const raid = service.checkTriggers({ type: 'first_event', eventId: 'first_raid_victory' });
        assert.ok(raid.includes('pres_first_raid_victory'));
    });
});
