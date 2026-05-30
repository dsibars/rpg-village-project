import './setup.js';
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ExploreView } from '../../js/presentation/ui/explore/ExploreView.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, '../../pages/explore.html');
const html = fs.readFileSync(htmlPath, 'utf8');

test('ExploreView DOM Refactor', async (t) => {
    const mockUi = {
        t: (k) => k,
        switchView: () => {},
        update: () => {},
        showConfirmDialog: ({ onConfirm }) => onConfirm && onConfirm()
    };

    const createMockState = () => ({
        expeditionRegions: {
            region_forest: {
                unlocked: true,
                clears: 0,
                availableNodes: [
                    {
                        id: 'exp_forest_1',
                        regionId: 'region_forest',
                        name: 'Forest Ruins',
                        stages: [{ enemyLevel: 1, enemies: ['goblin'] }],
                        reward: { gold: 50 },
                        isStory: false,
                        status: 'available'
                    }
                ]
            }
        },
        expeditions: [
            {
                id: 'exp_forest_1',
                regionId: 'region_forest',
                name: 'Forest Ruins',
                stages: [{ enemyLevel: 1, enemies: ['goblin'] }],
                reward: { gold: 50 },
                isStory: false
            }
        ],
        activeExpeditions: [],
        maxConcurrentExpeditions: 2,
        heroes: [
            {
                id: 'hero_1',
                name: 'Arthur',
                level: 3,
                hp: 120,
                maxHp: 120,
                activity: 'idle'
            }
        ]
    });

    await t.test('mounts successfully and renders region list', () => {
        document.body.innerHTML = html;
        const rootNode = document.body.querySelector('#explore-view');
        
        const view = new ExploreView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.update(state);

        const listContainer = document.body.querySelector('#regions-list-container');
        assert.ok(listContainer);

        const regionItems = listContainer.querySelectorAll('.region-list-item');
        assert.strictEqual(regionItems.length, 1);

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('selecting region and expedition updates detail pane', () => {
        document.body.innerHTML = html;
        const rootNode = document.body.querySelector('#explore-view');
        
        const view = new ExploreView();
        view.mount(rootNode, mockUi);
        view.setViewMode('list');

        const state = createMockState();
        view.update(state);

        // Select region first
        const regionItem = document.body.querySelector('.region-list-item');
        assert.ok(regionItem);
        regionItem.dispatchEvent(new Event('click', { bubbles: true }));
        view.update(state);

        // Now expedition cards should be in detail content
        const detailContent = document.body.querySelector('#expedition-detail-content');
        assert.ok(detailContent);

        const card = detailContent.querySelector('.expedition-card');
        assert.ok(card);
        card.dispatchEvent(new Event('click', { bubbles: true }));
        view.update(state);

        const profile = detailContent.querySelector('.expedition-profile');
        assert.ok(profile);

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('start button emits checkDefenseAdvisory', () => {
        document.body.innerHTML = html;
        const rootNode = document.body.querySelector('#explore-view');
        
        const view = new ExploreView();
        view.mount(rootNode, mockUi);
        view.setViewMode('list');

        const state = createMockState();
        view.update(state);

        // Select region
        const regionItem = document.body.querySelector('.region-list-item');
        regionItem.dispatchEvent(new Event('click', { bubbles: true }));
        view.update(state);

        // Select expedition
        const card = document.body.querySelector('.expedition-card');
        card.dispatchEvent(new Event('click', { bubbles: true }));
        view.update(state);

        // Toggle hero checkbox
        const checkbox = document.body.querySelector('.exp-hero-check');
        assert.ok(checkbox);
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));

        const emitted = [];
        view.on('checkDefenseAdvisory', (data) => emitted.push(data));

        const startBtn = document.body.querySelector('.btn-start-exp');
        assert.ok(startBtn);
        startBtn.dispatchEvent(new Event('click', { bubbles: true }));

        assert.strictEqual(emitted.length, 1);
        assert.strictEqual(emitted[0].expId, 'exp_forest_1');
        assert.deepStrictEqual(emitted[0].heroIds, ['hero_1']);

        // Cleanup
        document.body.innerHTML = '';
    });
});
