/**
 * CombatLogFormatter — Converts structured combat event objects into localized strings.
 * Pure utility; no side effects.
 */
export class CombatLogFormatter {
    constructor(i18n) {
        this.i18n = i18n;
    }

    /**
     * Format a single combat log event into a human-readable string.
     * @param {Object} event
     * @returns {string}
     */
    format(event) {
        if (!event || typeof event !== 'object') return String(event);

        switch (event.type) {
            case 'DAMAGE':
                return this._formatDamage(event);
            case 'HEAL':
                return this._formatHeal(event);
            case 'VAMP':
                return this._formatVamp(event);
            case 'TRAIT_REGEN':
                return this._formatTraitRegen(event);
            case 'STATUS_TICK':
                return this._formatStatusTick(event);
            case 'STATUS_EXPIRED':
                return this._formatStatusExpired(event);
            case 'USE_CONSUMABLE':
                return this._formatUseConsumable(event);
            case 'SPELL_DAMAGE':
                return this._formatSpellDamage(event);
            case 'MP_RESTORE':
                return this._formatMpRestore(event);
            case 'STAMINA_RESTORE':
                return this._formatStaminaRestore(event);
            case 'BUFF_ATK':
            case 'BUFF_DEF':
            case 'BUFF_SPD':
            case 'BUFF_CRIT':
                return this._formatBuff(event);
            default:
                return `[${event.type}] ${JSON.stringify(event)}`;
        }
    }

    _formatDamage(event) {
        if (event.isMiss) {
            return this.i18n.t('log_miss', {
                attacker: event.actorName,
                target: event.targetName
            });
        }

        let msg = this.i18n.t('log_attack', {
            attacker: event.actorName,
            target: event.targetName,
            damage: event.amount
        });

        if (event.isCrit) {
            msg = `💥 ${msg}`;
        }

        if (event.targetDefeated) {
            msg += ` ${this.i18n.t('log_target_defeated', { target: event.targetName })}`;
        }

        return msg;
    }

    _formatHeal(event) {
        return this.i18n.t('log_heal', {
            attacker: event.actorName,
            target: event.targetName,
            amount: event.amount
        });
    }

    _formatVamp(event) {
        return this.i18n.t('log_vamp', {
            actor: event.actorName,
            amount: event.amount
        });
    }

    _formatTraitRegen(event) {
        return this.i18n.t('log_regen', {
            target: event.targetName,
            amount: event.amount
        });
    }

    _formatStatusTick(event) {
        const key = event.effectType === 'poison' ? 'log_poison'
            : event.effectType === 'burn' ? 'log_burn'
            : null;

        if (key) {
            return this.i18n.t(key, {
                target: event.targetName,
                damage: event.damage
            });
        }

        return `${event.targetName} takes ${event.damage} ${event.effectType} damage.`;
    }

    _formatStatusExpired(event) {
        return this.i18n.t('log_status_expired', {
            target: event.targetName,
            effect: event.effectType
        });
    }

    _formatUseConsumable(event) {
        const statLabel = event.healType === 'HEAL_MP' ? 'MP' : 'HP';
        const itemName = this.i18n.t(event.consumableId) || event.consumableId;

        return this.i18n.t('log_use_consumable', {
            attacker: event.actorName,
            item: itemName,
            target: event.targetName,
            amount: event.amount,
            stat: statLabel
        });
    }

    _formatSpellDamage(event) {
        let msg = this.i18n.t('log_spell_damage', {
            attacker: event.actorName,
            spell: event.spellName,
            target: event.targetName,
            damage: event.amount
        });
        if (event.targetDefeated) {
            msg += ` ${this.i18n.t('log_target_defeated', { target: event.targetName })}`;
        }
        return msg;
    }

    _formatMpRestore(event) {
        return this.i18n.t('log_mp_restore', {
            attacker: event.actorName,
            target: event.targetName,
            amount: event.amount
        });
    }

    _formatStaminaRestore(event) {
        return this.i18n.t('log_stamina_restore', {
            attacker: event.actorName,
            target: event.targetName,
            amount: event.amount
        });
    }

    _formatBuff(event) {
        const buffKeyMap = {
            BUFF_ATK: 'log_buff_atk',
            BUFF_DEF: 'log_buff_def',
            BUFF_SPD: 'log_buff_spd',
            BUFF_CRIT: 'log_buff_crit'
        };
        const key = buffKeyMap[event.type] || 'log_buff_generic';
        return this.i18n.t(key, {
            attacker: event.actorName,
            target: event.targetName,
            amount: event.amount
        });
    }
}
