import { SKILLS_DATA } from '../../shared/data/CombatData.js';
import { WEAPON_FAMILIES, ARMOR_ARCHETYPES, MATERIAL_TIERS, EQUIPMENT_SET_BONUSES } from '../../shared/data/EquipmentData.js';
import { GLYPH_DATA } from '../../shared/data/MagicCircleData.js';
import { Result } from '../../shared/core/Result.js';
import { MagicCircleService } from '../../magic_circle/MagicCircleService.js';
import { HeroMigrationService } from '../services/HeroMigrationService.js';

export class Hero {
    static SKILL_POINT_MILESTONES = [1, 5, 10, 15, 20, 25];
    static MAX_FAMILIES = 6;

    constructor(data) {
        this.id = data.id || crypto.randomUUID();
        this.name = data.name || 'Unknown Hero';
        this.origin = data.origin || 'origin_warrior';
        this.level = data.level || 1;
        this.exp = data.exp || 0;
        this.statPoints = data.statPoints !== undefined ? data.statPoints : 5;
        this.avatar = data.avatar || null;

        // Base stats
        this.baseMaxHp = data.baseMaxHp || 30;
        this.baseMaxMp = data.baseMaxMp || 15;
        this.baseStrength = data.baseStrength || 8;
        this.baseSpeed = data.baseSpeed || 4;
        this.baseDefense = data.baseDefense || 4;
        this.baseMagicPower = data.baseMagicPower || 4;

        // Dynamic state
        this.hp = data.hp ?? this.baseMaxHp;
        this.mp = data.mp ?? this.baseMaxMp;
        this.status = data.status || 'resting';

        // --- Physical Skill System (Family-based) ---
        // Migrate from old flat skill system if needed
        if (data.knownFamilies) {
            // New format
            this.knownFamilies = [...data.knownFamilies];
            this.skillPoints = data.skillPoints !== undefined ? data.skillPoints : this._computeSkillPointsFromLevel();
            this.techniqueUses = data.techniqueUses || {};
            this.techniqueTiers = data.techniqueTiers || {};
        } else if (data.skills) {
            // Old format — migrate
            const migration = HeroMigrationService.migrateOldSkills(
                data.skills, data.techniqueTiers, data.techniqueUses, this._computeSkillPointsFromLevel()
            );
            this.knownFamilies = migration.knownFamilies;
            this.skillPoints = migration.skillPoints;
            this.techniqueUses = migration.techniqueUses;
            this.techniqueTiers = migration.techniqueTiers;
        } else {
            // Fresh hero
            this.knownFamilies = ['single_strike'];
            this.skillPoints = this._computeSkillPointsFromLevel();
            this.techniqueUses = {};
            this.techniqueTiers = {};
        }

        // Ensure single_strike is always present
        if (!this.knownFamilies.includes('single_strike')) {
            this.knownFamilies.unshift('single_strike');
        }

        this.magicXp = data.magicXp || 0;
        this.magicTier = data.magicTier || MagicCircleService.getMagicTier(this.magicXp);
        this.knownGlyphs = HeroMigrationService.migrateKnownGlyphs(
            data.knownGlyphs || data.glyphRepertoire || (this.origin === 'origin_arcane_initiate' ? ['core_fire', 'power_plus'] : []),
            this.origin
        );
        this.glyphMastery = HeroMigrationService.migrateGlyphMastery(data.glyphMastery, this.knownGlyphs);
        this.spellCodex = data.spellCodex || [];
        this.lifetimeStats = data.lifetimeStats || {
            enemiesDefeated: 0,
            damageDealt: 0,
            damageTaken: 0,
            expeditionsCompleted: 0,
            battlesWon: 0,
            battlesLost: 0,
            highestDamageDealt: 0
        };
        this.titles = data.titles || [];
        // Migrate old bodyInscription (array of skill IDs) to new format
        this.bodyInscription = HeroMigrationService.migrateBodyInscription(data.bodyInscription);
        this.pendingBodyInscription = data.pendingBodyInscription || null;
        this.bodyInscriptionDaysRemaining = data.bodyInscriptionDaysRemaining || 0;
        this.gambits = HeroMigrationService.migrateGambits(data.gambits || []);
        this.fallbackAction = data.fallbackAction || 'basic_attack';
        this.presetId = data.presetId || null;
        this.statusEffects = data.statusEffects || [];
        this.phoenixUsed = data.phoenixUsed || false;
        this.mealBuffs = data.mealBuffs || [];

        // --- Fatigue System ---
        this.fatigue = data.fatigue || 0;
        this.maxFatigue = 100;

        this.equipment = data.equipment || {
            head: null,
            body: null,
            legs: null,
            leftHand: null,
            rightHand: null,
            accessory: null
        };

        // Final calculated stats
        this.recalculateStats();

        // Stamina is derived from STR/DEF/Level, so it must be set AFTER recalculateStats
        this.stamina = data.stamina ?? this.maxStamina;
    }

