import { CombatCalculator } from '../core/CombatCalculator.js';
import { CombatAI } from '../core/CombatAI.js';
import { GambitService } from '../../../gambit/GambitService.js';
import { Result } from '../../core/Result.js';
import { SKILLS_DATA, CONSUMABLES_DATA, CORE_ALLY_EFFECTS } from '../../data/GameConstants.js';
import { MagicCircleService } from '../../../magic_circle/MagicCircleService.js';

export class BattleService {
    constructor(inventoryService) {
        this.inventory = inventoryService;
        this.reset();
    }

    reset() {
        this.heroes = [];
        this.enemies = [];
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.isOver = false;
        this.winner = null;
        this.log = [];
        this.autoBattle = false;
        this.itemUsedThisTurn = false;
    }

    startBattle(heroes, enemies, autoBattle = false) {
        this.reset();
        this.heroes = heroes;
        this.enemies = enemies;
        this.autoBattle = autoBattle;

        this._determineTurnOrder();
        this.partyTraits = this._calculatePartyTraits();

        return Result.ok({
            turnOrder: this.turnOrder.map(e => ({ id: e.id, name: e.name, type: (e.origin !== undefined || e.type === 'Hero') ? 'Hero' : 'Enemy' })),
            partyTraits: this.partyTraits
        });
    }

    _calculatePartyTraits() {
        const traits = {
            hpRegen: 0,
            physicalDamageReduction: 0,
            magicPowerBoost: 0,
            goldBonus: 1.0
        };

        this.heroes.forEach(hero => {
            if (hero.hp > 0) {
                switch (hero.origin) {
                    case 'origin_cook':
                        traits.hpRegen += 0.05;
                        break;
                    case 'origin_guard':
                        traits.physicalDamageReduction += 0.10;
                        break;
                    case 'origin_poet':
                        traits.magicPowerBoost += 0.10;
                        break;
                    case 'origin_thief':
                        traits.goldBonus += 0.10;
                        break;
                }
            }
        });

        return traits;
    }

    _determineTurnOrder() {
        this.turnOrder = [...this.heroes, ...this.enemies]
            .filter(e => e.hp > 0)
            .sort((a, b) => b.speed - a.speed);
    }

    nextTurn() {
        if (this.isOver) return Result.fail('error_battle_over');

        const currentEntity = this.turnOrder[this.currentTurnIndex];

        if (currentEntity.hp <= 0) {
            return this._advanceTurn();
        }

        // 0. Stamina Regeneration (8% max STA per turn)
        if (currentEntity.maxStamina > 0) {
            const regen = Math.floor(currentEntity.maxStamina * 0.08);
            currentEntity.stamina = Math.min(currentEntity.maxStamina, currentEntity.stamina + regen);
        }

        // 0.1 Stun / Sleep Check — skip turn if incapacitated
        const stunEffect = currentEntity.statusEffects && currentEntity.statusEffects.find(e => e.type === 'stun');
        if (stunEffect) {
            stunEffect.duration--;
            if (stunEffect.duration <= 0) {
                currentEntity.statusEffects = currentEntity.statusEffects.filter(e => e !== stunEffect);
            }
            const event = {
                type: 'STUN_SKIP',
                actorId: currentEntity.id,
                actorName: currentEntity.name,
                actorIsHero: this.heroes.includes(currentEntity)
            };
            this.log.push(event);
            return this._advanceTurn({ stunSkipped: true });
        }
        const sleepEffect = currentEntity.statusEffects && currentEntity.statusEffects.find(e => e.type === 'sleep');
        if (sleepEffect) {
            sleepEffect.duration--;
            if (sleepEffect.duration <= 0) {
                currentEntity.statusEffects = currentEntity.statusEffects.filter(e => e !== sleepEffect);
            }
            const event = {
                type: 'SLEEP_SKIP',
                actorId: currentEntity.id,
                actorName: currentEntity.name,
                actorIsHero: this.heroes.includes(currentEntity)
            };
            this.log.push(event);
            // Sleepers still regenerate stamina
            return this._advanceTurn({ sleepSkipped: true });
        }

        // 1. Process Status Effects (Poison, Burn, etc.)
        const statusResults = this._processStatusEffects(currentEntity);

        // 1.1 Process Party Traits (Regen)
        if (this.heroes.includes(currentEntity) && this.partyTraits.hpRegen > 0 && currentEntity.hp > 0) {
            const regenAmount = Math.floor(currentEntity.maxHp * this.partyTraits.hpRegen);
            if (regenAmount > 0) {
                currentEntity.hp = Math.min(currentEntity.maxHp, currentEntity.hp + regenAmount);
                const event = {
                    type: 'TRAIT_REGEN',
                    amount: regenAmount,
                    targetId: currentEntity.id,
                    targetName: currentEntity.name,
                    targetIsHero: true,
                    targetHp: currentEntity.hp,
                    targetMaxHp: currentEntity.maxHp
                };
                statusResults.push(event);
                this.log.push(event);
            }
        }

        if (currentEntity.hp <= 0) {
            this._checkBattleEnd();
            if (this.isOver) {
                return Result.ok({ statusEvents: statusResults, entityDefeated: true, battleOver: true, winner: this.winner });
            }
            return Result.ok({ statusEvents: statusResults, entityDefeated: true });
        }

        // 2. Perform Auto Action if applicable
        if (this.enemies.includes(currentEntity) || this.autoBattle) {
            return this.performAutoAction(currentEntity, statusResults);
        }

        return Result.ok({
            actionRequired: true,
            entity: { id: currentEntity.id, name: currentEntity.name },
            statusEvents: statusResults
        });
    }

