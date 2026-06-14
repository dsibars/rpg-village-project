<template>
  <div class="labor-pool">
    <div class="pool-header">
      <h4>{{ t('village_uxelm_role') }}</h4>
      <span class="pool-status" :class="{ 'has-idle': available > 0 }">
        <span v-if="available > 0" class="idle-badge">{{ available }}</span>
        <span class="status-text">
          <template v-if="available > 0">
            {{ t('shared_uxelm_available') }} / {{ total }} {{ t('shared_uxelm_total') }}
          </template>
          <template v-else>
            {{ available }} {{ t('shared_uxelm_available') }} / {{ total }} {{ t('shared_uxelm_total') }}
          </template>
        </span>
      </span>
    </div>

    <div class="role-list">
      <div
        v-for="(count, role) in roles"
        :key="role"
        class="role-row"
        :class="{ 'has-count': count > 0 }"
      >
        <div class="role-info">
          <span class="role-icon" :class="'role-' + role">{{ roleIcons[role] }}</span>
          <div class="role-labels">
            <span class="role-name">{{ t('village_info_role_' + role) }}</span>
            <span class="role-effect" :class="'effect-' + role">{{ roleEffects[role] }}</span>
          </div>
        </div>
        <div class="role-controls">
          <Button
            variant="ghost"
            size="sm"
            :disabled="count <= 0"
            @click="$emit('changeRole', { role, delta: -1 })"
          >
            −
          </Button>
          <span class="role-count" :class="{ 'is-zero': count === 0 }">{{ count }}</span>
          <Button
            variant="ghost"
            size="sm"
            :disabled="available <= 0"
            @click="$emit('changeRole', { role, delta: 1 })"
          >
            +
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import Button from '@/components/Button.vue'

const props = defineProps({
  population: { type: Object, default: () => ({}) }
})

const emit = defineEmits(['changeRole'])

const { t } = useI18n()

const roles = computed(() => {
  const pop = props.population || {}
  return pop.roles || { builder: pop.builders || 0, farmer: 0, miner: 0, scout: 0 }
})

const total = computed(() => props.population?.total || 0)

const used = computed(() => {
  return Object.values(roles.value).reduce((a, b) => a + b, 0)
})

const available = computed(() => total.value - used.value)

const roleIcons = {
  builder: '🔨',
  farmer: '🌾',
  miner: '⛏',
  scout: '👁'
}

const roleEffects = {
  builder: t('village_info_role_builder_effect'),
  farmer: t('village_info_role_farmer_effect'),
  miner: t('village_info_role_miner_effect'),
  scout: t('village_info_role_scout_effect')
}
</script>

<style scoped>
.labor-pool {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.pool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pool-header h4 {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pool-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
  transition: color 0.2s ease;
}

.pool-status.has-idle {
  color: var(--color-primary-light);
}

.idle-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-primary-light));
  color: #0a1f0a;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 11px;
  animation: pulseIdle 2s ease-in-out infinite;
}

@keyframes pulseIdle {
  0%, 100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(74, 222, 128, 0); }
}

.status-text {
  font-weight: 500;
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.role-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  gap: var(--spacing-sm);
  transition: all 0.15s ease;
}

.role-row:hover {
  border-color: var(--color-primary-light);
  background: rgba(74, 222, 128, 0.04);
}

.role-row.has-count {
  border-color: rgba(74, 222, 128, 0.25);
  background: rgba(74, 222, 128, 0.03);
}

.role-row.has-count:hover {
  border-color: var(--color-primary-light);
  background: rgba(74, 222, 128, 0.07);
}

.role-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.role-icon {
  font-size: 1.1rem;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.04);
  flex-shrink: 0;
}

.role-builder { background: rgba(168, 162, 158, 0.15); }
.role-farmer   { background: rgba(250, 204, 21, 0.12); }
.role-miner    { background: rgba(148, 163, 184, 0.15); }
.role-scout    { background: rgba(34, 211, 238, 0.12); }

.role-labels {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.role-name {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 500;
}

.role-effect {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.effect-builder { color: #a8a29e; }
.effect-farmer  { color: #facc15; }
.effect-miner   { color: #94a3b8; }
.effect-scout   { color: #22d3ee; }

.role-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.role-count {
  min-width: 28px;
  text-align: center;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text-primary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.06);
  transition: all 0.15s ease;
}

.role-count.is-zero {
  color: var(--text-muted);
  background: transparent;
  font-weight: 500;
}
</style>
