# Initiative: Battle UX Rework (Arena Combat)

> Status: SPEC — parked for a future iteration (post Step 3). Captured from
> the product owner on 2026-07-18. Do not start without reviewing together.

## Problem

The current battle screen is "a form stretched to screen width": actors in
the top third, a void below, no arena, enemies as emoji. It doesn't feel
like an RPG battle.

## Design (owner's spec)

### 1. Area-based backgrounds
- Optional `area` parameter propagated from any battle trigger (expeditions
  provide it per region). Combat overlay renders a background per `area`.
- Start with ~5 placeholder backgrounds (even flat colors) to establish the
  plumbing; replace with real art later (possible image-gen pass).

### 2. Fixed-size square actor cards on an implicit 3×3 grid per side
- Hero cards (left): fixed square size, transparent bg, name + bars kept,
  portrait = the same hero art as hero details, facing **right** (toward the
  enemy).
- Enemy cards (right): same format, image on the left, facing left.
- 4-hero party limit stays even with a 3×3 grid.

### 3. Turn focus + FF-style action menu
- On an actor's turn, its card animates to the **center** of the screen.
- For heroes: an action list appears beside the centered card (classic FF
  nested menu). On selection, card returns to its grid slot.
- Target feedback: shiny effect on target cards (single enemy, healed ally,
  or all targets for AoE).
- Enemies: same center-and-return animation, no menu (automated).

### 4. Grid tactics (to be designed carefully, not rushed)
- Candidate rules the owner likes:
  - Back column (far from center): cannot use physical skills.
  - Items only on adjacent heroes.
  - Ranged attack blocked if an ally is on the line.
  - A "move" action that repositions at the cost of the turn.
  - Grouping heroes enables collaboration but eases AoE targeting.
- Owner wants to think the rules through properly first.

### Later
- Iterate card presentation; possibly real sprites.
- Party configuration UI (alias of N heroes with placement); solo heroes
  get a preferred position otherwise assigned at combat start.

## References
- Current combat UI: `ux/features/combat/` (`CombatOverlay`, `CombatActorGrid`,
  `CombatActorCard`, `CombatActionPanel`, `CombatHeader`)
- Battle engine: `js/engine/shared/combat/services/BattleService.js`
- Expedition trigger (area source): `js/engine/explore/services/ExpeditionService.js`
