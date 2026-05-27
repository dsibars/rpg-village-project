import { el } from '../../shared/utils/DOMUtils.js';

/**
 * VillageCanvas - Surgically manages the village building tiles.
 */
export class VillageCanvas {
    constructor({ t }) {
        this.t = t;
        this.root = el('div', { class: 'village-grid' });
        this.tilesMap = new Map(); // id -> { root, iconEl, nameEl, levelEl }
    }

    update(village) {
        const infra = village.infrastructure || {};
        const tilesData = [
            { id: 'townhall', name: 'Town Hall', icon: '🏛️', lvl: 1, active: true },
            { id: 'housing', name: this.t('village_housing') || 'Housing', icon: '🏠', lvl: infra.housing || 0, active: (infra.housing || 0) > 0 },
            { id: 'farm', name: this.t('village_farm') || 'Farm', icon: '🌾', lvl: infra.farm || 0, active: (infra.farm || 0) > 0 },
            { id: 'warehouse', name: this.t('village_warehouse') || 'Warehouse', icon: '📦', lvl: infra.warehouse || 0, active: (infra.warehouse || 0) > 0 },
            { id: 'blacksmith', name: this.t('village_blacksmith') || 'Blacksmith', icon: '⚒️', lvl: infra.blacksmith || 0, active: (infra.blacksmith || 0) > 0 },
            { id: 'training_grounds', name: this.t('village_training_grounds') || 'Training Grounds', icon: '💪', lvl: infra.training_grounds || 0, active: (infra.training_grounds || 0) > 0 },
            { id: 'explorer_guild', name: this.t('village_explorer_guild') || 'Explorer Guild', icon: '🧭', lvl: infra.explorer_guild || 0, active: (infra.explorer_guild || 0) > 0 },
            { id: 'witchs_hut', name: this.t('village_witchs_hut') || "Witch's Hut", icon: '🔮', lvl: infra.witchs_hut || 0, active: (infra.witchs_hut || 0) > 0 },
            { id: 'arcane_sanctum', name: this.t('village_arcane_sanctum') || 'Arcane Sanctum', icon: '✨', lvl: infra.arcane_sanctum || 0, active: (infra.arcane_sanctum || 0) > 0 },
            { id: 'infirmary', name: this.t('village_infirmary') || 'Infirmary', icon: '🏥', lvl: infra.infirmary || 0, active: (infra.infirmary || 0) > 0 },
            { id: 'tavern', name: this.t('village_tavern') || 'Tavern', icon: '🍺', lvl: infra.tavern || 0, active: (infra.tavern || 0) > 0 }
        ];

        tilesData.forEach(tile => {
            const statusClass = tile.active ? 'active' : 'locked';
            const lvlLabel = this.t('ui_level') || 'Level';
            const displayedIcon = tile.active ? tile.icon : '🔒';
            const displayedLvl = tile.active ? `${lvlLabel} ${tile.lvl}` : (this.t('ui_locked') || 'Locked');

            let cached = this.tilesMap.get(tile.id);
            if (!cached) {
                const iconEl = el('div', { class: 'village-tile-icon' }, [displayedIcon]);
                const nameEl = el('div', { class: 'village-tile-name' }, [tile.name]);
                const levelEl = el('div', { class: 'village-tile-level' }, [displayedLvl]);
                const tileRoot = el('div', { class: `village-tile ${statusClass}` }, [
                    iconEl,
                    nameEl,
                    levelEl
                ]);
                this.root.appendChild(tileRoot);
                cached = { root: tileRoot, iconEl, nameEl, levelEl };
                this.tilesMap.set(tile.id, cached);
            } else {
                cached.root.className = `village-tile ${statusClass}`;
                if (cached.iconEl.textContent !== displayedIcon) {
                    cached.iconEl.textContent = displayedIcon;
                }
                if (cached.levelEl.textContent !== displayedLvl) {
                    cached.levelEl.textContent = displayedLvl;
                }
            }
        });
    }
}
