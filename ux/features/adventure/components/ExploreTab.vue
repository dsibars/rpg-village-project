<template>
  <div class="explore-tab">
    <!-- View Toggle -->
    <div class="view-toggle">
      <Button
        variant="ghost"
        size="sm"
        :class="{ active: viewMode === 'tree' }"
        @click="viewMode = 'tree'"
      >
        🌳 {{ t('explore_uxelm_tree_view') }}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        :class="{ active: viewMode === 'list' }"
        @click="viewMode = 'list'"
      >
        📋 {{ t('explore_uxelm_list_view') }}
      </Button>
    </div>

    <!-- Status Banner (PF-014) -->
    <div class="status-banner">
      <span class="status-label">{{ t('explore_uxelm_active_expeditions') }}:</span>
      <span class="status-value" :class="{ warning: isAtMaxExpeditions }">
        {{ activeExpeditions.length }} / {{ maxConcurrent }}
      </span>
    </div>

    <!-- Region List -->
    <div class="region-list">
      <button
        v-for="region in regions"
        :key="region.id"
        class="region-btn"
        :class="{ active: selectedRegion === region.id }"
        @click="selectedRegion = region.id"
      >
        {{ t('explore_info_' + region.id) }}
        <span class="region-count">{{ region.clearCount }}/{{ region.totalCount }}</span>
      </button>
    </div>

    <!-- Expedition List -->
    <div v-if="viewMode === 'list'" class="expedition-list">
      <div
        v-for="exp in filteredExpeditions"
        :key="exp.id"
        class="expedition-card"
        :class="{ active: selectedExp?.id === exp.id }"
        @click="selectExpedition(exp)"
      >
        <div class="card-header">
          <span class="exp-name">{{ exp.name }}</span>
          <span class="exp-badge">{{ exp.stages?.length || 0 }} {{ t('explore_uxelm_stages') }} • Lv. {{ maxEnemyLevel(exp) }}</span>
        </div>
      </div>
    </div>

    <!-- Expedition Tree (simplified) -->
    <div v-else class="expedition-tree">
      <div
        v-for="exp in filteredExpeditions"
        :key="exp.id"
        class="tree-node"
        :class="exp.status || 'available'"
        @click="selectExpedition(exp)"
      >
        <span class="node-icon">{{ nodeIcon(exp) }}</span>
        <span class="node-name">{{ exp.name }}</span>
      </div>
    </div>

    <!-- Detail Pane -->
    <div v-if="selectedExp" class="detail-pane">
      <div class="detail-header">
        <h3>{{ selectedExp.name }}</h3>
        <span class="detail-badge">{{ selectedExp?.isStory ? t('explore_uxelm_story') : t('explore_uxelm_exploration') }}</span>
      </div>

      <div class="detail-stats">
        <p>{{ selectedExp.stages?.length || 0 }} {{ t('explore_uxelm_stages') }}</p>
        <p>{{ t('explore_uxelm_base_reward') }}: {{ selectedExp.reward?.gold || 0 }} {{ t('village_info_gold') }}</p>
        <p>{{ t('explore_uxelm_recommended_level') }}: {{ maxEnemyLevel(selectedExp) }}</p>
      </div>

      <!-- Combat Intel -->
      <div v-if="enemyTags.length" class="combat-intel">
        <h4>{{ t('explore_uxelm_intel_enemies') }}</h4>
        <div class="enemy-tags">
          <span v-for="tag in enemyTags" :key="tag" class="enemy-tag">{{ tag }}</span>
        </div>
      </div>

      <!-- Hero Selector (for available expeditions) -->
      <div v-if="detailMode === 'available'" class="hero-selector">
        <h4>{{ t('explore_uxelm_select_heroes') }}</h4>
        <div class="hero-list">
          <label
            v-for="hero in availableHeroes"
            :key="hero.id"
            class="hero-row"
            :class="{ selected: selectedHeroIds.includes(hero.id) }"
          >
            <input
              type="checkbox"
              :checked="selectedHeroIds.includes(hero.id)"
              @change="toggleHero(hero.id)"
            >
            <div class="hero-row-info">
              <span class="hero-row-name">{{ hero.name }} ({{ t('shared_uxelm_level') }} {{ hero.level }})</span>
              <span class="hero-row-hp">HP: {{ hero.hp ?? 0 }}/{{ hero.baseMaxHp ?? hero.maxHp ?? '?' }}</span>
            </div>
          </label>
        </div>
        <Button
          variant="primary"
          size="sm"
          :disabled="selectedHeroIds.length === 0 || isAtMaxExpeditions"
          @click="startExpedition"
        >
          {{ t('explore_uxelm_assign_heroes') }}
        </Button>
        <p v-if="isAtMaxExpeditions" class="warning">{{ t('explore_uxelm_max_concurrent') }}</p>
      </div>

      <!-- Active Expedition Dashboard -->
      <div v-else-if="detailMode === 'active'" class="active-dashboard">
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: `${activeProgress}%` }" />
        </div>
        <p>{{ activeExpedition?.currentStage || 0 }} / {{ selectedExp.stages?.length || 0 }} {{ t('explore_uxelm_stages') }}</p>
        <p>{{ t('explore_uxelm_assigned_heroes') }}: {{ assignedHeroNames.join(', ') }}</p>
        <Button variant="secondary" size="sm" @click="retireExpedition">
          {{ t('explore_uxelm_unassign_retire') }}
        </Button>
      </div>
    </div>

    <!-- Defense Advisory Modal -->
    <ModalFrame
      v-if="defenseWarning"
      :title="t('shared_uxelm_advisory_title')"
      @close="defenseWarning = null"
    >
      <div class="advisory-modal-content">
        <p class="warning-text">{{ defenseWarning.message }}</p>
        <div class="advisory-actions">
          <Button variant="danger" size="sm" @click="confirmStartExpedition">
            {{ t('shared_uxelm_confirm') }}
          </Button>
          <Button variant="secondary" size="sm" @click="defenseWarning = null">
            {{ t('shared_uxelm_cancel') }}
          </Button>
        </div>
      </div>
    </ModalFrame>
  </div>
