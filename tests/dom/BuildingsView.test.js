import './setup.js';
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BuildingsView } from '../../js/presentation/ui/buildings/BuildingsView.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, '../../pages/buildings.html');
const html = fs.readFileSync(htmlPath, 'utf8');

test('BuildingsView DOM Refactor', async (t) => {
    const mockUi = {
        t: (k) => k,
        switchView: () => {}
    };

    const createMockState = () => ({
        village: {
            gold: 500,
            infrastructure: {
                farm: 1,
                housing: 1,
                warehouse: 1,
                blacksmith: 0
            },
            constructionQueue: []
        },
        inventory: {
            materials: {
                material_wood: 50,
                material_stone: 20
            }
        }
    });

    await t.test('mounts successfully and renders building list', () => {
        document.body.innerHTML = html;
        const rootNode = document.body.querySelector('#buildings-view');
        
        const view = new BuildingsView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.update(state);

        const listContainer = document.body.querySelector('#buildings-list-container');
        assert.ok(listContainer);

        const cards = listContainer.querySelectorAll('.building-card');
        assert.strictEqual(cards.length, 4);

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('selecting building updates detail pane', () => {
        document.body.innerHTML = html;
        const rootNode = document.body.querySelector('#buildings-view');
        
        const view = new BuildingsView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.update(state);

        // Select farm
        const farmCard = document.body.querySelector('.building-card[data-id="farm"]');
        assert.ok(farmCard);
        farmCard.dispatchEvent(new Event('click', { bubbles: true }));

        // Selection change is picked up by next update
        view.update(state);

        const detailPane = document.body.querySelector('#building-detail-content');
        assert.ok(detailPane);

        const content = detailPane.querySelector('.building-profile');
        assert.ok(content);
        assert.ok(content.textContent.includes('farm'));

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('upgrade button emits startProject event', () => {
        document.body.innerHTML = html;
        const rootNode = document.body.querySelector('#buildings-view');
        
        const view = new BuildingsView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.selectedBuildingId = 'farm';
        view.update(state);

        const emitted = [];
        view.on('startProject', (data) => emitted.push(data));

        const btn = document.body.querySelector('.upgrade-btn');
        assert.ok(btn);
        btn.dispatchEvent(new Event('click', { bubbles: true }));

        assert.strictEqual(emitted.length, 1);
        assert.strictEqual(emitted[0].buildingId, 'farm');

        // Cleanup
        document.body.innerHTML = '';
    });
});
