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
      <div class="combat-log-section" :class="{ expanded: isLogExpanded }" @click="!isLogExpanded && (isLogExpanded = true)">
        <div class="log-badge">{{ effectiveLog.length }}</div>
        <div v-if="isLogExpanded" class="combat-log-expanded-header">
          <h3>{{ t('combat_uxelm_battle_log') }}</h3>
          <button class="btn-log-close" @click.stop="isLogExpanded = false">✕</button>
        </div>
        <div class="log-console" ref="logConsole">
          <div
            v-for="(entry, idx) in visibleLog"
            :key="idx"
            class="log-entry"
            :style="{ color: entry.color }"
          >
            <span class="log-text">{{ entry.text }}</span>
            <span v-if="entry.hpInfo" class="log-hp-info"> {{ entry.hpInfo }}</span>
            <span v-if="entry.defeatedInfo" class="log-defeated-info"> {{ entry.defeatedInfo }}</span>
          </div>
        </div>
        <button v-if="!isLogExpanded" class="btn-log-toggle" @click.stop="isLogExpanded = true">↗</button>
      </div>
    </div>
  </FullViewOverlay>
</template>

<script setup>
import { computed, ref, watch, nextTick, onErrorCaptured, inject } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import { useActiveBattle, useExpeditions, useInventory } from '@/core/composables/useGameState.js'
import FullViewOverlay from '@/components/FullViewOverlay.vue'
import CombatHeader from './components/CombatHeader.vue'
import CombatActorGrid from './components/CombatActorGrid.vue'
import CombatActionPanel from './components/CombatActionPanel.vue'

const emit = defineEmits(['close'])

const { t } = useI18n()
const { dispatch } = useAdapter()
const engine = inject('engine')
const gameState = inject('gameState')

const battle = useActiveBattle()
const { activeExpeditions } = useExpeditions()
const inventory = useInventory()

const menuState = ref('main')
const selectedAction = ref(null)
const selectedFamily = ref(null)
const logConsole = ref(null)
const lastLogLength = ref(0)

