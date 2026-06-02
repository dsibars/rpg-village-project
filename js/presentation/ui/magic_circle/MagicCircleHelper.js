import { GLYPH_DATA, CORE_ALLY_EFFECTS, glyphHasGrowthPotential } from '../../../engine/shared/data/MagicCircleData.js';

/**
 * MagicCircleHelper — Pure presentation logic for the Magic Circle UI.
 * No DOM. No side effects. Just data → strings.
 *
 * Use these helpers instead of re-implementing effect formatting,
 * target resolution, or ally-effect mapping.
 */

// ─── Effect Chip Formatting ───

const EFFECT_CHIP_MAP = {
    pierce:       { icon: '⚔️',  labelKey: 'magic_circle_info_effect_pierce' },
    poisonStacks: { icon: '☠️',  labelKey: 'magic_circle_info_effect_poison' },
    sleepChance:  { icon: '💤',  labelKey: 'magic_circle_info_effect_sleep' },
    lifesteal:    { icon: '🧛',  labelKey: 'magic_circle_info_effect_leech' },
    speedBoost:   { icon: '💨',  labelKey: 'magic_circle_info_effect_speed' },
    reflectChance:{ icon: '🔄',  labelKey: 'magic_circle_info_effect_reflect' },
    critBonus:    { icon: '🎯',  labelKey: 'magic_circle_info_effect_crit' },
    costReduction:{ icon: '💎',  labelKey: 'magic_circle_info_effect_cost_reduce' }
};

const HARMFUL_EFFECTS = ['poisonStacks', 'sleepChance', 'pierce', 'lifesteal'];

/**
 * Build an array of effect chip objects for a composed spell.
 * @param {Object} effects — spell.effects
 * @param {boolean} isSupport — spell.category === 'support'
 * @returns {Array<{icon: string, labelKey: string, value: number}>}
 */
export function buildEffectChips(effects, isSupport = false) {
    const chips = [];
    for (const [key, config] of Object.entries(EFFECT_CHIP_MAP)) {
        const value = effects?.[key];
        if (!value || value <= 0) continue;
        if (isSupport && HARMFUL_EFFECTS.includes(key)) continue;

        let displayValue;
        if (key === 'poisonStacks') {
            displayValue = Math.floor(value);
        } else if (key === 'sleepChance') {
            displayValue = Math.round(value * 100);
        } else {
            displayValue = Math.round(value * 100);
        }
        chips.push({
            icon: config.icon,
            labelKey: config.labelKey,
            value: displayValue
        });
    }
    return chips;
}

/**
 * Build the main "power" display for the preview card.
 * Returns { labelKey, value } for the top stat (Damage / Heal / Buff / Restore).
 * @param {Object} spell
 * @returns {{labelKey: string, value: number}}
 */
export function getPowerDisplay(spell) {
    if (!spell) return { labelKey: 'magic_circle_info_preview_damage', value: 0 };

    if (spell.category === 'support') {
        const amount = Math.max(1, Math.floor(spell.damage * (spell.allyFactor || 0.2)));
        const allyEffect = CORE_ALLY_EFFECTS[spell.element];
        if (!allyEffect) return { labelKey: 'magic_circle_info_preview_heal', value: amount };

        const labelMap = {
            heal_hp: 'magic_circle_info_preview_heal',
            restore_mp: 'magic_circle_info_preview_restore_mp',
            restore_stamina: 'magic_circle_info_preview_restore_stamina',
            buff_atk: 'magic_circle_info_preview_buff_atk',
            buff_def: 'magic_circle_info_preview_buff_def',
            buff_spd: 'magic_circle_info_preview_buff_spd',
            buff_crit: 'magic_circle_info_preview_buff_crit'
        };
        return { labelKey: labelMap[allyEffect.type] || 'magic_circle_info_preview_heal', value: amount };
    }

    return { labelKey: 'magic_circle_info_preview_damage', value: spell.damage };
}

// ─── Target Resolution ───

/**
 * Resolve target polarity and count from a spell.
 * @param {Object} spell
 * @returns {{polarity: 'enemy'|'ally', count: 'single'|'all'}}
 */
export function resolveTarget(spell) {
    if (!spell) return { polarity: 'enemy', count: 'single' };
    const targetType = spell.targetType || 'single_enemy';
    return {
        polarity: targetType.includes('ally') ? 'ally' : 'enemy',
        count: targetType.startsWith('all_') ? 'all' : 'single'
    };
}

/**
 * Get the display label key for a target type.
 * @param {string} targetType
 * @returns {string} i18n key
 */
