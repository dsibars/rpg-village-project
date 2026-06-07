import { computed, ref } from 'vue'
import { inject } from 'vue'
import {
  GLYPH_DATA,
  computeGlyphEffect,
  computeGlyphCostMult,
  glyphHasGrowthPotential
} from '../../../../js/engine/shared/data/MagicCircleData.js'

// ─── Slot Geometry ───

export function getSlotCoords(i) {
  if (i === 0) return { x: 50, y: 50 }
  const ring = Math.floor((i - 1) / 6) + 1
  const slotInRing = (i - 1) % 6
  const radius = ring * 11.2
  const angle = slotInRing * (2 * Math.PI / 6) - Math.PI / 2
  return {
    x: 50 + radius * Math.cos(angle),
    y: 50 + radius * Math.sin(angle)
  }
}

export function isAdjacent(i, j) {
  if (i === j) return false
  if (i === 0) return j >= 1 && j <= 6
  if (j === 0) return i >= 1 && i <= 6

  const ringI = Math.floor((i - 1) / 6) + 1
  const ringJ = Math.floor((j - 1) / 6) + 1
  const posI = (i - 1) % 6
  const posJ = (j - 1) % 6

  if (ringI === ringJ) {
    return Math.abs(posI - posJ) === 1 || Math.abs(posI - posJ) === 5
  }

  if (Math.abs(ringI - ringJ) === 1) {
    return posI === posJ
  }

  return false
}

// ─── Glyph Helpers ───

const GLYPH_ICON_MAP = {
  glyph_potentiate: '\u{1F4AA}',
  glyph_focus: '\u{1F3AF}',
  glyph_extend: '\u{23F3}',
  glyph_multi: '\u{1F465}',
  glyph_pierce: '\u{2694}',
  glyph_venom: '\u{2620}',
  glyph_slumber: '\u{1F4A4}',
  glyph_aegis: '\u{1F6E1}',
  glyph_celerity: '\u{1F4A8}',
  glyph_reflect: '\u{1F504}',
  glyph_leech: '\u{1F9DB}',
  glyph_streamline: '\u{1F48E}'
}

const ELEMENT_ICON_MAP = {
  fire: '\u{1F525}',
  water: '\u{1F4A7}',
  wind: '\u{1F343}',
  storm: '\u{26A1}',
  light: '\u{2600}',
  dark: '\u{1F311}',
  earth: '\u{1FAA8}'
}

export function getGlyphIcon(glyph) {
  if (!glyph) return '\u{1F52E}'
  if (glyph.type === 'core') {
    return ELEMENT_ICON_MAP[glyph.element] || '\u{1F52E}'
  }
  return GLYPH_ICON_MAP[glyph.id] || '\u{1F52E}'
}

export function getGlyphAbbreviation(glyph) {
  if (!glyph) return '?'
  if (glyph.type === 'core') return ''
  return glyph.id.replace('glyph_', '').substring(0, 3).toUpperCase()
}

export function getElementColor(element) {
  const map = {
    fire: '#ef4444',
    water: '#3b82f6',
    wind: '#10b981',
    storm: '#f59e0b',
    light: '#fbbf24',
    dark: '#a855f7',
    earth: '#84cc16'
  }
  return map[element] || '#6366f1'
}

export function isStaticGlyph(glyph) {
  return !glyphHasGrowthPotential(glyph)
}

export function getMaxSelectableTier(glyph, masteredTier) {
  if (isStaticGlyph(glyph)) return 1
  return Math.max(1, Math.min(7, masteredTier || 1))
}

// ─── Spell Preview Helpers ───

const EFFECT_CHIP_MAP = {
  pierce: { icon: '\u{2694}', labelKey: 'magic_circle_info_effect_pierce' },
  poisonStacks: { icon: '\u{2620}', labelKey: 'magic_circle_info_effect_poison' },
  sleepChance: { icon: '\u{1F4A4}', labelKey: 'magic_circle_info_effect_sleep' },
  lifesteal: { icon: '\u{1F9DB}', labelKey: 'magic_circle_info_effect_leech' },
  speedBoost: { icon: '\u{1F4A8}', labelKey: 'magic_circle_info_effect_speed' },
  reflectChance: { icon: '\u{1F504}', labelKey: 'magic_circle_info_effect_reflect' },
  critBonus: { icon: '\u{1F3AF}', labelKey: 'magic_circle_info_effect_crit' },
  costReduction: { icon: '\u{1F48E}', labelKey: 'magic_circle_info_effect_cost_reduce' }
}

