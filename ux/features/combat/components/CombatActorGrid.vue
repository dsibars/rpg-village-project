<template>
  <div class="combat-grid" :class="{ 'targeting-active': targetingMode }">
    <!-- Heroes Column -->
    <div class="combat-column">
      <div class="column-title">{{ t('combat_uxelm_heroes') }}</div>
      <CombatActorCard
        v-for="(hero, index) in heroes"
        :key="hero.id || index"
        :actor="hero"
        :is-hero="true"
        :is-current-turn="currentActorId === hero.id"
        :is-targetable="isTargetable(hero, true)"
        :actor-index="index"
        :animation-class="actorAnimations[hero.id] || ''"
        :active-effects="floatingEffects[hero.id] || []"
        @target="$emit('target', { index, isHero: true })"
      />
    </div>

    <!-- Action Column -->
    <div class="combat-action-column">
      <!-- Initiative Timeline Track -->
      <div v-if="upcomingActors && upcomingActors.length > 0" class="initiative-track">
        <div class="initiative-title">
          {{ t('combat_uxelm_turn_timeline') }}
        </div>
        <div class="initiative-list">
          <template v-for="(act, idx) in upcomingActors" :key="act.id + '_' + idx">
            <div
              class="initiative-node"
              :class="{
                'is-hero': act.isHero,
                'is-enemy': !act.isHero,
                'is-current': act.isCurrent
              }"
              :title="act.name"
            >
              {{ act.avatar }}
              <span class="initiative-node-name">{{ act.name.split(' ')[0] }}</span>
            </div>
            <span v-if="idx < upcomingActors.length - 1" class="initiative-arrow">➔</span>
          </template>
        </div>
      </div>

      <div class="turn-banner">
        <span v-if="currentActor">{{ t('shared_uxelm_turn', { name: currentActorName }) }}</span>
        <span v-else>{{ t('combat_uxelm_awaiting') }}</span>
      </div>

      <!-- Latest Battle Action Feed -->
      <div v-if="latestActionText" class="latest-action-banner">
        <span class="action-icon">⚡</span>
        <span class="action-text">{{ latestActionText }}</span>
      </div>

      <slot name="action-panel" />
    </div>

    <!-- Enemies Column -->
    <div class="combat-column">
      <div class="column-title">{{ t('combat_uxelm_enemies') }}</div>
      <CombatActorCard
        v-for="(enemy, index) in enemies"
        :key="enemy.id || index"
        :actor="enemy"
        :is-hero="false"
        :is-current-turn="currentActorId === enemy.id"
        :is-targetable="isTargetable(enemy, false)"
        :actor-index="index"
        :animation-class="actorAnimations[enemy.id] || ''"
        :active-effects="floatingEffects[enemy.id] || []"
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
  validTargetIndices: { type: Array, default: () => [] },
  upcomingActors: { type: Array, default: () => [] },
  actorAnimations: { type: Object, default: () => ({}) },
  floatingEffects: { type: Object, default: () => ({}) },
  latestActionText: { type: String, default: '' }
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
  padding: 8px 12px; /* Visual padding to prevent scaled child borders from clipping */
}

.column-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: var(--spacing-xs);
  border-bottom: 1px solid var(--glass-border);
  margin-bottom: var(--spacing-xs);
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

/* Initiative Timeline Track */
.initiative-track {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  padding-bottom: 24px; /* Prevents character name labels from clipping with the bottom border */
  margin-bottom: var(--spacing-sm);
}

.initiative-title {
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  text-align: center;
}

.initiative-list {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-xs);
}

.initiative-node {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 0.95rem;
  border-radius: 50%;
  background: var(--bg-accent);
  border: 1px solid var(--glass-border);
  color: var(--text-muted);
  transition: all 0.3s ease;
}

.initiative-node.is-hero {
  border-color: rgba(99, 102, 241, 0.4);
  background: rgba(99, 102, 241, 0.15);
}

.initiative-node.is-enemy {
  border-color: rgba(248, 113, 113, 0.4);
  background: rgba(248, 113, 113, 0.15);
}

.initiative-node.is-current {
  width: 40px;
  height: 40px;
  font-size: 1.15rem;
  color: white;
  border-color: var(--accent-color);
  background: var(--accent-color);
  box-shadow: 0 0 10px var(--accent-glow);
}

.initiative-node-name {
  position: absolute;
  bottom: -18px; /* Positioned cleanly below the node sphere */
  font-size: 0.6rem;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 48px;
  color: var(--text-muted);
  pointer-events: none;
}

.initiative-node.is-current .initiative-node-name {
  color: var(--text-primary);
  font-weight: 700;
}

.initiative-arrow {
  color: var(--text-muted);
  font-size: 0.75rem;
}

/* Latest Action Feed Banner */
.latest-action-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: linear-gradient(90deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.12) 50%, rgba(139, 92, 246, 0.05) 100%);
  border-top: 1px solid var(--glass-border);
  border-bottom: 1px solid var(--glass-border);
  text-align: center;
  min-height: 48px;
  animation: bannerPulse 2s ease-in-out infinite;
}

@keyframes bannerPulse {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; }
}

.latest-action-banner .action-icon {
  font-size: 1.1rem;
  filter: drop-shadow(0 0 4px var(--accent-glow));
}

.latest-action-banner .action-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

/* Adaptive Targeting Overrides (using Deep selector for nested CombatActorCard root elements) */
.combat-grid.targeting-active :deep(.combat-card):not(.targetable) {
  opacity: 0.25 !important;
  filter: grayscale(0.9) blur(0.5px) !important;
  pointer-events: none;
}

.combat-grid.targeting-active :deep(.combat-card).targetable {
  transform: scale(1.01);
  border-color: var(--accent-color) !important;
  cursor: crosshair;
  box-shadow: 0 0 15px rgba(99, 102, 241, 0.4);
}

.combat-grid.targeting-active :deep(.combat-card).targetable:hover {
  transform: scale(1.025);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.7);
  border-color: #ffffff;
}

@media (max-width: 768px) {
  .combat-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }
}
</style>