const activeExpedition = computed(() => {
  const active = activeExpeditions.value || []
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

const isLogExpanded = ref(false)
const logEvents = computed(() => battle.value?.log || [])
const lastBattleLog = ref([])

watch(battle, (newVal, oldVal) => {
  if (oldVal?.log?.length > 0 && (!newVal || newVal.isOver)) {
    lastBattleLog.value = [...oldVal.log]
  }
})

const effectiveLog = computed(() => battle.value?.log || lastBattleLog.value || [])

function translateEnemyName({ name, templateId, isElite, eliteTier }) {
  if (!templateId) return name
  const transKey = 'combat_info_' + templateId
  let baseName = t(transKey)
  if (baseName === transKey) {
    baseName = name
  }
  if (isElite) {
    const tierSuffix = eliteTier > 1 ? ` +${eliteTier - 1}` : ''
    return `★ ${baseName}${tierSuffix}`
  }
  return baseName
}

function formatLogEntry(entry) {
  if (typeof entry === 'string') {
    return { text: entry, color: '#aaa' }
  }

  const ev = { ...entry }

  if (ev.actorName && !ev.actorIsHero && ev.actorTemplateId) {
    ev.actorName = translateEnemyName({
      name: ev.actorName,
      templateId: ev.actorTemplateId,
      isElite: ev.actorIsElite,
      eliteTier: ev.actorEliteTier
    })
  }
  if (ev.targetName && !ev.targetIsHero && ev.targetTemplateId) {
    ev.targetName = translateEnemyName({
      name: ev.targetName,
      templateId: ev.targetTemplateId,
      isElite: ev.targetIsElite,
      eliteTier: ev.targetEliteTier
    })
  }

  let text = ''
  let color = '#aaa'
  let hpInfo = ''
  let defeatedInfo = ''

  if (ev.type === 'DAMAGE') {
    if (ev.isMiss) {
      text = t('combat_log_miss', { attacker: ev.actorName, target: ev.targetName })
      color = '#ffcc00'
    } else {
      const familyKey = 'heroes_info_family_' + ev.skillId
      const translatedFamily = t(familyKey)
      const skillLabel = ev.skillId && translatedFamily !== familyKey
        ? `[${translatedFamily}${ev.effectiveTier ? ' T' + ev.effectiveTier : ''}] `
        : ''
      text = skillLabel + t('combat_log_attack', { attacker: ev.actorName, target: ev.targetName, damage: ev.amount })
      color = ev.actorIsHero ? '#4caf50' : '#f44336'
      if (ev.isCrit) text = '🔥 ' + text
      if (ev.targetDefeated) {
        const defeatedText = t('combat_log_target_defeated')?.replace('{target}', '') || ''
        defeatedInfo = `(${defeatedText} 💀)`
      }
    }
  } else if (ev.type === 'SPELL_DAMAGE') {
    text = t('combat_log_spell_damage', { attacker: ev.actorName, spell: ev.spellName || t('shared_uxelm_magic'), target: ev.targetName, damage: ev.amount })
    color = ev.actorIsHero ? '#9c27b0' : '#f44336'
    if (ev.targetDefeated) {
      const defeatedText = t('combat_log_target_defeated')?.replace('{target}', '') || ''
      defeatedInfo = `(${defeatedText} 💀)`
    }
  } else if (ev.type === 'STUN_SKIP') {
    text = t('combat_log_stun_skip', { actor: ev.actorName })
    color = '#ffcc00'
  } else if (ev.type === 'SLEEP_SKIP') {
    text = t('combat_log_sleep_skip', { actor: ev.actorName })
    color = '#9c27b0'
  } else if (ev.type === 'MAGIC_TIER_UP') {
    text = t('combat_log_magic_tier_up', { actor: ev.actorName, fromTier: ev.fromTier, toTier: ev.toTier })
    color = '#9c27b0'
  } else if (ev.type === 'TECHNIQUE_EVOLVED') {
    const familyKey = 'heroes_info_family_' + ev.family
    const translatedFamily = t(familyKey)
    text = t('combat_log_evolved', { actor: ev.actorName, family: translatedFamily !== familyKey ? translatedFamily : ev.family, tier: ev.tier })
    color = '#ff9800'
  } else if (ev.type === 'HEAL') {
    text = t('combat_log_heal', { attacker: ev.actorName, target: ev.targetName, amount: ev.amount })
    color = '#03a9f4'
  } else if (ev.type === 'VAMP') {
    text = t('combat_log_vamp', { actor: ev.actorName, amount: ev.amount })
    color = '#8bc34a'
  } else if (ev.type === 'TRAIT_REGEN') {
    text = t('combat_log_regen', { target: ev.targetName, amount: ev.amount })
    color = '#8bc34a'
  } else if (ev.type === 'STATUS_TICK') {
    if (ev.effectType === 'poison') {
      text = t('combat_log_poison', { target: ev.targetName, damage: ev.damage })
      color = '#9c27b0'
    } else if (ev.effectType === 'burn') {
      text = t('combat_log_burn', { target: ev.targetName, damage: ev.damage })
      color = '#ff9800'
    }
  } else if (ev.type === 'STATUS_EXPIRED') {
    text = t('combat_log_status_expired', { target: ev.targetName, effect: ev.effectType })
    color = '#888'
  } else if (ev.type === 'USE_CONSUMABLE') {
    const itemName = t(ev.consumableId)
    const stat = ev.healType === 'HEAL_MP' ? t('heroes_info_stat_mp') : t('heroes_info_stat_hp')
    text = t('combat_log_use_consumable', { attacker: ev.actorName, item: itemName, target: ev.targetName, amount: ev.amount, stat })
    color = '#00bcd4'
  } else if (ev.type === 'STAMINA_REGEN') {
    text = t('combat_log_stamina_restore', { actor: ev.actorName, amount: ev.amount })
    color = '#4caf50'
  } else {
    text = `[${ev.type}]`
  }

  if (ev.targetHp !== undefined && ev.targetMaxHp !== undefined && !ev.targetDefeated) {
    hpInfo = `(${t('heroes_info_stat_hp')}: ${ev.targetHp}/${ev.targetMaxHp})`
  }

  return { text, color, hpInfo, defeatedInfo }
}

const visibleLog = computed(() => {
  return effectiveLog.value.slice(-100).map((entry) => {
    return formatLogEntry(entry)
  })
})

watch(effectiveLog, () => {
  if (effectiveLog.value.length !== lastLogLength.value) {
    lastLogLength.value = effectiveLog.value.length
    nextTick(() => {
      if (logConsole.value) {
        logConsole.value.scrollTop = logConsole.value.scrollHeight
      }
    })
  }
})

function toggleAutoBattle() {
  dispatch('combat', 'toggleAuto')
}

function skipBattle() {
  dispatch('combat', 'skip')
}

function executeDefend() {
  if (!currentHero.value) return
  // Defend passes the turn (no special buff in v1)
  dispatch('combat', 'nextTurn')
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
  if (!action) return

  let result
  if (action.type === 'attack') {
    result = dispatch('combat', 'executeAction', { skillId: 'single_strike', targetIndex: index })
  } else if (action.type === 'skill') {
    result = dispatch('combat', 'executeAction', { skillId: action.id, targetIndex: index, tier: action.tier || null })
  } else if (action.type === 'spell') {
    result = dispatch('combat', 'executeSpell', { spellIndex: action.index, targetIndex: index })
  } else if (action.type === 'item') {
    const targetId = isHero
      ? battle.value?.heroes?.[index]?.id
      : battle.value?.enemies?.[index]?.id
    result = dispatch('combat', 'useConsumable', { consumableId: action.id, targetId })
  }

  if (result && !result.success) {
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
  transition: max-height 0.2s ease;
}

.combat-log-section.expanded {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  top: 0;
  max-height: 100%;
  z-index: 100;
}

.combat-log-expanded-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-bottom: 1px solid var(--glass-border);
  background: var(--bg-card);
}

.combat-log-expanded-header h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-primary-light);
}

.btn-log-close {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1rem;
}

.btn-log-toggle {
  position: absolute;
  top: 8px;
  right: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--glass-border);
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  padding: 2px 6px;
  font-size: 0.75rem;
}

.log-badge {
  position: absolute;
  top: -10px;
  right: 48px;
  padding: 2px 8px;
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  z-index: 10;
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
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.log-hp-info {
  color: var(--text-muted);
  font-size: 0.85em;
  margin-left: var(--spacing-xs);
}

.log-defeated-info {
  color: var(--color-danger);
  font-weight: bold;
  margin-left: var(--spacing-xs);
}
</style>
