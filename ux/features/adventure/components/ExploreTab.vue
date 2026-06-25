<template>
  <div class="explore-tab">
    <!-- Explore Header: View Toggle + Status -->
    <div class="explore-header">
      <div class="view-toggle">
        <button
          class="view-btn"
          :class="{ active: viewMode === 'list' }"
          title="List View"
          @click="viewMode = 'list'"
        >☰</button>
        <button
          class="view-btn"
          :class="{ active: viewMode === 'tree' }"
          title="Tree View"
          @click="viewMode = 'tree'"
        >🌲</button>
      </div>
      <div
        id="explore-status-banner"
        :class="['status-banner', { none: activeExpeditions.length === 0 }]"
      >
        {{ t('explore_uxelm_active_expeditions') }}: {{ activeExpeditions.length }} / {{ maxConcurrent }}
      </div>
    </div>

    <!-- Master-Detail Layout -->
    <div class="master-detail-layout">
      <!-- Master Pane: World Map / Regions -->
      <aside class="master-pane card">
        <div class="pane-header">
          <h3>{{ t('explore_uxelm_world_map') }}</h3>
        </div>
        <div class="region-list-container">
          <div
            v-for="[regionId, regionData] in regionEntries"
            :key="regionId"
            class="region-list-item"
            :data-tutorial-target="'region_card_' + regionId"
            :class="{ selected: selectedRegion === regionId }"
            @click="selectRegion(regionId)"
          >
            <div class="region-list-name">{{ t('explore_info_' + regionId) }}</div>
            <div class="region-list-meta">
              {{ regionData.clears || 0 }} {{ t('explore_uxelm_clears') }} — {{ availableCount(regionData) }} {{ pathWord(regionData) }}
              <span v-if="activeCount(regionData) > 0">
                • {{ activeCount(regionData) }} {{ t('explore_uxelm_active') }}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Detail Pane: Tree or List -->
      <main class="detail-pane card glass-pane">
        <!-- Empty state when no region selected -->
        <div v-if="!selectedRegion" class="empty-detail">
          <div class="detail-icon-bg">🗺️</div>
          <p>{{ t('explore_uxelm_select_region') }}</p>
        </div>

        <!-- Empty state when region has no available paths -->
        <div v-else-if="allNodes.length === 0" class="empty-detail no-paths">
          <div class="detail-icon-bg">🔒</div>
          <p>{{ t('explore_uxelm_no_paths') }}</p>
          <p class="empty-hint">{{ t('explore_uxelm_build_explorer_guild_hint') }}</p>
        </div>

        <!-- Tree View -->
        <div v-else-if="viewMode === 'tree'" class="expedition-tree-root expedition-tree">
          <!-- Region title bar -->
          <div class="tree-region-title-bar">
            <span class="tree-region-title-name">{{ t('explore_info_' + selectedRegion) }}</span>
            <span class="tree-region-title-meta">
              {{ (selectedRegionData?.clears || 0) }} {{ t('explore_uxelm_clears') }}
            </span>
          </div>

          <!-- Tree scroll container -->
          <div ref="treeScrollContainer" class="tree-scroll-container">
            <div class="tree-wrapper">
              <div
                v-for="(levelNodes, levelIndex) in treeLevels"
                :key="levelIndex"
                class="tree-level-row"
              >
                <div
                  v-for="node in levelNodes"
                  :key="node.id"
                  :data-id="node.id"
                  :data-tutorial-target="'expedition_node_' + node.id"
                  class="tree-node"
                  :class="[nodeStateClass(node), { selected: selectedExp?.id === node.id }]"
                  :title="nodeTooltip(node)"
                  @click="handleNodeClick(node)"
                >
                  {{ nodeIconChar(node) }}
                </div>
              </div>
            </div>
            <!-- SVG overlay for connectors -->
            <svg
              ref="svgOverlay"
              class="tree-svg-overlay"
              :width="svgSize.width"
              :height="svgSize.height"
              :style="{ width: svgSize.width + 'px', height: svgSize.height + 'px' }"
            >
              <line
                v-for="(conn, i) in connectors"
                :key="i"
                :x1="conn.x1"
                :y1="conn.y1"
                :x2="conn.x2"
                :y2="conn.y2"
                :class="conn.class"
                stroke="rgba(255,255,255,0.12)"
                stroke-width="1.5"
              />
            </svg>
          </div>
        </div>

        <!-- List View -->
        <div v-else class="expedition-list-view expedition-list">
          <div
            v-for="exp in listExpeditions"
            :key="exp.id"
            class="expedition-card"
            :class="{ active: selectedExp?.id === exp.id }"
            @click="selectExpedition(exp)"
          >
            <div class="card-header">
              <span class="exp-name">{{ exp.name }}</span>
              <span class="exp-badge">{{ exp.stages?.length || 0 }} {{ t('explore_uxelm_stages') }}</span>
            </div>
            <div class="card-meta">
              <span class="meta-tag" :class="exp.isStory ? 'story' : 'exploration'">
                {{ exp.isStory ? t('explore_uxelm_story') : t('explore_uxelm_exploration') }}
              </span>
              <span class="meta-tag level">
                {{ t('explore_uxelm_recommended_level') }} {{ exp.stages?.[0]?.enemyLevel || 1 }}
              </span>
            </div>
          </div>

          <!-- Inline detail pane for list view -->
          <div v-if="selectedExp && viewMode === 'list'" class="detail-pane-inline">
            <ExpeditionDetailInline
              :expedition="selectedExp"
              :mode="detailMode"
              @start="startExpedition"
              @recall="retireExpedition"
            />
          </div>
        </div>
      </main>
    </div>

    <!-- Expedition Detail Modal (for tree view clicks) -->
    <ModalFrame
      v-if="showDetailModal"
      :title="selectedExp?.name || ''"
      @close="showDetailModal = false"
    >
      <ExpeditionDetailInline
        :expedition="selectedExp"
        :mode="detailMode"
        @start="startExpedition"
        @recall="retireExpedition"
      />
    </ModalFrame>

    <!-- Completed / Closed Node Modal -->
    <ModalFrame
      v-if="showCompletedModal"
      :title="completedModalNode?.name || ''"
      @close="showCompletedModal = false"
    >
      <div class="completed-modal-content">
        <div class="completed-modal-header">
          <div class="completed-icon">{{ completedModalNode?.status === 'closed' ? '⬡' : '✕' }}</div>
          <div class="completed-name">{{ completedModalNode?.name }}</div>
          <div class="completed-meta">
            {{ completedModalStatus }} — {{ t('shared_uxelm_day') }} {{ completedModalNode?.completionMeta?.dayCompleted || '?' }}
          </div>
        </div>
        <div class="completed-info">
          <div><strong>{{ t('explore_uxelm_heroes') }}:</strong> {{ completedModalNode?.completionMeta?.heroNames?.join(', ') || t('explore_uxelm_unknown') }}</div>
          <div><strong>{{ t('explore_uxelm_reward') }}:</strong> {{ completedModalNode?.completionMeta?.rewardReceived?.gold || 0 }} {{ t('explore_uxelm_gold_suffix') }}</div>
          <div v-if="completedModalRewardItems" class="completed-items">{{ completedModalRewardItems }}</div>
          <div v-if="completedModalNode?.completionMeta?.rewardReceived?.closureBonus" class="completed-bonus">
            {{ t('explore_uxelm_closure_bonus') }}: {{ completedModalNode.completionMeta.rewardReceived.closureBonus.gold }}g
          </div>
        </div>
        <div class="completed-footer">
          {{ (completedModalNode?.stages || []).length }} {{ t('explore_uxelm_stages_suffix') }} • {{ t('explore_uxelm_depth_suffix') }} {{ completedModalNode?.depth || 1 }}
        </div>
      </div>
    </ModalFrame>

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
import { ref, computed, watch, inject, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState } from '@/core/composables/useGameState.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import Button from '@/components/Button.vue'
import ModalFrame from '@/components/ModalFrame.vue'
import ExpeditionDetailInline from './ExpeditionDetailInline.vue'

