<template>
  <div ref="arenaRoot" class="combat-arena">
    <BattleBackdrop :area="area" />

    <div class="arena-content">
      <!-- Heroes: implicit 3×3 grid, portraits face right -->
      <div class="arena-side">
        <div class="side-title">{{ t('combat_uxelm_heroes') }}</div>
        <div class="side-grid">
          <CombatActorCard
            v-for="(hero, index) in heroes"
            :key="hero.id || index"
            :ref="el => registerCard(hero.id, el)"
            :actor="hero"
            :is-hero="true"
            :is-current-turn="currentActorId === hero.id"
            :is-targetable="isTargetable(hero, true)"
            :actor-index="index"
            :animation-class="actorAnimations[hero.id] || ''"
            :active-effects="floatingEffects[hero.id] || []"
            :style="focusStyle(hero.id)"
            @target="$emit('target', { index, isHero: true })"
          />
        </div>
      </div>

      <!-- Center stage: timeline + focused-card zone + action menu -->
      <div class="arena-center">
        <div v-if="upcomingActors && upcomingActors.length > 0 && !isOver" class="initiative-track">
          <template v-for="(act, idx) in upcomingActors" :key="act.id + '_' + idx">
            <div
              class="initiative-node"
              :class="{ 'is-hero': act.isHero, 'is-enemy': !act.isHero, 'is-current': act.isCurrent }"
              :title="act.name"
            >
              {{ act.avatar }}
            </div>
            <span v-if="idx < upcomingActors.length - 1" class="initiative-arrow">➔</span>
          </template>
        </div>

        <div class="center-stage">
          <div class="turn-banner" :class="{ defeat: isOver && !isVictory }">
            <span v-if="isOver">{{ t('combat_uxelm_battle_over') }}</span>
            <span v-else-if="currentActorName">{{ t('shared_uxelm_turn', { name: currentActorName }) }}</span>
            <span v-else>{{ t('combat_uxelm_awaiting') }}</span>
          </div>

          <slot name="action-panel" />

          <div v-if="latestActionText && !isOver" class="latest-action-banner">
            <span class="action-icon">⚡</span>
            <span class="action-text">{{ latestActionText }}</span>
          </div>
        </div>
      </div>

      <!-- Enemies: implicit 3×3 grid, portraits face left -->
      <div class="arena-side">
        <div class="side-title">{{ t('combat_uxelm_enemies') }}</div>
        <div class="side-grid">
          <CombatActorCard
            v-for="(enemy, index) in enemies"
            :key="enemy.id || index"
            :ref="el => registerCard(enemy.id, el)"
            :actor="enemy"
            :is-hero="false"
            :is-current-turn="currentActorId === enemy.id"
            :is-targetable="isTargetable(enemy, false)"
            :actor-index="index"
            :animation-class="actorAnimations[enemy.id] || ''"
            :active-effects="floatingEffects[enemy.id] || []"
            :style="focusStyle(enemy.id)"
            @target="$emit('target', { index, isHero: false })"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import BattleBackdrop from './BattleBackdrop.vue'
import CombatActorCard from './CombatActorCard.vue'

const props = defineProps({
  heroes: { type: Array, default: () => [] },
  enemies: { type: Array, default: () => [] },
  currentActorId: { type: String, default: null },
  targetingMode: { type: String, default: null },
  validTargetIndices: { type: Array, default: () => [] },
  upcomingActors: { type: Array, default: () => [] },
  actorAnimations: { type: Object, default: () => ({}) },
  floatingEffects: { type: Object, default: () => ({}) },
  latestActionText: { type: String, default: '' },
  isOver: { type: Boolean, default: false },
  isVictory: { type: Boolean, default: false },
  area: { type: String, default: null }
})

defineEmits(['target'])

const { t } = useI18n()

const arenaRoot = ref(null)
const cardEls = new Map()
// id -> { dx, dy } translation that moves the active card to the arena center
const focusOffsets = ref({})

function registerCard(id, el) {
  if (!id) return
  if (el) cardEls.set(id, el)
  else cardEls.delete(id)
}

const currentActorName = computed(() => {
  const all = [...props.heroes, ...props.enemies]
  return all.find((a) => a.id === props.currentActorId)?.name || ''
})

function isTargetable(actor, isHero) {
  if (!props.targetingMode) return false
  if (actor.hp <= 0) return false

  // Friendly targeting
  if (props.targetingMode.includes('ally')) {
    return isHero && props.validTargetIndices.includes(props.heroes.indexOf(actor))
  }

  // Enemy targeting
  if (props.targetingMode.includes('enemy')) {
    return !isHero && props.validTargetIndices.includes(props.enemies.indexOf(actor))
  }

  // Self targeting
  if (props.targetingMode === 'self') {
    return isHero && actor.id === props.currentActorId
  }

  return false
}

// Measure where the active card sits and compute the translation that
// brings it to the arena's center stage (FLIP-style, grid slot preserved).
watch(
  () => [props.currentActorId, props.heroes.length, props.enemies.length],
  async () => {
    await nextTick()
    if (!props.currentActorId || !arenaRoot.value) {
      focusOffsets.value = {}
      return
    }
    const el = cardEls.get(props.currentActorId)?.$el || cardEls.get(props.currentActorId)
    if (!el) {
      focusOffsets.value = {}
      return
    }
    const arenaRect = arenaRoot.value.getBoundingClientRect()
    const cardRect = el.getBoundingClientRect()
    const dx = (arenaRect.left + arenaRect.width / 2) - (cardRect.left + cardRect.width / 2)
    // Focus slightly above center so the action menu fits below the card
    const dy = (arenaRect.top + arenaRect.height * 0.42) - (cardRect.top + cardRect.height / 2)
    focusOffsets.value = { [props.currentActorId]: { dx, dy } }
  },
  { immediate: true }
)

function focusStyle(id) {
  const offset = focusOffsets.value[id]
  if (!offset) return {}
  return {
    transform: `translate(${offset.dx}px, ${offset.dy}px) scale(1.18)`,
    zIndex: 30,
    position: 'relative'
  }
}
</script>

<style scoped>
.combat-arena {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
}

.arena-content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-lg);
  gap: var(--spacing-md);
}

.arena-side {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.side-title {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: var(--spacing-xs);
}

.side-grid {
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-auto-rows: auto;
  gap: var(--spacing-sm);
  justify-content: center;
  align-content: center;
}

.arena-center {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
}

.initiative-track {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 10px;
  background: rgba(13, 19, 14, 0.55);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}

.initiative-node {
  font-size: 1rem;
  opacity: 0.55;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.initiative-node.is-current {
  opacity: 1;
  transform: scale(1.25);
  filter: drop-shadow(0 0 4px rgba(134, 239, 172, 0.8));
}

.initiative-arrow {
  font-size: 0.6rem;
  color: var(--text-muted);
}

.center-stage {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

.turn-banner {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-primary-light, #86efac);
  text-align: center;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
}

.turn-banner.defeat {
  color: #f87171;
}

.latest-action-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: 4px 12px;
  background: rgba(13, 19, 14, 0.6);
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  color: var(--text-primary);
  max-width: 90%;
}

.action-icon {
  font-size: 0.85rem;
}

.action-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .arena-content {
    padding: var(--spacing-xs) var(--spacing-sm);
    gap: var(--spacing-sm);
  }

  .side-grid {
    gap: var(--spacing-xs);
  }
}
</style>
