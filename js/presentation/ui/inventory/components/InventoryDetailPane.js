import { el } from '../../shared/utils/DOMUtils.js';
import { getFormattedStats } from '../../shared/EquipmentHelper.js';
import { MEAL_RECIPES } from '../../../../engine/shared/data/InventoryData.js';

const CATEGORY_KEY_MAP = {
    materials: 'inventory_uxelm_category_materials',
    food: 'inventory_uxelm_category_food',
    consumables: 'inventory_uxelm_category_consumables',
    equipment: 'inventory_uxelm_category_equipment'
};

const BUFF_STAT_KEY_MAP = {
    strength: 'heroes_info_stat_strength',
    defense: 'heroes_info_stat_defense',
    maxHp: 'heroes_info_stat_hp',
    maxMp: 'heroes_info_stat_mp',
    magicPower: 'heroes_info_stat_magic_power',
    speed: 'heroes_info_stat_speed',
    evasion: 'heroes_info_stat_evasion',
    mpCostReduction: 'heroes_info_stat_mpCostReduction'
};

export function createInventoryDetailPane({ onCook, onConsume, onEquip, onUnequip, onDrop, onTeachGlyph, t }) {
    // Empty state
    const emptyStateRef = el('div', { class: 'empty-detail' }, [
        el('div', { class: 'detail-icon-bg' }, ['🎒']),
        el('p', { dataI18n: 'inventory_uxelm_select_item' }, [t('inventory_uxelm_select_item')])
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
        qtyLabelRef.textContent = t('inventory_uxelm_owned');
        qtyValueRef.textContent = String(item.qty);

        // Category & description
        let categoryLabel = t(CATEGORY_KEY_MAP[item.type] || item.type);
        let description = '';

        if (item.type === 'materials') {
            description = t('desc_' + item.id);
        } else if (item.type === 'food') {
            description = t('desc_' + item.id);
        } else if (item.type === 'consumables') {
            description = t('item_' + item.id + '_desc');
        }

        // Equipment overrides
        if (item.type === 'equipment' && item.rawEquipment) {
            const eq = item.rawEquipment;
            categoryLabel = t('inventory_uxelm_category_equipment');
            const descKey = 'desc_' + eq.type + '_' + eq.material;
            const descVal = t(descKey);
            description = descVal !== descKey ? descVal : `${t('inventory_info_tier_' + eq.material)} ${t('inventory_info_type_' + eq.type)}.`;

            const formattedStats = getFormattedStats(eq, t);
            eqStatsRef.innerHTML = '';
            eqStatsRef.append(
                el('h4', {}, [t('inventory_uxelm_equipment_stats')]),
                el('div', { class: 'inspector-stat-row' }, [
                    el('span', { class: 'inspector-stat-label' }, [t('inventory_uxelm_slot')]),
                    el('span', { class: 'inspector-stat-value', style: { textTransform: 'capitalize' } }, [`${eq.type} (${eq.slot})`])
                ]),
                el('div', { class: 'inspector-stat-row' }, [
                    el('span', { class: 'inspector-stat-label' }, [t('shared_uxelm_tier')]),
                    el('span', { class: 'inspector-stat-value' }, [String(eq.tier || 1)])
                ]),
                el('div', { class: 'inspector-stat-row' }, [
                    el('span', { class: 'inspector-stat-label' }, [t('shared_uxelm_level')]),
                    el('span', { class: 'inspector-stat-value' }, [`+${eq.level || 0}`])
                ]),
                el('div', { class: 'inspector-stat-row' }, [
                    el('span', { class: 'inspector-stat-label' }, [t('inventory_uxelm_properties')]),
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
                el('h4', {}, [t('inventory_uxelm_recipes')])
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
                    ingredientsList.push(el('span', { style: { color } }, [`${qty} ${t(ingId)}`]));
                    if (idx < entries.length - 1) {
                        ingredientsList.push(', ');
                    }
                });

                const buffDesc = [];
                const buffEntries = Object.entries(recipe.buff);
                buffEntries.forEach(([stat, val], idx) => {
                    const label = stat === 'maxHp' ? `+${Math.round(val * 100)}% HP` : `+${val} ${t(BUFF_STAT_KEY_MAP[stat] || stat)}`;
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
                        el('div', { style: { fontWeight: '600', fontSize: '0.9rem' } }, [`${recipe.icon} ${t(recipe.name)}`]),
                        el('div', { style: { fontSize: '0.75rem', color: 'var(--text-muted)' } }, ingredientsList),
                        el('div', { style: { fontSize: '0.75rem', color: 'var(--accent-color)' } }, [
                            ...buffDesc,
                            ` · ${recipe.battles} ${t('inventory_uxelm_battles')}`
                        ])
                    ]),
                    el('button', {
                        class: 'btn btn-primary btn-sm btn-cook-meal',
                        disabled: !canCook,
                        style: { minWidth: '60px' },
                        onClick: () => onCook(recipe.id)
                    }, [t('inventory_uxelm_cook')])
                ]);
                recipesContainer.appendChild(row);
            });

            actionRef.appendChild(recipesContainer);
        } else if (item.id && item.id.startsWith('meal_')) {
            const recipe = MEAL_RECIPES[item.id];
            if (recipe) {
                const buffDesc = Object.entries(recipe.buff).map(([stat, val]) => {
                    if (stat === 'maxHp') return `+${Math.round(val * 100)}% HP`;
                    return `+${val} ${t(BUFF_STAT_KEY_MAP[stat] || stat)}`;
                }).join(', ');

                const container = el('div', { class: 'item-inspector-stats', style: { marginTop: '15px' } }, [
                    el('h4', {}, [t('inventory_uxelm_effect')]),
                    el('div', { style: { fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' } }, [`${buffDesc} · ${recipe.battles} ${t('inventory_uxelm_battles')}`]),
                    el('button', {
                        class: 'btn btn-primary btn-consume-meal',
                        style: { width: '100%' },
                        onClick: () => onConsume(item.id)
                    }, [t('inventory_uxelm_feed_heroes')])
                ]);
                actionRef.appendChild(container);
            }
        } else if (item.id && item.id.startsWith('tablet_glyph_')) {
            const container = el('div', { class: 'item-inspector-stats', style: { marginTop: '15px' } }, [
                el('h4', {}, [t('inventory_uxelm_effect')]),
                el('div', { style: { fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px' } }, [t('item_' + item.id + '_desc')]),
                el('button', {
                    class: 'btn btn-primary btn-use-tablet',
                    style: { width: '100%' },
                    onClick: () => onTeachGlyph(item.id)
                }, [t('inventory_uxelm_use_tablet')])
            ]);
            actionRef.appendChild(container);
        }
    }

    return { root, update };
}