const HARMFUL_EFFECTS = ['poisonStacks', 'sleepChance', 'pierce', 'lifesteal']

export function buildEffectChips(effects, isSupport = false) {
  const chips = []
  for (const [key, config] of Object.entries(EFFECT_CHIP_MAP)) {
    const value = effects?.[key]
    if (!value || value <= 0) continue
    if (isSupport && HARMFUL_EFFECTS.includes(key)) continue

    let displayValue
    if (key === 'poisonStacks') {
      displayValue = Math.floor(value)
    } else {
      displayValue = Math.round(value * 100)
    }
    const suffix = key === 'poisonStacks' ? '' : '%'
    chips.push({ icon: config.icon, labelKey: config.labelKey, value: displayValue, suffix })
  }
  return chips
}

export function getPowerDisplay(spell) {
  if (!spell) return { labelKey: 'magic_circle_info_preview_damage', value: 0 }

  if (spell.category === 'support') {
    const amount = Math.max(1, Math.floor(spell.damage * (spell.allyFactor || 0.2)))
    const allyEffect = spell.allyEffect || { type: 'heal_hp' }
    const labelMap = {
      heal_hp: 'magic_circle_info_preview_heal',
      restore_mp: 'magic_circle_info_preview_restore_mp',
      restore_stamina: 'magic_circle_info_preview_restore_stamina',
      buff_atk: 'magic_circle_info_preview_buff_atk',
      buff_def: 'magic_circle_info_preview_buff_def',
      buff_spd: 'magic_circle_info_preview_buff_spd',
      buff_crit: 'magic_circle_info_preview_buff_crit'
    }
    return { labelKey: labelMap[allyEffect.type] || 'magic_circle_info_preview_heal', value: amount }
  }

  return { labelKey: 'magic_circle_info_preview_damage', value: spell.damage }
}

export function resolveTarget(spell) {
  if (!spell) return { polarity: 'enemy', count: 'single' }
  const targetType = spell.targetType || 'single_enemy'
  return {
    polarity: targetType.includes('ally') ? 'ally' : 'enemy',
    count: targetType.startsWith('all_') ? 'all' : 'single'
  }
}

export function computeBudgetState(mpCost, maxMp) {
  const ratio = mpCost / Math.max(1, maxMp)
  if (ratio > 0.90) {
    return { ratio, color: '#ef4444', labelKey: 'magic_circle_info_budget_over', isOverBudget: true }
  }
  if (ratio > 0.75) {
    return { ratio, color: '#f59e0b', labelKey: 'magic_circle_info_budget_warning', isOverBudget: false }
  }
  return { ratio, color: '#10b981', labelKey: 'magic_circle_info_budget_within', isOverBudget: false }
}

// ─── Glyph Description Helper ───

export function getGlyphDescription(glyph, tier) {
  if (!glyph) return ''
  const effects = computeGlyphEffect(glyph, tier)
  const costMult = computeGlyphCostMult(glyph, tier)
  const costPercent = Math.round((costMult - 1) * 100)

  if (glyph.type === 'core') {
    return `Element: ${glyph.element.toUpperCase()}. Base Damage: ${glyph.baseDamage}, Base MP Cost: ${glyph.baseCost}. Sets the elemental base parameters.`
  }

  switch (glyph.id) {
    case 'glyph_potentiate':
      return `Amplifies damage multiplier by +${Math.round((effects.damageMult - 1) * 100)}%. (+${costPercent}% MP cost)`
    case 'glyph_focus':
      return `Increases damage by +${Math.round((effects.damageMult - 1) * 100)}% and Critical Chance by +${Math.round(effects.critBonus * 100)}%. (+${costPercent}% MP cost)`
    case 'glyph_extend':
      return `Increases duration of effects by +${effects.duration} turn${effects.duration > 1 ? 's' : ''}. (+${costPercent}% MP cost)`
    case 'glyph_multi':
      return `Hits all possible targets. (+${costPercent}% MP cost)`
    case 'glyph_pierce':
      return `Ignores ${Math.round(effects.pierce * 100)}% of target's Defense. (+${costPercent}% MP cost)`
    case 'glyph_venom':
      return `Inflicts +${effects.poisonStacks} poison stack${effects.poisonStacks > 1 ? 's' : ''}. (+${costPercent}% MP cost)`
    case 'glyph_slumber':
      return `Grants a ${Math.round(effects.sleepChance * 100)}% chance to induce Sleep. (+${costPercent}% MP cost)`
    case 'glyph_aegis':
      return `Targets allies instead of enemies. (+${costPercent}% MP cost)`
    case 'glyph_celerity':
      return `Increases Speed by +${Math.round(effects.speedBoost * 100)}% during combat. (+${costPercent}% MP cost)`
    case 'glyph_reflect':
      return `Grants a ${Math.round(effects.reflectChance * 100)}% chance to reflect attacks. (+${costPercent}% MP cost)`
    case 'glyph_leech':
      return `Heals caster for ${Math.round(effects.lifesteal * 100)}% of damage dealt. (+${costPercent}% MP cost)`
    case 'glyph_streamline':
      return `Reduces total spell MP cost by ${Math.round(effects.costReduction * 100)}%.`
    default:
      return 'Custom spell enhancement.'
  }
}

