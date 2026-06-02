import { el } from '../../shared/utils/DOMUtils.js';

/**
 * CombatActorCard - Surgically updates HP, MP, Stamina, and Status badges for an actor.
 */
export class CombatActorCard {
    constructor({ t, isHero, index }) {
        this.t = t;
        this.isHero = isHero;
        this.index = index;

        this.avatarEl = el('div', { class: 'combat-card-avatar' }, ['⚔️']);
        this.nameEl = el('span', { class: 'combat-card-name' });
        this.lvlEl = el('span', { class: 'combat-card-level' });
        
        this.hpBar = el('div', { class: 'combat-bar combat-bar-hp' });
        this.hpBarWrap = el('div', { class: 'combat-bar-container' }, [this.hpBar]);
        this.hpText = el('div', { class: 'combat-bar-text' });

        this.staminaBar = el('div', { class: 'combat-bar combat-bar-stamina' });
        this.staminaBarWrap = el('div', {
            class: 'combat-bar-container',
            style: 'height: 4px; display: none;'
        }, [this.staminaBar]);
        this.staminaText = el('div', {
            class: 'combat-bar-text',
            style: 'font-size: 0.7rem; display: none;'
        });

        this.mpBar = el('div', { class: 'combat-bar combat-bar-mp' });
        this.mpBarWrap = el('div', {
            class: 'combat-bar-container',
            style: 'height: 4px; display: none;'
        }, [this.mpBar]);
        this.mpText = el('div', {
            class: 'combat-bar-text',
            style: 'font-size: 0.7rem; display: none;'
        });

        this.statusesEl = el('div', { class: 'combat-card-statuses' });
        this.effectsEl = el('div', { class: 'combat-effects-container' });

        this.infoEl = el('div', { class: 'combat-card-info' }, [
            el('div', { class: 'combat-card-header' }, [this.nameEl, this.lvlEl]),
            this.hpBarWrap,
            this.hpText,
            this.staminaBarWrap,
            this.staminaText,
            this.mpBarWrap,
            this.mpText,
            this.statusesEl
        ]);

        this.root = el('div', {
            class: 'combat-card'
        }, [
            this.avatarEl,
            this.infoEl,
            this.effectsEl
        ]);
    }

    update(actor, isCurrentTurn) {
        const isDead = actor.hp <= 0;
        
        const cardTypeClass = this.isHero ? 'hero-card' : 'enemy-card';
        this.root.className = `combat-card ${cardTypeClass} ${isCurrentTurn ? 'active' : ''} ${isDead ? 'dead' : ''}`;
        
        if (this.isHero) {
            this.root.setAttribute('data-hero-id', actor.id);
            this.root.setAttribute('data-hero-index', this.index);
            this.effectsEl.id = `effects-hero-${actor.id}`;
        } else {
            this.root.setAttribute('data-enemy-index', this.index);
            this.effectsEl.id = `effects-enemy-${this.index}`;
        }

        const expectedAvatar = isDead ? '💀' : (this.isHero ? '⚔️' : '👾');
        if (this.avatarEl.textContent !== expectedAvatar) {
            this.avatarEl.textContent = expectedAvatar;
        }

        let expectedName = actor.name;
        if (!this.isHero && actor.templateId) {
            const translationKey = 'combat_info_' + actor.templateId;
            const baseName = this.t(translationKey);
            if (baseName !== translationKey) {
                if (actor.isElite) {
                    const prefixKey = 'combat_info_elite_tier_' + actor.eliteTier;
                    const prefix = this.t(prefixKey);
                    if (prefix !== prefixKey) {
                        expectedName = this.t('combat_info_elite_format', { prefix, name: baseName });
                    } else {
                        expectedName = `${actor.isElite ? ['Fierce', 'Corrupted', 'Ancient', 'Legendary'][actor.eliteTier] : ''} ${baseName}`.trim();
                    }
                } else {
                    expectedName = baseName;
                }
            }
        }
        if (this.nameEl.textContent !== expectedName) {
            this.nameEl.textContent = expectedName;
        }

        const expectedLvl = `Lv.${actor.level || 1}`;
        if (this.lvlEl.textContent !== expectedLvl) {
            this.lvlEl.textContent = expectedLvl;
        }

        const hpPct = actor.maxHp ? Math.max(0, Math.min(100, (actor.hp / actor.maxHp) * 100)) : 0;
        this.hpBar.style.width = `${hpPct}%`;
        
        const hpLabelHtml = `<span>${this.t('heroes_info_stat_hp')}</span><span>${actor.hp}/${actor.maxHp}</span>`;
        if (this.hpText.innerHTML !== hpLabelHtml) {
            this.hpText.innerHTML = hpLabelHtml;
        }

        if (this.isHero && actor.maxStamina > 0) {
            this.staminaBarWrap.style.display = 'block';
            this.staminaText.style.display = 'flex';
            const staPct = actor.maxStamina ? Math.max(0, Math.min(100, (actor.stamina / actor.maxStamina) * 100)) : 0;
            this.staminaBar.style.width = `${staPct}%`;
            
            const staLabelHtml = `<span>${this.t('shared_uxelm_stamina')}</span><span>${actor.stamina}/${actor.maxStamina}</span>`;
            if (this.staminaText.innerHTML !== staLabelHtml) {
                this.staminaText.innerHTML = staLabelHtml;
            }
        } else {
            this.staminaBarWrap.style.display = 'none';
            this.staminaText.style.display = 'none';
        }

        if (this.isHero && actor.maxMp > 0) {
            this.mpBarWrap.style.display = 'block';
            this.mpText.style.display = 'flex';
            const mpPct = actor.maxMp ? Math.max(0, Math.min(100, (actor.mp / actor.maxMp) * 100)) : 0;
            this.mpBar.style.width = `${mpPct}%`;
            
            const mpLabelHtml = `<span>${this.t('heroes_info_stat_mp')}</span><span>${actor.mp}/${actor.maxMp}</span>`;
            if (this.mpText.innerHTML !== mpLabelHtml) {
                this.mpText.innerHTML = mpLabelHtml;
            }
        } else {
            this.mpBarWrap.style.display = 'none';
            this.mpText.style.display = 'none';
        }

        this.statusesEl.innerHTML = '';
        (actor.statusEffects || []).forEach(st => {
            const iconMap = { poison: '🤢', burn: '🔥', regen: '💚', haste: '⭐', sleep: '💤', stun: '💫' };
            const badge = el('span', {
                class: 'combat-status-badge',
                title: `${st.type} (${st.duration} turns)`
            }, [iconMap[st.type] || st.type]);
            this.statusesEl.appendChild(badge);
        });
    }
}
