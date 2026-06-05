<template>
  <div
    class="combat-card"
    :class="[
      isHero ? 'hero-card' : 'enemy-card',
      { active: isCurrentTurn, dead: isDead }
    ]"
  >
    <div class="card-avatar">
      {{ isDead ? '\u{1F480}' : (isHero ? '\u{2694}' : '\u{1F47E}') }}
    </div>

    <div class="card-info">
      <div class="card-header">
        <span class="card-name">{{ displayName }}</span>
        <span class="card-level">Lv.{{ actor.level || 1 }}</span>
      </div>

      <!-- HP Bar -->
      <div class="bar-container">
        <div class="bar hp-bar" :style="{ width: `${hpPct}%` }" />
      </div>
      <div class="bar-text">
        <span>{{ t('heroes_info_stat_hp') }}</span>
        <span>{{ actor.hp }}/{{ actor.maxHp }}</span>
      </div>

      <!-- Stamina Bar (heroes only) -->
      <template v-if="isHero && actor.maxStamina > 0">
        <div class="bar-container thin">
          <div class="bar stamina-bar" :style="{ width: `${staminaPct}%` }" />
        </div>
        <div class="bar-text small">
          <span>{{ t('shared_uxelm_stamina') }}</span>
          <span>{{ actor.stamina }}/{{ actor.maxStamina }}</span>
        </div>
      </template>

      <!-- MP Bar (heroes only) -->
      <template v-if="isHero && actor.maxMp > 0">
        <div class="bar-container thin">
          <div class="bar mp-bar" :style="{ width: `${mpPct}%` }" />
        </div>
        <div class="bar-text small">
          <span>{{ t('heroes_info_stat_mp') }}</span>
          <span>{{ actor.mp }}/{{ actor.maxMp }}</span>
        </div>
      </template>

      <!-- Status Effects -->
      <div v-if="actor.statusEffects?.length > 0" class="status-badges">
        <span
          v-for="(st, idx) in actor.statusEffects"
          :key="idx"
          class="status-badge"
          :title="`${st.type} (${st.duration} turns)`"
        >
          {{ statusIcon(st.type) }}
        </span>
      </div>
    </div>

    <!-- Targeting overlay -->
    <div
      v-if="isTargetable"
      class="target-overlay"
      @click="$emit('target', actorIndex)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'

const props = defineProps({
  actor: { type: Object, required: true },
  isHero: { type: Boolean, default: false },
  isCurrentTurn: { type: Boolean, default: false },
  isTargetable: { type: Boolean, default: false },
  actorIndex: { type: Number, default: 0 }
})

const emit = defineEmits(['target'])

const { t } = useI18n()

const isDead = computed(() => props.actor.hp <= 0)

const displayName = computed(() => {
  if (props.isHero) return props.actor.name

  const actor = props.actor
  if (!actor.templateId) return actor.name

  const translationKey = 'combat_info_' + actor.templateId
  const baseName = t(translationKey)
  if (baseName === translationKey) return actor.name

  if (actor.isElite) {
    const prefixKey = 'combat_info_elite_tier_' + actor.eliteTier
    const prefix = t(prefixKey)
    if (prefix !== prefixKey) {
      return t('combat_info_elite_format', { prefix, name: baseName })
    }
    const defaultPrefixes = ['Fierce', 'Corrupted', 'Ancient', 'Legendary']
    return `${defaultPrefixes[actor.eliteTier] || 'Fierce'} ${baseName}`
  }
  return baseName
})

const hpPct = computed(() => {
  const max = props.actor.maxHp || 1
  return Math.max(0, Math.min(100, (props.actor.hp / max) * 100))
})

const staminaPct = computed(() => {
  const max = props.actor.maxStamina || 1
  return Math.max(0, Math.min(100, (props.actor.stamina / max) * 100))
})

const mpPct = computed(() => {
  const max = props.actor.maxMp || 1
  return Math.max(0, Math.min(100, (props.actor.mp / max) * 100))
})

function statusIcon(type) {
  const map = {
    poison: '\u{1F922}',
    burn: '\u{1F525}',
    regen: '\u{1F49A}',
    haste: '\u{2B50}',
    sleep: '\u{1F4A4}',
    stun: '\u{1F4AB}'
  }
  return map[type] || type
}
</script>

<style scoped>
.combat-card {
  position: relative;
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}

.combat-card.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.3);
}

.combat-card.dead {
  opacity: 0.5;
  filter: grayscale(0.8);
}

.card-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.card-level {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.bar-container {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.bar-container.thin {
  height: 4px;
}

.bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.hp-bar {
  background: linear-gradient(90deg, #ef4444, #22c55e);
}

.stamina-bar {
  background: #f59e0b;
}

.mp-bar {
  background: #3b82f6;
}

.bar-text {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.bar-text.small {
  font-size: 0.65rem;
}

.status-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 2px;
}

.status-badge {
  font-size: 0.8rem;
  padding: 1px 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-sm);
}

.target-overlay {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-md);
  background: rgba(99, 102, 241, 0.15);
  border: 2px dashed var(--color-primary);
  cursor: crosshair;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