    /**
     * Compute how many skill points a hero should have at their current level.
     * Milestones: 1, 5, 10, 15, 20, 25
     */
    _computeSkillPointsFromLevel() {
        return Hero.SKILL_POINT_MILESTONES.filter(m => m <= this.level).length;
    }

    /**
     * Learn a new glyph. Idempotent.
     */
    learnGlyph(glyphId) {
        if (this.knownGlyphs.includes(glyphId)) return Result.fail('heroes_error_glyph_already_known');
        this.knownGlyphs.push(glyphId);
        if (!this.glyphMastery[glyphId]) {
            this.glyphMastery[glyphId] = { tier: 1, uses: 0 };
        }
        return Result.ok({ glyphId, tier: 1 });
    }

    /**
     * Record a glyph use and check for mastery evolution.
     * @returns {Object|null} evolution info if tier increased
     */
    recordGlyphUse(glyphId) {
        if (!this.glyphMastery[glyphId]) return null;
        this.glyphMastery[glyphId].uses++;
        const current = this.glyphMastery[glyphId].tier;
        const newTier = MagicCircleService.checkGlyphMastery(glyphId, current, this.glyphMastery[glyphId].uses);
        if (newTier) {
            this.glyphMastery[glyphId].tier = newTier;
            return { glyphId, fromTier: current, toTier: newTier };
        }
        return null;
    }

    /**
     * Inscribe a composed spell to the hero's Spell Codex (max 6).
     */
    inscribeSpell(spell) {
        const validation = MagicCircleService.validateInscription(spell, this.magicTier, this.spellCodex.length);
        if (!validation.success) return validation;
        this.spellCodex.push(spell);
        return Result.ok({ spell });
    }

    /**
     * Replace a spell in the Codex at a given index.
     */
    replaceSpell(index, spell) {
        if (index < 0 || index >= this.spellCodex.length) {
            return Result.fail('heroes_error_codex_index_invalid');
        }
        this.spellCodex[index] = spell;
        return Result.ok({ spell });
    }

    /**
     * Remove a spell from the Codex.
     */
    removeSpell(index) {
        if (index < 0 || index >= this.spellCodex.length) {
            return Result.fail('heroes_error_codex_index_invalid');
        }
        this.spellCodex.splice(index, 1);
        return Result.ok(true);
    }

    /**
     * Cast a spell: consume MP, gain Magic Insight, record glyph uses.
     */
    castSpell(spell) {
        if (!spell) return Result.fail('heroes_error_spell_invalid');
        if (!MagicCircleService.canCast(spell, this.magicTier)) {
            return Result.fail('heroes_error_magic_tier_low');
        }
        if (this.mp < spell.mpCost) {
            return Result.fail('heroes_error_mp_not_enough');
        }

        this.mp -= spell.mpCost;

        // Gain Magic Insight
        const insight = MagicCircleService.calculateInsight(spell, this.glyphMastery);
        this.magicXp += insight;
        const oldTier = this.magicTier;
        this.magicTier = MagicCircleService.getMagicTier(this.magicXp);

        // Record glyph uses for mastery
        const evolutions = [];
        for (const gid of spell.glyphIds) {
            if (this.knownGlyphs.includes(gid)) {
                const evo = this.recordGlyphUse(gid);
                if (evo) evolutions.push(evo);
            }
        }

        return Result.ok({
            spell,
            mpCost: spell.mpCost,
            insightGained: insight,
            magicTierUp: this.magicTier > oldTier ? { from: oldTier, to: this.magicTier } : null,
            glyphEvolutions: evolutions
        });
    }

