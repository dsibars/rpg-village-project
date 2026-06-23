/**
 * Combat Balance Lab — Metrics Parser
 *
 * Parses a single combat log into per-combat metrics and aggregates
 * multiple combat runs into statistics.
 *
 * Design notes
 * ─────────────
 * • Turn counting uses a heuristic: an entity’s turn is a contiguous
 *   block of log events belonging to the same actor.  STAMINA_REGEN,
 *   STUN_SKIP, SLEEP_SKIP, DAMAGE, SPELL_DAMAGE, HEAL, etc. that share
 *   an actorId (or targetId for STATUS_TICK / TRAIT_REGEN) are treated
 *   as the same turn.
 * • Damage is bucketed by source (autoAttack, skill, spell, statusEffect).
 * • Healing is tracked as a total + tick count.
 * • Status effects are tracked by type (applied via DAMAGE event
 *   annotation, ticks via STATUS_TICK events).
 */

// ───────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────

function createDamageBucket() {
  return { total: 0, hits: 0, crits: 0, misses: 0, avgPerHit: 0 };
}

function addToDamageBucket(bucket, amount, hits = 1, isCrit = false, isMiss = false) {
  if (isMiss) {
    bucket.misses += hits;
  } else {
    bucket.total += amount;
    bucket.hits += hits;
    if (isCrit) bucket.crits += 1; // one crit per action, not per hit
  }
  if (bucket.hits > 0) {
    bucket.avgPerHit = bucket.total / bucket.hits;
  }
}

function getTurnActor(event) {
  // STATUS_TICK and TRAIT_REGEN happen to the current entity, not from an actor
  if (event.type === 'STATUS_TICK' || event.type === 'STATUS_EXPIRED' || event.type === 'TRAIT_REGEN') {
    return event.targetId || null;
  }
  return event.actorId || null;
}

// ───────────────────────────────────────────────────────────────────────────
// Per-combat parser
// ───────────────────────────────────────────────────────────────────────────

/**
 * Parse a single combat log into structured metrics.
 *
 * @param {Array<Object>} log — array of combat events from BattleService
 * @param {string|null} [winner] — 'heroes', 'enemies', 'escape', or null
 * @returns {Object} per-combat metrics
 */
export function parseCombatLog(log, winner = null) {
  const metrics = {
    turns: 0,
    winner: winner || null,
    damage: {
      autoAttack: createDamageBucket(),
      skill: {},
      spell: {},
      statusEffect: createDamageBucket()
    },
    healing: {
      total: 0,
      ticks: 0,
      bySource: {}
    },
    statusEffects: {
      applied: {},
      ticks: {}
    },
    items: {
      used: {}
    },
    resources: {
      staminaSpent: { total: 0, byHero: {} },
      mpSpent: { total: 0, byHero: {} }
    }
  };

  let currentTurnActor = null;

  for (const event of log) {
    const actor = getTurnActor(event);

    // ── Turn counting ─────────────────────────────────────────────────
    if (actor && actor !== currentTurnActor) {
      currentTurnActor = actor;
      metrics.turns++;
    }

    // ── Damage events ───────────────────────────────────────────────────
    if (event.type === 'DAMAGE') {
      const isAutoAttack = event.skillId === 'single_strike';
      const bucket = isAutoAttack
        ? metrics.damage.autoAttack
        : (metrics.damage.skill[event.skillId] ||= createDamageBucket());
      addToDamageBucket(bucket, event.amount || 0, event.hits || 1, event.isCrit, event.isMiss);

      // Side effects attached to damage events
      if (event.statusApplied) {
        metrics.statusEffects.applied[event.statusApplied] =
          (metrics.statusEffects.applied[event.statusApplied] || 0) + 1;
      }
      continue;
    }

    if (event.type === 'SPELL_DAMAGE') {
      const spellName = event.spellName || 'unknown';
      const bucket = (metrics.damage.spell[spellName] ||= createDamageBucket());
      addToDamageBucket(bucket, event.amount || 0, 1, false, false);
      continue;
    }

    if (event.type === 'STATUS_TICK') {
      const damage = event.damage || 0;
      addToDamageBucket(metrics.damage.statusEffect, damage, 1);
      const effectType = event.effectType || 'unknown';
      metrics.statusEffects.ticks[effectType] = (metrics.statusEffects.ticks[effectType] || 0) + 1;
      continue;
    }

    // ── Healing events ────────────────────────────────────────────────
    if (event.type === 'HEAL' || event.type === 'VAMP' || event.type === 'TRAIT_REGEN') {
      const amount = event.amount || 0;
      metrics.healing.total += amount;
      metrics.healing.ticks++;

      const source = event.type === 'VAMP' ? 'vampirism'
        : event.type === 'TRAIT_REGEN' ? 'trait_regen'
        : event.source || 'heal';

      const src = (metrics.healing.bySource[source] ||= { total: 0, ticks: 0 });
      src.total += amount;
      src.ticks++;
      continue;
    }

    // ── Item usage ──────────────────────────────────────────────────────
    if (event.type === 'USE_CONSUMABLE') {
      const itemId = event.consumableId || 'unknown';
      metrics.items.used[itemId] = (metrics.items.used[itemId] || 0) + 1;
      continue;
    }

    // ── Stamina / MP restore (not spent, but tracked for completeness) ──
    if (event.type === 'STAMINA_RESTORE' || event.type === 'MP_RESTORE') {
      const amount = event.amount || 0;
      const source = event.type === 'STAMINA_RESTORE' ? 'stamina_restore' : 'mp_restore';
      const src = (metrics.healing.bySource[source] ||= { total: 0, ticks: 0 });
      src.total += amount;
      src.ticks++;
      continue;
    }

    // ── Stamina regen (turn indicator, no healing/damage to count) ──────
    if (event.type === 'STAMINA_REGEN') {
      // Already counted as turn indicator; no additional metrics
      continue;
    }
  }

  return metrics;
}