    _processStatusEffects(entity) {
        if (!entity.statusEffects || entity.statusEffects.length === 0) return [];

        const isHero = this.heroes.includes(entity);
        const events = [];
        for (let i = entity.statusEffects.length - 1; i >= 0; i--) {
            const eff = entity.statusEffects[i];
            let damage = 0;

            if (eff.type === 'poison' || eff.type === 'burn') {
                damage = Math.floor(entity.maxHp * (eff.power || 0.05));
                entity.hp = Math.max(0, entity.hp - damage);
                const event = {
                    type: 'STATUS_TICK',
                    effectType: eff.type,
                    damage,
                    targetId: entity.id,
                    targetName: entity.name,
                    targetIsHero: isHero,
                    targetHp: entity.hp,
                    targetMaxHp: entity.maxHp
                };
                events.push(event);
                this.log.push(event);
            }

            eff.duration--;
            if (eff.duration <= 0) {
                entity.statusEffects.splice(i, 1);
                const event = {
                    type: 'STATUS_EXPIRED',
                    effectType: eff.type,
                    targetId: entity.id,
                    targetName: entity.name,
                    targetIsHero: isHero
                };
                events.push(event);
                this.log.push(event);
                if (entity.recalculateStats) entity.recalculateStats({});
            }
        }
        return events;
    }

    performAutoAction(entity, statusResults = []) {
        const allies = this.heroes.includes(entity) ? this.heroes : this.enemies;
        const enemies = this.heroes.includes(entity) ? this.enemies : this.heroes;

        // Spec 4.0: Gambits override CombatAI entirely when enabled
        if (entity.gambits && entity.gambits.length > 0) {
            const gambitDecision = GambitService.evaluate(entity, allies, enemies);
            if (gambitDecision) {
                if (gambitDecision.skillId) {
                    return this.executeAction(entity, gambitDecision.skillId, gambitDecision.targetIndex, statusResults);
                }
                if (gambitDecision.spellIndex !== undefined) {
                    const spell = entity.spellCodex?.[gambitDecision.spellIndex];
                    if (spell) {
                        return this.castSpell(entity, spell, gambitDecision.targetIndex);
                    }
                }
                if (gambitDecision.itemId) {
                    const targetId = gambitDecision.targetIndex !== null ? allies[gambitDecision.targetIndex]?.id : entity.id;
                    return this.useConsumable(entity, gambitDecision.itemId, targetId);
                }
                if (gambitDecision.defend) {
                    return this._handleDefend(entity);
                }
                if (gambitDecision.flee) {
                    return this._handleFlee(entity, allies);
                }
            }
            // No gambit matched OR action failed → Slot 0 Fallback
            const fallback = GambitService.getFallbackAction(entity, allies);
            if (fallback.skillId) {
                return this.executeAction(entity, fallback.skillId, fallback.targetIndex, statusResults);
            }
            if (fallback.defend) {
                return this._handleDefend(entity);
            }
            return Result.ok({ actionEvents: [], battleOver: false });
        }

        // No gambits → CombatAI takes over
        const context = { actor: entity, allies, enemies, type: 'smart' };
        const decision = CombatAI.decideAction(context);
        if (decision.spellIndex !== undefined) {
            const spell = entity.spellCodex?.[decision.spellIndex];
            if (spell) {
                return this.castSpell(entity, spell, decision.targetIndex);
            }
        }
        return this.executeAction(entity, decision.skillId, decision.targetIndex, statusResults);
    }

