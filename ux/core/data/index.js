/**
 * Static data re-export layer.
 *
 * Feature components must NOT import raw engine data directly.
 * All static catalog imports go through here so the UX layer stays
 * decoupled from engine file paths.
 */

export { TECHNIQUE_FAMILIES } from '../../../js/engine/shared/data/CombatData.js'
export { CONSUMABLES_DATA } from '../../../js/engine/shared/data/InventoryData.js'
export {
  GLYPH_DATA,
  GLYPH_TIER_QUALITY,
  computeGlyphEffect,
  computeGlyphCostMult,
  glyphHasGrowthPotential
} from '../../../js/engine/shared/data/MagicCircleData.js'

export { CODEX_FEATURES, CODEX_CATEGORIES } from '../../../js/engine/shared/data/CodexFeatures.js'
export { PRESENTATION_CATALOG } from '../../../js/engine/shared/data/PresentationCatalog.js'
export { UNLOCK_NARRATIVES } from '../../../js/engine/shared/data/UnlockNarratives.js'
