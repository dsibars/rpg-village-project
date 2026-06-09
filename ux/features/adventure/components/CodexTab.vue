<template>
  <div class="codex-tab">
    <!-- Left Pane: Navigation & List -->
    <div class="codex-nav-pane">
      <div class="category-list">
        <button
          v-for="cat in navCategories"
          :key="cat.id"
          class="category-btn"
          :class="{ active: selectedCategory === cat.id }"
          @click="selectedCategory = cat.id"
        >
          <span class="category-icon">{{ cat.icon }}</span>
          <span class="category-name">{{ cat.name }}</span>
        </button>
      </div>

      <div class="features-list">
        <div
          v-for="feature in filteredFeatures"
          :key="feature.id"
          class="feature-row"
          :class="{
            active: selectedFeatureId === feature.id,
            locked: !feature.unlocked
          }"
          @click="selectFeature(feature)"
        >
          <span class="feature-icon">{{ feature.unlocked ? feature.icon : '❓' }}</span>
          <span class="feature-name">{{ t(feature.nameKey) }}</span>
          <span v-if="!feature.unlocked" class="feature-lock">🔒</span>
        </div>
      </div>
    </div>

    <!-- Right Pane: Details (Desktop Only) -->
    <div v-if="!isMobile" class="codex-detail-pane">
      <div v-if="selectedFeature" class="codex-detail-wrapper">
        <div class="codex-detail-header">
          <div class="codex-detail-icon-bg">
            {{ selectedFeature.unlocked ? selectedFeature.icon : '❓' }}
          </div>
          <div class="codex-detail-title-group">
            <h2>{{ t(selectedFeature.nameKey) }}</h2>
            <span
              class="codex-status-badge"
              :class="selectedFeature.unlocked ? 'unlocked' : 'locked'"
            >
              {{ selectedFeature.unlocked ? t('shared_uxelm_unlocked') : t('shared_uxelm_locked') }}
            </span>
          </div>
        </div>

        <div v-if="!selectedFeature.unlocked" class="codex-requirement-card">
          <h4>{{ t('shared_uxelm_requirements') }}</h4>
          <p class="codex-requirement-text">{{ t(selectedFeature.unlockHintKey) }}</p>
        </div>

        <div class="codex-explanation-section">
          <h4>{{ t('nav_codex') }}</h4>
          <div
            class="codex-explanation-content"
            :class="{ locked: !selectedFeature.unlocked }"
            v-html="detailDescription"
          />
        </div>
      </div>

      <div v-else class="empty-detail">
        <div class="detail-icon-bg">📖</div>
        <p>{{ t('codex_uxelm_intro') }}</p>
      </div>
    </div>

    <!-- Detail Modal (Mobile Only) -->
    <ModalFrame
      v-if="isMobile && showMobileDetail && selectedFeature"
      :title="t(selectedFeature.nameKey)"
      @close="closeMobileDetail"
    >
      <div class="codex-detail-wrapper mobile-view">
        <div class="codex-detail-header">
          <div class="codex-detail-icon-bg">
            {{ selectedFeature.unlocked ? selectedFeature.icon : '❓' }}
          </div>
          <div class="codex-detail-title-group">
            <span
              class="codex-status-badge"
              :class="selectedFeature.unlocked ? 'unlocked' : 'locked'"
            >
              {{ selectedFeature.unlocked ? t('shared_uxelm_unlocked') : t('shared_uxelm_locked') }}
            </span>
          </div>
        </div>

        <div v-if="!selectedFeature.unlocked" class="codex-requirement-card">
          <h4>{{ t('shared_uxelm_requirements') }}</h4>
          <p class="codex-requirement-text">{{ t(selectedFeature.unlockHintKey) }}</p>
        </div>

        <div class="codex-explanation-section">
          <h4>{{ t('nav_codex') }}</h4>
          <div
            class="codex-explanation-content"
            :class="{ locked: !selectedFeature.unlocked }"
            v-html="detailDescription"
          />
        </div>
      </div>
    </ModalFrame>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState } from '@/core/composables/useGameState.js'
