import './setup.js';
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { VillageView } from '../../js/presentation/ui/village/VillageView.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const villageHtmlPath = path.resolve(__dirname, '../../pages/village.html');
const villageHtml = fs.readFileSync(villageHtmlPath, 'utf8');

test('VillageView DOM Refactor', async (t) => {
    // Setup mock UI reference
    let emitted = [];
    const mockUi = {
        t: (k) => k,
        switchView: () => {},
        forceUpdate: () => {}
    };

    // Helper to create mock state
    const createMockState = () => ({
        village: {
            maxStorage: 200,
            infrastructure: {
                townhall: 2,
                housing: 1,
                farm: 2,
                warehouse: 1,
                blacksmith: 1,
                training_grounds: 0,
                explorer_guild: 0
            },
            population: {
                total: 5,
                roles: {
                    builder: 1,
                    farmer: 2,
                    miner: 1,
                    scout: 0
                }
            },
            constructionQueue: [
                { buildingId: 'training_grounds', targetLevel: 1, duration: 3, daysRemaining: 2 }
            ],
            lastDailyReport: {
                day: 5,
                consumed: 10,
                starvation: false,
                growth: 1,
                minerYield: { wood: 5, stone: 2 },
                completed: ['housing'],
                recovery: [{ heroName: 'Arthur', amount: 15 }],
                training: [{ heroName: 'Valen', leveledUp: true }],
                expedition: { expId: 'exp_tutorial_cave', status: 'completed', reward: { gold: 50 } },
                tavernRecruit: { name: 'Elara', origin: 'origin_arcane_initiate' },
                raid: { isVictory: true, defensePower: 30, raidPower: 20, goldReward: 25 }
            }
        },
        inventory: {
            totalUsed: 50
        },
        dailyObjectives: {
            objectives: [
                { id: 'obj1', label: 'Clear slimes', progress: 3, target: 5, completed: false }
            ],
            allCompleted: false
        },
        calendar: {
            season: 'spring',
            dayOfSeason: 12,
            day: 12,
            upcomingEvents: [
                { day: 14, type: 'raid' }
            ],
            defenseAssigned: ['hero_arthur']
        },
        heroes: [
            { id: 'hero_arthur', name: 'Arthur', activity: 'defense', hp: 80 },
            { id: 'hero_valen', name: 'Valen', activity: 'idle', hp: 90 }
        ]
    });

    await t.test('mounts successfully and renders initial state', () => {
        document.body.innerHTML = villageHtml;
        const rootNode = document.body.querySelector('#village-view');
        
        const view = new VillageView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.update(state);

        // Verify Town Hall level
        const thLvl = document.body.querySelector('#village-townhall-level');
        assert.strictEqual(thLvl.textContent, '2');

        // Verify storage text
        const storageText = document.body.querySelector('#village-storage-text');
        assert.strictEqual(storageText.textContent, '50 / 200');

        // Verify active building tile
        const farmTile = document.body.querySelector('.village-tile.active:nth-child(3)');
        assert.ok(farmTile);
        assert.ok(farmTile.querySelector('.village-tile-name').textContent.includes('village_info_building_farm'));

        // Verify construction project rendering
        const projectItem = document.body.querySelector('.construction-item');
        assert.ok(projectItem);
        assert.ok(projectItem.textContent.includes('training_grounds'));

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('worker allocation buttons emit setWorkerRole', () => {
        document.body.innerHTML = villageHtml;
        const rootNode = document.body.querySelector('#village-view');
        
        emitted = [];
        const view = new VillageView();
        view.mount(rootNode, mockUi);
        view.on('setWorkerRole', (data) => emitted.push({ event: 'setWorkerRole', data }));

        const state = createMockState();
        view.update(state);

        // Find + button for farmer
        const farmerIncBtn = document.body.querySelector('.btn-role[data-role="farmer"][data-role-action="inc"]');
        assert.ok(farmerIncBtn);
        assert.ok(!farmerIncBtn.disabled); // pool total = 5, assigned = 4, available = 1, so inc is enabled

        farmerIncBtn.dispatchEvent(new Event('click', { bubbles: true }));
        assert.strictEqual(emitted.length, 1);
        assert.strictEqual(emitted[0].event, 'setWorkerRole');
        assert.strictEqual(emitted[0].data.role, 'farmer');
        assert.strictEqual(emitted[0].data.delta, 1);

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('defense assignments button clicks emit actions', () => {
        document.body.innerHTML = villageHtml;
        const rootNode = document.body.querySelector('#village-view');
        
        emitted = [];
        const view = new VillageView();
        view.mount(rootNode, mockUi);
        view.on('assignDefense', (data) => emitted.push({ event: 'assignDefense', data }));
        view.on('unassignDefense', (data) => emitted.push({ event: 'unassignDefense', data }));

        const state = createMockState();
        view.update(state);

        // Find Arthur remove button
        const arthurRemoveBtn = document.body.querySelector('.remove-btn[data-hero-id="hero_arthur"]');
        assert.ok(arthurRemoveBtn);
        arthurRemoveBtn.dispatchEvent(new Event('click', { bubbles: true }));

        assert.strictEqual(emitted.length, 1);
        assert.strictEqual(emitted[0].event, 'unassignDefense');
        assert.strictEqual(emitted[0].data.heroId, 'hero_arthur');

        // Find Valen assign button (Valen is idle and hp > 0)
        const valenAssignBtn = document.body.querySelector('.assign-btn[data-hero-id="hero_valen"]');
        assert.ok(valenAssignBtn);
        valenAssignBtn.dispatchEvent(new Event('click', { bubbles: true }));

        assert.strictEqual(emitted.length, 2);
        assert.strictEqual(emitted[1].event, 'assignDefense');
        assert.strictEqual(emitted[1].data.heroId, 'hero_valen');

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('daily report modal handles show, close and recall', () => {
        document.body.innerHTML = villageHtml;
        const rootNode = document.body.querySelector('#village-view');
        
        const view = new VillageView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.update(state);

        // Modal container should be visible
        const container = document.body.querySelector('#daily-report-container');
        assert.strictEqual(container.style.display, 'flex');
        assert.ok(container.classList.contains('daily-report-overlay'));

        // Click close button on modal
        const closeBtn = container.querySelector('.btn-close-report');
        assert.ok(closeBtn);
        closeBtn.dispatchEvent(new Event('click', { bubbles: true }));

        // Update view with same state
        view.update(state);

        // Container should now be hidden
        assert.strictEqual(container.style.display, 'none');

        // Recall button should be visible
        const recallBtn = document.body.querySelector('#btn-recall-report');
        assert.strictEqual(recallBtn.style.display, 'inline-flex');

        // Click recall button
        recallBtn.dispatchEvent(new Event('click', { bubbles: true }));
        view.update(state);

        // Container should be visible again
        assert.strictEqual(container.style.display, 'flex');

        // Cleanup
        document.body.innerHTML = '';
    });
});