</template>

<script setup>
import { ref, computed, inject, watch } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState } from '@/core/composables/useGameState.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import Button from '@/components/Button.vue'
import ModalFrame from '@/components/ModalFrame.vue'

const { t } = useI18n()
const { gameState, heroes } = useGameState()
const { dispatch } = useAdapter()
const engine = inject('engine')

const viewMode = ref(localStorage.getItem('explore_view_mode') || 'tree')
const selectedRegion = ref(null)
const selectedExp = ref(null)
const selectedHeroIds = ref([])

// Persist view mode preference to localStorage (PF-007)
watch(viewMode, (mode) => {
  localStorage.setItem('explore_view_mode', mode)
})

// Auto-select first region when regions load and none is selected (PF-006)
watch(() => gameState.value.expeditionRegions, (regs) => {
  if (!selectedRegion.value && regs && regs.length > 0) {
    selectedRegion.value = regs[0].id
  }
}, { immediate: true })

const regions = computed(() => {
  const regs = gameState.value.expeditionRegions
  if (!regs) return []
  if (Array.isArray(regs)) return regs
  // v1 stores expeditionRegions as object { regionId: { name, ... } }
  return Object.entries(regs).map(([id, data]) => ({ id, ...data }))
})
const expeditions = computed(() => gameState.value.expeditions || [])
const activeExpeditions = computed(() => gameState.value.activeExpeditions || [])
const maxConcurrent = computed(() => gameState.value.maxConcurrentExpeditions || 1)

const isAtMaxExpeditions = computed(() => activeExpeditions.value.length >= maxConcurrent.value)

const filteredExpeditions = computed(() => {
  if (!selectedRegion.value) return expeditions.value
  return expeditions.value.filter((e) => e.regionId === selectedRegion.value)
})

const activeExpedition = computed(() => {
  if (!selectedExp.value) return null
  return activeExpeditions.value.find((e) => e.id === selectedExp.value.id)
})

const detailMode = computed(() => {
  if (activeExpedition.value) return 'active'
  return 'available'
})

const activeProgress = computed(() => {
  if (!activeExpedition.value || !selectedExp.value) return 0
  return ((activeExpedition.value.currentStage || 0) / (selectedExp.value.stages?.length || 1)) * 100
})

const assignedHeroNames = computed(() => {
  const active = activeExpedition.value
  if (!active || !active.heroIds) return []
  return active.heroIds.map((id) => {
    const h = heroes.value.find((hero) => hero.id === id)
    return h ? h.name : id
  })
})

const availableHeroes = computed(() => {
  return heroes.value.filter((h) => h.activity === 'idle' && h.hp > 0)
})

