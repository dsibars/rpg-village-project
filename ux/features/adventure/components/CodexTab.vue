<template>
  <div class="codex-tab">
    <div class="category-list">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="category-btn"
        :class="{ active: selectedCategory === cat.id }"
        @click="selectedCategory = cat.id"
      >
        {{ cat.name }}
      </button>
    </div>

    <div class="entry-list">
      <div
        v-for="entry in filteredEntries"
        :key="entry.id"
        class="entry-card"
        :class="{ locked: !entry.unlocked }"
        @click="entry.unlocked && (selectedEntry = entry)"
      >
        <span class="entry-icon">{{ entry.unlocked ? '\u{1F4D6}' : '\u{1F512}' }}</span>
        <div class="entry-info">
          <span class="entry-name">{{ entry.unlocked ? entry.name : '???' }}</span>
          <span v-if="entry.unlocked" class="entry-desc">{{ entry.description }}</span>
        </div>
      </div>
    </div>

    <!-- Entry Detail Modal -->
    <ModalFrame
      v-if="selectedEntry"
      :title="selectedEntry.name"
      @close="selectedEntry = null"
    >
      <div class="entry-detail">
        <p v-for="(para, idx) in formattedDescription" :key="idx" class="detail-para">
          {{ para }}
        </p>
      </div>
    </ModalFrame>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState } from '@/core/composables/useGameState.js'
import ModalFrame from '@/components/ModalFrame.vue'

const { t } = useI18n()
const { gameState } = useGameState()

const selectedCategory = ref('all')
const selectedEntry = ref(null)

const categories = computed(() => [
  { id: 'all', name: t('shared_uxelm_all') },
  { id: 'combat', name: t('codex_category_combat') },
  { id: 'village', name: t('codex_category_village') },
  { id: 'magic', name: t('codex_category_magic') },
  { id: 'explore', name: t('codex_category_explore') }
])

const entries = computed(() => gameState.value.codexEntries || [])

const filteredEntries = computed(() => {
  if (selectedCategory.value === 'all') return entries.value
  return entries.value.filter((e) => e.category === selectedCategory.value)
})

const formattedDescription = computed(() => {
  if (!selectedEntry.value) return []
  return (selectedEntry.value.fullDescription || selectedEntry.value.description || '').split('\n\n')
})
</script>

<style scoped>
.codex-tab {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.category-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.85rem;
}

.category-btn.active {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
}

.entry-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.entry-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.entry-card:hover:not(.locked) {
  border-color: var(--color-primary-light);
}

.entry-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.entry-icon {
  font-size: 1.25rem;
}

.entry-info {
  display: flex;
  flex-direction: column;
}

.entry-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.entry-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.entry-detail {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  max-width: 500px;
}

.detail-para {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.5;
}
</style>