// ───────────────────────────────────────────────────────────────────────────
// Aggregation
// ───────────────────────────────────────────────────────────────────────────

function avg(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function mergeDamageBuckets(target, source) {
  target.total += source.total;
  target.hits += source.hits;
  target.crits += source.crits;
  target.misses += source.misses;
  if (target.hits > 0) {
    target.avgPerHit = target.total / target.hits;
  }
}

/**
 * Aggregate an array of per-combat metrics into summary statistics.
 *
 * @param {Array<Object>} metricsArray — results from parseCombatLog()
 * @returns {Object} aggregated metrics
 */
export function aggregateMetrics(metricsArray) {
  if (!metricsArray || metricsArray.length === 0) {
    return {
      scenarioId: '',
      iterations: 0,
      wins: 0, losses: 0, winRate: 0,
      avgTurns: 0, minTurns: 0, maxTurns: 0,
      damage: {},
      healing: { total: 0, ticks: 0 },
      statusEffects: {},
      items: {},
      resources: { staminaSpent: { total: 0, byHero: {} }, mpSpent: { total: 0, byHero: {} } }
    };
  }

  const wins = metricsArray.filter(m => m.winner === 'heroes' || m.winner === 'escape').length;
  const losses = metricsArray.filter(m => m.winner === 'enemies').length;
  const turnCounts = metricsArray.map(m => m.turns);

  const damage = {
    autoAttack: createDamageBucket(),
    skill: {},
    spell: {},
    statusEffect: createDamageBucket()
  };

  const healing = { total: 0, ticks: 0 };
  const statusEffects = { applied: {}, ticks: {} };
  const items = { used: {} };
  const resources = {
    staminaSpent: { total: 0, byHero: {} },
    mpSpent: { total: 0, byHero: {} }
  };

  for (const m of metricsArray) {
    mergeDamageBuckets(damage.autoAttack, m.damage.autoAttack);
    for (const [id, bucket] of Object.entries(m.damage.skill)) {
      mergeDamageBuckets((damage.skill[id] ||= createDamageBucket()), bucket);
    }
    for (const [name, bucket] of Object.entries(m.damage.spell)) {
      mergeDamageBuckets((damage.spell[name] ||= createDamageBucket()), bucket);
    }
    mergeDamageBuckets(damage.statusEffect, m.damage.statusEffect);

    healing.total += m.healing.total;
    healing.ticks += m.healing.ticks;

    for (const [k, v] of Object.entries(m.statusEffects.applied)) {
      statusEffects.applied[k] = (statusEffects.applied[k] || 0) + v;
    }
    for (const [k, v] of Object.entries(m.statusEffects.ticks)) {
      statusEffects.ticks[k] = (statusEffects.ticks[k] || 0) + v;
    }

    for (const [k, v] of Object.entries(m.items.used)) {
      items.used[k] = (items.used[k] || 0) + v;
    }

    resources.staminaSpent.total += m.resources.staminaSpent.total;
    for (const [hero, v] of Object.entries(m.resources.staminaSpent.byHero)) {
      resources.staminaSpent.byHero[hero] = (resources.staminaSpent.byHero[hero] || 0) + v;
    }
    resources.mpSpent.total += m.resources.mpSpent.total;
    for (const [hero, v] of Object.entries(m.resources.mpSpent.byHero)) {
      resources.mpSpent.byHero[hero] = (resources.mpSpent.byHero[hero] || 0) + v;
    }
  }

  return {
    scenarioId: '',
    iterations: metricsArray.length,
    wins,
    losses,
    winRate: wins / metricsArray.length,
    avgTurns: avg(turnCounts),
    minTurns: Math.min(...turnCounts),
    maxTurns: Math.max(...turnCounts),
    damage,
    healing,
    statusEffects,
    items,
    resources
  };
}

/**
 * Resolve a dotted metric path against aggregated metrics.
 *
 * @param {Object} metrics — aggregated metrics from aggregateMetrics()
 * @param {string} path — dotted path, e.g. "damage.spell.Fireball.total"
 * @returns {number|undefined}
 */
export function resolveMetric(metrics, path) {
  const parts = path.split('.');
  let value = metrics;
  for (const part of parts) {
    if (value === null || value === undefined) return undefined;
    value = value[part];
  }
  return value;
}