    getTraitMultipliers() {
        const mults = {
            maxHp: 1.0,
            maxMp: 1.0,
            strength: 1.0,
            speed: 1.0,
            defense: 1.0,
            magicPower: 1.0,
            critChance: 0,
            accuracy: 1.0,
            goldBonus: 1.0,
            mpRecovery: 1.0
        };

        switch (this.origin) {
            case 'origin_clown':
                mults.critChance += 15;
                mults.accuracy -= 0.05;
                break;
            case 'origin_warrior':
                mults.defense *= 1.10;
                mults.maxHp *= 1.05;
                break;
            case 'origin_thief':
                mults.speed *= 1.10;
                mults.goldBonus *= 1.10;
                break;
            case 'origin_farmer':
                mults.maxHp *= 1.15;
                break;
            case 'origin_monk':
                mults.maxMp *= 1.15;
                mults.mpRecovery *= 1.20;
                break;
            case 'origin_cook':
                mults.maxHp *= 1.05;
                break;
            case 'origin_guard':
                mults.defense *= 1.15;
                break;
            case 'origin_poet':
                mults.maxMp *= 1.10;
                mults.magicPower *= 1.10;
                break;
            case 'origin_arcane_initiate':
                mults.magicPower *= 1.25;
                mults.maxMp *= 1.20;
                mults.strength *= 0.85;
                mults.defense *= 0.90;
                break;
        }

        return mults;
    }

