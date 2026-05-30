import './setup.js';
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HeroesView } from '../../js/presentation/ui/heroes/HeroesView.js';
import { HeroInscriptionModal } from '../../js/presentation/ui/heroes/components/HeroInscriptionModal.js';
import { HeroSkillsModal } from '../../js/presentation/ui/heroes/components/HeroSkillsModal.js';
import { TrainerModal, WitchModal, AcademyModal, HallOfFameModal } from '../../js/presentation/ui/heroes/components/HeroTrainingModals.js';
import { EquipmentView } from '../../js/presentation/ui/heroes/components/EquipmentView.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const heroesHtmlPath = path.resolve(__dirname, '../../pages/heroes.html');
const heroesHtml = fs.readFileSync(heroesHtmlPath, 'utf8');

test('HeroesView DOM Refactor', async (t) => {
    // Setup mock UI reference
    const mockUi = {
        t: (k) => k,
        switchView: () => {},
        forceUpdate: () => {},
        update: () => {},
        engine: {
            getRecruitCost: () => 100
        },
        openEquipmentOverlay: (options) => {
            const eqView = new EquipmentView({ ui: mockUi });
            mockUi.equipmentView = eqView;
            eqView.open(options);
        }
    };

    // Helper to create mock state
    const createMockState = () => ({
        heroes: [
            {
                id: 'hero_1',
                name: 'Arthur',
                origin: 'origin_warrior',
                level: 3,
                exp: 150,
                expToNextLevel: 300,
                hp: 120,
                maxHp: 120,
                mp: 40,
                maxMp: 40,
                stamina: 50,
                maxStamina: 50,
                strength: 15,
                speed: 10,
                defense: 12,
                magicPower: 5,
                activity: 'idle',
                statPoints: 2,
                skillPoints: 1,
                knownFamilies: ['single_strike'],
                techniqueTiers: { 'single_strike': 1 },
                techniqueUses: { 'single_strike': 12 },
                equipment: {
                    head: null,
                    body: null,
                    legs: null,
                    leftHand: null,
                    rightHand: null,
                    accessory: null
                }
            }
        ],
        village: {
            gold: 500,
            maxStorage: 100,
            infrastructure: {
                tavern: 1,
                arcane_sanctum: 0,
                witchs_hut: 0
            }
        },
        inventory: {
            totalUsed: 20,
            equipment: []
        }
    });

    await t.test('mounts successfully and renders roster list', () => {
        document.body.innerHTML = heroesHtml;
        const rootNode = document.body.querySelector('#heroes-view');
        
        const view = new HeroesView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.update(state);

        // Verify roster list contains Arthur
        const listContainer = document.body.querySelector('#heroes-list-container');
        assert.ok(listContainer);
        
        const card = listContainer.querySelector('[data-id="hero_1"]');
        assert.ok(card);
        assert.strictEqual(card.querySelector('.list-item-title').textContent, 'Arthur');

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('selecting hero displays detail pane surgically', () => {
        document.body.innerHTML = heroesHtml;
        const rootNode = document.body.querySelector('#heroes-view');
        
        const view = new HeroesView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.update(state);

        // Initially no active hero details
        const emptyMsg = document.body.querySelector('.empty-detail');
        assert.ok(emptyMsg);
        assert.strictEqual(emptyMsg.style.display, 'flex');

        // Select Arthur
        view.selectedHeroId = 'hero_1';
        view.update(state);

        assert.strictEqual(emptyMsg.style.display, 'none');
        
        const profileLeft = document.body.querySelector('.hero-profile-left');
        assert.ok(profileLeft);
        assert.ok(profileLeft.querySelector('h2').textContent.includes('Arthur'));

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('clicks allocate stat trigger emit events', () => {
        document.body.innerHTML = heroesHtml;
        const rootNode = document.body.querySelector('#heroes-view');
        
        const view = new HeroesView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.selectedHeroId = 'hero_1';
        
        const emitted = [];
        view.on('increaseStat', (data) => emitted.push(data));

        view.update(state);

        // Click strength '+' allocate button
        const strengthRow = document.body.querySelector('.stats-grid').children[3]; // strength is index 3
        const addBtn = strengthRow.querySelector('.btn-assign-stat');
        assert.ok(addBtn);
        addBtn.dispatchEvent(new Event('click'));

        assert.strictEqual(emitted.length, 1);
        assert.deepStrictEqual(emitted[0], { heroId: 'hero_1', statId: 'baseStrength' });

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('clicking equipment button opens EquipmentView overlay', () => {
        document.body.innerHTML = heroesHtml;
        const rootNode = document.body.querySelector('#heroes-view');
        
        const view = new HeroesView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        state.inventory.equipment = [
            { id: 'eq_iron_helmet', type: 'armor', slot: 'head', material: 'iron', archetype: 'plate', level: 0 }
        ];
        view.selectedHeroId = 'hero_1';
        view.update(state);

        // Click Equipment button in quick-links
        const buttons = Array.from(document.body.querySelectorAll('.hero-quick-links button'));
        const equipmentButton = buttons.find(b => b.textContent.includes('ui_equipment'));
        assert.ok(equipmentButton, 'Equipment button should exist in quick-links');
        equipmentButton.dispatchEvent(new Event('click'));

        // Verify overlay is in body
        const overlay = document.body.querySelector('.equipment-page-overlay');
        assert.ok(overlay);
        assert.ok(overlay.textContent.includes('Arthur'));

        // Close page
        const closeBtn = overlay.querySelector('#btn-equip-close');
        assert.ok(closeBtn);
        closeBtn.dispatchEvent(new Event('click'));

        // Cleanup
        document.body.innerHTML = '';
        if (mockUi.equipmentView) {
            mockUi.equipmentView.close();
            mockUi.equipmentView = null;
        }
    });

    await t.test('clicking skills button opens HeroSkillsModal', () => {
        document.body.innerHTML = heroesHtml;
        const rootNode = document.body.querySelector('#heroes-view');
        
        const view = new HeroesView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.selectedHeroId = 'hero_1';
        view.update(state);

        // Click Skills button in quick-links
        const buttons = Array.from(document.body.querySelectorAll('.hero-quick-links button'));
        const skillsButton = buttons.find(b => b.textContent.includes('ui_skills'));
        assert.ok(skillsButton, 'Skills button should exist in quick-links');
        skillsButton.dispatchEvent(new Event('click'));

        // Verify modal overlay is in body
        const overlay = document.body.querySelector('.modal-overlay');
        assert.ok(overlay);
        assert.ok(overlay.textContent.includes('ui_hero_skills_title'));

        // Close modal
        const closeBtn = overlay.querySelector('.btn-close-modal');
        assert.ok(closeBtn);
        closeBtn.dispatchEvent(new Event('click'));

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('HeroSkillsModal renders known and locked families', () => {
        const hero = {
            id: 'hero_1',
            name: 'Arthur',
            level: 3,
            activity: 'idle',
            skillPoints: 1,
            knownFamilies: ['single_strike', 'multiple_attack'],
            techniqueTiers: { single_strike: 2, multiple_attack: 1 },
            techniqueUses: { single_strike: 120, multiple_attack: 15 },
            bodyInscription: null
        };
        const tFunc = (k) => k;
        const emitted = [];
        const onLearn = (familyId) => emitted.push(familyId);

        try {
            HeroSkillsModal.show(hero, tFunc, onLearn);

            const overlay = document.body.querySelector('.modal-overlay');
            assert.ok(overlay);
            // Should show known families
            assert.ok(overlay.textContent.includes('family_single_strike'));
            assert.ok(overlay.textContent.includes('family_multiple_attack'));
            // Should show locked families
            assert.ok(overlay.textContent.includes('ui_locked_families'));
            // Should show learn button for locked families
            const learnBtn = overlay.querySelector('.btn-learn-family');
            assert.ok(learnBtn);
            learnBtn.dispatchEvent(new Event('click'));
            assert.strictEqual(emitted.length, 1);
        } finally {
            const overlay = document.body.querySelector('.modal-overlay');
            if (overlay) overlay.remove();
        }
    });

    await t.test('HeroInscriptionModal renders and updates circle', () => {
        const hero = {
            id: 'hero_1',
            name: 'Arthur',
            knownGlyphs: ['glyph_fire', 'glyph_potentiate'],
            glyphMastery: { glyph_fire: { tier: 1 } },
            bodyInscription: { glyphIds: ['glyph_fire'], glyphTiers: { glyph_fire: 1 } }
        };
        const tFunc = (k) => k;
        const emitted = [];
        const emit = (event, data) => emitted.push({ event, data });

        try {
            HeroInscriptionModal.show(hero, tFunc, emit);

            const overlay = document.body.querySelector('.modal-overlay');
            assert.ok(overlay);
            assert.ok(overlay.textContent.includes('body_inscription_desc'));

            // Check if known glyphs are listed
            assert.ok(overlay.textContent.includes('glyph_fire'));
        } finally {
            const overlay = document.body.querySelector('.modal-overlay');
            if (overlay) overlay.remove();
        }
    });

    await t.test('Training ground modals (Trainer, Witch, Academy, HallOfFame) render successfully', () => {
        const hero = {
            id: 'hero_1',
            name: 'Arthur',
            level: 5,
            lifetimeStats: { enemiesDefeated: 12 },
            titles: ['title_first_blood']
        };
        const tFunc = (k) => k;
        const mockI18n = { t: (k) => k };

        try {
            // 1. TrainerModal
            TrainerModal.show(hero, mockI18n, tFunc);
            let overlay = document.body.querySelector('.modal-overlay');
            assert.ok(overlay);
            assert.ok(overlay.textContent.includes('trainer_title'));
            overlay.remove();

            // 2. WitchModal
            WitchModal.show([hero], 'hero_1', mockI18n, tFunc, { village: { day: 5 } }, () => {});
            overlay = document.body.querySelector('.modal-overlay');
            assert.ok(overlay);
            assert.ok(overlay.textContent.includes('witch_title'));
            overlay.remove();

            // 3. AcademyModal
            AcademyModal.show(hero, [{ name: 'Fire Blast', glyphIds: ['glyph_fire'], mpCost: 5 }], tFunc);
            overlay = document.body.querySelector('.modal-overlay');
            assert.ok(overlay);
            assert.ok(overlay.textContent.includes('academy_title'));
            overlay.remove();

            // 4. HallOfFameModal
            HallOfFameModal.show(hero, tFunc);
            overlay = document.body.querySelector('.modal-overlay');
            assert.ok(overlay);
            assert.ok(overlay.textContent.includes('hall_of_fame_title'));
            overlay.remove();
        } finally {
            const overlay = document.body.querySelector('.modal-overlay');
            if (overlay) overlay.remove();
        }
    });
});
