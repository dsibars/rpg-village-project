<template>
  <div class="village-defense">
    <div v-if="showHeader" class="defense-header">
      <h4>{{ t('village_uxelm_defender') }}</h4>
      <span class="defense-count">{{ assigned.length }} / {{ maxDefenders }}</span>
    </div>

    <div v-if="assigned.length === 0 && idleHeroes.length === 0" class="empty-state">
      {{ t('village_uxelm_defender_none') }}
    </div>

    <div v-else class="defense-content">
      <!-- Assigned defenders -->
      <div v-if="assigned.length > 0" class="defenders-row">
        <span
          v-for="heroId in assigned"
          :key="heroId"
          class="defender-chip"
          :title="t('shared_uxelm_remove')"
          @click="$emit('unassign', heroId)"
        >
          {{ getHeroName(heroId) }}
          <span class="remove-btn">✕</span>
        </span>
      </div>

      <!-- Assignable heroes -->
      <div v-if="assignableHeroes.length > 0 && canAssign" class="assign-section">
        <h5>{{ t('village_uxelm_defender_assign') }}</h5>
        <div class="assign-buttons">
          <Button
            v-for="hero in assignableHeroes"
            :key="hero.id"
            variant="ghost"
            size="sm"
            @click="$emit('assign', hero.id)"
          >
            + {{ hero.name }}
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
  assigned: { type: Array, default: () => [] },
  heroes: { type: Array, default: () => [] },
  showHeader: { type: Boolean, default: true }
})

const emit = defineEmits(['assign', 'unassign'])

const { t } = useI18n()

const maxDefenders = 4

const idleHeroes = computed(() =>
  (props.heroes || []).filter((h) => h.activity === 'idle' && h.hp > 0)
)

const canAssign = computed(() => props.assigned.length < maxDefenders)

const assignableHeroes = computed(() =>
  idleHeroes.value.filter((h) => !props.assigned.includes(h.id))
)

function getHeroName(heroId) {
  const hero = props.heroes.find((h) => h.id === heroId)
  return hero ? hero.name : heroId
}
</script>

<style scoped>
.village-defense {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.defense-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.defense-header h4 {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.defense-count {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.empty-state {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-style: italic;
}

.defenders-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: var(--spacing-xs);
}

.defender-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background: rgba(74, 222, 128, 0.1);
  border: 1px solid rgba(74, 222, 128, 0.2);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--text-primary);
  cursor: pointer;
}

.defender-chip:hover {
  border-color: var(--color-danger);
}

.remove-btn {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.assign-section h5 {
  margin: 0 0 var(--spacing-xs);
  font-size: 0.8rem;
  color: var(--text-muted);
}

.assign-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