    recalculateStats(villageUpgrades = {}) {
        const traitMults = this.getTraitMultipliers();

        let equipBonus = {
            maxHp: 0,
            maxMp: 0,
            strength: 0,
            speed: 0,
            defense: 0,
            magicPower: 0,
            evasion: 0,
            critChance: 0,
            accuracy: 0,
            mpCostReduction: 0,
            vampirism: 0,
            hasPhoenix: false
        };

        Object.values(this.equipment).forEach(item => {
            if (!item) return;

            if (item.type === 'weapon') {
                const family = WEAPON_FAMILIES[item.family];
                const tier = MATERIAL_TIERS[item.material];
                if (family && tier) {
                    const upgradeMult = Math.pow(1.1, item.level || 0);
                    const itemPower = 2 * tier.mult * upgradeMult;
                    equipBonus.strength += itemPower * family.dmgMult;
                    equipBonus.speed += family.spdBonus;
                    equipBonus.evasion += family.evaBonus || 0;
                    if (family.magBonus) equipBonus.magicPower += family.magBonus * tier.mult * upgradeMult;
                    if (family.mpCostReduction) equipBonus.mpCostReduction += family.mpCostReduction;
                }
            } else if (item.type === 'armor') {
                const arch = ARMOR_ARCHETYPES[item.archetype];
                const tier = MATERIAL_TIERS[item.material];
                if (arch && tier) {
                    const upgradeMult = Math.pow(1.1, item.level || 0);
                    const itemPower = 5 * tier.mult * upgradeMult;
                    equipBonus.defense += itemPower * arch.defMult;
                    equipBonus.maxHp += itemPower * (arch.hpMult || 0);
                    equipBonus.maxMp += itemPower * (arch.mpMult || 0);
                    equipBonus.magicPower += itemPower * (arch.magMult || 0);
                    equipBonus.speed += arch.spdPenalty || 0;
                    equipBonus.evasion += arch.evaBonus || arch.evaPenalty || 0;
                }
            }

            if (item.affixes) {
                item.affixes.forEach(aff => {
                    switch(aff) {
                        case 'vampire': equipBonus.vampirism += 0.05; break;
                        case 'sage': equipBonus.mpCostReduction += 0.10; break;
                        case 'titan':
                            equipBonus.maxHp += (this.baseMaxHp * 0.20);
                            equipBonus.speed -= 2;
                            break;
                        case 'assassin':
                            equipBonus.critChance += 10;
                            equipBonus.accuracy += 20;
                            break;
                        case 'phoenix':
                            equipBonus.hasPhoenix = true;
                            break;
                    }
                });
            }
        });

        // --- Set Bonuses ---
        const setCounts = {};
        Object.values(this.equipment).forEach(item => {
            if (!item || !item.set) return;
            setCounts[item.set] = (setCounts[item.set] || 0) + 1;
        });

        // --- Meal Buffs ---
        if (this.mealBuffs && this.mealBuffs.length > 0) {
            this.mealBuffs.forEach(buff => {
                if (buff.stat === 'maxHp') {
                    equipBonus.maxHp += Math.floor(this.baseMaxHp * buff.value);
                } else if (equipBonus[buff.stat] !== undefined) {
                    equipBonus[buff.stat] += buff.value;
                }
            });
        }

        this.activeSetBonuses = [];
        for (const [setId, count] of Object.entries(setCounts)) {
            const setData = EQUIPMENT_SET_BONUSES[setId];
            if (!setData) continue;

            let activeThreshold = 0;
            for (const t of setData.thresholds) {
                if (count >= t) activeThreshold = t;
            }

            if (activeThreshold > 0) {
                const bonus = setData.bonuses[activeThreshold];
                for (const [stat, val] of Object.entries(bonus)) {
                    if (equipBonus[stat] !== undefined) {
                        equipBonus[stat] += val;
                    }
                }
                this.activeSetBonuses.push({
                    setId,
                    setName: setData.name,
                    pieces: count,
                    threshold: activeThreshold,
                    bonus
                });
            }
        }

        const hpBoost = (villageUpgrades.hp_boost || 0) * 10;
        const atkBoost = (villageUpgrades.attack_boost || 0);
        const defBoost = (villageUpgrades.defense_boost || 0);

        let hasteMult = 1.0;
        if (this.statusEffects.some(e => e.type === 'haste')) hasteMult = 1.5;

        this.maxHp = Math.floor((this.baseMaxHp + hpBoost + equipBonus.maxHp) * traitMults.maxHp);
        this.maxMp = Math.floor((this.baseMaxMp + equipBonus.maxMp) * traitMults.maxMp);
        this.strength = Math.floor((this.baseStrength + atkBoost + equipBonus.strength) * traitMults.strength);
        this.speed = Math.floor((this.baseSpeed + equipBonus.speed) * traitMults.speed * hasteMult);
        this.defense = Math.floor((this.baseDefense + defBoost + equipBonus.defense) * traitMults.defense);
        this.magicPower = Math.floor((this.baseMagicPower + equipBonus.magicPower) * traitMults.magicPower);

        // maxStamina depends on strength, defense, and level
        this.maxStamina = Math.floor((this.strength * 3) + (this.defense * 2) + (this.level * 2));

        this.evasion = equipBonus.evasion;
        this.mpCostReduction = equipBonus.mpCostReduction;
        this.vampirism = equipBonus.vampirism;
        this.critChanceBonus = (equipBonus.critChance || 0) + (traitMults.critChance || 0);
        this.accuracyBonus = (equipBonus.accuracy || 0) + (traitMults.accuracy || 0);
        this.hasPhoenix = equipBonus.hasPhoenix;

        this.hp = Math.min(this.hp, this.maxHp);
        this.mp = Math.min(this.mp, this.maxMp);
        if (this.stamina !== undefined) {
            this.stamina = Math.min(this.stamina, this.maxStamina);
        }

        // --- Fatigue Penalty ---
        // Fatigue 0-50: no penalty
        // Fatigue 51-75: -5% strength, speed
        // Fatigue 76-90: -10% strength, speed, defense
        // Fatigue 91-100: -20% strength, speed, defense, -10% accuracy
        if (this.fatigue > 90) {
            this.strength = Math.floor(this.strength * 0.80);
            this.speed = Math.floor(this.speed * 0.80);
            this.defense = Math.floor(this.defense * 0.80);
            this.accuracyBonus = (this.accuracyBonus || 0) - 10;
        } else if (this.fatigue > 75) {
            this.strength = Math.floor(this.strength * 0.90);
            this.speed = Math.floor(this.speed * 0.90);
            this.defense = Math.floor(this.defense * 0.90);
        } else if (this.fatigue > 50) {
            this.strength = Math.floor(this.strength * 0.95);
            this.speed = Math.floor(this.speed * 0.95);
        }
    }

    getExpToNextLevel() {
        return this.level * 20;
    }

    addExperience(amount) {
        this.exp += amount;
        let levelsGained = 0;
        while (true) {
            const nextLevelExp = this.getExpToNextLevel();
            if (this.exp >= nextLevelExp) {
                this.exp -= nextLevelExp;
                this.levelUp();
                levelsGained++;
            } else {
                break;
            }
        }
        return Result.ok(levelsGained);
    }

    levelUp() {
        this.level++;
        this.statPoints += (this.level % 5 === 0) ? 3 : 2;

        // Check for skill point milestones
        if (Hero.SKILL_POINT_MILESTONES.includes(this.level)) {
            this.skillPoints++;
        }

        this.baseMaxHp += 5;
        this.baseMaxMp += 2;

        this.recalculateStats();

        this.hp = this.maxHp;
        this.mp = this.maxMp;
        this.stamina = this.maxStamina;
    }

