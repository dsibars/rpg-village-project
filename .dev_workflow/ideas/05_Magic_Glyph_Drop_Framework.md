# Idea 05: Magic Glyph Drop Framework

## Goal
Connect the expedition system to the Magic Circle system by allowing regions to drop **glyph tablets** as expedition rewards. Make magic progression region-gated: players must venture into specific areas to obtain specific glyphs.

## Current State (as per docs & code)
- `docs/shared/combat/magic_circle_system.md` defines glyphs as learnable spell components. Glyphs are obtained via:
  - Tablets found in expeditions (RNG)
  - Mastery through repeated casting
  - Teaching at the Glyph Academy
- **Currently, glyph tablets NEVER drop.** `LootService` only generates equipment and consumables.
- `docs/explore/regions_data.md` has no concept of glyph drops.
- Mystic Ruins is the designated "magic area" in the existing docs, but it has no mechanical identity related to magic.

## What This Enables
- Mystic Ruins becomes the primary source of basic elemental glyphs (`glyph_fire`, `glyph_water`, `glyph_earth`, `glyph_wind`).
- Forgotten Ruins can drop advanced effect glyphs (`glyph_pierce`, `glyph_multi`, `glyph_dark`).
- Future magic-themed regions can be authored with a `glyphDropTable` in their data file.
- The "magic area" concept from the user's draft becomes mechanically real.

## In Scope
1. **`glyphDropTable` in region schema**: optional array of `{ glyphId, weight, tier? }` (part of the region identity model from Idea 02).
2. **`LootService.generateGlyphDrop(regionId)`**: rolls the drop table, returns a glyph tablet item or null.
3. **Glyph Tablet item type**: added to inventory system as a consumable/quest item that the Arcane Sanctum or Magic Circle UI knows how to consume.
4. **`ExpeditionService._finishExpedition` hook**: calls `generateGlyphDrop` after equipment and consumable drops; adds result to expedition completion report so the UI can display it.
5. **Drop chance tuning**: base drop rate per region (e.g., 40% chance per expedition in Mystic Ruins), scaled by region level.

## Out of Scope
- New glyph types (the framework uses existing glyph IDs from `magic_circle_system.md`).
- Changes to how glyphs are learned or how the Magic Circle UI works.
- Enemy abilities related to magic (silence, spell absorption, etc.).
- Changes to the Glyph Academy teaching system.

## Boundaries & Constraints
- Glyph tablets must be **inventory items** so they appear in the Inventory UI and can be consumed by the Magic Circle system.
- Must not break the existing consumable drop balance (MP potions remain guaranteed).
- Drop rates must be data-driven per region, not hardcoded in `LootService`.
- Backward compatible: regions without `glyphDropTable` continue to drop only equipment and consumables.
- i18n: glyph names already have translation keys; only "Glyph Tablet" as an item name needs new keys.

## Dependencies
- **Idea 01 (Expedition Service Refactor)** must be complete. `LootService` and `ExpeditionService` need clean boundaries.
- **Idea 02 (Region Identity)** is the natural home for `glyphDropTable` — it belongs in the region data schema.
- **Idea 04 (Story Mission Effects)** could be used to grant glyph tablets directly from story missions, but this is optional.

## Success Criteria
- Mystic Ruins can be configured with a `glyphDropTable` and tablets drop after expeditions.
- A hero who receives a `glyph_fire` tablet can consume it to learn the glyph (reuses existing Magic Circle learn flow).
- Adding a new glyph to a region's drop table requires only editing the region data file.
- All existing tests pass.