    _handleDefend(entity) {
        const event = {
            type: 'defend',
            actorId: entity.id,
            actorName: entity.name,
            message: `${entity.name} defends.`,
            targetIsHero: this.heroes.includes(entity)
        };
        this.log.push(event);
        // v1.0: Defend simply ends the turn. In future, could add a temporary defense buff.
        return Result.ok({ actionEvents: [event], battleOver: false });
    }

    _handleFlee(entity, allies) {
        const success = Math.random() < 0.5;
        if (success) {
            const event = {
                type: 'flee',
                actorId: entity.id,
                actorName: entity.name,
                message: `${entity.name} leads the party to safety!`,
                success: true,
                targetIsHero: this.heroes.includes(entity)
            };
            this.log.push(event);
            this.isOver = true;
            this.winner = 'escape';
            return Result.ok({ actionEvents: [event], battleOver: true, winner: 'escape' });
        } else {
            const event = {
                type: 'flee',
                actorId: entity.id,
                actorName: entity.name,
                message: `${entity.name} attempted to flee but failed!`,
                success: false,
                targetIsHero: this.heroes.includes(entity)
            };
            this.log.push(event);
            return Result.ok({ actionEvents: [event], battleOver: false });
        }
    }

    executeAction(actor, skillId, targetIndex = null, statusResults = [], forcedTier = null) {
        if (this.isOver) return Result.fail('error_battle_over');

        const skillData = SKILLS_DATA[skillId];
        if (!skillData) return Result.fail('error_invalid_skill');

        const isActorHero = this.heroes.includes(actor);

        // Determine effective tier for physical skills
        const heroTier = (skillData.family && actor.techniqueTiers && actor.techniqueTiers[skillData.family]) || 1;
        const effectiveTier = forcedTier !== null ? Math.min(forcedTier, heroTier) : heroTier;

        // Compute resource costs dynamically
        const staCost = skillData.staminaCostBase + skillData.staminaCostPerTier * (effectiveTier - 1);

        // Resource cost: physical uses stamina, magic uses MP
        // Body inscription only applies to Technique Codex skills (not basic attack)
        const isBasicAttack = skillId === 'single_strike';
        const isBodyInscribed = isActorHero && !isBasicAttack && actor.bodyInscription && actor.bodyInscription.glyphIds && actor.bodyInscription.glyphIds.length > 0;
        const hybridMpCost = isActorHero && actor.getHybridMpCost ? actor.getHybridMpCost() : 0;
        if (skillData.category === 'physical') {
            if (actor.stamina < staCost) return Result.fail('error_not_enough_stamina');
            if (isBodyInscribed && hybridMpCost > 0) {
                if (actor.mp < hybridMpCost) return Result.fail('error_not_enough_mp');
                actor.mp -= hybridMpCost;
            }
            actor.stamina -= staCost;
        } else {
            if (actor.mp < skillData.mpCost) return Result.fail('error_not_enough_mp');
            actor.mp -= skillData.mpCost;
            // Magic spells cost MP only, even for inscribed heroes
        }

        // Gain Magic Insight for casting magic spells
        if (isActorHero && skillData.category === 'magic' && actor.magicXp !== undefined) {
            const insight = Math.floor((skillData.mpCost || 0) * 0.5);
            if (insight > 0) {
                actor.magicXp += insight;
                actor.magicTier = MagicCircleService.getMagicTier(actor.magicXp);
            }
        }

        // Record technique use for infinite tier progression
        let evolutionResult = null;
        if (skillData.family && actor.recordTechniqueUse) {
            evolutionResult = actor.recordTechniqueUse(skillData.family);
            if (evolutionResult && this.log) {
                this.log.push({
                    type: 'TECHNIQUE_EVOLVED',
                    actorId: actor.id,
                    actorName: actor.name,
                    family: skillData.family,
                    tier: evolutionResult.newTier
                });
            }
        }

        // skillLevel is deprecated; the family system uses techniqueTiers instead
        const skillLevel = 0;

        const allies = isActorHero ? this.heroes : this.enemies;
        const enemies = isActorHero ? this.enemies : this.heroes;

        // Determine Targets
        let baseTargets = [];
        if (skillData.targetType === 'all_allies') {
            baseTargets = allies.filter(a => a.hp > 0);
        } else if (skillData.targetType === 'single_ally') {
            baseTargets = [targetIndex !== null ? allies[targetIndex] : actor];
        } else if (skillData.targetType === 'all_enemies') {
            baseTargets = enemies.filter(e => e.hp > 0);
        } else if (skillData.targetType === 'single_enemy') {
            if (targetIndex !== null && enemies[targetIndex]?.hp > 0) {
                baseTargets = [enemies[targetIndex]];
            } else {
                const alive = enemies.filter(e => e.hp > 0);
                baseTargets = alive.length > 0 ? [alive[0]] : [];
            }
        } else if (skillData.targetType === 'self') {
            baseTargets = [actor];
        }

        if (baseTargets.length === 0) return Result.fail('error_no_targets');

        // Handle Cleave: scales number of adjacent targets with tier
        if (skillData.cleave && baseTargets.length > 0) {
            const heroTier = actor.techniqueTiers && actor.techniqueTiers[skillId] || 1;
            let maxTargets = 2; // Tier 1-2: primary + 1 adjacent
            if (heroTier >= 5) {
                maxTargets = 99; // Tier 5+: all enemies
            } else if (heroTier >= 3) {
                maxTargets = 3; // Tier 3-4: primary + 2 adjacent
            }
            const mainTarget = baseTargets[0];
            const others = enemies.filter(e => e.hp > 0 && e !== mainTarget);
            const extra = others.slice(0, maxTargets - 1);
            baseTargets = [mainTarget, ...extra];
        }

        // Handle Splash/Jump
        let targetsWithMultipliers = baseTargets.map(t => ({ target: t, mult: 1.0 }));
        const mainTarget = baseTargets[0];

        if (skillData.splash && mainTarget) {
            const others = enemies.filter(e => e.hp > 0 && e !== mainTarget);
            others.forEach(o => targetsWithMultipliers.push({ target: o, mult: skillData.splash }));
        }

        if (skillData.jump && mainTarget) {
            const others = enemies.filter(e => e.hp > 0 && e !== mainTarget);
            let currentMult = skillData.jump;
            others.forEach(o => {
                targetsWithMultipliers.push({ target: o, mult: currentMult });
                currentMult *= skillData.jump;
            });
        }

        const actionEvents = [];

        targetsWithMultipliers.forEach(({ target, mult }) => {
            const result = CombatCalculator.calculate(actor, target, skillData, skillLevel, this.partyTraits, effectiveTier);

            const event = {
                type: skillData.category === 'support' ? 'HEAL' : 'DAMAGE',
                actorId: actor.id,
                actorName: actor.name,
                actorIsHero: isActorHero,
                targetId: target.id,
                targetName: target.name,
                targetIsHero: this.heroes.includes(target),
                skillId: skillId,
                skillName: skillId,
                effectiveTier: effectiveTier,
                isMiss: result.isMiss,
                amount: 0,
                isCrit: result.isCrit,
                elementMult: result.elementMult,
                hits: result.hits || 1
            };

            if (!result.isMiss) {
                if (skillData.category === 'support') {
                    const healAmount = Math.floor(target.maxHp * result.amount * mult);
                    target.hp = Math.min(target.maxHp, target.hp + healAmount);
                    event.amount = healAmount;
                } else {
                    let damage = Math.max(1, Math.floor(result.amount * mult));

                    // Phoenix: survive lethal damage once
                    if (target.hp - damage <= 0 && this.heroes.includes(target) && target.hasPhoenix && !target.phoenixUsed) {
                        target.hp = 1;
                        target.phoenixUsed = true;
                        damage = 0;
                        event.phoenixTriggered = true;
                    } else {
                        target.hp = Math.max(0, target.hp - damage);
                    }

                    event.amount = damage;
                    if (target.hp <= 0) event.targetDefeated = true;

                    // Track lifetime stats for heroes
                    if (isActorHero && actor.lifetimeStats) {
                        actor.lifetimeStats.damageDealt += damage;
                        if (damage > actor.lifetimeStats.highestDamageDealt) {
                            actor.lifetimeStats.highestDamageDealt = damage;
                        }
                    }
                    if (this.heroes.includes(target) && target.lifetimeStats) {
                        target.lifetimeStats.damageTaken += damage;
                    }
                    if (isActorHero && actor.lifetimeStats && target.hp <= 0 && !this.heroes.includes(target)) {
                        actor.lifetimeStats.enemiesDefeated++;
                    }

                    // Side effects from family effects (stun, poison, loot)
                    if (result.effect === 'stun' && Math.random() < 0.3) {
                        this._applyStatusEffect(target, { type: 'stun', duration: 1 });
                        event.statusApplied = 'stun';
                    }
                    if (result.effect === 'poison' && Math.random() < 0.5) {
                        this._applyStatusEffect(target, { type: 'poison', duration: 3, power: 0.05 });
                        event.statusApplied = 'poison';
                    }
                    if (result.effect === 'loot') {
                        const tier = actor.techniqueTiers && actor.techniqueTiers[skillId] || 1;
                        const lootRoll = this._rollPlunderLoot(tier);
                        if (lootRoll) {
                            event.loot = lootRoll;
                            // Add gold directly; items go to post-battle rewards
                            if (lootRoll.gold > 0) {
                                // Gold is added to a pending battle reward pool
                            }
                        }
                    }

                    // Vampirism: heal attacker for a percentage of damage dealt
                    if (isActorHero && actor.vampirism > 0 && damage > 0) {
                        const vampHeal = Math.floor(damage * actor.vampirism);
                        if (vampHeal > 0) {
                            const prevHp = actor.hp;
                            actor.hp = Math.min(actor.maxHp, actor.hp + vampHeal);
                            const actualHeal = actor.hp - prevHp;
                            if (actualHeal > 0) {
                                const vampEvent = {
                                    type: 'VAMP',
                                    actorId: actor.id,
                                    actorName: actor.name,
                                    actorIsHero: true,
                                    targetId: actor.id,
                                    targetName: actor.name,
                                    targetIsHero: true,
                                    amount: actualHeal,
                                    targetHp: actor.hp,
                                    targetMaxHp: actor.maxHp
                                };
                                this.log.push(vampEvent);
                            }
                        }
                    }
                }
            }
            event.targetHp = target.hp;
            event.targetMaxHp = target.maxHp;
            actionEvents.push(event);
            this.log.push(event);
        });

        this._checkBattleEnd();
        if (this.isOver) {
            return Result.ok({ statusEvents: statusResults, actionEvents, battleOver: true, winner: this.winner });
        }

        return this._advanceTurn({ statusEvents: statusResults, actionEvents });
    }