// ─── Main Composable ───

export function useMagicCircle(hero, isSimulator = false) {
  const engine = inject('engine')

  const composition = ref([])
  const selectedTiers = ref({})
  const focusedSlotIndex = ref(null)
  const customName = ref('')

  const knownGlyphs = computed(() => hero.value?.knownGlyphs || [])
  const glyphMastery = computed(() => hero.value?.glyphMastery || {})
  const magicTier = computed(() => hero.value?.magicTier || 1)
  const maxMp = computed(() => hero.value?.maxMp || hero.value?.stats?.mp || 100)

  const maxSlots = computed(() => {
    if (engine?.getMagicCircleSlotCount) {
      return engine.getMagicCircleSlotCount(magicTier.value)
    }
    return Math.min(25, 1 + magicTier.value * 6)
  })

  const availableGlyphs = computed(() => {
    const known = new Set(knownGlyphs.value)
    return Object.values(GLYPH_DATA).filter((g) => known.has(g.id))
  })

  const glyphIds = computed(() => composition.value.map((c) => c.glyphId))
  const glyphTiers = computed(() => {
    const tiers = {}
    for (const c of composition.value) {
      tiers[c.glyphId] = selectedTiers.value[c.glyphId] || glyphMastery.value[c.glyphId]?.tier || 1
    }
    return tiers
  })

  const spell = computed(() => {
    if (composition.value.length === 0 || !engine?.composeSpell) return null
    const result = engine.composeSpell(glyphIds.value, glyphTiers.value, customName.value || null)
    return result?.success ? result.data : null
  })

  const mpCost = computed(() => spell.value?.mpCost || 0)
  const budget = computed(() => computeBudgetState(mpCost.value, maxMp.value))

  const targetInfo = computed(() => resolveTarget(spell.value))
  const isSupport = computed(() => spell.value?.category === 'support')
  const powerDisplay = computed(() => getPowerDisplay(spell.value))
  const effectChips = computed(() => buildEffectChips(spell.value?.effects, isSupport.value))

  function placeGlyph(slotIndex, glyphId) {
    const existing = composition.value.find((c) => c.slotIndex === slotIndex)
    if (existing) {
      existing.glyphId = glyphId
    } else {
      composition.value.push({ slotIndex, glyphId })
    }
    composition.value.sort((a, b) => a.slotIndex - b.slotIndex)
  }

  function removeGlyph(slotIndex) {
    composition.value = composition.value.filter((c) => c.slotIndex !== slotIndex)
  }

  function clearComposition() {
    composition.value = []
    selectedTiers.value = {}
    focusedSlotIndex.value = null
    customName.value = ''
  }

  function setTier(glyphId, tier) {
    selectedTiers.value[glyphId] = tier
  }

  return {
    composition,
    selectedTiers,
    focusedSlotIndex,
    customName,
    magicTier,
    maxMp,
    maxSlots,
    availableGlyphs,
    glyphMastery,
    spell,
    mpCost,
    budget,
    targetInfo,
    isSupport,
    powerDisplay,
    effectChips,
    placeGlyph,
    removeGlyph,
    clearComposition,
    setTier
  }
}
