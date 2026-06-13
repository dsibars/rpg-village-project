globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { AcademyService } from '../../js/engine/academy/AcademyService.js';
import { HeroService } from '../../js/engine/heroes/services/HeroService.js';
import { InventoryService } from '../../js/engine/shared/inventory/services/InventoryService.js';

function createService() {
    const inventory = new InventoryService();
    const heroService = new HeroService(inventory);
    const villageService = {
        state: {
            infrastructure: { arcane_sanctum: 1 },
            gold: 1000
        },
        getState() { return this.state; },
        save() {}
    };
    return new AcademyService(heroService, villageService);
}

test('AcademyService: teach glyph from teacher to student', () => {
    const service = createService();
    const teacher = service.heroService.add({ name: 'Teacher', origin: 'origin_arcane_initiate', level: 1, statPoints: 5, knownGlyphs: ['glyph_fire', 'glyph_potentiate'] }).data;
    const student = service.heroService.add({ name: 'Student', origin: 'origin_warrior', level: 1, statPoints: 5, knownGlyphs: [] }).data;

    const result = service.teachGlyph(teacher.id, student.id, 'glyph_fire');
    assert.strictEqual(result.success, true);
    assert.ok(student.knownGlyphs.includes('glyph_fire'));
    assert.ok(student.glyphMastery['glyph_fire']);
    assert.strictEqual(student.glyphMastery['glyph_fire'].tier, 1);
});

test('AcademyService: teach fails if teacher does not know glyph', () => {
    const service = createService();
    const teacher = service.heroService.add({ name: 'Teacher', origin: 'origin_warrior', level: 1, statPoints: 5, knownGlyphs: [] }).data;
    const student = service.heroService.add({ name: 'Student', origin: 'origin_warrior', level: 1, statPoints: 5, knownGlyphs: [] }).data;

    const result = service.teachGlyph(teacher.id, student.id, 'glyph_fire');
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error, 'academy_error_teacher_glyph_unknown');
});

test('AcademyService: save and retrieve design', () => {
    const service = createService();
    const result = service.saveDesign({ name: 'Fireball', glyphIds: ['glyph_fire', 'glyph_potentiate'], mpCost: 6, damage: 14 });
    assert.strictEqual(result.success, true);

    const designs = service.getDesigns();
    assert.strictEqual(designs.length, 1);
    assert.strictEqual(designs[0].name, 'Fireball');
});

test('AcademyService: copy design to hero starts a 2-day session', () => {
    const service = createService();
    service.saveDesign({ name: 'Fireball', glyphIds: ['glyph_fire', 'glyph_potentiate'], mpCost: 6, damage: 14 });
    const design = service.getDesigns()[0];

    const hero = service.heroService.add({ name: 'Hero', origin: 'origin_warrior', level: 1, statPoints: 5, knownGlyphs: ['glyph_fire'] }).data;
    const result = service.copyDesignToHero(design.id, hero.id);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.data.daysRemaining, 2);
    assert.strictEqual(result.data.cost, 15); // 10 + 5*1
    assert.strictEqual(hero.activity, 'studying_design');
    // Glyphs are not added yet — they are added after 2 days via processDay
    assert.ok(!hero.knownGlyphs.includes('glyph_potentiate'));

    // Simulate 2 days
    service.processDay();
    service.processDay();
    assert.ok(hero.knownGlyphs.includes('glyph_potentiate'));
    assert.ok(hero.glyphMastery['glyph_potentiate']);
    assert.strictEqual(hero.activity, 'idle');
});