    _applyStatusEffect(target, effect) {
        if (!target.statusEffects) target.statusEffects = [];
        const existing = target.statusEffects.find(e => e.type === effect.type);
        if (existing) {
            existing.duration = Math.max(existing.duration, effect.duration);
            if (effect.value !== undefined) {
                existing.value = Math.max(existing.value || 0, effect.value);
            }
        } else {
            target.statusEffects.push({ ...effect });
        }
        if (target.recalculateStats) target.recalculateStats({});
    }

    /**
     * Cast a spell from the hero's Spell Codex.
     * @param {Object} actor - the casting hero
     * @param {Object} spell - spell object from codex
     * @param {number|null} targetIndex - target enemy index (for single-target spells)
     * @returns {Result}
     */
    castSpell(actor, spell, targetIndex = null) {
        if (this.isOver) return Result.fail('error_battle_over');
        if (!spell) return Result.fail('error_invalid_spell');

        const isActorHero = this.heroes.includes(actor);

        // Resource check
        if (actor.mp < spell.mpCost) {
            return Result.fail('error_not_enough_mp');
        }
        actor.mp -= spell.mpCost;

        // Gain Magic Insight
        if (actor.magicXp !== undefined) {
            const insight = MagicCircleService.calculateInsight(spell, actor.glyphMastery || {});
            if (insight > 0) {
                actor.magicXp += insight;
                const oldTier = actor.magicTier || 1;
                actor.magicTier = MagicCircleService.getMagicTier(actor.magicXp);
                if (actor.magicTier > oldTier && this.log) {
                    this.log.push({
                        type: 'MAGIC_TIER_UP',
                        actorId: actor.id,
                        actorName: actor.name,
                        fromTier: oldTier,
                        toTier: actor.magicTier
                    });
                }
            }
        }

        // Record glyph uses for mastery
        if (spell.glyphIds && actor.recordGlyphUse) {
            for (const gid of spell.glyphIds) {
                actor.recordGlyphUse(gid);
            }
        }

        const allies = isActorHero ? this.heroes : this.enemies;
        const enemies = isActorHero ? this.enemies : this.heroes;

        // Determine targets
        let baseTargets = [];
        if (spell.targetType === 'all_allies') {
            baseTargets = allies.filter(a => a.hp > 0);
        } else if (spell.targetType === 'single_ally') {
            baseTargets = [targetIndex !== null ? allies[targetIndex] : actor];
        } else if (spell.targetType === 'all_enemies') {
            baseTargets = enemies.filter(e => e.hp > 0);
        } else {
            // single_enemy or default
            if (targetIndex !== null && enemies[targetIndex]?.hp > 0) {
                baseTargets = [enemies[targetIndex]];
            } else {
                const alive = enemies.filter(e => e.hp > 0);
                baseTargets = alive.length > 0 ? [alive[0]] : [];
            }
        }

        if (baseTargets.length === 0) {
            return Result.fail('error_no_targets');
        }

        const isSupport = spell.category === 'support' ||
                          spell.targetType === 'single_ally' ||
                          spell.targetType === 'all_allies';

        if (isSupport) {
            return this._castSupportSpell(actor, spell, baseTargets, isActorHero);
        }
        return this._castOffensiveSpell(actor, spell, baseTargets, isActorHero);
    }

