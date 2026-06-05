<template>
  <div class="combat-grid">
    <!-- Heroes Column -->
    <div class="combat-column">
      <div class="column-title">{{ t('shared_uxelm_heroes') }}</div>
      <CombatActorCard
        v-for="(hero, index) in heroes"
        :key="hero.id"
        :actor="hero"
        :is-hero="true"
        :is-current-turn="currentActorId === hero.id"
        :is-targetable="isTargetable(hero, true)"
        :actor-index="index"
        @target="$emit('target', { index, isHero: true })"
      />
    </div>

    <!-- Action Column -->
    <div class="combat-action-column">
      <div class="turn-banner">
        <span v-if="currentActor">{{ t('combat_uxelm_current_turn', { name: currentActorName }) }}</span>
        <span v-else>{{ t('combat_uxelm_awaiting') }}</span>
      </div>
      <slot name="action-panel" />
    </div>

    <!-- Enemies Column -->
    <div class="combat-column">
      <div class="column-title">{{ t('combat_uxelm_enemies') }}</div>
      <CombatActorCard
        v-for="(enemy, index) in enemies"
        :key="index"
        :actor="enemy"
        :is-hero="false"
        :is-current-turn="currentActorId === enemy.id"
        :is-targetable="isTargetable(enemy, false)"
        :actor-index="index"
        @target="$emit('target', { index, isHero: false })"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import CombatActorCard from './CombatActorCard.vue'

const props = defineProps({
  heroes: { type: Array, default: () => [] },
  enemies: { type: Array, default: () => [] },
  currentActorId: { type: String, default: null },
  targetingMode: { type: String, default: null },
  validTargetIndices: { type: Array, default: () => [] }
})

const emit = defineEmits(['target'])

const { t } = useI18n()

const currentActor = computed(() => {
  const all = [...props.heroes, ...props.enemies]
  return all.find((a) => a.id === props.currentActorId)
})

const currentActorName = computed(() => {
  if (!currentActor.value) return ''
  return currentActor.value.name
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
</script>

<style scoped>
.combat-grid {
  display: grid;
  grid-template-columns: 1fr 320px 1fr;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
  flex: 1;
  min-height: 0;
}

.combat-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  min-height: 0;
  overflow-y: auto;
}

.column-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--glass-border);
}

.combat-action-column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-height: 0;
}

.turn-banner {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  text-align: center;
  font-weight: 600;
  color: var(--color-primary-light);
}

@media (max-width: 768px) {
  .combat-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }
}
</style>