    addPermanentSpeedBonus(amount) {
        this.baseSpeed += amount;
        this.recalculateStats();
    }

    increaseStat(statId) {
        if (this.statPoints <= 0) return Result.fail('heroes_error_stat_point_none');

        const statMap = {
            baseMaxHp: 3,
            baseMaxMp: 2,
            baseStrength: 1,
            baseSpeed: 1,
            baseDefense: 1,
            baseMagicPower: 1
        };

        const gain = statMap[statId];
        if (gain === undefined) return Result.fail('heroes_error_stat_invalid');

        this[statId] += gain;
        this.statPoints--;

        this.recalculateStats();

        return Result.ok(this[statId]);
    }

    tickMealBuffs() {
        if (!this.mealBuffs || this.mealBuffs.length === 0) return false;
        let changed = false;
        this.mealBuffs = this.mealBuffs.map(buff => {
            const updated = { ...buff, battlesRemaining: buff.battlesRemaining - 1 };
            if (updated.battlesRemaining > 0) {
                return updated;
            }
            changed = true;
            return null;
        }).filter(Boolean);
        if (changed) {
            this.recalculateStats();
        }
        return changed;
    }

    /**
     * Add fatigue after battle or expedition.
     * @param {number} amount - fatigue points to add
     */
    addFatigue(amount) {
        this.fatigue = Math.min(this.maxFatigue, Math.max(0, this.fatigue + amount));
        this.recalculateStats();
    }

    /**
     * Recover fatigue (resting at inn or village).
     * @param {number} amount - fatigue points to recover
     */
    recoverFatigue(amount) {
        const oldFatigue = this.fatigue;
        this.fatigue = Math.max(0, this.fatigue - amount);
        if (this.fatigue !== oldFatigue) {
            this.recalculateStats();
        }
    }

    /**
     * Get fatigue level string for UI display.
     */
    getFatigueLevel() {
        if (this.fatigue <= 20) return 'fresh';
        if (this.fatigue <= 50) return 'fine';
        if (this.fatigue <= 75) return 'tired';
        if (this.fatigue <= 90) return 'exhausted';
        return 'spent';
    }

    // --- Physical Skill System (Family-based) ---

    /**
     * Learn a new technique family. Consumes 1 skill point.
     * Families are permanent once learned.
     */
    learnFamily(familyId) {
        if (!SKILLS_DATA[familyId]) {
            return Result.fail('heroes_error_family_invalid');
        }
        if (this.knownFamilies.includes(familyId)) {
            return Result.fail('heroes_error_family_already_known');
        }
        if (this.knownFamilies.length >= Hero.MAX_FAMILIES) {
            return Result.fail('heroes_error_family_max_reached');
        }
        if (this.skillPoints <= 0) {
            return Result.fail('heroes_error_skill_point_none');
        }

        this.knownFamilies.push(familyId);
        this.techniqueTiers[familyId] = this.techniqueTiers[familyId] || 1;
        this.skillPoints--;

        return Result.ok({ familyId, tier: this.techniqueTiers[familyId] });
    }

    /**
     * Calculate the stamina cost for a family at a given tier.
     */
    getStaminaCost(familyId, tier) {
        const skillData = SKILLS_DATA[familyId];
        if (!skillData) return 0;
        const effectiveTier = tier || this.techniqueTiers[familyId] || 1;
        return skillData.staminaCostBase + skillData.staminaCostPerTier * (effectiveTier - 1);
    }

    /**
     * Calculate total Skill Tier Points for Body Inscription unlock.
     * Formula: sum of (tier + 1) across all known families.
     */
    getSkillTierPoints() {
        return this.knownFamilies.reduce((sum, family) => {
            const tier = this.techniqueTiers[family] || 1;
            return sum + (tier + 1);
        }, 0);
    }