    _castOffensiveSpell(actor, spell, baseTargets, isActorHero) {
        const actionEvents = [];
        const effects = spell.effects || {};

        for (const target of baseTargets) {
            // Elemental multiplier
            const elementMult = CombatCalculator.getElementMultiplier(spell.element, target.element);

            // Defense reduction
            const targetDefense = CombatCalculator.getFinalStat(target, 'defense');
            const rawDamage = spell.damage * elementMult;
            const defMult = CombatCalculator.calculateDamageMultiplier(rawDamage, targetDefense);

            let finalDamage = Math.max(1, Math.floor(rawDamage * defMult));

            // Pierce effect: ignore % of defense
            if (effects.pierce > 0) {
                const pierceBonus = Math.floor(finalDamage * effects.pierce);
                finalDamage += pierceBonus;
            }

            // Apply damage
            target.hp = Math.max(0, target.hp - finalDamage);

            const event = {
                type: 'SPELL_DAMAGE',
                actorId: actor.id,
                actorName: actor.name,
                actorIsHero: isActorHero,
                targetId: target.id,
                targetName: target.name,
                targetIsHero: this.heroes.includes(target),
                spellName: spell.name,
                element: spell.element,
                amount: finalDamage,
                isMiss: false,
                isCrit: false,
                elementMult,
                targetDefeated: target.hp <= 0
            };

            // Apply status effects
            if (effects.poisonStacks > 0) {
                this._applyStatusEffect(target, { type: 'poison', duration: effects.poisonStacks * 2 });
                event.statusApplied = 'poison';
            }
            if (effects.sleepChance > 0 && Math.random() < effects.sleepChance) {
                this._applyStatusEffect(target, { type: 'sleep', duration: 2 });
                event.statusApplied = 'sleep';
            }

            // Leech (lifesteal)
            if (effects.lifesteal > 0 && finalDamage > 0) {
                const heal = Math.floor(finalDamage * effects.lifesteal);
                actor.hp = Math.min(actor.maxHp, actor.hp + heal);
                this.log.push({
                    type: 'HEAL',
                    actorId: actor.id,
                    actorName: actor.name,
                    targetId: actor.id,
                    targetName: actor.name,
                    amount: heal,
                    source: 'leech'
                });
            }

            actionEvents.push(event);
            this.log.push(event);
        }

        this._checkBattleEnd();
        if (this.isOver) {
            return Result.ok({ actionEvents, battleOver: true, winner: this.winner });
        }
        return this._advanceTurn({ actionEvents });
    }

