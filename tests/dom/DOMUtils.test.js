import './setup.js';
import test from 'node:test';
import assert from 'node:assert';
import { el, diffList } from '../../js/presentation/ui/shared/utils/DOMUtils.js';

test('DOMUtils', async (t) => {
    await t.test('el() creates standard elements with classes and text', () => {
        const node = el('div', { className: 'hero-card', dataId: '123' }, 'Arthur');
        assert.strictEqual(node.tagName, 'DIV');
        assert.strictEqual(node.className, 'hero-card');
        assert.strictEqual(node.getAttribute('data-id'), '123');
        assert.strictEqual(node.textContent, 'Arthur');
    });

    await t.test('el() handles conditional classes', () => {
        const isPrimary = true;
        const isHidden = false;
        const node = el('button', { 
            class: ['btn', isPrimary ? 'btn-primary' : '', isHidden ? 'hidden' : ''] 
        });
        assert.strictEqual(node.className, 'btn btn-primary');

        const nodeObj = el('button', {
            class: { 'btn': true, 'btn-primary': isPrimary, 'hidden': isHidden }
        });
        assert.strictEqual(nodeObj.className, 'btn btn-primary');
    });

    await t.test('el() handles event listeners', () => {
        let clicked = false;
        const node = el('button', { onClick: () => clicked = true });
        node.dispatchEvent(new Event('click'));
        assert.strictEqual(clicked, true);
    });

    await t.test('el() handles boolean attributes and styles', () => {
        const node = el('input', { 
            disabled: true, 
            style: { marginTop: '10px', color: 'red' } 
        });
        assert.strictEqual(node.disabled, true);
        assert.strictEqual(node.hasAttribute('disabled'), true);
        assert.strictEqual(node.style.marginTop, '10px');
        assert.strictEqual(node.style.color, 'red');
    });

    await t.test('el() handles refs', () => {
        let refNode = null;
        const node = el('div', { ref: (n) => refNode = n });
        assert.strictEqual(node, refNode);
    });

    await t.test('diffList() appends new items', () => {
        const container = el('ul');
        diffList(container, [
            el('li', { dataId: '1' }, 'One'),
            el('li', { dataId: '2' }, 'Two')
        ]);
        assert.strictEqual(container.children.length, 2);
        assert.strictEqual(container.children[0].textContent, 'One');
    });

    await t.test('diffList() handles reordering and removals', () => {
        const container = el('ul', {}, [
            el('li', { dataId: '1' }, 'One'),
            el('li', { dataId: '2' }, 'Two'),
            el('li', { dataId: '3' }, 'Three')
        ]);
        const originalTwo = container.children[1];

        // New list: [Two, Four, One] (Three removed, Two moved to front)
        diffList(container, [
            el('li', { dataId: '2' }, 'Two'),
            el('li', { dataId: '4' }, 'Four'),
            el('li', { dataId: '1' }, 'One')
        ]);

        assert.strictEqual(container.children.length, 3);
        assert.strictEqual(container.children[0].getAttribute('data-id'), '2');
        assert.strictEqual(container.children[0], originalTwo); // Node preserved
        assert.strictEqual(container.children[1].getAttribute('data-id'), '4');
        assert.strictEqual(container.children[2].getAttribute('data-id'), '1');
    });

    await t.test('diffList() replaces changed nodes', () => {
        const container = el('ul', {}, [
            el('li', { dataId: '1' }, 'One')
        ]);
        const originalOne = container.children[0];

        // Same ID, different content
        diffList(container, [
            el('li', { dataId: '1' }, 'One Updated')
        ]);

        assert.strictEqual(container.children.length, 1);
        assert.notStrictEqual(container.children[0], originalOne); // Node replaced because content changed
        assert.strictEqual(container.children[0].textContent, 'One Updated');
    });

    await t.test('el() handles SVGs', () => {
        const node = el('svg', { className: 'icon' }, [
            el('path', { d: 'M0 0h24v24H0z' })
        ]);
        assert.strictEqual(node.namespaceURI, 'http://www.w3.org/2000/svg');
        assert.strictEqual(node.children[0].namespaceURI, 'http://www.w3.org/2000/svg');
    });

    await t.test('el() handles ariaLabel and innerHTML', () => {
        const node = el('button', { ariaLabel: 'Close', innerHTML: '<span>X</span>' });
        assert.strictEqual(node.getAttribute('aria-label'), 'Close');
        assert.strictEqual(node.innerHTML, '<span>X</span>');
    });

    await t.test('el() handles mixed children', () => {
        const node = el('div', {}, [
            el('span', {}, 'First'),
            'Middle Text',
            null,
            false,
            el('span', {}, 'Last')
        ]);
        assert.strictEqual(node.children.length, 2);
        assert.match(node.textContent, /FirstMiddle Text/);
    });

    await t.test('diffList() clears all items', () => {
        const container = el('ul', {}, [
            el('li', { dataId: '1' }, 'One'),
            el('li', { dataId: '2' }, 'Two')
        ]);
        diffList(container, []);
        assert.strictEqual(container.children.length, 0);
    });

    await t.test('diffList() cleans up non-keyed elements', () => {
        const container = el('ul');
        container.appendChild(el('li', {}, 'No Key'));
        container.appendChild(el('li', { dataId: '1' }, 'One'));
        
        diffList(container, [
            el('li', { dataId: '1' }, 'One')
        ]);
        
        assert.strictEqual(container.children.length, 1);
        assert.strictEqual(container.children[0].getAttribute('data-id'), '1');
    });
});
