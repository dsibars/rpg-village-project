import './setup.js';
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ForgeView } from '../../js/presentation/ui/forge/ForgeView.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, '../../pages/forge.html');
const html = fs.readFileSync(htmlPath, 'utf8');

test('ForgeView DOM Refactor', async (t) => {
    const mockUi = {
        t: (k) => k,
        switchView: () => {},
        forceUpdate: () => {}
    };

    const createMockState = () => ({
        village: {
            gold: 500,
            infrastructure: {
                blacksmith: 1
            }
        },
        inventory: {
            equipment: [
                { id: 'eq_iron_sword', type: 'weapon', material: 'iron', family: 'sword', level: 0, slot: 'leftHand' }
            ]
        },
        heroes: []
    });

    await t.test('mounts successfully and renders equipment list', () => {
        document.body.innerHTML = html;
        const rootNode = document.body.querySelector('.forge-view');
        
        const view = new ForgeView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.update(state);

        const itemsList = document.body.querySelector('#forge-items-list');
        assert.ok(itemsList);

        const rows = itemsList.querySelectorAll('.forge-item-row');
        assert.strictEqual(rows.length, 1);

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('selecting item updates detail pane', () => {
        document.body.innerHTML = html;
        const rootNode = document.body.querySelector('.forge-view');
        
        const view = new ForgeView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.update(state);

        const row = document.body.querySelector('.forge-item-row');
        assert.ok(row);
        row.dispatchEvent(new Event('click', { bubbles: true }));

        const detailPane = document.body.querySelector('#forge-detail-content');
        assert.ok(detailPane);

        const content = detailPane.querySelector('.forge-upgrade-header');
        assert.ok(content);

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('forge button emits refineItem event', () => {
        document.body.innerHTML = html;
        const rootNode = document.body.querySelector('.forge-view');
        
        const view = new ForgeView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.selectedItemId = 'eq_iron_sword';
        view.update(state);

        const emitted = [];
        view.on('refineItem', (data) => emitted.push(data));

        const btn = document.body.querySelector('#forge-detail-content button');
        assert.ok(btn);
        btn.dispatchEvent(new Event('click', { bubbles: true }));

        assert.strictEqual(emitted.length, 1);
        assert.strictEqual(emitted[0].itemId, 'eq_iron_sword');

        // Cleanup
        document.body.innerHTML = '';
    });
});