const { t } = useI18n()
const { gameState, heroes } = useGameState()
const { dispatch } = useAdapter()
const engine = inject('engine')

const emit = defineEmits(['tutorial:event'])

const viewMode = ref(localStorage.getItem('explore_view_mode') || 'tree')
const selectedRegion = ref(null)
const selectedExp = ref(null)
const selectedHeroIds = ref([])
const showDetailModal = ref(false)
const showCompletedModal = ref(false)
const completedModalNode = ref(null)
const treeScrollContainer = ref(null)
const svgOverlay = ref(null)
const svgSize = ref({ width: 0, height: 0 })
const connectors = ref([])

const defenseWarning = ref(null)

// Persist view mode
watch(viewMode, (mode) => {
  localStorage.setItem('explore_view_mode', mode)
})

// Note: we no longer auto-select the first region on load. The player must
// explicitly click a region, which lets the Day 1 tutorial's "select region"
// step receive the region_selected event reliably.



function getRegions(regs) {
  if (!regs) return []
  if (Array.isArray(regs)) {
    return regs.filter(r => r.unlocked).map(r => [r.id, r])
  }
  return Object.entries(regs)
    .filter(([_, r]) => r.unlocked)
    .sort((a, b) => a[0].localeCompare(b[0]))
}

const regionEntries = computed(() => {
  const day = gameState.value.village?.day || 0
  return getRegions(gameState.value.expeditionRegions)
})

