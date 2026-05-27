import './setup.js';
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { InventoryView } from '../../js/presentation/ui/inventory/InventoryView.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(__dirname, '../../pages/inventory.html');
const html = fs.readFileSync(htmlPath, 'utf8');

test('InventoryView DOM Refactor', async (t) => {
    const mockUi = {
        t: (k) => k,
        switchView: () => {},
        forceUpdate: () => {}
    };

    const createMockState = () => ({
        inventory: {
            totalUsed: 10,
            materials: {
                material_wood: 5,
                material_stone: 2
            },
            food: {
                food_raw_grain: 3
            },
            consumables: {
                item_tiny_hp_potion: 2
            },
            equipment: [
                { id: 'eq_iron_sword', type: 'weapon', material: 'iron', family: 'sword', level: 0, slot: 'leftHand' }
            ]
        },
        village: {
            maxStorage: 100
        }
    });

    await t.test('mounts successfully and renders grid items', () => {
        document.body.innerHTML = html;
        const rootNode = document.body.querySelector('#inventory-view');
        
        const view = new InventoryView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.update(state);

        const itemsContainer = document.body.querySelector('#inventory-items-container');
        assert.ok(itemsContainer);

        // Should have wood, stone, grain, potion, sword = 5 items
        const cards = itemsContainer.querySelectorAll('.inventory-item-card');
        assert.strictEqual(cards.length, 5);

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('filtering items updates grid', () => {
        document.body.innerHTML = html;
        const rootNode = document.body.querySelector('#inventory-view');
        
        const view = new InventoryView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.update(state);

        // Click materials filter
        const matFilter = document.body.querySelector('.filter-btn[data-filter="materials"]');
        assert.ok(matFilter);
        matFilter.dispatchEvent(new Event('click', { bubbles: true }));

        const itemsContainer = document.body.querySelector('#inventory-items-container');
        const cards = itemsContainer.querySelectorAll('.inventory-item-card');
        assert.strictEqual(cards.length, 2); // wood and stone

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('selecting item updates detail pane', () => {
        document.body.innerHTML = html;
        const rootNode = document.body.querySelector('#inventory-view');
        
        const view = new InventoryView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.update(state);

        // Click first item
        const card = document.body.querySelector('.inventory-item-card');
        assert.ok(card);
        const itemId = card.getAttribute('data-id');
        card.dispatchEvent(new Event('click'));

        const detailPane = document.body.querySelector('#inventory-detail-content');
        assert.ok(detailPane);

        // Content should be visible
        const content = detailPane.querySelector('.item-inspector');
        assert.ok(content);

        // Cleanup
        document.body.innerHTML = '';
    });
});
