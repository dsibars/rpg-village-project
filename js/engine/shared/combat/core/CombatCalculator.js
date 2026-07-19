import { TECHNIQUE_FAMILIES } from '../../data/CombatData.js';

export class CombatCalculator {
    /**
     * Extracts the effective stat from an entity
     */
    static getFinalStat(entity, statName) {
        let baseVal = entity[statName] || 0;

        // Apply active buffs that match the requested stat
        if (entity.statusEffects && entity.statusEffects.length > 0) {
            const buffs = entity.statusEffects.filter(e =>
                e.type.startsWith('buff_') &&
                e.stat === statName &&
                e.duration > 0
            );
            const totalBuff = buffs.reduce((sum, b) => sum + (b.value || 0), 0);
            baseVal += totalBuff;
        }

        return Math.max(1, baseVal);
    }

    /**
     * Calculates the damage multiplier based on Attack vs Defense ratio (R)
     */
    static calculateDamageMultiplier(attackValue, defenseValue) {
        if (defenseValue <= 0) defenseValue = 1;
        const R = attackValue / defenseValue;
        
        // Redesigned: higher attack rewards more, defense stays meaningful longer
        if (R >= 10) return 3.0;       // 10x attack → 3.0x (was 1.0x)
        if (R >= 5)  return 2.0 + (R - 5) * 0.2;   // 5x → 2.0x, scaling up
        if (R >= 2)  return 1.0 + (R - 2) * 0.33;  // 2x → 1.0x, scaling up
        if (R >= 1)  return 0.5 + (R - 1) * 0.5;   // 1x → 0.5x, linear to 1.0x
        if (R >= 0.5) return R * 0.5;               // 0.5x → 0.25x
        
        return 0.2;  // Below 0.5x → barely scratches
    }

    /**
     * Calculates elemental efficiency
     */
    static getElementMultiplier(skillElement, targetElement) {
        if (!skillElement || !targetElement || targetElement === 'neutral') return 1.0;
        if (skillElement === targetElement) return 1.0;

        const relationships = {
            fire: 'wind',
            wind: 'storm',
            storm: 'water',
            water: 'fire'
        };

        if (relationships[skillElement] === targetElement) return 1.5;
        if (relationships[targetElement] === skillElement) return 0.5;
        
        return 1.0;
    }

    /**
     * Calculates evasion chance (0-100)
     */
    static calculateEvasionChance(attacker, defender) {
        let sAttacker = this.getFinalStat(attacker, 'speed');
        let sDefender = this.getFinalStat(defender, 'speed');

        // Apply Accuracy/Evasion multipliers from traits if present
        if (attacker.accuracyBonus) {
            sAttacker *= (1 + (attacker.accuracyBonus / 100));
        }

        const R = sDefender / sAttacker;

        if (R <= 1) {
            return Math.max(0, (R - 0.5) * 20);
        } else {
            return 10 + (R * 10);
        }
    }

    /**
     * Main calculation entry point
     * @returns {Object} { amount, evasionChance, isMiss, elementMult, isCrit }
     */
    static calculate(attacker, defender, skillData, skillLevel = 0, partyTraits = {}, forcedTier = null) {
        const evasionChance = this.calculateEvasionChance(attacker, defender);

        let critChance = attacker.critChanceBonus || 0;

        const isMiss = Math.random() * 100 < evasionChance;
        const isCrit = !isMiss && (Math.random() * 100 < critChance);

        if (isMiss) {
            return { amount: 0, evasionChance, isMiss: true, elementMult: 1, isCrit: false };
        }

        // Use hero's technique tier if available (infinite tier system), else fall back to skillData.tier
        const effectiveTier = forcedTier !== null ? forcedTier :
            ((skillData.family && attacker.techniqueTiers && attacker.techniqueTiers[skillData.family]) || skillData.tier || 1);
        const multiplier = 1.0 + (0.005 * effectiveTier * skillLevel);
        let baseStatValue = this.getFinalStat(attacker, skillData.stat);
        
        // Apply Party Traits
        if (skillData.stat === 'magicPower' && partyTraits.magicPowerBoost) {
            baseStatValue *= (1 + partyTraits.magicPowerBoost);
        }

        if (skillData.category === 'support') {
            const power = skillData.power || 0.1;
            const finalPercentage = power * multiplier;
            return { amount: finalPercentage, evasionChance: 0, isMiss: false, elementMult: 1, isCrit: false };
        } else {
            // Family-based damage calculation
            const familyData = skillData.family ? TECHNIQUE_FAMILIES[skillData.family] : null;
            let damageMultiplier = skillData.baseMultiplier || 1.0;
            let hits = 1;
            let effect = null;

            if (familyData) {
                const tier = effectiveTier;
                if (familyData.id === 'multiple_attack') {
                    // Multi-hit: hits = tier, per-hit decays slightly
                    hits = Math.max(1, tier);
                    const perHit = Math.max(0.4, familyData.baseMult - familyData.hitDecay * Math.max(0, tier - 2));
                    damageMultiplier = hits * perHit;
                } else {
                    // Single-hit families: base + growth per tier above 1
                    damageMultiplier = familyData.baseMult + familyData.growth * (tier - 1);
                }
                effect = familyData.effect || null;
            }

            let rawDamage = baseStatValue * damageMultiplier * multiplier;
            if (isCrit) rawDamage *= 1.5;
            
            const targetDefense = this.getFinalStat(defender, 'defense');
            const defMult = this.calculateDamageMultiplier(rawDamage, targetDefense);
            const elementMult = this.getElementMultiplier(skillData.element, defender.element);
            
            let finalDamage = Math.max(1, Math.floor(rawDamage * defMult * elementMult));
            
            // Apply physical damage reduction from party traits
            if (skillData.category === 'physical' && partyTraits.physicalDamageReduction) {
                finalDamage = Math.floor(finalDamage * (1 - partyTraits.physicalDamageReduction));
            }

            return { amount: finalDamage, evasionChance, isMiss: false, elementMult, isCrit, hits, effect };
        }
    }
}
