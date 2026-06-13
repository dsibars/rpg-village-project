<template>
  <div class="labor-pool">
    <div class="pool-header">
      <h4>{{ t('village_uxelm_role') }}</h4>
      <span class="pool-status">
        ({{ available }} {{ t('shared_uxelm_available') }} / {{ total }} {{ t('shared_uxelm_total') }})
      </span>
    </div>

    <div class="role-list">
      <div
        v-for="(count, role) in roles"
        :key="role"
        class="role-row"
      >
        <div class="role-info">
          <span class="role-icon">{{ roleIcons[role] }}</span>
          <span class="role-name">{{ t('village_info_role_' + role) }}</span>
          <span class="role-effect">({{ roleEffects[role] }})</span>
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
          <span class="role-count">{{ count }}</span>
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
  font-size: 0.8rem;
  color: var(--text-muted);
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
}

.role-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.role-icon {
  font-size: 1rem;
}

.role-name {
  font-size: 0.85rem;
  color: var(--text-primary);
}

.role-effect {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.role-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.role-count {
  min-width: 24px;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}
</style>
