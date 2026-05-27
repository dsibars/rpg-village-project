import { el } from '../../shared/utils/DOMUtils.js';
import { getEquipmentName, getEquipmentStats } from '../../shared/EquipmentHelper.js';
import { getRefineCost } from '../../../../engine/shared/data/GameConstants.js';

const STAT_LABEL_MAP = {
    strength: 'ui_stats_power',
    defense: 'ui_stats_defense',
    maxHp: 'ui_stats_hp',
    maxMp: 'ui_stats_mp',
    magicPower: 'ui_stats_magic',
    speed: 'ui_stats_speed',
    evasion: 'ui_stats_evasion',
    mpCostReduction: 'ui_stats_mpreduce'
};

export function createForgeDetailPane({ onUpgrade, onCraft, t }) {
    // Empty state
    const emptyStateRef = el('div', { class: 'empty-detail' }, [
        el('div', { class: 'detail-icon-bg' }, ['🔥']),
        el('p', { dataI18n: 'ui_select_item', style: { color: 'var(--text-muted)' } }, [
            t('ui_select_item') || 'Select a piece of equipment from the inventory to upgrade.'
        ])
    ]);

    // Header refs
    const nameRef = el('h2');
    const levelBadgeRef = el('span', { class: 'forge-level-badge' });

    // Stats refs
    const statsContainerRef = el('div', { class: 'forge-stats-comparison' });

    // Cost refs
    const costSectionRef = el('div', { class: 'forge-cost-section' });

    // Action refs
    const actionBtnRef = el('button', { class: ['btn', 'btn-primary', 'btn-lg'] });

    const contentRef = el('div', { style: { display: 'none' } }, [
        el('div', { class: 'forge-upgrade-header' }, [
            el('div', { class: 'forge-title-group' }, [nameRef]),
            levelBadgeRef
        ]),
        statsContainerRef,
        costSectionRef,
        el('div', { class: 'forge-action-footer' }, [
            actionBtnRef
        ])
    ]);

    const root = el('div', { style: { height: '100%' } }, [emptyStateRef, contentRef]);

    let activeItem = null;

    actionBtnRef.addEventListener('click', () => {
        if (activeItem) {
            onUpgrade({ itemId: activeItem.id });
        }
    });

    function update({ item, state, mode }) {
        activeItem = item;

        if (!item) {
            emptyStateRef.style.display = 'flex';
            contentRef.style.display = 'none';
            return;
        }

        emptyStateRef.style.display = 'none';
        contentRef.style.display = 'block';

        const currentLevel = item.level || 0;
        const isMaxLevel = currentLevel >= 10;

        nameRef.textContent = getEquipmentName(item, t);
        levelBadgeRef.textContent = `+${currentLevel}`;

        // Stats
        const currentStats = getEquipmentStats(item);
        const nextItemMock = { ...item, level: currentLevel + 1 };
        const nextStats = isMaxLevel ? null : getEquipmentStats(nextItemMock);

        const allStatKeys = Array.from(new Set([...Object.keys(currentStats), ...(nextStats ? Object.keys(nextStats) : [])]));

        statsContainerRef.innerHTML = '';
        statsContainerRef.appendChild(el('h4', { dataI18n: 'ui_item_stats' }, [t('ui_item_stats') || 'Stats']));

        if (allStatKeys.length === 0) {
            statsContainerRef.appendChild(
                el('div', { style: { color: 'var(--text-muted)', fontSize: '0.9rem' } }, [
                    t('ui_no_item_stats') || 'No stats modification.'
                ])
            );
        } else {
            allStatKeys.forEach(key => {
                const curVal = currentStats[key] || 0;
                let nextValHtml = null;
                if (!isMaxLevel && nextStats) {
                    const nextVal = nextStats[key] || 0;
                    if (nextVal !== curVal) {
                        const diff = nextVal - curVal;
                        const diffSign = diff > 0 ? '+' : '';
                        nextValHtml = el('span', { class: 'forge-stat-next' }, [
                            ` ➔ ${nextVal} (${diffSign}${diff})`
                        ]);
                    }
                }

                const labelKey = STAT_LABEL_MAP[key] || key;
                const label = t(labelKey) || key.toUpperCase();

                statsContainerRef.appendChild(el('div', { class: 'forge-stat-row' }, [
                    el('span', { class: 'forge-stat-label' }, [label]),
                    el('span', { class: 'forge-stat-values' }, [
                        `${curVal}`,
                        nextValHtml
                    ].filter(Boolean))
                ]));
            });
        }

        // Cost section
        costSectionRef.innerHTML = '';
        let canAfford = true;

        if (!isMaxLevel) {
            const cost = getRefineCost(item);
            const playerGold = state.village?.gold || 0;
            const goldClass = playerGold >= cost.gold ? '' : 'insufficient';
            if (playerGold < cost.gold) canAfford = false;

            const costGrid = el('div', { class: 'forge-cost-grid' });

            costGrid.appendChild(el('div', { class: ['forge-cost-item', goldClass] }, [
                el('span', { class: 'label' }, ['💰 Gold']),
                el('span', { class: 'value' }, [`${cost.gold} / ${playerGold}`])
            ]));

            for (const [matId, requiredQty] of Object.entries(cost.materials || {})) {
                let ownedQty = 0;
                if (matId.startsWith('material_')) {
                    ownedQty = state.inventory?.materials?.[matId] || 0;
                } else if (matId.startsWith('food_')) {
                    ownedQty = state.inventory?.food?.[matId] || 0;
                } else {
                    ownedQty = state.inventory?.consumables?.[matId] || 0;
                }
                const isEnough = ownedQty >= requiredQty;
                if (!isEnough) canAfford = false;
                const matClass = isEnough ? '' : 'insufficient';
                const matName = t(matId) || matId;

                costGrid.appendChild(el('div', { class: ['forge-cost-item', matClass] }, [
                    el('span', { class: 'label' }, [`📦 ${matName}`]),
                    el('span', { class: 'value' }, [`${requiredQty} / ${ownedQty}`])
                ]));
            }

            costSectionRef.appendChild(el('h4', { dataI18n: 'ui_refine_cost' }, [t('ui_refine_cost') || 'Refine Cost']));
            costSectionRef.appendChild(costGrid);
            costSectionRef.style.display = 'block';
        } else {
            costSectionRef.style.display = 'none';
        }

        const btnLabel = isMaxLevel ? (t('ui_refine_max') || 'Max Level') : (t('ui_refine') || 'Refine');
        const btnDisabled = isMaxLevel || !canAfford;

        actionBtnRef.disabled = btnDisabled;
        actionBtnRef.innerHTML = '';
        actionBtnRef.appendChild(el('span', { class: 'icon' }, ['🔥']));
        actionBtnRef.appendChild(el('span', {}, [btnLabel]));
    }

    return { root, update };
}
