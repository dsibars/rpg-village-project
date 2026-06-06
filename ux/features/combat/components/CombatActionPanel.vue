<template>
  <div class="combat-action-panel">
    <!-- Turn Banner -->
    <div class="turn-banner">
      {{ bannerText }}
    </div>

    <!-- Battle Over -->
    <div v-if="battle?.isOver" class="resolution-pane">
      <CombatResolutionPane :battle="battle" :engine="engine" @close="$emit('close')" />
    </div>

    <!-- Auto / Enemy Turn Message -->
    <div v-else-if="!isHeroTurn || battle?.autoBattle" class="auto-message">
      {{ battle?.autoBattle ? t('shared_uxelm_auto_combat_running') : t('shared_uxelm_enemy_planning') }}
    </div>

    <!-- Main Menu -->
    <div v-else-if="menuState === 'main'" class="action-buttons">
      <Button variant="secondary" @click="selectAction('targeting', { type: 'attack', id: 'single_strike', name: t('heroes_info_family_single_strike') })">
        ⚔ {{ t('heroes_info_family_single_strike') }}
      </Button>
      <Button variant="secondary" :disabled="!hasSkills" @click="setMenu('skills')">
        🔮 {{ t('shared_uxelm_skills') }}
      </Button>
      <Button variant="secondary" :disabled="!canCastSpells" @click="setMenu('magic')">
        ✨ {{ t('shared_uxelm_magic') }}
      </Button>
      <Button variant="secondary" :disabled="battle?.itemUsedThisTurn" @click="setMenu('items')">
        🎒 {{ t('combat_uxelm_items') }}
        <span v-if="battle?.itemUsedThisTurn" class="hint">({{ t('shared_uxelm_once_per_turn') }})</span>
      </Button>
      <Button variant="secondary" @click="executeDefend">
        🛡️ {{ t('gambit_uxelm_defend') }}
      </Button>
    </div>

    <!-- Skills Menu -->
    <div v-else-if="menuState === 'skills'" class="sub-menu">
      <Button variant="ghost" size="sm" class="back-btn" @click="setMenu('main')">
        ◀ {{ t('shared_uxelm_back') }}
      </Button>
      <div v-if="skillFamilies.length === 0" class="empty-msg">
        {{ t('shared_uxelm_technique_none') }}
      </div>
      <div v-else class="action-buttons">
        <Button
          v-for="familyId in skillFamilies"
          :key="familyId"
          variant="secondary"
          :disabled="!canAffordSkill(familyId, heroTier(familyId))"
          @click="selectFamily(familyId)"
        >
          {{ t('heroes_info_family_' + familyId) }}
          <span class="cost">(Tier {{ heroTier(familyId) }} · {{ skillCost(familyId).staCost }} STA<span v-if="skillCost(familyId).mpCost"> + {{ skillCost(familyId).mpCost }} MP</span>)</span>
        </Button>
      </div>
    </div>

    <!-- Family Tiers Menu -->
    <div v-else-if="menuState === 'family_tiers'" class="sub-menu">
      <Button variant="ghost" size="sm" class="back-btn" @click="setMenu('skills')">
        ◀ {{ t('shared_uxelm_back') }}
      </Button>
      <div class="menu-title">{{ t('heroes_info_family_' + selectedFamily) }}</div>
      <div class="action-buttons">
        <Button
          v-for="tier in availableTiers"
          :key="tier"
          variant="secondary"
          :disabled="!canAffordSkill(selectedFamily, tier)"
          @click="selectAction('targeting', { type: 'skill', id: selectedFamily, name: t('heroes_info_family_' + selectedFamily), tier })"
        >
          <span v-if="tier === heroTier(selectedFamily)" class="tier-highlight">⚡</span>
          <span v-else-if="tier === 1" class="tier-low">⚪</span>
          Tier {{ tier }}
          <span class="cost">({{ skillCost(selectedFamily, tier).staCost }} STA<span v-if="skillCost(selectedFamily, tier).mpCost"> + {{ skillCost(selectedFamily, tier).mpCost }} MP</span>)</span>
        </Button>
      </div>
    </div>

    <!-- Magic Menu -->
    <div v-else-if="menuState === 'magic'" class="sub-menu">
      <Button variant="ghost" size="sm" class="back-btn" @click="setMenu('main')">
        ◀ {{ t('shared_uxelm_back') }}
      </Button>
      <div v-if="spells.length === 0" class="empty-msg">
        {{ t('shared_uxelm_spell_none') }}
      </div>
      <div v-else class="action-buttons">
        <Button
          v-for="(spell, idx) in spells"
          :key="idx"
          variant="secondary"
          :disabled="!canCastSpell(spell)"
          @click="selectAction('targeting', { type: 'spell', index: idx, name: spell.name })"
        >
          {{ elementIcon(spell.element) }} {{ spell.name }}
          <span class="cost">({{ spell.mpCost }} MP)</span>
        </Button>
      </div>
    </div>

    <!-- Items Menu -->
    <div v-else-if="menuState === 'items'" class="sub-menu">
      <Button variant="ghost" size="sm" class="back-btn" @click="setMenu('main')">
        ◀ {{ t('shared_uxelm_back') }}
      </Button>
      <div v-if="consumableItems.length === 0" class="empty-msg">
        {{ t('shared_uxelm_consumable_none') }}
      </div>
      <div v-else class="action-buttons">
        <Button
          v-for="item in consumableItems"
          :key="item.id"
          variant="secondary"
          @click="selectAction('targeting', { type: 'item', id: item.id, name: t(item.id) })"
        >
          {{ t(item.id) }} x{{ item.qty }}
        </Button>
      </div>
    </div>

    <!-- Targeting Mode -->
    <div v-else-if="menuState === 'targeting'" class="sub-menu">
      <Button variant="ghost" size="sm" class="back-btn" @click="goBackFromTargeting">
        ◀ {{ t('shared_uxelm_back') }}
      </Button>
      <div class="targeting-msg">
        {{ t('shared_uxelm_choose_target') }} — {{ selectedAction?.name || '' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import Button from '@/components/Button.vue'
import CombatResolutionPane from './CombatResolutionPane.vue'

const props = defineProps({
  battle: { type: Object, default: null },
  currentHero: { type: Object, default: null },
  engine: { type: Object, default: null },
  inventory: { type: Object, default: () => ({}) },
  menuState: { type: String, default: 'main' },
  selectedAction: { type: Object, default: null },
  selectedFamily: { type: String, default: null }
})

const emit = defineEmits(['menuChange', 'actionSelect', 'defend', 'close'])

const { t } = useI18n()

const activeActor = computed(() => {
  const b = props.battle
  if (!b) return null
  return b.turnOrder?.[b.currentTurnIndex] || null
})

const bannerText = computed(() => {
  const actor = activeActor.value
  if (!actor) return '...'
  const name = t(actor.name)
  return t('shared_uxelm_turn').replace('{name}', name)
})

const isHeroTurn = computed(() => {
  const actor = activeActor.value
  return actor && actor.type === 'Hero' && !props.battle?.autoBattle
})

const hasSkills = computed(() => {
  const hero = props.currentHero
  if (!hero) return false
  return (hero.knownFamilies || []).length > 1
})

const canCastSpells = computed(() => {
  const hero = props.currentHero
  if (!hero) return false
  const codex = hero.spellCodex || []
  return codex.some(s => props.engine?.canCastSpell?.(hero, s))
})

const skillFamilies = computed(() => {
  const hero = props.currentHero
  if (!hero) return []
  return (hero.knownFamilies || []).filter(f => f !== 'single_strike')
})

const spells = computed(() => {
  return props.currentHero?.spellCodex || []
})

const consumableItems = computed(() => {
  const consumables = props.inventory?.consumables || {}
  return Object.entries(consumables)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ id, qty }))
})

