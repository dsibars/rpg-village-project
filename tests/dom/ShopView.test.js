import './setup.js';
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ShopView } from '../../js/presentation/ui/shop/ShopView.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shopHtmlPath = path.resolve(__dirname, '../../pages/shop.html');
const shopHtml = fs.readFileSync(shopHtmlPath, 'utf8');

test('ShopView DOM Refactor', async (t) => {
    // Setup mock UI reference
    const mockUi = {
        t: (k) => k,
        switchView: () => {},
        forceUpdate: () => {}
    };

    // Helper to create mock state
    const createMockState = () => ({
        completedExpeditions: ['exp_tutorial_cave'],
        village: {
            gold: 500,
            maxStorage: 100,
            infrastructure: {
                blacksmith: 1
            }
        },
        inventory: {
            totalUsed: 20,
            consumables: {
                'item_tiny_hp_potion': 3
            },
            equipment: [
                { id: 'eq_iron_sword', type: 'weapon', material: 'iron', family: 'sword', level: 0 }
            ]
        },
        heroes: []
    });

    await t.test('mounts successfully and renders catalog items', () => {
        document.body.innerHTML = shopHtml;
        const rootNode = document.body.querySelector('.shop-view');
        
        const view = new ShopView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.update(state);

        // Verify that catalog exists and is populated
        const catalogContainer = document.body.querySelector('#shop-catalog-container');
        assert.ok(catalogContainer);
        
        // Minor potion should be in Consumables category
        const row = catalogContainer.querySelector('[data-id="item_tiny_hp_potion"]');
        assert.ok(row);
        assert.strictEqual(row.querySelector('.list-item-title').textContent, 'item_tiny_hp_potion');

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('switching tabs updates active class surgically', () => {
        document.body.innerHTML = shopHtml;
        const rootNode = document.body.querySelector('.shop-view');
        
        const view = new ShopView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.update(state);

        const buyTab = document.body.querySelector('.shop-tab[data-tab="buy"]');
        const sellTab = document.body.querySelector('.shop-tab[data-tab="sell"]');

        assert.ok(buyTab.classList.contains('active'));
        assert.ok(!sellTab.classList.contains('active'));

        // Simulate click sell tab
        sellTab.dispatchEvent(new Event('click'));
        view.currentTab = 'sell';
        view.update(state);

        assert.ok(!buyTab.classList.contains('active'));
        assert.ok(sellTab.classList.contains('active'));

        // Cleanup
        document.body.innerHTML = '';
    });

    await t.test('selecting item updates detail pane surgically', () => {
        document.body.innerHTML = shopHtml;
        const rootNode = document.body.querySelector('.shop-view');
        
        const view = new ShopView();
        view.mount(rootNode, mockUi);

        const state = createMockState();
        view.update(state);

        // Click first item row
        const row = document.body.querySelector('.shop-item-row');
        assert.ok(row);
        
        const itemId = row.getAttribute('data-id');
        view.selectedItemKey = itemId;
        view.update(state);

        // Check detail content is visible and showing correct item
        const detailPane = document.body.querySelector('#shop-detail-content');
        assert.ok(detailPane);
        
        const itemName = detailPane.querySelector('h2').textContent;
        assert.ok(itemName.includes(itemId.replace('_name', '')));

        // Cleanup
        document.body.innerHTML = '';
    });
});
