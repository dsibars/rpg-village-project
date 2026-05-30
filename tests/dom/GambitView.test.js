import './setup.js';
import test from 'node:test';
import assert from 'node:assert';
import { GambitView } from '../../js/presentation/ui/gambit/GambitView.js';

test('GambitView DOM Refactor', async (t) => {
    const mockUi = {
        t: (k) => k,
        engine: {
            getCompatibleTargets: () => ['weakest_enemy', 'strongest_enemy'],
            buildGambit: () => ({
                id: 'gambit_test',
                conditions: [{ op: 'SINGLE', left: { type: 'always', value: true } }],
                action: { type: 'skill', payload: 'single_strike' },
                target: 'weakest_enemy',
                enabled: true
            })
        }
    };

    // Helper to create mock hero state
    const createMockHero = () => ({
        id: 'hero_1',
        name: 'Arthur',
        gambits: [
            {
                id: 'gambit_1',
                conditions: [{ op: 'SINGLE', left: { type: 'always', value: true } }],
                action: { type: 'skill', payload: 'single_strike' },
                target: 'weakest_enemy',
                enabled: true
            },
            {
                id: 'gambit_2',
                conditions: [{ op: 'SINGLE', left: { type: 'self_hp', operator: '<', value: 0.5 } }],
                action: { type: 'spell', payload: 'Heal' },
                target: 'self',
                enabled: false
            }
        ],
        fallbackAction: 'single_strike',
        knownFamilies: ['single_strike'],
        spellCodex: [{ name: 'Heal', targetType: 'single_ally' }]
    });

    const translations = {
        'ui_win_rate': 'Win Rate',
        'gambit_health_score': 'Health Score',
        'ui_avg_hp': 'Avg HP',
        'ui_avg_mp': 'Avg MP',
        'gambit_test_mode_title': 'Gambit Simulation Results',
        'ui_btn_close': 'Close'
    };

    const mockTranslate = (key) => {
        if (translations[key]) return translations[key];
        if (key.startsWith('family_')) return key.replace('family_', '');
        if (key.startsWith('gambit_target_')) return key.replace('gambit_target_', '');
        return key;
    };

    await t.test('formatGambitRule() returns static element representing the rule', () => {
        const rule = {
            conditions: [{ op: 'SINGLE', left: { type: 'self_hp', operator: '<', value: 0.5 } }],
            action: { type: 'spell', payload: 'Heal' },
            target: 'self'
        };
        const element = GambitView.formatGambitRule(rule, mockTranslate);
        assert.ok(element instanceof global.HTMLElement);
        assert.strictEqual(element.textContent.replace(/\s+/g, ' '), 'self_hp < 0.5 → Heal ON self');
    });

    await t.test('open() renders initial view and lists gambits surgically', () => {
        const view = new GambitView({ ui: mockUi });
        const hero = createMockHero();
        const emitted = [];
        const emit = (name, data) => emitted.push({ name, data });

        try {
            view.open({
                hero,
                inventoryEquipment: {},
                t: mockTranslate,
                emit
            });

            assert.ok(view.overlay);
            assert.ok(document.body.contains(view.overlay));

            // Check header title contains hero name
            const title = view.overlay.querySelector('h2');
            assert.ok(title.textContent.includes('Arthur'));

            // Check gambit list container has 12 rows (2 active, 10 empty)
            const listContainer = view.overlay.querySelector('.gambit-list-container');
            assert.ok(listContainer);
            assert.strictEqual(listContainer.children.length, 12); // exactly 12 slots now that fallback is outside

            // Verify fallback row exists
            const fallbackRow = view.overlay.querySelector('.fallback-row');
            assert.ok(fallbackRow);

            const activeRows = listContainer.querySelectorAll('.gambit-row-v1:not(.empty-slot)');
            assert.strictEqual(activeRows.length, 2);

            // First active row checks
            assert.strictEqual(activeRows[0].getAttribute('data-id'), 'gambit_1');
            assert.ok(!activeRows[0].classList.contains('gambit-disabled'));
            const toggleBtn1 = activeRows[0].querySelector('.btn-toggle-gambit');
            assert.strictEqual(toggleBtn1.textContent, 'Disable');

            // Second active row checks (disabled state)
            assert.strictEqual(activeRows[1].getAttribute('data-id'), 'gambit_2');
            assert.ok(activeRows[1].classList.contains('gambit-disabled'));
            const toggleBtn2 = activeRows[1].querySelector('.btn-toggle-gambit');
            assert.strictEqual(toggleBtn2.textContent, 'Enable');
        } finally {
            if (view.overlay) {
                view.overlay.remove();
                view.overlay = null;
            }
        }
    });

    await t.test('clicks and interactions trigger emit events', () => {
        const view = new GambitView({ ui: mockUi });
        const hero = createMockHero();
        const emitted = [];
        const emit = (name, data) => emitted.push({ name, data });

        try {
            view.open({
                hero,
                inventoryEquipment: {},
                t: mockTranslate,
                emit
            });

            // Click Disable on first row
            const listContainer = view.overlay.querySelector('.gambit-list-container');
            const activeRows = listContainer.querySelectorAll('.gambit-row-v1:not(.empty-slot)');
            const toggleBtn = activeRows[0].querySelector('.btn-toggle-gambit');
            toggleBtn.click();
            assert.strictEqual(emitted.length, 1);
            assert.strictEqual(emitted[0].name, 'toggleGambit');
            assert.strictEqual(emitted[0].data.gambitId, 'gambit_1');

            // Click Remove on second row
            const removeBtn = activeRows[1].querySelector('.btn-remove-gambit');
            removeBtn.click();
            assert.strictEqual(emitted.length, 2);
            assert.strictEqual(emitted[1].name, 'removeGambit');
            assert.strictEqual(emitted[1].data.gambitId, 'gambit_2');

            // Click Move Down on first row
            const moveDownBtn = activeRows[0].querySelector('.btn-move-gambit[data-dir="1"]');
            moveDownBtn.click();
            assert.strictEqual(emitted.length, 3);
            assert.strictEqual(emitted[2].name, 'moveGambit');
            assert.strictEqual(emitted[2].data.direction, 1);
        } finally {
            if (view.overlay) {
                view.overlay.remove();
                view.overlay = null;
            }
        }
    });

    await t.test('filterTargets compatibility selection restricts invalid options', () => {
        const view = new GambitView({ ui: mockUi });
        const hero = createMockHero();
        const emitted = [];
        const emit = (name, data) => emitted.push({ name, data });

        try {
            view.open({
                hero,
                inventoryEquipment: {},
                t: mockTranslate,
                emit
            });

            const actionSelect = view.overlay.querySelector('#new-gambit-action');
            const targetSelect = view.overlay.querySelector('#new-gambit-target');

            assert.ok(actionSelect, 'actionSelect should exist');
            assert.ok(targetSelect, 'targetSelect should exist');

            // Change select action to single strike technique (data-target-type = single_enemy)
            actionSelect.value = 'tech:single_strike';
            actionSelect.dispatchEvent(new Event('change'));

            // Target self should be hidden/disabled
            const selfOpt = Array.from(targetSelect.options).find(opt => opt.value === 'self');
            assert.ok(selfOpt.disabled);

            // Weakest enemy should be enabled
            const weakestEnemyOpt = Array.from(targetSelect.options).find(opt => opt.value === 'weakest_enemy');
            assert.ok(!weakestEnemyOpt.disabled);
        } finally {
            if (view.overlay) {
                view.overlay.remove();
                view.overlay = null;
            }
        }
    });

    await t.test('showTestResults static method constructs modal and closes it', () => {
        const mockResult = {
            victories: 80,
            runs: 100,
            avgHpRemaining: 65,
            avgMpRemaining: 30,
            log: [
                '--- Battle Simulation Run #1 ---',
                'Arthur matching [Rule 1]: always -> single_strike',
                'Arthur deals 15 damage'
            ]
        };

        try {
            // Call showTestResults static method
            GambitView.showTestResults(mockResult, 8.5, 'ironclad', mockTranslate);

            const overlay = document.querySelector('.modal-overlay');
            assert.ok(overlay, 'modal overlay should exist');

            // Verify content details are rendered
            assert.ok(overlay.querySelector('.health-score-circle.ironclad'));
            assert.strictEqual(overlay.querySelector('.health-score-circle').textContent, '8.5');
            assert.ok(overlay.textContent.includes('Win Rate: 80%'));

            // Click close
            const closeBtn = overlay.querySelector('#btn-close-test');
            closeBtn.click();

            // Wait for removal animation timeout
            setTimeout(() => {
                assert.ok(!document.body.contains(overlay));
            }, 350);
        } finally {
            const overlay = document.querySelector('.modal-overlay');
            if (overlay) overlay.remove();
        }
    });
});