const availableTiers = computed(() => {
  const max = props.currentHero?.techniqueTiers?.[props.selectedFamily] || 1
  const tiers = []
  for (let t = max; t >= 1; t--) tiers.push(t)
  return tiers
})

function heroTier(familyId) {
  return props.currentHero?.techniqueTiers?.[familyId] || 1
}

function skillCost(familyId, tier) {
  return props.engine?.getSkillCost?.(props.currentHero, familyId, tier) || { staCost: 0, mpCost: 0 }
}

function canAffordSkill(familyId, tier) {
  return props.engine?.canAffordSkill?.(props.currentHero, familyId, tier) || false
}

function canCastSpell(spell) {
  return props.engine?.canCastSpell?.(props.currentHero, spell) || false
}

function elementIcon(element) {
  return { fire: '🔥', water: '💧', wind: '💨', storm: '⚡', light: '✨', dark: '🌑', earth: '🪨' }[element] || '✨'
}

function setMenu(state, action = null, family = null) {
  emit('menuChange', state, action, family)
}

function selectAction(menuState, action) {
  emit('actionSelect', action)
  emit('menuChange', menuState, action)
}

function selectFamily(familyId) {
  const tier = heroTier(familyId)
  // If only tier 1, go straight to targeting
  if (tier <= 1) {
    selectAction('targeting', { type: 'skill', id: familyId, name: t('heroes_info_family_' + familyId), tier: 1 })
  } else {
    emit('menuChange', 'family_tiers', null, familyId)
  }
}

function goBackFromTargeting() {
  const action = props.selectedAction
  if (!action) {
    emit('menuChange', 'main')
    return
  }
  if (action.type === 'skill') {
    if (action.tier !== undefined) {
      emit('menuChange', 'family_tiers', null, action.id)
    } else {
      emit('menuChange', 'skills')
    }
  } else if (action.type === 'spell') {
    emit('menuChange', 'magic')
  } else if (action.type === 'item') {
    emit('menuChange', 'items')
  } else {
    emit('menuChange', 'main')
  }
}

function executeDefend() {
  emit('defend')
}
</script>

<style scoped>
.combat-action-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  min-height: 200px;
}

.turn-banner {
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-secondary);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--glass-border);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.action-buttons > :deep(button) {
  flex: 1 1 120px;
}

.auto-message {
  padding: var(--spacing-lg);
  text-align: center;
  color: var(--text-muted);
  font-style: italic;
}

.resolution-pane {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.sub-menu {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.back-btn {
  align-self: flex-start;
}

.menu-title {
  text-align: center;
  font-weight: 700;
  color: var(--text-primary);
}

.targeting-msg {
  text-align: center;
  color: var(--color-success);
  font-weight: 700;
  padding: var(--spacing-md);
}

.empty-msg {
  text-align: center;
  color: var(--text-muted);
  padding: var(--spacing-md);
}

.hint {
  font-size: 0.75rem;
  opacity: 0.7;
}

.cost {
  font-size: 0.75rem;
  opacity: 0.7;
}

.tier-highlight {
  margin-right: 4px;
}

.tier-low {
  margin-right: 4px;
  opacity: 0.6;
}
</style>
