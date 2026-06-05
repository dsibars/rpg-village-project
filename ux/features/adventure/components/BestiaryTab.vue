<template>
  <div class="bestiary-tab">
    <div class="bestiary-header">
      <span class="bestiary-count">{{ t('shared_uxelm_nav_bestiary') }}: {{ discoveredCount }} / {{ totalCount }}</span>
    </div>

    <div v-if="totalCount === 0" class="bestiary-empty">
      {{ t('bestiary_uxelm_empty') }}
    </div>

    <div v-else class="bestiary-grid">
      <div
        v-for="enemy in enemyList"
        :key="enemy.id"
        class="enemy-card"
        :class="{ discovered: enemy.isDiscovered, undiscovered: !enemy.isDiscovered }"
      >
        <div class="enemy-type-badge">{{ enemy.isDiscovered ? typeIcon(enemy.type) : '❓' }}</div>
        <div class="enemy-name">{{ enemy.isDiscovered ? enemy.name : '???' }}</div>
        
        <div class="enemy-stats">
          <div class="stat-row">
            <span class="stat-label">{{ t('shared_uxelm_stat_hp') }}:</span>
            <span class="stat-value">{{ enemy.isDiscovered ? enemy.maxHp : '?' }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">{{ t('shared_uxelm_stat_str') }}:</span>
            <span class="stat-value">{{ enemy.isDiscovered ? enemy.strength : '?' }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">{{ t('shared_uxelm_stat_def') }}:</span>
            <span class="stat-value">{{ enemy.isDiscovered ? enemy.defense : '?' }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">{{ t('shared_uxelm_stat_spd') }}:</span>
            <span class="stat-value">{{ enemy.isDiscovered ? enemy.speed : '?' }}</span>
          </div>
        </div>

        <div v-if="enemy.isDiscovered" class="enemy-element" :style="{ color: elementColor(enemy.element) }">
          <span class="element-bullet">●</span> {{ translateElement(enemy.element) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState } from '@/core/composables/useGameState.js'

const { t } = useI18n()
const { gameState } = useGameState()

const discoveredList = computed(() => gameState.value.bestiary || [])
const templates = computed(() => gameState.value.enemyTemplates || {})

const enemyList = computed(() => {
  const tplObj = templates.value
  const disc = discoveredList.value
  
  return Object.entries(tplObj).map(([id, tpl]) => {
    const isDiscovered = disc.includes(id)
    
    // Translate name
    let name = tpl.name || id
    if (isDiscovered) {
      const translationKey = 'combat_info_' + id
      const translated = t(translationKey)
      name = translated !== translationKey ? translated : name
    }

    return {
      id,
      name,
      isDiscovered,
      type: tpl.type,
      maxHp: tpl.maxHp,
      strength: tpl.strength,
      defense: tpl.defense,
      speed: tpl.speed,
      element: tpl.element
    }
  })
})

const discoveredCount = computed(() => {
  return enemyList.value.filter(e => e.isDiscovered).length
})

const totalCount = computed(() => {
  return enemyList.value.length
})

function typeIcon(type) {
  const map = {
    beast: '🐺',
    humanoid: '👺',
    elemental: '💧',
    undead: '💀',
    dragon: '🐉'
  }
  return map[type] || '❓'
}

function elementColor(element) {
  const map = {
    fire: '#ff6b6b',
    water: '#4dabf7',
    earth: '#8ce99a',
    wind: '#74c0fc',
    neutral: '#adb5bd'
  }
  return map[element] || map.neutral
}

function translateElement(element) {
  if (!element) return ''
  const key = 'shared_info_element_' + element
  const translated = t(key)
  return translated !== key ? translated : element
}
</script>

<style scoped>
.bestiary-tab {
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.bestiary-header {
  display: flex;
  justify-content: flex-end;
  padding-bottom: var(--spacing-xs);
}

.bestiary-count {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 500;
}

.bestiary-empty {
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.bestiary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: var(--spacing-sm);
}

.enemy-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  text-align: center;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.enemy-card.undiscovered {
  opacity: 0.45;
  filter: grayscale(0.8);
}

.enemy-card.discovered:hover {
  border-color: var(--color-primary-light);
  transform: translateY(-2px);
}

.enemy-type-badge {
  font-size: 2rem;
}

.enemy-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
  margin-top: 4px;
}

.enemy-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xs);
  width: 100%;
  margin: var(--spacing-xs) 0;
  padding-top: var(--spacing-xs);
  border-top: 1px solid rgba(255, 255, 255, 0.03);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
}

.stat-label {
  color: var(--text-muted);
}

.stat-value {
  color: var(--text-primary);
  font-weight: 500;
}

.enemy-element {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  display: flex;
  align-items: center;
  gap: 4px;
}

.element-bullet {
  font-size: 0.6rem;
}
</style>
