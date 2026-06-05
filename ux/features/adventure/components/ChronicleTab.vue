<template>
  <div class="chronicle-tab">
    <!-- Recently Unlocked -->
    <div v-if="recentUnlocks.length > 0" class="recent-section">
      <h3>{{ t('chronicle_uxelm_recent') }}</h3>
      <div class="unlock-list">
        <div
          v-for="unlock in recentUnlocks"
          :key="unlock.id"
          class="unlock-card"
          @click="showNarrative(unlock)"
        >
          <span class="unlock-icon">\u{1F31F}</span>
          <span class="unlock-name">{{ unlock.title }}</span>
        </div>
      </div>
    </div>

    <!-- Chapters -->
    <div class="chapters-list">
      <div
        v-for="chapter in chapters"
        :key="chapter.id"
        class="chapter-section"
      >
        <button class="chapter-header" @click="toggleChapter(chapter.id)">
          <span class="chapter-title">{{ chapter.title }}</span>
          <span class="chapter-progress">{{ chapter.completed }}/{{ chapter.total }}</span>
          <span class="chapter-toggle">{{ expandedChapters[chapter.id] ? '\u{25BC}' : '\u{25B6}' }}</span>
        </button>

        <div v-if="expandedChapters[chapter.id]" class="milestone-list">
          <div
            v-for="milestone in chapter.milestones"
            :key="milestone.id"
            class="milestone-row"
            :class="milestone.status"
          >
            <span class="milestone-check">
              {{ milestone.status === 'completed' ? '\u{2705}' : milestone.status === 'pending' ? '\u{2B1C}' : '\u{1F512}' }}
            </span>
            <span class="milestone-name">{{ milestone.name }}</span>
            <Button
              v-if="milestone.status === 'completed' && milestone.narrative"
              variant="ghost"
              size="sm"
              @click="showNarrative(milestone.narrative)"
            >
              \u{1F3A5} {{ t('shared_uxelm_replay') }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Narrative Modal -->
    <ModalFrame
      v-if="activeNarrative"
      :title="activeNarrative.title"
      @close="activeNarrative = null"
    >
      <div class="narrative-content">
        <p class="narrative-era">{{ activeNarrative.era }}</p>
        <p class="narrative-text">{{ activeNarrative.text }}</p>
      </div>
    </ModalFrame>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState } from '@/core/composables/useGameState.js'
import Button from '@/components/Button.vue'
import ModalFrame from '@/components/ModalFrame.vue'

const { t } = useI18n()
const { gameState } = useGameState()

const expandedChapters = ref({})
const activeNarrative = ref(null)

const chronicle = computed(() => gameState.value.chronicle || {})
const chapters = computed(() => chronicle.value.chapters || [])
const recentUnlocks = computed(() => chronicle.value.recentUnlocks || [])

function toggleChapter(chapterId) {
  expandedChapters.value[chapterId] = !expandedChapters.value[chapterId]
}

function showNarrative(narrative) {
  activeNarrative.value = narrative
}
</script>

<style scoped>
.chronicle-tab {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding: var(--spacing-lg);
}

.recent-section h3 {
  margin: 0 0 var(--spacing-sm);
  font-size: 1rem;
  color: var(--text-primary);
}

.unlock-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.unlock-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.85rem;
}

.unlock-card:hover {
  border-color: var(--color-primary-light);
}

.chapters-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.chapter-section {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.chapter-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.95rem;
}

.chapter-title {
  flex: 1;
  font-weight: 600;
  text-align: left;
}

.chapter-progress {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.chapter-toggle {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.milestone-list {
  padding: 0 var(--spacing-md) var(--spacing-md);
}

.milestone-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-xs) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.milestone-row.locked {
  opacity: 0.5;
}

.milestone-check {
  font-size: 0.9rem;
}

.milestone-name {
  flex: 1;
  font-size: 0.85rem;
  color: var(--text-primary);
}

.narrative-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-width: 500px;
}

.narrative-era {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
  font-style: italic;
}

.narrative-text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.6;
}
</style>