    /**
     * Records a technique use and checks for infinite tier evolution.
     * Tier thresholds are CUMULATIVE: Tier N requires 50 * (3^(N-1) - 1) total uses.
     * @returns {Object|null} evolution info if tier increased, null otherwise
     */
    recordTechniqueUse(family) {
        if (!family) return null;

        this.techniqueUses[family] = (this.techniqueUses[family] || 0) + 1;

        const currentTier = this.techniqueTiers[family] || 1;
        const totalUses = this.techniqueUses[family];
        const nextTier = currentTier + 1;
        const cumulativeThreshold = this._getCumulativeTierThreshold(nextTier);

        if (totalUses >= cumulativeThreshold) {
            this.techniqueTiers[family] = nextTier;
            return { family, fromTier: currentTier, toTier: nextTier, uses: totalUses };
        }
        return null;
    }

    /**
     * Cumulative uses required to reach a given tier.
     * Tier 2: 100, Tier 3: 400, Tier 4: 1300, Tier 5: 4000...
     * Formula: 50 * (3^(tier-1) - 1)
     */
    _getCumulativeTierThreshold(tier) {
        if (tier <= 1) return 0;
        return Math.floor(50 * (Math.pow(3, tier - 1) - 1));
    }

    // --- Body Inscription (Glyph-based 7-slot circle) ---

    inscribeBodyCircle(glyphIds, glyphTiers = {}) {
        const skillTierPoints = this.getSkillTierPoints();
        if (skillTierPoints < 12) return Result.fail('heroes_error_inscription_skill_not_enough');
        if ((this.magicTier || 0) < 7) return Result.fail('heroes_error_inscription_magic_not_enough');

        if (!glyphIds || glyphIds.length === 0) return Result.fail('heroes_error_glyph_none');
        // Doc: exactly 7 slots (Core + Ring 1)
        if (glyphIds.length !== 7) return Result.fail('heroes_error_body_circle_size_invalid');

        const core = glyphIds.find(gid => {
            const g = GLYPH_DATA[gid];
            return g && g.type === 'core';
        });
        if (!core) return Result.fail('heroes_error_glyph_core_none');

        // Verify all glyphs are known
        for (const gid of glyphIds) {
            if (!this.knownGlyphs.includes(gid)) return Result.fail('heroes_error_glyph_not_known');
        }

        // Set pending inscription — takes effect after 5 days
        this.pendingBodyInscription = {
            glyphIds: [...glyphIds],
            glyphTiers: { ...glyphTiers }
        };
        this.bodyInscriptionDaysRemaining = 5;
        return Result.ok({ glyphIds, daysRemaining: 5 });
    }

    /**
     * Process one day of body inscription. Called by GameEngine.nextDay().
     * @returns {boolean} true if inscription just completed
     */
    processBodyInscriptionDay() {
        if (this.bodyInscriptionDaysRemaining > 0) {
            this.bodyInscriptionDaysRemaining--;
            if (this.bodyInscriptionDaysRemaining <= 0) {
                // Inscription complete — apply it
                this.bodyInscription = this.pendingBodyInscription;
                this.pendingBodyInscription = null;
                this.bodyInscription.inscribedAt = Date.now();
                return true;
            }
        }
        return false;
    }

    isInscribing() {
        return this.bodyInscriptionDaysRemaining > 0;
    }

    eraseBodyCircle() {
        if (!this.bodyInscription) return Result.fail('heroes_error_inscription_none');
        this.bodyInscription = null;
        this.pendingBodyInscription = null;
        this.bodyInscriptionDaysRemaining = 0;
        return Result.ok(true);
    }

    /**
     * Calculate the additional MP cost for using physical skills when body-inscribed.
     * Formula from doc: Base 8 + modifiers, scaled by magic tier.
     */
    getHybridMpCost() {
        if (!this.bodyInscription) return 0;
        const { glyphIds, glyphTiers } = this.bodyInscription;
        let base = 8;
        for (const gid of glyphIds) {
            const g = GLYPH_DATA[gid];
            if (!g) continue;
            const tier = glyphTiers[gid] || 1;
            switch (gid) {
                case 'glyph_potentiate': base += 2 * tier; break;
                case 'glyph_multi': base += 5; break;
                case 'glyph_pierce': base += 3; break;
                case 'glyph_leech': base += 2; break;
                case 'glyph_focus': base += 2; break;
            }
        }
        return Math.floor(base * (1 + (this.magicTier || 1) / 20));
    }

    // --- Gambits ---

    setFallbackAction(action) {
        if (!action) return Result.fail('heroes_error_action_invalid');
        this.fallbackAction = action;
        return Result.ok(true);
    }