export function getTargetLabelKey(targetType) {
    const map = {
        single_enemy: 'magic_circle_info_preview_target_single_enemy',
        all_enemies: 'magic_circle_info_preview_target_all_enemies',
        single_ally: 'magic_circle_info_preview_target_single_ally',
        all_allies: 'magic_circle_info_preview_target_all_allies'
    };
    return map[targetType] || 'magic_circle_info_preview_target_single_enemy';
}

// ─── Glyph Card Helpers ───

/**
 * Check if a glyph is "static" (no functional tier growth).
 * @param {Object} glyph — from GLYPH_DATA
 * @returns {boolean}
 */
export function isStaticGlyph(glyph) {
    return !glyphHasGrowthPotential(glyph);
}

/**
 * Get the maximum selectable tier for a glyph given a hero's mastery.
 * @param {Object} glyph — from GLYPH_DATA
 * @param {number} masteredTier — hero's mastery tier for this glyph
 * @returns {number}
 */
export function getMaxSelectableTier(glyph, masteredTier) {
    if (isStaticGlyph(glyph)) return 1;
    return Math.max(1, Math.min(7, masteredTier || 1));
}

/**
 * Build a tier option list for a glyph selector.
 * @param {Object} glyph
 * @param {number} masteredTier
 * @returns {Array<{tier: number, symbol: string}>}
 */
export function buildTierOptions(glyph, masteredTier, engine = null) {
    const max = getMaxSelectableTier(glyph, masteredTier);
    return Array.from({ length: max }, (_, i) => ({
        tier: i + 1,
        symbol: engine ? engine.getGlyphSymbol(i + 1) : String(i + 1)
    }));
}

/**
 * Get a short abbreviation for a non-core glyph (for mandala slot display).
 * e.g. "POT" for glyph_potentiate, "MUL" for glyph_multi.
 * @param {Object} glyph
 * @returns {string}
 */
export function getGlyphAbbreviation(glyph) {
    if (!glyph) return '?';
    if (glyph.type === 'core') return '';
    return glyph.id.replace('glyph_', '').substring(0, 3).toUpperCase();
}

/**
 * Get the display icon for any glyph (core or non-core).
 * @param {Object} glyph
 * @returns {string}
 */
export function getGlyphIcon(glyph) {
    if (!glyph) return '🔮';
    if (glyph.type === 'core') {
        const map = {
            fire: '🔥', water: '💧', wind: '🌪️',
            storm: '⚡', light: '✨', dark: '🌑', earth: '🪨'
        };
        return map[glyph.element] || '🔮';
    }
    const map = {
        glyph_potentiate: '💪', glyph_focus: '🎯', glyph_extend: '⏳',
        glyph_multi: '👥', glyph_pierce: '⚔️', glyph_venom: '☠️',
        glyph_slumber: '💤', glyph_aegis: '🛡️', glyph_celerity: '💨',
        glyph_reflect: '🔄', glyph_leech: '🧛', glyph_streamline: '💎'
    };
    return map[glyph.id] || '🔮';
}

/**
 * Get the element emoji for a core glyph.
 * @param {string} element
 * @returns {string}
 */
export function getElementEmoji(element) {
    const map = {
        fire: '🔥', water: '💧', wind: '🌪️',
        storm: '⚡', light: '✨', dark: '🌑', earth: '🪨'
    };
    return map[element] || '🔮';
}

/**
 * Get the element color token (for CSS theming).
 * @param {string} element
 * @returns {string} CSS color value
 */
export function getElementColor(element) {
    const map = {
        fire: '#ef4444',   // red-500
        water: '#3b82f6',  // blue-500
        wind: '#10b981',   // emerald-500
        storm: '#f59e0b',  // amber-500
        light: '#fbbf24',  // amber-400
        dark: '#a855f7',   // purple-500
        earth: '#84cc16'   // lime-500
    };
    return map[element] || '#6366f1'; // indigo-500 fallback
}

// ─── MP Budget ───

/**
 * Compute budget state from spell cost and hero max MP.
 * @param {number} mpCost
 * @param {number} maxMp
 * @returns {{ratio: number, color: string, labelKey: string, isOverBudget: boolean}}
 */
export function computeBudgetState(mpCost, maxMp) {
    const ratio = mpCost / Math.max(1, maxMp);
    if (ratio > 0.90) {
        return { ratio, color: '#ef4444', labelKey: 'magic_circle_info_budget_over', isOverBudget: true };
    }
    if (ratio > 0.75) {
        return { ratio, color: '#f59e0b', labelKey: 'magic_circle_info_budget_warning', isOverBudget: false };
    }
    return { ratio, color: '#10b981', labelKey: 'magic_circle_info_budget_within', isOverBudget: false };
}
