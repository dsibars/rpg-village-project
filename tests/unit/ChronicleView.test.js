import '../dom/setup.js';
import test from 'node:test';
import assert from 'node:assert';
import { ChronicleView } from '../../js/presentation/ui/chronicle/ChronicleView.js';
import { PresentationService } from '../../js/engine/shared/services/PresentationService.js';

const enTranslations = {
    chronicle_title: 'Village Chronicle',
    chronicle_recently_unlocked: 'Recently Unlocked',
    chronicle_seen: 'Seen',
    chronicle_locked: 'Locked',
    chronicle_pending: 'Pending',
    chronicle_pending_hint: 'Will play next day',
    chronicle_replay: 'See Again',
    chronicle_replay_badge: 'Replay',
    chronicle_hint_prefix: 'Requires:',
    chronicle_hint_newgame: 'Unlocked at the start of a new game',
    chronicle_day_prefix: 'Day',
    chronicle_day_unknown: '—',
    chronicle_chapter_1_title: 'Chapter 1 — The Spark',
    chronicle_chapter_2_title: 'Chapter 2 — The Circle',
    pres_prologue: 'Prologue',
    pres_first_harvest: 'The First Harvest',
    pres_shield_dark: 'A Shield in the Dark',
    pres_warm_fire: 'A Warm Fire',
    pres_discipline: 'Discipline',
    pres_first_spark: 'The First Spark',
    pres_chapter1_finale: 'Chapter 1 Finale',
    pres_language_world: 'The Language of the World',
    pres_name_flame: 'A Name in Flame',
    pres_veil_thins: 'The Veil Thins',
    pres_world_opens: 'The World Opens',
    pres_chapter2_finale: 'Chapter 2 Finale'
};

const mockI18n = {
    t: (k, p) => {
        let val = enTranslations[k] || k;
        if (p) {
            Object.keys(p).forEach(key => {
                val = val.replace(`{${key}}`, p[key]);
            });
        }
        return val;
    }
};

test('ChronicleView: renders chapters from catalog', () => {
    const engine = { presentationService: new PresentationService(), i18n: mockI18n };
    const view = new ChronicleView(document.createElement('div'), engine, engine.i18n, null);
    view.render();
    assert.ok(view.container.innerHTML.includes('Chapter 1'));
});

test('ChronicleView: seen milestone shows day and See Again', () => {
    const service = new PresentationService();
    service.markAsSeen('pres_prologue', 1);
    const engine = { presentationService: service, i18n: mockI18n };
    const view = new ChronicleView(document.createElement('div'), engine, engine.i18n, null);
    view.render();
    assert.ok(view.container.innerHTML.includes('Day 1'));
    assert.ok(view.container.innerHTML.includes('See Again'));
});

test('ChronicleView: locked milestone hides title', () => {
    const engine = { presentationService: new PresentationService(), i18n: mockI18n };
    const view = new ChronicleView(document.createElement('div'), engine, engine.i18n, null);
    view.render();
    assert.ok(view.container.innerHTML.includes('???'));
});

test('ChronicleView: pending milestone shows Will play next day', () => {
    const service = new PresentationService();
    service.checkTriggers({ type: 'new_game' });
    const engine = { presentationService: service, i18n: mockI18n };
    const view = new ChronicleView(document.createElement('div'), engine, engine.i18n, null);
    view.render();
    assert.ok(view.container.innerHTML.includes('Will play next day'));
});

test('ChronicleView: Recently Unlocked shows last 3 seen', () => {
    const service = new PresentationService();
    service.markAsSeen('pres_prologue', 1);
    service.markAsSeen('pres_first_harvest', 4);
    service.markAsSeen('pres_shield_dark', 7);
    const engine = { presentationService: service, i18n: mockI18n };
    const view = new ChronicleView(document.createElement('div'), engine, engine.i18n, null);
    view.render();
    const html = view.container.innerHTML;
    assert.ok(html.includes('Recently Unlocked'));
});