    _castSupportSpell(actor, spell, targets, isActorHero) {
        const allyEffect = CORE_ALLY_EFFECTS[spell.element];
        const actionEvents = [];

        for (const target of targets) {
            const amount = Math.max(1, Math.floor(spell.damage * (spell.allyFactor || 0.2)));
            const event = {
                actorId: actor.id,
                actorName: actor.name,
                actorIsHero: isActorHero,
                targetId: target.id,
                targetName: target.name,
                targetIsHero: this.heroes.includes(target),
                spellName: spell.name,
                element: spell.element,
                amount: 0
            };

            if (!allyEffect) {
                // Fallback: generic heal if element not mapped
                target.hp = Math.min(target.maxHp, target.hp + amount);
                event.type = 'HEAL';
                event.amount = amount;
            } else {
                switch (allyEffect.type) {
                    case 'heal_hp':
                        target.hp = Math.min(target.maxHp, target.hp + amount);
                        event.type = 'HEAL';
                        event.amount = amount;
                        break;
                    case 'restore_mp':
                        target.mp = Math.min(target.maxMp, target.mp + amount);
                        event.type = 'MP_RESTORE';
                        event.amount = amount;
                        break;
                    case 'restore_stamina':
                        if (target.stamina !== undefined && target.maxStamina !== undefined) {
                            target.stamina = Math.min(target.maxStamina, target.stamina + amount);
                            event.type = 'STAMINA_RESTORE';
                            event.amount = amount;
                        } else {
                            event.type = 'SPELL_SUPPORT';
                            event.amount = 0;
                        }
                        break;
                    case 'buff_atk':
                        this._applyStatusEffect(target, { type: 'buff_atk', duration: allyEffect.duration, value: amount, stat: allyEffect.stat });
                        event.type = 'BUFF_ATK';
                        event.amount = amount;
                        break;
                    case 'buff_def':
                        this._applyStatusEffect(target, { type: 'buff_def', duration: allyEffect.duration, value: amount, stat: allyEffect.stat });
                        event.type = 'BUFF_DEF';
                        event.amount = amount;
                        break;
                    case 'buff_spd':
                        this._applyStatusEffect(target, { type: 'buff_spd', duration: allyEffect.duration, value: amount, stat: allyEffect.stat });
                        event.type = 'BUFF_SPD';
                        event.amount = amount;
                        break;
                    case 'buff_crit':
                        this._applyStatusEffect(target, { type: 'buff_crit', duration: allyEffect.duration, value: amount, stat: allyEffect.stat });
                        event.type = 'BUFF_CRIT';
                        event.amount = amount;
                        break;
                    default:
                        target.hp = Math.min(target.maxHp, target.hp + amount);
                        event.type = 'HEAL';
                        event.amount = amount;
                }
            }

            actionEvents.push(event);
            this.log.push(event);
        }

        this._checkBattleEnd();
        if (this.isOver) {
            return Result.ok({ actionEvents, battleOver: true, winner: this.winner });
        }
        return this._advanceTurn({ actionEvents });
    }