import { CODEX_FEATURES, CODEX_CATEGORIES } from '@/core/data/index.js'
import ModalFrame from '@/components/ModalFrame.vue'

const { t } = useI18n()
const { gameState } = useGameState()

const selectedCategory = ref('all')
const selectedFeatureId = ref(null)
const showMobileDetail = ref(false)
const isMobile = ref(false)

const navCategories = computed(() => {
  return [
    { id: 'all', icon: '🔍', name: t('shared_uxelm_all') },
    ...CODEX_CATEGORIES.map(cat => ({
      id: cat.id,
      icon: cat.icon,
      name: t(cat.nameKey)
    }))
  ]
})

const features = computed(() => {
  const state = gameState.value || {}
  return CODEX_FEATURES.map(f => {
    const unlocked = typeof f.isUnlocked === 'function' ? f.isUnlocked(state) : !!f.isUnlocked
    return {
      ...f,
      unlocked
    }
  })
})

const filteredFeatures = computed(() => {
  if (selectedCategory.value === 'all') return features.value
  return features.value.filter(f => f.categoryId === selectedCategory.value)
})

const selectedFeature = computed(() => {
  if (!selectedFeatureId.value) return null
  return features.value.find(f => f.id === selectedFeatureId.value) || null
})

const detailDescription = computed(() => {
  const feat = selectedFeature.value
  if (!feat) return ''
  if (!feat.unlocked) {
    return formatDescription(t('codex_locked_placeholder'))
  }
  return formatDescription(t(feat.descKey))
})

function selectFeature(feature) {
  selectedFeatureId.value = feature.id
  if (isMobile.value) {
    showMobileDetail.value = true
  }
}

function closeMobileDetail() {
  showMobileDetail.value = false
}

function handleResize() {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Description parser
function formatDescription(text) {
  if (!text) return ''
  const cleanedText = text.replace(/\\n/g, '\n')
  const blocks = cleanedText.split('\n\n')

  return blocks.map(block => {
    block = block.trim()
    if (!block) return ''

    // Tip check
    const lowerBlock = block.toLowerCase()
    const isTip = lowerBlock.startsWith('tip:') || 
                  lowerBlock.startsWith('consejo:') || 
                  lowerBlock.startsWith('consello:') || 
                  lowerBlock.startsWith('oharra:') || 
                  lowerBlock.startsWith('consejo estratégico:') || 
                  lowerBlock.startsWith('strategic tip:')
    
    if (isTip) {
      const colonIndex = block.indexOf(':')
      const label = block.substring(0, colonIndex + 1).trim()
      const content = block.substring(colonIndex + 1).trim()
      return `
        <div class="codex-tip-card">
          <span class="tip-icon">💡</span>
          <div class="tip-content">
            <strong>${label}</strong> ${content}
          </div>
        </div>
      `
    }

    // List check
    if (block.startsWith('- ') || block.includes('\n- ')) {
      const lines = block.split('\n')
      let headerHtml = ''

      if (lines[0] && !lines[0].trim().startsWith('-')) {
        const headerText = lines.shift().trim()
        const cleanHeader = headerText.endsWith(':') ? headerText.slice(0, -1).trim() : headerText
        if (headerText.endsWith(':') && headerText.length < 50) {
          headerHtml = `<h3 class="codex-section-subtitle">${cleanHeader}</h3>`
        } else {
          headerHtml = `<p class="codex-paragraph" style="margin-bottom: 8px;">${cleanHeader}</p>`
        }
      }

      const listItems = lines.map(line => {
        const cleanLine = line.replace(/^-\s*/, '').trim()
        if (!cleanLine) return ''

        const colonIndex = cleanLine.indexOf(':')
        if (colonIndex > 0) {
          const title = cleanLine.substring(0, colonIndex).trim()
          const desc = cleanLine.substring(colonIndex + 1).trim()
          return `
            <li class="codex-list-item">
              <div class="list-item-title-wrapper">
                <span class="list-item-bullet">✦</span>
                <strong class="list-item-title">${title}</strong>
              </div>
              <span class="list-item-desc">${desc}</span>
            </li>
          `
        }
        return `
          <li class="codex-list-item">
            <div class="list-item-title-wrapper">
              <span class="list-item-bullet">✦</span>
              <span class="list-item-desc" style="padding-left: 0;">${cleanLine}</span>
            </div>
          </li>
        `
      }).filter(Boolean).join('')

      return `${headerHtml}<ul class="codex-styled-list">${listItems}</ul>`
    }

    // Section subtitle check
    if (block.endsWith(':')) {
      const titleText = block.substring(0, block.length - 1).trim()
      return `<h3 class="codex-section-subtitle">${titleText}</h3>`
    }

    // Normal paragraph
    return `<p class="codex-paragraph">${block}</p>`
  }).filter(Boolean).join('\n')
}
</script>

<style scoped>
.codex-tab {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  height: 100%;
}

@media (max-width: 768px) {
  .codex-tab {
    grid-template-columns: 1fr;
  }
}

.codex-nav-pane {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.category-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.category-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.8rem;
  transition: all 0.15s ease;
}

.category-btn.active {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
}

.features-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  overflow-y: auto;
  max-height: 500px;
}