const selectedRegionData = computed(() => {
  if (!selectedRegion.value) return null
  const entry = regionEntries.value.find(([id]) => id === selectedRegion.value)
  return entry ? entry[1] : null
})

const activeExpeditions = computed(() => {
  const day = gameState.value.village?.day || 0
  return gameState.value.activeExpeditions || []
})
const maxConcurrent = computed(() => gameState.value.maxConcurrentExpeditions || 1)
const isAtMaxExpeditions = computed(() => activeExpeditions.value.length >= maxConcurrent.value)

const allNodes = computed(() => {
  // Force re-evaluation when day changes (shallowRef doesn't detect deep mutations)
  const day = gameState.value.village?.day || 0
  const regions = gameState.value.expeditionRegions
  if (!regions || !selectedRegion.value) return []
  const regionData = regions[selectedRegion.value]
  const nodes = regionData?.availableNodes
  return nodes ? [...nodes] : []
})

const activeIds = computed(() => {
  return new Set(activeExpeditions.value.map(e => e.id))
})

function availableCount(regionData) {
  return (regionData.availableNodes || []).filter(n => (n.status || 'available') === 'available').length
}

function activeCount(regionData) {
  return (regionData.availableNodes || []).filter(n => activeIds.value.has(n.id)).length
}

function pathWord(regionData) {
  const count = availableCount(regionData)
  return count === 1 ? t('explore_uxelm_path_singular') : t('explore_uxelm_path_plural')
}

function selectRegion(regionId) {
  if (selectedRegion.value === regionId) return
  selectedRegion.value = regionId
  selectedExp.value = null
  selectedHeroIds.value = []
  emit('tutorial:event', { event: 'region_selected', regionId })
}

// Tree computation
const treeLevels = computed(() => {
  const nodes = allNodes.value
  if (nodes.length === 0) return []

  const nodesById = {}
  const nodesByParent = {}

  nodes.forEach(node => {
    nodesById[node.id] = node
    const parentId = node.parentId || 'root'
    if (!nodesByParent[parentId]) nodesByParent[parentId] = []
    nodesByParent[parentId].push(node)
  })

  const levelMap = new Map()
  function setLevel(nodeId, level) {
    const node = nodesById[nodeId]
    if (!node || levelMap.has(nodeId)) return
    levelMap.set(nodeId, level)
    const children = nodesByParent[nodeId] || []
    children.forEach(child => setLevel(child.id, level + 1))
  }

  const rootNodes = nodes.filter(n => !n.parentId)
  rootNodes.forEach(r => setLevel(r.id, 0))

  const maxLevel = Math.max(0, ...Array.from(levelMap.values()))
  const levels = []
  for (let i = 0; i <= maxLevel; i++) levels.push([])
  nodes.forEach(node => {
    const level = levelMap.get(node.id) || 0
    levels[level].push(node)
  })

  // Return in reverse order so column-reverse renders root at top
  return levels.reverse()
})

function nodeIconChar(node) {
  const status = node.status || 'available'
  const isActive = activeIds.value.has(node.id)
  if (status === 'completed') return '✕'
  if (status === 'closed') return '⬡'
  if (isActive) return '◎'
  if (status === 'locked') return '△'
  return '○'
}