const enemyTags = computed(() => {
  if (!selectedExp.value || !selectedExp.value.stages) return []
  const tags = new Set()
  selectedExp.value.stages.forEach((stage) => {
    if (stage.enemies) {
      stage.enemies.forEach((e) => {
        const enemyId = typeof e === 'string' ? e : (e.id || e.templateId)
        if (enemyId) {
          const translated = t('combat_info_' + enemyId)
          tags.add(translated !== 'combat_info_' + enemyId ? translated : enemyId)
        }
      })
    }
  })
  return Array.from(tags)
})

function maxEnemyLevel(exp) {
  if (!exp.stages) return 1
  return Math.max(1, ...exp.stages.map((s) => s.enemyLevel || 1))
}

function selectExpedition(exp) {
  selectedExp.value = exp
  selectedHeroIds.value = []
}

function toggleHero(heroId) {
  const idx = selectedHeroIds.value.indexOf(heroId)
  if (idx >= 0) {
    selectedHeroIds.value.splice(idx, 1)
  } else {
    selectedHeroIds.value.push(heroId)
  }
}

const defenseWarning = ref(null)

function startExpedition() {
  if (!selectedExp.value || selectedHeroIds.value.length === 0) return

  if (engine) {
    const advisory = engine.getDefenseAdvisory(selectedExp.value.id, [...selectedHeroIds.value])
    if (advisory && advisory.hasWarning) {
      const currentDay = gameState.value.village?.day || 1
      const daysUntilRaid = advisory.nextRaidDay - currentDay
      
      const message = t(advisory.warningKey, {
        raidDay: advisory.nextRaidDay,
        returnDay: advisory.expeditionReturnDay,
        daysUntilRaid
      })
      
      defenseWarning.value = { message }
      return
    }
  }

  confirmStartExpedition()
}

function confirmStartExpedition() {
  dispatch('explore', 'assignExpedition', {
    expId: selectedExp.value.id,
    heroIds: [...selectedHeroIds.value]
  })
  selectedHeroIds.value = []
  defenseWarning.value = null
}

function retireExpedition() {
  if (!selectedExp.value) return
  dispatch('explore', 'retireExpedition', { expId: selectedExp.value.id })
}

function nodeIcon(exp) {
  const status = exp.status || 'available'
  const map = {
    available: '⬜',
    active: '🔵',
    completed: '✅',
    closed: '⬛'
  }
  return map[status] || '⬜'
}
</script>

<style scoped>
.explore-tab {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
}

.view-toggle {
  display: flex;
  gap: var(--spacing-xs);
}

.view-toggle button.active {
  background: rgba(99, 102, 241, 0.2);
  border-color: var(--color-primary);
}

.status-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
}

.status-label {
  color: var(--text-secondary);
}

.status-value {
  font-weight: 600;
  color: var(--color-primary-light);
}

.status-value.warning {
  color: var(--color-danger);
}

.region-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.region-btn {
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  font-family: var(--font-body);
  font-size: 0.85rem;
}

.region-btn:hover, .region-btn.active {
  border-color: var(--color-primary-light);
}

.region-count {
  margin-left: 4px;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.expedition-list, .expedition-tree {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.expedition-card {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.expedition-card:hover, .expedition-card.active {
  border-color: var(--color-primary-light);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exp-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.exp-badge {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.tree-node {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.tree-node:hover {
  border-color: var(--color-primary-light);
}

.tree-node.active {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.08);
}

.tree-node.completed {
  opacity: 0.6;
}

.node-icon {
  font-size: 1rem;
}

.node-name {
  font-size: 0.9rem;
}

.detail-pane {
  padding: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.detail-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.detail-badge {
  padding: 2px 8px;
  background: rgba(99, 102, 241, 0.1);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  color: var(--color-primary-light);
  text-transform: capitalize;
}

.detail-stats {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.combat-intel {
  padding: var(--spacing-sm);
  background: var(--bg-base);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-sm);
}

.combat-intel h4 {
  margin: 0 0 var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.enemy-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.enemy-tag {
  padding: 2px 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  color: var(--color-danger);
}

.hero-selector {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.hero-selector h4 {
  margin: 0;
  font-size: 0.9rem;
}

.hero-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.hero-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-base);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.hero-row:hover, .hero-row.selected {
  border-color: var(--color-primary-light);
}

.hero-row input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.hero-row-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-row-name {
  font-size: 0.85rem;
  font-weight: 500;
}

.hero-row-hp {
  font-size: 0.75rem;
  color: var(--color-success);
}

.warning {
  color: var(--color-danger);
  font-size: 0.8rem;
}

.active-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--color-primary);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.advisory-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-width: 400px;
}

.warning-text {
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.5;
}

.advisory-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}
</style>