    addGambit(gambit) {
        if (!gambit || !gambit.id) return Result.fail('heroes_error_gambit_invalid');
        this.gambits = this.gambits || [];
        if (this.gambits.length >= 12) return Result.fail('heroes_error_gambit_limit_reached');
        if (this.gambits.find(g => g.id === gambit.id)) return Result.fail('heroes_error_gambit_id_duplicate');
        // Auto-migrate old-format gambits before storing
        const migrated = HeroMigrationService.migrateGambits([gambit])[0];
        this.gambits.push(migrated);
        return Result.ok(true);
    }

    removeGambit(gambitId) {
        this.gambits = (this.gambits || []).filter(g => g.id !== gambitId);
        return Result.ok(true);
    }

    toggleGambit(gambitId) {
        const gambit = (this.gambits || []).find(g => g.id === gambitId);
        if (!gambit) return Result.fail('heroes_error_gambit_not_found');
        gambit.enabled = !gambit.enabled;
        return Result.ok(gambit.enabled);
    }

    moveGambit(gambitId, direction) {
        const gambits = this.gambits || [];
        const idx = gambits.findIndex(g => g.id === gambitId);
        if (idx === -1) return Result.fail('heroes_error_gambit_not_found');
        const newIdx = idx + direction;
        if (newIdx < 0 || newIdx >= gambits.length) return Result.fail('heroes_error_gambit_move_invalid');
        const temp = gambits[idx];
        gambits[idx] = gambits[newIdx];
        gambits[newIdx] = temp;
        return Result.ok(true);
    }

    // --- Serialization ---

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            origin: this.origin,
            level: this.level,
            exp: this.exp,
            expToNextLevel: this.getExpToNextLevel(),
            statPoints: this.statPoints,
            baseMaxHp: this.baseMaxHp,
            baseMaxMp: this.baseMaxMp,
            baseStrength: this.baseStrength,
            baseSpeed: this.baseSpeed,
            baseDefense: this.baseDefense,
            baseMagicPower: this.baseMagicPower,
            maxHp: this.maxHp,
            maxMp: this.maxMp,
            maxStamina: this.maxStamina,
            strength: this.strength,
            speed: this.speed,
            defense: this.defense,
            magicPower: this.magicPower,
            hp: this.hp,
            mp: this.mp,
            stamina: this.stamina,
            status: this.status,
            // New family-based skill system
            knownFamilies: JSON.parse(JSON.stringify(this.knownFamilies)),
            skillPoints: this.skillPoints,
            techniqueUses: JSON.parse(JSON.stringify(this.techniqueUses)),
            techniqueTiers: JSON.parse(JSON.stringify(this.techniqueTiers)),
            // Magic
            magicXp: this.magicXp,
            magicTier: this.magicTier,
            knownGlyphs: JSON.parse(JSON.stringify(this.knownGlyphs)),
            glyphMastery: JSON.parse(JSON.stringify(this.glyphMastery)),
            spellCodex: JSON.parse(JSON.stringify(this.spellCodex)),
            // Stats & meta
            lifetimeStats: JSON.parse(JSON.stringify(this.lifetimeStats)),
            titles: JSON.parse(JSON.stringify(this.titles)),
            bodyInscription: this.bodyInscription ? JSON.parse(JSON.stringify(this.bodyInscription)) : null,
            pendingBodyInscription: this.pendingBodyInscription ? JSON.parse(JSON.stringify(this.pendingBodyInscription)) : null,
            bodyInscriptionDaysRemaining: this.bodyInscriptionDaysRemaining,
            fallbackAction: this.fallbackAction,
            presetId: this.presetId,
            gambits: JSON.parse(JSON.stringify(this.gambits)),
            statusEffects: JSON.parse(JSON.stringify(this.statusEffects)),
            phoenixUsed: this.phoenixUsed,
            equipment: JSON.parse(JSON.stringify(this.equipment)),
            activeSetBonuses: this.activeSetBonuses || [],
            mealBuffs: this.mealBuffs || [],
            fatigue: this.fatigue,
            maxFatigue: this.maxFatigue,
            fatigueLevel: this.getFatigueLevel(),
            avatar: this.avatar,
            skillTierPoints: this.getSkillTierPoints(),
            isInscriptionEligible: this.getSkillTierPoints() >= 12 && (this.magicTier || 0) >= 7,
            hybridMpCost: this.getHybridMpCost(),
            skillPointMilestones: Hero.SKILL_POINT_MILESTONES
        };
    }
}