function nodeStateClass(node) {
  const status = node.status || 'available'
  const isActive = activeIds.value.has(node.id)
  if (status === 'completed') return 'completed'
  if (status === 'closed') return 'closed'
  if (isActive) return 'active'
  if (status === 'locked') return 'locked'
  return 'available'
}

function nodeTooltip(node) {
  const stageCount = (node.stages || []).length
  return `${node.name} — ${stageCount} ${t('explore_uxelm_stages')}`
}

function handleNodeClick(node) {
  const status = node.status || 'available'
  if (status === 'completed' || status === 'closed') {
    completedModalNode.value = node
    showCompletedModal.value = true
    return
  }
  selectedExp.value = node
  selectedHeroIds.value = []
  showDetailModal.value = true
}

const completedModalStatus = computed(() => {
  if (!completedModalNode.value) return ''
  return completedModalNode.value.status === 'closed'
    ? t('explore_uxelm_path_sealed_title')
    : t('explore_uxelm_completed_title')
})

const completedModalRewardItems = computed(() => {
  const items = completedModalNode.value?.completionMeta?.rewardReceived?.items
  if (!items) return ''
  return Object.entries(items).map(([k, v]) => {
    const transKey = k.startsWith('material_') || k.startsWith('food_') || k.startsWith('meal_') ? k : 'item_' + k
    return `${v} ${t(transKey)}`
  }).join(', ')
})

// List view expeditions
const listExpeditions = computed(() => {
  return allNodes.value.filter(n => {
    const s = n.status || 'available'
    return s === 'available' || activeIds.value.has(n.id)
  })
})

const activeExpedition = computed(() => {
  if (!selectedExp.value) return null
  return activeExpeditions.value.find(e => e.id === selectedExp.value.id)
})

const detailMode = computed(() => {
  if (activeExpedition.value) return 'active'
  return 'available'
})

function selectExpedition(exp) {
  selectedExp.value = exp
  selectedHeroIds.value = []
}

function startExpedition({ expId, heroIds }) {
  showDetailModal.value = false
  const result = dispatch('explore', 'assignExpedition', { expId, heroIds })
  if (result?.success) {
    emit('tutorial:event', { event: 'expedition_started', nodeId: expId })
  }
  selectedHeroIds.value = []
}

function retireExpedition({ expId }) {
  showDetailModal.value = false
  dispatch('explore', 'retireExpedition', { expId })
}

function confirmStartExpedition() {
  defenseWarning.value = null
}

// SVG Connectors
function drawConnectors() {
  const container = treeScrollContainer.value
  if (!container || allNodes.value.length === 0) {
    connectors.value = []
    return
  }

  const containerRect = container.getBoundingClientRect()
  if (containerRect.width === 0) return

  svgSize.value = { width: containerRect.width, height: containerRect.height }

  const nodesById = {}
  allNodes.value.forEach(n => { nodesById[n.id] = n })

  const nodeEls = container.querySelectorAll('.tree-node')
  const elMap = new Map()
  nodeEls.forEach(el => {
    const id = el.getAttribute('data-id')
    if (id) elMap.set(id, el)
  })

  const newConnectors = []
  for (const node of allNodes.value) {
    if (!node.parentId) continue
    const parentEntry = elMap.get(node.parentId)
    const childEntry = elMap.get(node.id)
    if (!parentEntry || !childEntry) continue

    const parentRect = parentEntry.getBoundingClientRect()
    const childRect = childEntry.getBoundingClientRect()

    const x1 = parentRect.left + parentRect.width / 2 - containerRect.left
    const y1 = parentRect.top + parentRect.height / 2 - containerRect.top
    const x2 = childRect.left + childRect.width / 2 - containerRect.left
    const y2 = childRect.top + childRect.height / 2 - containerRect.top

    const parentNode = nodesById[node.parentId]
    const isParentCompleted = parentNode?.status === 'completed'
    const isChildCompleted = node.status === 'completed'
    const isParentActive = activeIds.value.has(parentNode?.id)
    const isChildActive = activeIds.value.has(node.id)

    let lineClass = 'tree-connector-line'
    if (isParentCompleted && isChildCompleted) {
      lineClass += ' connector-completed'
    } else if (isChildActive || isParentActive) {
      lineClass += ' connector-active'
    } else if (node.status === 'locked') {
      lineClass += ' connector-locked'
    }

    newConnectors.push({ x1, y1, x2, y2, class: lineClass })
  }
  connectors.value = newConnectors
}