    useConsumable(actor, consumableId, targetId = null) {
        if (this.isOver) return Result.fail('error_battle_over');
        if (this.itemUsedThisTurn) return Result.fail('error_item_already_used');

        const useResult = this.inventory.useConsumable(consumableId);
        if (!useResult.success) return useResult;

        const data = CONSUMABLES_DATA[consumableId];
        if (!data) return Result.fail('error_invalid_consumable');

        const target = [...this.heroes, ...this.enemies].find(e => e.id === targetId) || actor;

        let amount = 0;
        let type = data.type;

        if (type === 'HEAL_HP') {
            amount = Math.floor(target.maxHp * data.amount);
            target.hp = Math.min(target.maxHp, target.hp + amount);
        } else if (type === 'HEAL_MP') {
            amount = Math.floor(target.maxMp * data.amount);
            target.mp = Math.min(target.maxMp, target.mp + amount);
        } else if (type === 'ESCAPE') {
            this.isOver = true;
            this.winner = 'escape';
        }

        const event = {
            type: 'USE_CONSUMABLE',
            actorId: actor.id,
            actorName: actor.name,
            actorIsHero: this.heroes.includes(actor),
            targetId: target.id,
            targetName: target.name,
            targetIsHero: this.heroes.includes(target),
            consumableId,
            healType: type,
            amount,
            targetHp: target.hp,
            targetMaxHp: target.maxHp
        };

        this.log.push(event);
        this.itemUsedThisTurn = true;

        return Result.ok({ event });
    }

