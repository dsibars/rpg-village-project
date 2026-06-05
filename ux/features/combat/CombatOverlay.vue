<template>
  <FullViewOverlay @close="onClose">
    <template #icon>⚔</template>
    <template #title>{{ t('combat_uxelm_battle_title') }}</template>

    <div class="combat-overlay">
      <CombatHeader
        :battle="battle"
        :active-expedition="activeExpedition"
        @toggle-auto="toggleAutoBattle"
        @skip="skipBattle"
      />

      <CombatActorGrid
        :heroes="battle?.heroes || []"
        :enemies="battle?.enemies || []"
        :current-actor-id="currentActorId"
        :targeting-mode="targetingMode"
        :valid-target-indices="validTargetIndices"
        @target="handleTarget"
      />

      <CombatActionPanel
        :battle="battle"
        :current-hero="currentHero"
        :engine="engine"
        :inventory="inventory"
        :menu-state="menuState"
        :selected-action="selectedAction"
        :selected-family="selectedFamily"
        @menu-change="onMenuChange"
        @action-select="onActionSelect"
        @defend="executeDefend"
        @close="onClose"
      />

      <!-- Combat Log -->
      <div class="combat-log-section">
        <div class="log-badge">{{ logEvents.length }}</div>
        <div class="log-console" ref="logConsole">
          <div
            v-for="(entry, idx) in visibleLog"
            :key="idx"
            class="log-entry"
          >
            {{ formatLogEntry(entry) }}
          </div>
        </div>
      </div>
    </div>
  </FullViewOverlay>
</template>

<script setup>
import { computed, ref, watch, nextTick, onErrorCaptured, inject } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useActiveBattle, useExpeditions, useInventory } from '@/core/composables/useGameState.js'
import FullViewOverlay from '@/components/FullViewOverlay.vue'
import CombatHeader from './components/CombatHeader.vue'
import CombatActorGrid from './components/CombatActorGrid.vue'
import CombatActionPanel from './components/CombatActionPanel.vue'

const emit = defineEmits(['close'])

const { t } = useI18n()
const engine = inject('engine')
const gameState = inject('gameState')

const battle = useActiveBattle()
const expeditions = useExpeditions()
const inventory = useInventory()

const menuState = ref('main')
const selectedAction = ref(null)
const selectedFamily = ref(null)
const logConsole = ref(null)
const lastLogLength = ref(0)

const activeExpedition = computed(() => {
  const active = expeditions.value.activeExpeditions || []
  return active[0] || null
})

const currentActorId = computed(() => {
  const b = battle.value
  if (!b || b.isOver) return null
  const actor = b.turnOrder?.[b.currentTurnIndex]
  return actor?.id || null
})

const currentHero = computed(() => {
  const b = battle.value
  if (!b) return null
  const actor = b.turnOrder?.[b.currentTurnIndex]
  if (!actor || actor.type !== 'Hero') return null
  return b.heroes.find((h) => h.id === actor.id)
})

const targetingMode = computed(() => {
  if (!selectedAction.value || !battle.value) return null
  const action = selectedAction.value

  const skillTargetType = action.type === 'skill'
    ? engine?.getSkillTargetType?.(action.id)
    : null
  const spellData = action.type === 'spell'
    ? currentHero.value?.spellCodex?.[action.index]
    : null

  if (skillTargetType === 'single_ally' || skillTargetType === 'all_allies') return 'ally'
  if (spellData?.targetType === 'single_ally' || spellData?.targetType === 'all_allies') return 'ally'
  if (action.type === 'item' && action.id.includes('potion')) return 'ally'
  if (skillTargetType === 'self') return 'self'
  if (spellData?.targetType === 'self') return 'self'
  return 'enemy'
})

const validTargetIndices = computed(() => {
  if (!selectedAction.value || !battle.value) return []
  const b = battle.value
  const mode = targetingMode.value

  if (mode === 'ally' || mode === 'self') {
    return b.heroes
      .map((h, idx) => h.hp > 0 ? idx : -1)
      .filter(i => i >= 0)
  }
  return b.enemies
    .map((e, idx) => e.hp > 0 ? idx : -1)
    .filter(i => i >= 0)
})

const logEvents = computed(() => battle.value?.log?.events || [])

const visibleLog = computed(() => {
  return logEvents.value.slice(-50).map((entry) => {
    if (typeof entry === 'string') return entry
    return entry.message || JSON.stringify(entry)
  })
})

function formatLogEntry(entry) {
  if (typeof entry === 'string') return entry
  return entry.message || JSON.stringify(entry)
}

watch(logEvents, () => {
  if (logEvents.value.length !== lastLogLength.value) {
    lastLogLength.value = logEvents.value.length
    nextTick(() => {
      if (logConsole.value) {
        logConsole.value.scrollTop = logConsole.value.scrollHeight
      }
    })
  }
})

function toggleAutoBattle() {
  engine?.toggleAutoBattle?.()
}

function skipBattle() {
  engine?.skipBattle?.()
}

function executeDefend() {
  const hero = currentHero.value
  if (!hero || !engine) return
  engine.heroDefend?.(hero.id)
  menuState.value = 'main'
}

function onMenuChange(newState, action = null, family = null) {
  menuState.value = newState
  if (action) selectedAction.value = action
  if (family !== undefined && family !== null) selectedFamily.value = family
  if (newState === 'main') {
    selectedAction.value = null
    selectedFamily.value = null
  }
}

function onActionSelect(action) {
  selectedAction.value = action
}

function handleTarget({ index, isHero }) {
  const action = selectedAction.value
  if (!action || !engine) return

  let result
  if (action.type === 'attack') {
    result = engine.executeBattleAction?.('single_strike', index)
  } else if (action.type === 'skill') {
    result = engine.executeBattleAction?.(action.id, index, action.tier || null)
  } else if (action.type === 'spell') {
    result = engine.executeBattleSpell?.(action.index, index)
  } else if (action.type === 'item') {
    const targetId = isHero
      ? battle.value?.heroes?.[index]?.id
      : battle.value?.enemies?.[index]?.id
    result = engine.useBattleConsumable?.(action.id, targetId)
  }

  if (result && !result.success) {
    // Show error toast via adapter or console
    console.error('Combat action failed:', result.error)
  }

  menuState.value = 'main'
  selectedAction.value = null
  selectedFamily.value = null
}

function onClose() {
  menuState.value = 'main'
  selectedAction.value = null
  selectedFamily.value = null
  emit('close')
}

onErrorCaptured((err, instance, info) => {
  console.error('CombatOverlay error:', err, info)
  return false
})
</script>

<style scoped>
.combat-overlay {
  display: flex;
  flex-direction: column;
  height: 100%;
  color: var(--text-primary);
  background: var(--bg-base);
}

.combat-log-section {
  position: relative;
  display: flex;
  flex-direction: column;
  max-height: 160px;
  background: var(--bg-card);
  border-top: 1px solid var(--glass-border);
}

.log-badge {
  position: absolute;
  top: -10px;
  right: 16px;
  padding: 2px 8px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
}

.log-console {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.log-entry {
  padding: 2px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}
</style>
