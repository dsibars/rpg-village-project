import './setup.js';
import test from 'node:test';
import assert from 'node:assert';
import { CombatView } from '../../js/presentation/ui/combat/CombatView.js';

test('CombatView DOM Integration Tests', async (t) => {
    const mockI18n = {
        t: (k) => k
    };

    const mockAdapter = {
        forceUpdate: () => {}
    };

    const createMockBattle = () => ({
        isOver: false,
        autoBattle: false,
        winner: null,
        currentTurnIndex: 0,
        turnOrder: [
            { id: 'hero_arthur', name: 'Arthur', type: 'Hero' },
            { id: 'enemy_slime', name: 'Slime', type: 'Enemy' }
        ],
        heroes: [
            { id: 'hero_arthur', name: 'Arthur', hp: 80, maxHp: 100, mp: 20, maxMp: 50, level: 3, stamina: 10, maxStamina: 20, statusEffects: [{ type: 'haste', duration: 2 }] }
        ],
        enemies: [
            { id: 'enemy_slime', name: 'Slime', hp: 40, maxHp: 50, level: 1, statusEffects: [] }
        ],
        log: [
            { type: 'DAMAGE', actorName: 'Arthur', targetName: 'Slime', amount: 10, actorIsHero: true, targetHp: 40, targetMaxHp: 50 }
        ]
    });

    await t.test('opens overlay and renders hero and enemy cards', () => {
        const view = new CombatView({ i18n: mockI18n });
        view.adapter = mockAdapter;

        const battle = createMockBattle();
        const state = { activeBattle: battle };

        view.update(state);

        // Verify overlay exists
        const overlay = document.body.querySelector('#combat-overlay');
        assert.ok(overlay);

        // Verify Hero Card renders
        const heroName = overlay.querySelector('[data-hero-id="hero_arthur"] .combat-card-name');
        assert.strictEqual(heroName.textContent, 'Arthur');

        // Verify Enemy Card renders
        const enemyName = overlay.querySelector('[data-enemy-index="0"] .combat-card-name');
        assert.strictEqual(enemyName.textContent, 'Slime');

        // Clean up overlay
        overlay.remove();
    });

    await t.test('auto battle and skip buttons trigger engine actions', () => {
        let autoToggled = false;
        let skipped = false;

        const view = new CombatView({ i18n: mockI18n });
        view.adapter = mockAdapter;
        view.engine = {
            toggleAutoBattle: () => { autoToggled = true; },
            skipBattle: () => { skipped = true; },
            canAffordSkill: () => true,
            getSkillCost: () => ({ staCost: 5, mpCost: 0 }),
            getSkillTargetType: () => 'single_enemy',
            canCastSpell: () => true
        };

        const battle = createMockBattle();
        const state = { activeBattle: battle };

        view.update(state);

        const overlay = document.body.querySelector('#combat-overlay');
        assert.ok(overlay);

        // Click auto button
        const autoBtn = overlay.querySelector('.combat-header-controls button:nth-child(1)');
        assert.ok(autoBtn);
        autoBtn.dispatchEvent(new Event('click', { bubbles: true }));
        assert.ok(autoToggled);

        // Click skip button
        const skipBtn = overlay.querySelector('.combat-header-controls button:nth-child(2)');
        assert.ok(skipBtn);
        skipBtn.dispatchEvent(new Event('click', { bubbles: true }));
        assert.ok(skipped);

        // Clean up
        overlay.remove();
    });

    await t.test('targeting mode toggles targetable class and executes engine actions', () => {
        let executedAction = null;
        let executedIndex = null;

        const view = new CombatView({ i18n: mockI18n });
        view.adapter = mockAdapter;
        view.engine = {
            executeBattleAction: (actionId, targetIndex) => {
                executedAction = actionId;
                executedIndex = targetIndex;
                return { success: true };
            },
            canAffordSkill: () => true,
            getSkillCost: () => ({ staCost: 5, mpCost: 0 }),
            getSkillTargetType: () => 'single_enemy',
            canCastSpell: () => true
        };

        const battle = createMockBattle();
        const state = { activeBattle: battle };

        view.update(state);

        const overlay = document.body.querySelector('#combat-overlay');
        
        // Go to attack targeting
        const attackBtn = overlay.querySelector('#btn-action-attack');
        assert.ok(attackBtn);
        attackBtn.dispatchEvent(new Event('click', { bubbles: true }));

        // Refresh DOM updates triggered by state change
        view.update(state);

        // Verify Enemy Card gets "targetable" class
        const enemyCard = overlay.querySelector('[data-enemy-index="0"]');
        assert.ok(enemyCard.classList.contains('targetable'));

        // Click on the targetable enemy card
        enemyCard.dispatchEvent(new Event('click', { bubbles: true }));

        assert.strictEqual(executedAction, 'single_strike');
        assert.strictEqual(executedIndex, 0);

        // Clean up
        overlay.remove();
    });

    await t.test('skill selection, tier selection, and targeting works through delegated click events', () => {
        let executedAction = null;
        let executedIndex = null;
        let executedTier = null;

        const view = new CombatView({ i18n: mockI18n });
        view.adapter = mockAdapter;
        view.engine = {
            executeBattleAction: (actionId, targetIndex, tier) => {
                executedAction = actionId;
                executedIndex = targetIndex;
                executedTier = tier;
                return { success: true };
            },
            canAffordSkill: () => true,
            getSkillCost: () => ({ staCost: 5, mpCost: 0 }),
            getSkillTargetType: () => 'single_enemy',
            canCastSpell: () => true
        };

        const battle = createMockBattle();
        battle.heroes[0].knownFamilies = ['single_strike', 'power_strike'];
        battle.heroes[0].techniqueTiers = { power_strike: 2 };
        battle.heroes[0].stamina = 20;

        const state = { activeBattle: battle };

        view.update(state);

        const overlay = document.body.querySelector('#combat-overlay');
        try {
            // Go to skills menu
            const skillsBtn = overlay.querySelector('#btn-action-skills');
            assert.ok(skillsBtn);
            skillsBtn.dispatchEvent(new Event('click', { bubbles: true }));

            // Refresh UI
            view.update(state);

            // Click on the skill button in the skills list
            const skillBtn = overlay.querySelector('[data-family-id="power_strike"]');
            assert.ok(skillBtn, 'Skill button with data-family-id="power_strike" should exist');
            skillBtn.dispatchEvent(new Event('click', { bubbles: true }));

            // Refresh UI
            view.update(state);

            // Click on the tier button in the tiers list
            const tierBtn = overlay.querySelector('[data-tier="2"]');
            assert.ok(tierBtn, 'Tier button with data-tier="2" should exist');
            tierBtn.dispatchEvent(new Event('click', { bubbles: true }));

            // Refresh UI
            view.update(state);

            // Verify Enemy Card gets "targetable" class
            const enemyCard = overlay.querySelector('[data-enemy-index="0"]');
            assert.ok(enemyCard.classList.contains('targetable'));

            // Click on the targetable enemy card
            enemyCard.dispatchEvent(new Event('click', { bubbles: true }));

            assert.strictEqual(executedAction, 'power_strike');
            assert.strictEqual(executedIndex, 0);
            assert.strictEqual(executedTier, 2);
        } finally {
            // Clean up
            overlay.remove();
        }
    });

    await t.test('victory/defeat resolution shows summary and handles closing', (t, done) => {
        let resolved = false;

        const view = new CombatView({ i18n: mockI18n });
        view.adapter = mockAdapter;
        view.engine = {
            getBattleResolutionPreview: () => ({
                isVictory: true,
                isLastStage: true,
                summary: [
                    { heroName: 'Arthur', hpLost: 20, expEarned: 15, leveledUp: false }
                ],
                rewards: {
                    gold: 30,
                    items: { item_wood: 5 }
                }
            }),
            resolveBattle: () => {
                resolved = true;
            },
            canAffordSkill: () => true,
            getSkillCost: () => ({ staCost: 5, mpCost: 0 }),
            getSkillTargetType: () => 'single_enemy',
            canCastSpell: () => true
        };

        const battle = createMockBattle();
        battle.isOver = true;
        battle.winner = 'heroes';
        const state = { activeBattle: battle };

        view.update(state);

        const overlay = document.body.querySelector('#combat-overlay');
        assert.ok(overlay);

        // Verify result text
        const title = overlay.querySelector('#combat-control-panel h3');
        assert.strictEqual(title.textContent, 'shared_uxelm_victory');

        // Click close
        const closeBtn = overlay.querySelector('#btn-resolve-battle');
        assert.ok(closeBtn);
        closeBtn.dispatchEvent(new Event('click', { bubbles: true }));

        assert.ok(resolved);

        // Clean up with timeout matching transition delay
        setTimeout(() => {
            const overlayAfter = document.body.querySelector('#combat-overlay');
            assert.strictEqual(overlayAfter, null);
            done();
        }, 350);
    });

    await t.test('hero stat bars update when HP changes', () => {
        const view = new CombatView({ i18n: mockI18n });
        view.adapter = mockAdapter;

        const battle = createMockBattle();
        const state = { activeBattle: battle };

        view.update(state);

        const overlay = document.body.querySelector('#combat-overlay');
        const heroCard = overlay.querySelector('[data-hero-id="hero_arthur"]');

        // Initial HP
        const hpText = heroCard.querySelector('.combat-bar-text');
        assert.ok(hpText.textContent.includes('80/100'));
        const hpBar = heroCard.querySelector('.combat-bar-hp');
        assert.strictEqual(hpBar.style.width, '80%');

        // Update HP
        battle.heroes[0].hp = 60;
        view.update(state);

        assert.ok(hpText.textContent.includes('60/100'));
        assert.strictEqual(hpBar.style.width, '60%');

        overlay.remove();
    });

    await t.test('combat log appends entries', () => {
        const view = new CombatView({ i18n: mockI18n });
        view.adapter = mockAdapter;

        const battle = createMockBattle();
        const state = { activeBattle: battle };

        view.update(state);

        const overlay = document.body.querySelector('#combat-overlay');
        const logConsole = overlay.querySelector('#combat-log-console');

        // Initial log has 1 entry
        assert.strictEqual(logConsole.children.length, 1);

        // Add new entries
        battle.log.push({ type: 'DAMAGE', actorName: 'Slime', targetName: 'Arthur', amount: 5, actorIsHero: false, targetHp: 75, targetMaxHp: 100 });
        battle.log.push({ type: 'HEAL', actorName: 'Arthur', targetName: 'Arthur', amount: 10 });
        view.update(state);

        assert.strictEqual(logConsole.children.length, 3);

        // Verify cap at 100 entries
        for (let i = 0; i < 105; i++) {
            battle.log.push({ type: 'DAMAGE', actorName: 'Slime', targetName: 'Arthur', amount: 1, actorIsHero: false });
        }
        view.update(state);
        assert.strictEqual(logConsole.children.length, 100);

        overlay.remove();
    });

    await t.test('combat log expands and collapses on click events', () => {
        const view = new CombatView({ i18n: mockI18n });
        view.adapter = mockAdapter;

        const battle = createMockBattle();
        const state = { activeBattle: battle };

        view.update(state);

        const overlay = document.body.querySelector('#combat-overlay');
        const logSection = overlay.querySelector('.combat-log-section');
        const expandBtn = overlay.querySelector('.btn-log-toggle');
        const closeBtn = overlay.querySelector('.btn-log-close');

        // Assert initially collapsed
        assert.ok(!logSection.classList.contains('expanded'));

        // Click section to expand
        logSection.dispatchEvent(new Event('click', { bubbles: true }));
        assert.ok(logSection.classList.contains('expanded'));

        // Clicking section again when expanded should not collapse it
        logSection.dispatchEvent(new Event('click', { bubbles: true }));
        assert.ok(logSection.classList.contains('expanded'));

        // Click close to collapse
        closeBtn.dispatchEvent(new Event('click', { bubbles: true }));
        assert.ok(!logSection.classList.contains('expanded'));

        // Click expand button to expand
        expandBtn.dispatchEvent(new Event('click', { bubbles: true }));
        assert.ok(logSection.classList.contains('expanded'));

        overlay.remove();
    });

    await t.test('control panel buttons show/hide correctly based on battle state', () => {
        const view = new CombatView({ i18n: mockI18n });
        view.adapter = mockAdapter;

        const battle = createMockBattle();
        const state = { activeBattle: battle };

        view.update(state);

        const overlay = document.body.querySelector('#combat-overlay');
        const controlPanel = overlay.querySelector('#combat-control-panel');

        // Hero turn, main menu visible
        const mainScreen = controlPanel.querySelector('.screen-main');
        const messageScreen = controlPanel.querySelector('.screen-message');
        const battleEndScreen = controlPanel.querySelector('.screen-battle-end');

        assert.strictEqual(mainScreen.style.display, '');
        assert.strictEqual(messageScreen.style.display, 'none');
        assert.strictEqual(battleEndScreen.style.display, 'none');

        // Auto battle → message screen
        battle.autoBattle = true;
        view.update(state);

        assert.strictEqual(mainScreen.style.display, 'none');
        assert.strictEqual(messageScreen.style.display, '');
        assert.strictEqual(messageScreen.textContent, 'shared_uxelm_auto_combat_running');

        // Battle over → battle end screen
        battle.isOver = true;
        battle.winner = 'heroes';
        view.update(state);

        assert.strictEqual(mainScreen.style.display, 'none');
        assert.strictEqual(messageScreen.style.display, 'none');
        assert.strictEqual(battleEndScreen.style.display, '');

        overlay.remove();
    });
});