// Watch for tree changes and redraw connectors
watch([() => allNodes.value, () => selectedRegion.value, () => viewMode.value], () => {
  nextTick(() => drawConnectors())
}, { flush: 'post' })

let resizeObserver = null

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => drawConnectors())
    if (treeScrollContainer.value) {
      resizeObserver.observe(treeScrollContainer.value)
    }
  }
  nextTick(() => drawConnectors())
})

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<style scoped>
.explore-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.explore-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  flex-shrink: 0;
  padding: 0 var(--spacing-lg);
  padding-top: var(--spacing-lg);
}

/* View Toggle */
.view-toggle {
  display: flex;
  gap: 4px;
  background: rgba(255,255,255,0.05);
  border-radius: var(--radius-sm);
  padding: 3px;
}
.view-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}
.view-btn:hover {
  color: var(--text-primary);
  background: rgba(255,255,255,0.08);
}
.view-btn.active {
  background: rgba(74, 222, 128, 0.3);
  color: #ffffff;
  font-weight: 700;
}

/* Status Banner */
.status-banner {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-weight: bold;
  font-size: 0.85rem;
}
.status-banner.none {
  display: none;
}

/* Master-Detail Layout */
.master-detail-layout {
  display: flex;
  flex-direction: row;
  gap: var(--spacing-md);
  align-items: stretch;
  flex: 1;
  min-height: 0;
  padding: 0 var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
}

.master-pane {
  flex: 0 0 320px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}
.pane-header h3 {
  margin: 0;
  color: var(--accent-color);
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.region-list-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding-right: 6px;
}

/* Region List Items */
.region-list-item {
  padding: 12px 14px;
  margin-bottom: 8px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: all 0.2s ease;
}
.region-list-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(74, 222, 128, 0.3);
}
.region-list-item.selected {
  background: rgba(74, 222, 128, 0.12);
  border-color: var(--accent-color);
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.15);
}
.region-list-name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
  margin-bottom: 4px;
}
.region-list-meta {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Detail Pane */
.detail-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.empty-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: var(--text-muted);
}
.empty-detail.no-paths {
  gap: 8px;
}
.empty-detail .empty-hint {
  font-size: 0.85rem;
  color: var(--text-secondary);
  max-width: 300px;
  line-height: 1.4;
}
.detail-icon-bg {
  font-size: 4rem;
  opacity: 0.1;
  margin-bottom: 20px;
}

/* Tree View */
.expedition-tree-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  position: relative;
}

.tree-region-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.tree-region-title-name {
  color: var(--accent-color);
  font-size: 1rem;
  font-weight: 600;
}
.tree-region-title-meta {
  color: var(--text-muted);
  font-size: 0.85rem;
}

.tree-scroll-container {
  flex: 1;
  position: relative;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 0;
  padding: 24px;
}

.tree-svg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
}

.tree-wrapper {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 48px;
  position: relative;
  z-index: 1;
}

.tree-level-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
}

.tree-node {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid;
  position: relative;
  z-index: 2;
  background: #0d130e;
  user-select: none;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
}
.tree-node:hover {
  transform: scale(1.15) translateY(-2px);
  z-index: 5;
}
.tree-node.selected {
  border-color: #ffffff !important;
  box-shadow: 0 0 25px rgba(255, 255, 255, 0.45), inset 0 0 12px rgba(255, 255, 255, 0.25);
  transform: scale(1.15);
}

