globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { DayResolutionService } from '../../js/engine/shared/services/DayResolutionService.js';

function buildService({ villageReport }) {
    const bookCalls = [];
    const vState = { day: 5, infrastructure: {}, gold: 0 };
    const villageService = {
        state: vState,
        getState: () => vState,
        nextDay: () => villageReport
    };
    const noop = () => {};
    return {
        bookCalls,
        service: new DayResolutionService({
            villageService,
            heroService: { list: () => [], saveAll: noop, tickAllMealBuffs: noop },
            expeditionService: {
                checkRegionUnlocks: noop,
                processDay: () => ({ success: false }),
                getPendingNarratives: () => [],
                consumePendingNarratives: noop,
                getHeroActivity: () => ({ type: 'idle' })
            },
            calendarService: {
                getSeasonEffects: () => ({}),
                generateEvents: noop,
                getUpcomingEvents: () => []
            },
            academyService: { processDay: noop },
            missionSeedService: {
                checkUnlocks: noop, fillSlots: noop, getBoardSlots: () => [],
                resetRerollForNewDay: noop, trackProgress: noop
            },
            dailyObjectivesService: { generateForDay: noop },
            dailyHeroActionsService: { processActions: () => [] },
            villageEventsService: { processDay: () => null },
            bookService: {
                addSection: (section) => { bookCalls.push(section); return null; }
            },
            chronicleService: { unlockEntry: noop },
            unlockService: {
                checkAllUnlocks: () => [], checkNewCodexFeatures: () => [], markAllAsShown: noop
            },
            presentationService: { isSeen: () => true },
            i18n: { t: (k) => k },
            hooks: {
                reportTutorialEvent: noop,
                processPresentationTriggers: noop,
                persistPresentationState: noop,
                evaluateChapterMilestones: () => ({ met: 0 }),
                buildUnlockState: () => ({})
            }
        })
    };
}

test('DayResolutionService: maps village report fields into Book day-note entries', () => {
    const { service, bookCalls } = buildService({
        villageReport: { consumed: 3, growth: 1, completed: ['farm'], tavernRecruit: null }
    });
    service.resolve();

    const dayNote = bookCalls.find(c => c.id === 'village_day_5');
    assert.ok(dayNote, 'expected a village_day_5 section');
    const keys = dayNote.entries.map(e => e.key);
    assert.ok(keys.includes('book_update_food_consumed'), 'food consumption entry missing');
    assert.ok(keys.includes('book_update_villager_joined'), 'villager growth entry missing');
    assert.ok(keys.includes('book_update_building_completed'), 'building completion entry missing');

    const food = dayNote.entries.find(e => e.key === 'book_update_food_consumed');
    assert.strictEqual(food.values.amount, 3);
    const growth = dayNote.entries.find(e => e.key === 'book_update_villager_joined');
    assert.strictEqual(growth.values.amount, 1);
});

test('DayResolutionService: quiet day when nothing happened', () => {
    const { service, bookCalls } = buildService({
        villageReport: { consumed: 0, growth: 0, completed: [], tavernRecruit: null }
    });
    service.resolve();

    const dayNote = bookCalls.find(c => c.id === 'village_day_5');
    assert.ok(dayNote);
    assert.deepStrictEqual(dayNote.entries.map(e => e.key), ['book_update_quiet_day']);
});

test('DayResolutionService: village event applies gold change and books a localized entry', () => {
    const { service, bookCalls } = buildService({
        villageReport: { consumed: 2, growth: 0, completed: [], tavernRecruit: null }
    });
    // Give the stub village state gold + the methods the event path needs
    service.villageService.state.gold = 100;
    service.villageService.save = () => {};
    service.villageService.addItemToInventory = () => {};
    service.villageService.inventoryService = { useConsumable: () => ({ success: true }) };
    service.villageEventsService = {
        processDay: () => ({
            id: 'traveling_merchant',
            description: 'A traveling merchant buys some of your surplus goods.+45 gold.',
            goldChange: 45
        })
    };

    service.resolve();

    assert.strictEqual(service.villageService.state.gold, 145, 'goldChange was not applied to village gold');
    const eventSection = bookCalls.find(c => c.id === 'village_event_traveling_merchant_5');
    assert.ok(eventSection, 'expected a book section for the event');
    assert.strictEqual(eventSection.entries[0].key, 'book_event_traveling_merchant');
    assert.strictEqual(eventSection.entries[0].values.amount, 45);
});