    /**
     * Roll Plunder loot based on technique tier.
     * @param {number} tier
     * @returns {Object|null} { gold, items } or null if no loot
     */
    _rollPlunderLoot(tier) {
        // Loot chance and quality scale with tier
        let chance = 0.15;
        let goldMin = 5, goldMax = 15;
        const items = [];

        if (tier >= 12) {
            chance = 0.70;
            goldMin = 50; goldMax = 150;
            items.push('tiny_hp_potion');
            if (Math.random() < 0.3) items.push('material_iron');
        } else if (tier >= 8) {
            chance = 0.50;
            goldMin = 30; goldMax = 80;
            if (Math.random() < 0.5) items.push('tiny_hp_potion');
        } else if (tier >= 5) {
            chance = 0.35;
            goldMin = 20; goldMax = 50;
            if (Math.random() < 0.5) items.push('tiny_hp_potion');
        } else if (tier >= 3) {
            chance = 0.25;
            goldMin = 10; goldMax = 30;
            if (Math.random() < 0.3) items.push('tiny_hp_potion');
        }

        if (Math.random() >= chance) return null;

        const gold = Math.floor(goldMin + Math.random() * (goldMax - goldMin + 1));
        return { gold, items };
    }

    _advanceTurn(data = {}) {
        this.currentTurnIndex++;
        this.itemUsedThisTurn = false;
        if (this.currentTurnIndex >= this.turnOrder.length) {
            this._determineTurnOrder();
            this.currentTurnIndex = 0;
        }
        const nextEntity = this.turnOrder[this.currentTurnIndex];
        return Result.ok({ ...data, nextEntityId: nextEntity?.id });
    }

    _checkBattleEnd() {
        const allHeroesDead = this.heroes.every(h => h.hp <= 0);
        const allEnemiesDead = this.enemies.every(e => e.hp <= 0);

        if (allHeroesDead) {
            this.isOver = true;
            this.winner = 'enemies';
        } else if (allEnemiesDead) {
            this.isOver = true;
            this.winner = 'heroes';
        }

        return Result.ok({ isOver: this.isOver, winner: this.winner });
    }
}
