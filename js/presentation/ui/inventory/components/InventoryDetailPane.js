import { el } from '../../shared/utils/DOMUtils.js';
import { getFormattedStats } from '../../shared/EquipmentHelper.js';
import { MEAL_RECIPES } from '../../../../engine/shared/data/InventoryData.js';

export function createInventoryDetailPane({ onCook, onConsume, onEquip, onUnequip, onDrop, t }) {
    // Empty state
    const emptyStateRef = el('div', { class: 'empty-detail' }, [
        el('div', { class: 'detail-icon-bg' }, ['🎒']),
        el('p', { dataI18n: 'ui_select_item' }, [t('ui_select_item')])
    ]);

    // Header refs
    const iconRef = el('span', { class: 'item-inspector-icon' });
    const badgeRef = el('span', { class: 'item-inspector-badge' });
    const nameRef = el('h2');
    const qtyLabelRef = el('span');
    const qtyValueRef = el('strong');
    const qtyRef = el('div', { class: 'item-inspector-qty' }, [qtyLabelRef, ': ', qtyValueRef]);

    const headerRef = el('div', { class: 'item-inspector-header' }, [
        el('div', { class: 'item-inspector-visual' }, [iconRef]),
        el('div', { class: 'item-inspector-title-group' }, [
            badgeRef,
            nameRef,
            qtyRef
        ])
    ]);

    // Body refs
    const descRef = el('p', { class: 'item-inspector-description' });

    // Equipment stats container
    const eqStatsRef = el('div', { class: 'item-inspector-stats' });

    // Action container (recipes, feed button, etc.)
    const actionRef = el('div');

    const bodyRef = el('div', { class: 'item-inspector-body' }, [
        descRef,
        eqStatsRef,
        actionRef
    ]);

    const contentRef = el('div', { class: 'item-inspector' }, [headerRef, bodyRef]);

    const root = el('div', { style: { height: '100%' } }, [emptyStateRef, contentRef]);

    function update({ item, state }) {
        if (!item) {
            emptyStateRef.style.display = 'flex';
            contentRef.style.display = 'none';
            return;
        }

        emptyStateRef.style.display = 'none';
        contentRef.style.display = 'block';

        // Basic info
        iconRef.textContent = item.icon;
        nameRef.textContent = item.name;
        qtyLabelRef.textContent = t('ui_owned') || 'Owned';
        qtyValueRef.textContent = String(item.qty);

        // Category & description
        let categoryLabel = t('ui_' + item.type);
        let description = '';

        if (item.type === 'materials') {
            description = t('desc_' + item.id) || '';
        } else if (item.type === 'food') {
            description = t('desc_' + item.id) || '';
        } else if (item.type === 'consumables') {
            description = t(item.id + '_desc') || '';
        }

        // Equipment overrides
        if (item.type === 'equipment' && item.rawEquipment) {
            const eq = item.rawEquipment;
            categoryLabel = t('ui_equipment');
            const descKey = 'desc_' + eq.type + '_' + eq.material;
            const descVal = t(descKey);
            description = descVal !== descKey ? descVal : `${t('tier_' + eq.material)} ${t('eq_' + eq.type)}.`;

            const formattedStats = getFormattedStats(eq, t);
            eqStatsRef.innerHTML = '';
            eqStatsRef.append(
                el('h4', {}, [t('ui_equipment_stats') || 'Equipment Stats']),
                el('div', { class: 'inspector-stat-row' }, [
                    el('span', { class: 'inspector-stat-label' }, [t('ui_slot') || 'Slot']),
                    el('span', { class: 'inspector-stat-value', style: { textTransform: 'capitalize' } }, [`${eq.type} (${eq.slot})`])
                ]),
                el('div', { class: 'inspector-stat-row' }, [
                    el('span', { class: 'inspector-stat-label' }, [t('ui_tier') || 'Tier']),
                    el('span', { class: 'inspector-stat-value' }, [String(eq.tier || 1)])
                ]),
                el('div', { class: 'inspector-stat-row' }, [
                    el('span', { class: 'inspector-stat-label' }, [t('ui_level') || 'Level']),
                    el('span', { class: 'inspector-stat-value' }, [`+${eq.level || 0}`])
                ]),
                el('div', { class: 'inspector-stat-row' }, [
                    el('span', { class: 'inspector-stat-label' }, [t('ui_properties') || 'Properties']),
                    el('span', { class: 'inspector-stat-value', style: { color: 'var(--success)' } }, [formattedStats])
                ])
            );
            eqStatsRef.style.display = 'block';
        } else {
            eqStatsRef.style.display = 'none';
        }

        badgeRef.textContent = categoryLabel;
        descRef.textContent = description;

        // Actions
        actionRef.innerHTML = '';
        if (item.id === 'food_raw_grain') {
            const recipes = Object.values(MEAL_RECIPES);
            const inventory = state?.inventory || {};
            const recipesContainer = el('div', { class: 'item-inspector-stats', style: { marginTop: '15px' } }, [
                el('h4', {}, [t('ui_recipes') || 'Recipes'])
            ]);

            recipes.forEach(recipe => {
                const canCook = Object.entries(recipe.ingredients).every(([ingId, qty]) => {
                    const count = inventory.materials?.[ingId] || inventory.food?.[ingId] || inventory.consumables?.[ingId] || 0;
                    return count >= qty;
                });

                const ingredientsList = [];
                const entries = Object.entries(recipe.ingredients);
                entries.forEach(([ingId, qty], idx) => {
                    const have = inventory.materials?.[ingId] || inventory.food?.[ingId] || inventory.consumables?.[ingId] || 0;
                    const color = have >= qty ? 'var(--success)' : 'var(--danger)';
                    ingredientsList.push(el('span', { style: { color } }, [`${qty} ${t(ingId) || ingId}`]));
                    if (idx < entries.length - 1) {
                        ingredientsList.push(', ');
                    }
                });

                const buffDesc = [];
                const buffEntries = Object.entries(recipe.buff);
                buffEntries.forEach(([stat, val], idx) => {
                    const label = stat === 'maxHp' ? `+${Math.round(val * 100)}% HP` : `+${val} ${t('ui_stats_' + stat) || stat.toUpperCase()}`;
                    buffDesc.push(label);
                    if (idx < buffEntries.length - 1) {
                        buffDesc.push(', ');
                    }
                });

                const row = el('div', {
                    style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: '1px dashed rgba(255,255,255,0.05)'
                    }
                }, [
                    el('div', { style: { textAlign: 'left' } }, [
                        el('div', { style: { fontWeight: '600', fontSize: '0.9rem' } }, [`${recipe.icon} ${t(recipe.name) || recipe.name}`]),
                        el('div', { style: { fontSize: '0.75rem', color: 'var(--text-muted)' } }, ingredientsList),
                        el('div', { style: { fontSize: '0.75rem', color: 'var(--accent-color)' } }, [
                            ...buffDesc,
                            ` · ${recipe.battles} ${t('ui_battles') || 'battle(s)'}`
                        ])
                    ]),
                    el('button', {
                        class: 'btn btn-primary btn-sm btn-cook-meal',
                        disabled: !canCook,
                        style: { minWidth: '60px' },
                        onClick: () => onCook(recipe.id)
                    }, [t('ui_cook') || 'Cook'])
                ]);
                recipesContainer.appendChild(row);
            });

            actionRef.appendChild(recipesContainer);
        } else if (item.id && item.id.startsWith('meal_')) {
            const recipe = MEAL_RECIPES[item.id];
            if (recipe) {
                const buffDesc = Object.entries(recipe.buff).map(([stat, val]) => {
                    if (stat === 'maxHp') return `+${Math.round(val * 100)}% HP`;
                    return `+${val} ${t('ui_stats_' + stat) || stat.toUpperCase()}`;
                }).join(', ');

                const container = el('div', { class: 'item-inspector-stats', style: { marginTop: '15px' } }, [
                    el('h4', {}, [t('ui_effect') || 'Effect']),
                    el('div', { style: { fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' } }, [`${buffDesc} · ${recipe.battles} ${t('ui_battles') || 'battle(s)'}`]),
                    el('button', {
                        class: 'btn btn-primary btn-consume-meal',
                        style: { width: '100%' },
                        onClick: () => onConsume(item.id)
                    }, [t('ui_feed_heroes') || 'Feed Heroes'])
                ]);
                actionRef.appendChild(container);
            }
        }
    }

    return { root, update };
}
