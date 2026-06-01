# Iteration Prompt: Fix 2 Save Bugs + Remove Dead Code

You just completed the Expedition Service Refactor. The code is **almost perfect** — all 16 tests pass. But a code review found **2 critical save bugs** that would cause region stats (retreats/fails) to be lost on reload.

## Issues to Fix

### Bug 1: `ExpeditionService.retire()` doesn't save RegionService state
**File:** `js/engine/explore/services/ExpeditionService.js`  
**Line:** ~226

`retire()` calls `this._trackRetreat()` which mutates `regionService` state, but then only calls `this.save()` (ExpeditionService state). The retreat count is lost.

**Fix:** Add `this.regionService.save();` before `this.save();`:
```js
retire(expId) {
    // ... existing retreat tracking logic ...
    this.state.activeCombatExpeditionId = null;
    this.regionService.save();  // <-- ADD THIS
    this.save();
    return Result.ok();
}
```

### Bug 2: `ExpeditionService.resolveBattle()` defeat path doesn't save RegionService state
**File:** `js/engine/explore/services/ExpeditionService.js`  
**Line:** ~568

The defeat branch calls `this.regionService.incrementRegionStat(exp.regionId, 'fails')` but then only calls `this.save()`. The fail count is lost.

**Fix:** Add `this.regionService.save();` before `this.save();`:
```js
} else {
    // Defeat removes this expedition
    // ... existing defeat logic ...
    
    // Track region failure stats
    this.regionService.incrementRegionStat(exp.regionId, 'fails');

    this.regionService.save();  // <-- ADD THIS
    this.save();
    finalResult = Result.ok({ status: 'failed', expId, expName, combatLog });
}
```

### Cleanup: Remove dead `_findExpeditionDefinition` method
**File:** `js/engine/explore/services/ExpeditionService.js`  
**Lines:** ~237-239

This method delegates to `regionService.getExpeditionDefinition()` but is **never called** anywhere in the codebase. Remove it to keep the file clean.

```js
// REMOVE this entire method:
_findExpeditionDefinition(expId) {
    return this.regionService.getExpeditionDefinition(expId);
}
```

## Verification

After fixing, run the tests to confirm nothing breaks:
```bash
node --test tests/unit/ExpeditionService.test.js
node --test tests/unit/DefenseRaid.test.js
```

Both suites must still pass (16/16 tests total).
