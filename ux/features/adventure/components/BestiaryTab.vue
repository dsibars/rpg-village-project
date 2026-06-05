<template>
  <div class="bestiary-tab">
    <div class="bestiary-grid">
      <div
        v-for="enemy in bestiary"
        :key="enemy.templateId"
        class="enemy-card"
        :class="{ discovered: enemy.discovered, undiscovered: !enemy.discovered }"
      >
        <div class="enemy-icon">{{ enemy.discovered ? typeIcon(enemy.type) : '\u{2753}' }}</div>
        <div class="enemy-name">{{ enemy.discovered ? displayName(enemy) : '???' }}</div>
        <div v-if="enemy.discovered" class="enemy-stats">
          <span>HP: {{ enemy.maxHp }}</span>
          <span>STR: {{ enemy.str }}</span>
          <span>DEF: {{ enemy.def }}</span>
          <span>SPD: {{ enemy.spd }}</span>
        </div>
        <div v-if="enemy.discovered" class="enemy-element" :style="{ color: elementColor(enemy.element) }">
          {{ enemy.element }}
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

const bestiary = computed(() => gameState.value.bestiary || [])

function displayName(enemy) {
  const key = 'combat_info_' + enemy.templateId
  const translated = t(key)
  return translated !== key ? translated : enemy.name
}

function typeIcon(type) {
  const map = { beast: '\u{1F43A}', humanoid: '\u{1F9D9}', undead: '\u{1F480}', elemental: '\u{1F525}' }
  return map[type] || '\u{1F47E}'
}

function elementColor(element) {
  const map = { fire: '#ef4444', water: '#3b82f6', wind: '#10b981', storm: '#f59e0b', earth: '#84cc16', dark: '#a855f7', light: '#fbbf24' }
  return map[element] || '#94a3b8'
}
</script>

<style scoped>
.bestiary-tab {
  padding: var(--spacing-lg);
}

.bestiary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
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
}

.enemy-card.undiscovered {
  opacity: 0.5;
  filter: grayscale(0.8);
}

.enemy-icon {
  font-size: 2rem;
}

.enemy-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.enemy-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.enemy-element {
  font-size: 0.75rem;
  text-transform: capitalize;
  font-weight: 600;
}
</style>