.feature-row {
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

.feature-row:hover:not(.locked) {
  border-color: var(--color-primary-light);
}

.feature-row.active {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.08);
}

.feature-row.locked {
  opacity: 0.45;
}

.feature-icon {
  font-size: 1.2rem;
}

.feature-name {
  flex: 1;
  font-weight: 500;
  font-size: 0.85rem;
}

.feature-lock {
  font-size: 0.8rem;
}

.codex-detail-pane {
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  overflow-y: auto;
  min-height: 400px;
}

.empty-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: var(--spacing-sm);
  height: 100%;
}

.detail-icon-bg {
  font-size: 3rem;
  opacity: 0.2;
}

.codex-detail-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.codex-detail-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.codex-detail-icon-bg {
  font-size: 2.2rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-md);
  width: 55px;
  height: 55px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.codex-detail-title-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.codex-detail-title-group h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-primary);
  font-family: var(--font-heading);
}

.codex-status-badge {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  align-self: flex-start;
}

.codex-status-badge.unlocked {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.codex-status-badge.locked {
  background: rgba(239, 68, 68, 0.1);
  color: #ef6c6c;
}

.codex-requirement-card {
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(239, 68, 68, 0.04);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: var(--radius-md);
}

.codex-requirement-card h4 {
  margin: 0 0 var(--spacing-xs);
  color: #ef6c6c;
  font-size: 0.85rem;
}

.codex-requirement-text {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.codex-explanation-section h4 {
  margin: 0 0 var(--spacing-sm);
  font-size: 0.9rem;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.codex-explanation-content {
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.6;
}

.codex-explanation-content.locked {
  opacity: 0.5;
  font-style: italic;
}
</style>

<!-- Styles for dynamically parsed HTML blocks -->
<style>
.codex-tip-card {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: rgba(251, 191, 36, 0.05);
  border: 1px solid rgba(251, 191, 36, 0.15);
  border-radius: var(--radius-md);
  margin: var(--spacing-sm) 0;
  text-align: left;
}

.tip-icon {
  font-size: 1.1rem;
}

.tip-content {
  font-size: 0.85rem;
  color: var(--text-primary);
}

.codex-section-subtitle {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-primary-light);
  margin: var(--spacing-md) 0 var(--spacing-xs);
  font-family: var(--font-heading);
}

.codex-paragraph {
  margin: 0 0 var(--spacing-sm) 0;
}

.codex-styled-list {
  list-style: none;
  padding: 0;
  margin: var(--spacing-xs) 0 var(--spacing-md) 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.codex-list-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: var(--spacing-sm);
}

.list-item-title-wrapper {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.list-item-bullet {
  color: var(--color-primary-light);
  font-size: 0.6rem;
}

.list-item-title {
  font-size: 0.85rem;
  color: var(--text-primary);
}

.list-item-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  padding-left: 14px;
}
</style>
