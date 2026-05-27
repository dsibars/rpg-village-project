import './setup.js';
import test from 'node:test';
import assert from 'node:assert';
import { createIconButton } from '../../js/presentation/ui/shared/components/IconButton.js';
import { createResourceBar } from '../../js/presentation/ui/shared/components/ResourceBar.js';
import { createHeroMiniCard } from '../../js/presentation/ui/shared/components/HeroMiniCard.js';

test('Shared Components DOM Tests', async (t) => {
    
    await t.test('createIconButton() renders and updates state', () => {
        let clicked = false;
        const iconBtn = createIconButton({
            icon: '🔥',
            onClick: () => clicked = true,
            disabled: false,
            variant: 'primary',
            title: 'Test Button'
        });

        assert.strictEqual(iconBtn.root.tagName, 'BUTTON');
        assert.strictEqual(iconBtn.root.textContent, '🔥');
        assert.strictEqual(iconBtn.root.title, 'Test Button');
        assert.ok(iconBtn.root.className.includes('btn-primary'));
        assert.strictEqual(iconBtn.root.disabled, false);

        // Click handler trigger
        iconBtn.root.dispatchEvent(new Event('click'));
        assert.strictEqual(clicked, true);

        // Update state
        iconBtn.update({ disabled: true, icon: '❄️' });
        assert.strictEqual(iconBtn.root.disabled, true);
        assert.strictEqual(iconBtn.root.textContent, '❄️');
    });

    await t.test('createResourceBar() renders and updates correctly', () => {
        const bar = createResourceBar({
            label: 'Storage',
            current: 30,
            max: 100,
            color: 'red'
        });

        assert.strictEqual(bar.refs.label.textContent, 'Storage');
        assert.strictEqual(bar.refs.value.textContent, '30 / 100');
        assert.strictEqual(bar.refs.progressInner.style.width, '30%');
        assert.strictEqual(bar.refs.progressInner.style.backgroundColor, 'red');

        // Update progress
        bar.update({ current: 85, max: 100 });
        assert.strictEqual(bar.refs.value.textContent, '85 / 100');
        assert.strictEqual(bar.refs.progressInner.style.width, '85%');
    });

    await t.test('createHeroMiniCard() variant support', () => {
        const mockHero = {
            id: 'h_test',
            name: 'Arthur Pendragon',
            level: 5,
            activity: 'idle',
            mealBuffs: ['meal_stew']
        };

        const tMock = (k) => k;

        // 1. List Variant
        const listCard = createHeroMiniCard({
            hero: mockHero,
            variant: 'list',
            selected: false,
            t: tMock
        });

        assert.ok(listCard.root.className.includes('hero-card'));
        assert.strictEqual(listCard.refs.title.textContent, 'Arthur Pendragon');
        assert.strictEqual(listCard.refs.level.textContent, 'ui_level 5');
        assert.strictEqual(listCard.refs.activity.textContent, '💤');
        assert.strictEqual(listCard.refs.meal.style.display, 'inline-block');

        // Update List Variant
        const updatedHero = { ...mockHero, level: 6, activity: 'combat', mealBuffs: [] };
        listCard.update(updatedHero, true);
        assert.strictEqual(listCard.refs.level.textContent, 'ui_level 6');
        assert.strictEqual(listCard.refs.activity.textContent, '⚔️');
        assert.strictEqual(listCard.refs.meal.style.display, 'none');
        assert.ok(listCard.root.className.includes('active'));

        // 2. Header Variant
        const headerCard = createHeroMiniCard({
            hero: mockHero,
            variant: 'header',
            t: tMock
        });
        assert.strictEqual(headerCard.refs.title.textContent, 'Arthur Pendragon');
        assert.ok(headerCard.refs.level.textContent.includes('ui_activity_idle'));

        // 3. Defense-Chip Variant
        const chipCard = createHeroMiniCard({
            hero: mockHero,
            variant: 'defense-chip',
            t: tMock
        });
        assert.strictEqual(chipCard.refs.label.textContent, '🛡️ Arthur Pendragon (Lvl 5)');
    });
});
