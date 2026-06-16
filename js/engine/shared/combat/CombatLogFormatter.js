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

        const ev = { ...event };
        if (ev.actorName && !ev.actorIsHero && ev.actorTemplateId) {
            ev.actorName = this.translateEnemyName({
                name: ev.actorName,
                templateId: ev.actorTemplateId,
                isElite: ev.actorIsElite,
                eliteTier: ev.actorEliteTier
            });
        }
        if (ev.targetName && !ev.targetIsHero && ev.targetTemplateId) {
            ev.targetName = this.translateEnemyName({
                name: ev.targetName,
                templateId: ev.targetTemplateId,
                isElite: ev.targetIsElite,
                eliteTier: ev.targetEliteTier
            });
        }

        switch (ev.type) {
            case 'DAMAGE':
                return this._formatDamage(ev);
            case 'HEAL':
                return this._formatHeal(ev);
            case 'VAMP':
                return this._formatVamp(ev);
            case 'TRAIT_REGEN':
                return this._formatTraitRegen(ev);
            case 'STATUS_TICK':
                return this._formatStatusTick(ev);
            case 'STATUS_EXPIRED':
                return this._formatStatusExpired(ev);
            case 'USE_CONSUMABLE':
                return this._formatUseConsumable(ev);
            case 'SPELL_DAMAGE':
                return this._formatSpellDamage(ev);
            case 'MP_RESTORE':
                return this._formatMpRestore(ev);
            case 'STAMINA_RESTORE':
                return this._formatStaminaRestore(ev);
            case 'STAMINA_REGEN':
                return this._formatStaminaRegen(ev);
            case 'STUN_SKIP':
                return this.i18n.t('combat_log_stun_skip', { actor: ev.actorName });
            case 'SLEEP_SKIP':
                return this.i18n.t('combat_log_sleep_skip', { actor: ev.actorName });
            case 'MAGIC_TIER_UP':
                return this.i18n.t('combat_log_magic_tier_up', { actor: ev.actorName, fromTier: ev.fromTier, toTier: ev.toTier });
            case 'TECHNIQUE_EVOLVED':
                return this._formatTechniqueEvolved(ev);
            case 'VICTORY':
                return this.i18n.t('combat_log_victory');
            case 'DEFEAT':
                return this.i18n.t('combat_log_defeat');
            case 'DEFEND':
                return this.i18n.t('combat_log_defend', { actor: ev.actorName });
            case 'FLEE_SUCCESS':
                return this.i18n.t('combat_log_flee_success', { actor: ev.actorName });
            case 'FLEE_FAIL':
                return this.i18n.t('combat_log_flee_fail', { actor: ev.actorName });
            case 'BUFF_ATK':
            case 'BUFF_DEF':
            case 'BUFF_SPD':
            case 'BUFF_CRIT':
                return this._formatBuff(ev);
            default:
                return `[${ev.type}] ${JSON.stringify(ev)}`;
        }
    }

    _formatDamage(event) {
        if (event.isMiss) {
            return this.i18n.t('combat_log_miss', {
                attacker: event.actorName,
                target: event.targetName
            });
        }

        let msg = this.i18n.t('combat_log_attack', {
            attacker: event.actorName,
            target: event.targetName,
            damage: event.amount
        });

        if (event.isCrit) {
            msg = `💥 ${msg}`;
        }

        if (event.targetDefeated) {
            msg += ` ${this.i18n.t('combat_log_target_defeated', { target: event.targetName })}`;
        }

        return msg;
    }

    _formatHeal(event) {
        return this.i18n.t('combat_log_heal', {
            attacker: event.actorName,
            target: event.targetName,
            amount: event.amount
        });
    }

    _formatVamp(event) {
        return this.i18n.t('combat_log_vamp', {
            actor: event.actorName,
            amount: event.amount
        });
    }

    _formatTraitRegen(event) {
        return this.i18n.t('combat_log_regen', {
            target: event.targetName,
            amount: event.amount
        });
    }

    _formatStatusTick(event) {
        const key = event.effectType === 'poison' ? 'combat_log_poison'
            : event.effectType === 'burn' ? 'combat_log_burn'
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
        return this.i18n.t('combat_log_status_expired', {
            target: event.targetName,
            effect: event.effectType
        });
    }

    _formatUseConsumable(event) {
        const statLabel = event.healType === 'HEAL_MP' ? 'MP' : 'HP';
        const itemName = this.i18n.t(event.consumableId) || event.consumableId;

        return this.i18n.t('combat_log_use_consumable', {
            attacker: event.actorName,
            item: itemName,
            target: event.targetName,
            amount: event.amount,
            stat: statLabel
        });
    }

    _formatSpellDamage(event) {
        let msg = this.i18n.t('combat_log_spell_damage', {
            attacker: event.actorName,
            spell: event.spellName,
            target: event.targetName,
            damage: event.amount
        });
        if (event.targetDefeated) {
            msg += ` ${this.i18n.t('combat_log_target_defeated', { target: event.targetName })}`;
        }
        return msg;
    }

    _formatMpRestore(event) {
        return this.i18n.t('combat_log_mp_restore', {
            attacker: event.actorName,
            target: event.targetName,
            amount: event.amount
        });
    }

    _formatStaminaRestore(event) {
        return this.i18n.t('combat_log_stamina_restore', {
            attacker: event.actorName,
            target: event.targetName,
            amount: event.amount
        });
    }

    _formatStaminaRegen(event) {
        return this.i18n.t('combat_log_stamina_regen', {
            actor: event.actorName,
            amount: event.amount
        });
    }

    _formatTechniqueEvolved(event) {
        const familyKey = 'heroes_info_family_' + event.family;
        const translatedFamily = this.i18n.t(familyKey);
        return this.i18n.t('combat_log_evolved', {
            actor: event.actorName,
            family: translatedFamily !== familyKey ? translatedFamily : event.family,
            tier: event.tier
        });
    }

    _formatBuff(event) {
        const buffKeyMap = {
            BUFF_ATK: 'combat_log_buff_atk',
            BUFF_DEF: 'combat_log_buff_def',
            BUFF_SPD: 'combat_log_buff_spd',
            BUFF_CRIT: 'combat_log_buff_crit'
        };
        const key = buffKeyMap[event.type] || 'combat_log_buff_generic';
        return this.i18n.t(key, {
            attacker: event.actorName,
            target: event.targetName,
            amount: event.amount
        });
    }

    translateEnemyName(actor) {
        if (!actor) return '';
        if (!actor.templateId) return actor.name;
        const translationKey = 'combat_info_' + actor.templateId;
        const baseName = this.i18n.t(translationKey);
        if (baseName === translationKey) return actor.name;
        if (actor.isElite) {
            const prefixKey = 'combat_info_elite_tier_' + actor.eliteTier;
            const prefix = this.i18n.t(prefixKey);
            if (prefix !== prefixKey) {
                return this.i18n.t('combat_info_elite_format', { prefix, name: baseName });
            }
            const defaultPrefixes = ['Fierce', 'Corrupted', 'Ancient', 'Legendary'];
            return `${defaultPrefixes[actor.eliteTier] || 'Fierce'} ${baseName}`;
        }
        return baseName;
    }
}