/* Node states */
.tree-node.available {
  background: radial-gradient(circle, rgba(74, 222, 128, 0.2) 0%, #0d130e 100%);
  border-color: var(--accent-color);
  color: #86efac;
  box-shadow: 0 0 12px rgba(74, 222, 128, 0.3), inset 0 0 8px rgba(74, 222, 128, 0.15);
  animation: pulse-glow-avail 2s infinite alternate;
}
.tree-node.active {
  background: radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, #0d130e 100%);
  border-color: #fbbf24;
  color: #fbbf24;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.5), inset 0 0 10px rgba(251, 191, 36, 0.3);
  animation: pulse-glow-active 1.5s infinite alternate;
}
.tree-node.active::before {
  content: '';
  position: absolute;
  inset: -5px;
  border-radius: 50%;
  border: 2px dashed #fbbf24;
  animation: spin-cw 12s linear infinite;
  pointer-events: none;
}
.tree-node.completed {
  background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, #0d130e 100%);
  border-color: var(--success);
  color: var(--success);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.25), inset 0 0 6px rgba(16, 185, 129, 0.1);
}
.tree-node.closed {
  background: radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, #0d130e 100%);
  border-color: #f59e0b;
  color: #f59e0b;
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
}
.tree-node.locked {
  background: #050806;
  border-color: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.12);
  font-size: 1rem;
  cursor: not-allowed;
  box-shadow: none;
}

/* SVG Energy Connectors */
:deep(.tree-connector-line) {
  stroke: rgba(255, 255, 255, 0.12);
  stroke-width: 1.5;
  transition: stroke 0.4s ease, stroke-width 0.4s ease;
}
:deep(.tree-connector-line.connector-completed) {
  stroke: rgba(16, 185, 129, 0.45);
  stroke-width: 2.5;
  filter: drop-shadow(0 0 2px rgba(16, 185, 129, 0.5));
}
:deep(.tree-connector-line.connector-active) {
  stroke: rgba(251, 191, 36, 0.65);
  stroke-width: 2.5;
  stroke-dasharray: 6 4;
  animation: tree-line-flow 1.5s linear infinite;
  filter: drop-shadow(0 0 3px rgba(251, 191, 36, 0.5));
}
:deep(.tree-connector-line.connector-locked) {
  stroke: rgba(255, 255, 255, 0.04);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

/* List View */
.expedition-list-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  overflow-y: auto;
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

/* Detail pane inline (list view) */
.detail-pane-inline {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
}

.card-meta {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.meta-tag {
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 12px;
  border: 1px solid;
  font-weight: 500;
}
.meta-tag.story {
  background: rgba(74, 222, 128, 0.15);
  border-color: rgba(74, 222, 128, 0.3);
  color: var(--color-primary-light);
}
.meta-tag.exploration {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  color: #60a5fa;
}
.meta-tag.level {
  background: rgba(255, 193, 7, 0.15);
  border-color: rgba(255, 193, 7, 0.3);
  color: #ffc107;
}

/* Completed modal */
.completed-modal-content {
  text-align: center;
}
.completed-modal-header {
  margin-bottom: 16px;
}
.completed-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}
.completed-name {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--accent-color);
}
.completed-meta {
  color: var(--text-muted);
  font-size: 0.9rem;
}
.completed-info {
  background: rgba(255,255,255,0.03);
  border-radius: var(--radius-md);
  padding: 12px;
  margin-bottom: 12px;
  text-align: left;
}
.completed-info > div {
  margin-bottom: 8px;
}
.completed-items {
  margin-top: 8px;
  font-size: 0.85rem;
  color: var(--text-muted);
}
.completed-bonus {
  margin-top: 8px;
  color: #f39c12;
  font-weight: bold;
}
.completed-footer {
  font-size: 0.8rem;
  color: var(--text-muted);
}

/* Advisory modal */
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

@keyframes pulse-glow-avail {
  0% { box-shadow: 0 0 6px rgba(74, 222, 128, 0.2), inset 0 0 4px rgba(74, 222, 128, 0.1); }
  100% { box-shadow: 0 0 16px rgba(74, 222, 128, 0.5), inset 0 0 10px rgba(74, 222, 128, 0.25); }
}
@keyframes pulse-glow-active {
  0% { box-shadow: 0 0 10px rgba(251, 191, 36, 0.4), inset 0 0 6px rgba(251, 191, 36, 0.2); }
  100% { box-shadow: 0 0 22px rgba(251, 191, 36, 0.85), inset 0 0 12px rgba(251, 191, 36, 0.4); }
}
@keyframes spin-cw {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes tree-line-flow {
  to { stroke-dashoffset: -20; }
}

@media (max-width: 768px) {
  .master-detail-layout {
    flex-direction: column;
  }
  .master-pane {
    flex: auto;
    height: auto;
    max-height: 40%;
  }
}
</style>
