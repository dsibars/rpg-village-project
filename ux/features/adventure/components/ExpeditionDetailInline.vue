<template>
  <div class="expedition-detail-inline expedition-detail">
    <!-- Active Expedition Dashboard -->
    <div v-if="mode === 'active'" class="active-dashboard">
      <div class="active-expedition-dashboard">
        <h3>{{ t('explore_uxelm_assigned_expedition') }}</h3>
        <p class="description">
          {{ isStageZero ? t('explore_uxelm_waiting_combat') : t('explore_uxelm_progress_combat') }}
        </p>
        <div class="exp-progress">
          <h4>{{ t('explore_uxelm_stage') }} {{ activeExp?.currentStage || 0 }} / {{ expedition.stages?.length || 0 }}</h4>
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: `${progressPct}%` }" />
          </div>
        </div>
        <Button variant="secondary" class="btn-retire" @click="$emit('recall', { expId: expedition.id })">
          {{ t('explore_uxelm_unassign_retire') }}
        </Button>
      </div>
    </div>

    <!-- Max expeditions warning (for available mode) -->
    <div v-else-if="isAtMax && !isActiveNode" class="alert alert-warning">
      {{ t('explore_uxelm_max_expeditions_reached') }}
    </div>

    <!-- Expedition Profile -->
    <div class="expedition-profile">
      <header class="profile-header">
        <div class="profile-title-group">
          <span class="profile-badge">{{ expedition.isStory ? t('explore_uxelm_story') : t('explore_uxelm_exploration') }}</span>
          <h2>{{ displayName }}</h2>
        </div>
      </header>
      <div class="exp-stats">
        <p><strong>{{ t('explore_uxelm_stages') }}:</strong> {{ expedition.stages?.length || 0 }}</p>
        <p><strong>{{ t('explore_uxelm_recommended_level') }}:</strong> {{ expedition.stages?.[0]?.enemyLevel || 1 }}</p>
        <p><strong>{{ t('explore_uxelm_base_reward') }}:</strong> {{ expedition.reward?.gold || 0 }} {{ t('village_uxelm_gold') }}</p>
      </div>
      <!-- Combat Intel -->
      <div v-if="uniqueEnemies.length > 0" class="combat-intel">
        <strong class="intel-label">{{ t('explore_uxelm_intel_enemies') }}</strong>
        <div class="enemy-tags">
          <span v-for="enemy in uniqueEnemies" :key="enemy" class="enemy-tag" :style="getEnemyStyle(enemy)">{{ enemy }}</span>
        </div>
      </div>
    </div>

    <!-- Hero Selector -->
    <div class="hero-selector">
      <h3>{{ t('explore_uxelm_select_heroes') }}</h3>

      <!-- Locked roster -->
      <div v-if="isLocked">
        <p>{{ t('explore_uxelm_roster_locked') }}</p>
        <ul>
          <li v-for="h in assignedHeroes" :key="h.id">{{ h.name }} ({{ t('shared_uxelm_level') }} {{ h.level }})</li>
        </ul>
      </div>

      <!-- No heroes -->
      <div v-else-if="availableHeroes.length === 0">
        <p>{{ t('explore_uxelm_no_idle_heroes') }}</p>
      </div>

      <!-- Hero checkboxes -->
      <div v-else class="hero-checkbox-list">
        <label
          v-for="h in availableHeroes"
          :key="h.id"
          class="hero-checkbox-item"
          :class="{ wounded: h.hp <= 0, selected: isSelected(h.id) }"
        >
          <input
            type="checkbox"
            :value="h.id"
            :checked="isSelected(h.id)"
            :disabled="h.hp <= 0"
            @change="toggleHero(h.id)"
          >
          <div class="hero-info" :style="h.hp <= 0 ? { opacity: '0.6' } : {}">
            <strong>{{ h.name }}</strong> ({{ t('shared_uxelm_level') }} {{ h.level }})
            <br>
            <small :style="{ color: hpColor(h) }">{{ hpText(h) }}</small>
          </div>
        </label>
      </div>

      <Button
        v-if="!isLocked && availableHeroes.length > 0"
        variant="primary"
        class="btn-start-exp"
        :disabled="!canStart"
        @click="handleStart"
      >
        {{ isActiveNode ? t('explore_uxelm_update_assignment') : t('explore_uxelm_assign_heroes') }}
      </Button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useGameState } from '@/core/composables/useGameState.js'
import Button from '@/components/Button.vue'

const props = defineProps({
  expedition: { type: Object, required: true },
  mode: { type: String, default: 'available' } // 'available' | 'active'
})

const emit = defineEmits(['start', 'recall'])

const { t } = useI18n()
const { gameState } = useGameState()

const selectedIds = ref(new Set())

// Reset selections when expedition changes
watch(() => props.expedition?.id, () => {
  selectedIds.value = new Set()
}, { immediate: true })

const activeExpeditions = computed(() => gameState.value.activeExpeditions || [])
const maxConcurrent = computed(() => gameState.value.maxConcurrentExpeditions || 1)
const isAtMax = computed(() => activeExpeditions.value.length >= maxConcurrent.value)

const activeExp = computed(() => {
  return activeExpeditions.value.find(e => e.id === props.expedition.id)
})

const isActiveNode = computed(() => !!activeExp.value)
const isStageZero = computed(() => activeExp.value?.currentStage === 0)
const isLocked = computed(() => isActiveNode.value && activeExp.value.currentStage > 0)

const progressPct = computed(() => {
  if (!activeExp.value) return 0
  return ((activeExp.value.currentStage || 0) / (props.expedition.stages?.length || 1)) * 100
})

const displayName = computed(() => {
  const trans = t(props.expedition.id)
  return trans !== props.expedition.id ? trans : props.expedition.name
})

const enemyTagColors = {
  neutral: { bg: 'rgba(255,59,48,0.1)', border: 'rgba(255,59,48,0.3)', text: '#ff3b30' },
  fire: { bg: 'rgba(255,149,0,0.1)', border: 'rgba(255,149,0,0.3)', text: '#ff9500' },
  earth: { bg: 'rgba(139,69,19,0.1)', border: 'rgba(139,69,19,0.3)', text: '#a0522d' },
  water: { bg: 'rgba(0,122,255,0.1)', border: 'rgba(0,122,255,0.3)', text: '#007aff' },
  storm: { bg: 'rgba(175,82,222,0.1)', border: 'rgba(175,82,222,0.3)', text: '#af52de' },
  wind: { bg: 'rgba(48,209,88,0.1)', border: 'rgba(48,209,88,0.3)', text: '#30d158' },
  dark: { bg: 'rgba(88,86,214,0.1)', border: 'rgba(88,86,214,0.3)', text: '#5856d6' },
  light: { bg: 'rgba(255,204,0,0.1)', border: 'rgba(255,204,0,0.3)', text: '#ffcc00' }
};

function getEnemyStyle(enemyName) {
  const templates = {
    'Green Slime': 'neutral',
    'Fire Slime': 'fire',
    'Earth Slime': 'earth',
    'Wild Boar': 'neutral',
    'Horned Rabbit': 'neutral',
    'Goblin Scout': 'neutral',
    'Goblin Grunt': 'neutral',
    'Small Bat': 'neutral',
    'Minor Spider': 'neutral',
    'Shell Crab': 'neutral',
    'Minor Water Spirit': 'water',
    'Shore Murloc': 'water',
    'Goblin Brute': 'neutral',
    'Goblin Shaman': 'storm',
    'Goblin Slinger': 'neutral',
    'Skeleton Warrior': 'neutral',
    'Ghost Wisp': 'wind',
    'Alpha Wolf': 'neutral',
    'Rotting Zombie': 'neutral',
    'Ice Elemental': 'water',
    'Young Drake': 'fire',
    'Frost Wolf': 'water',
    'Cultist Acolyte': 'fire',
    'Stone Golem': 'earth',
    'Goblin King': 'neutral',
    'Lich Apprentice': 'storm',
    'Mountain Troll': 'neutral',
    'Fierce Green Slime': 'neutral',
    'Fierce Fire Slime': 'fire',
    'Fierce Earth Slime': 'earth',
    'Fierce Wild Boar': 'neutral',
    'Fierce Horned Rabbit': 'neutral',
    'Fierce Goblin Scout': 'neutral',
    'Fierce Goblin Grunt': 'neutral',
    'Fierce Small Bat': 'neutral',
    'Fierce Minor Spider': 'neutral',
    'Fierce Shell Crab': 'neutral',
    'Fierce Minor Water Spirit': 'water',
    'Fierce Shore Murloc': 'water',
    'Fierce Goblin Brute': 'neutral',
    'Fierce Goblin Shaman': 'storm',
    'Fierce Goblin Slinger': 'neutral',
    'Fierce Skeleton Warrior': 'neutral',
    'Fierce Ghost Wisp': 'wind',
    'Fierce Alpha Wolf': 'neutral',
    'Fierce Rotting Zombie': 'neutral',
    'Fierce Ice Elemental': 'water',
    'Fierce Young Drake': 'fire',
    'Fierce Frost Wolf': 'water',
    'Fierce Cultist Acolyte': 'fire',
    'Fierce Stone Golem': 'earth',
    'Fierce Goblin King': 'neutral',
    'Fierce Lich Apprentice': 'storm',
    'Fierce Mountain Troll': 'neutral',
    'Corrupted Green Slime': 'neutral',
    'Corrupted Fire Slime': 'fire',
    'Corrupted Earth Slime': 'earth',
    'Corrupted Wild Boar': 'neutral',
    'Corrupted Horned Rabbit': 'neutral',
    'Corrupted Goblin Scout': 'neutral',
    'Corrupted Goblin Grunt': 'neutral',
    'Corrupted Small Bat': 'neutral',
    'Corrupted Minor Spider': 'neutral',
    'Corrupted Shell Crab': 'neutral',
    'Corrupted Minor Water Spirit': 'water',
    'Corrupted Shore Murloc': 'water',
    'Corrupted Goblin Brute': 'neutral',
    'Corrupted Goblin Shaman': 'storm',
    'Corrupted Goblin Slinger': 'neutral',
    'Corrupted Skeleton Warrior': 'neutral',
    'Corrupted Ghost Wisp': 'wind',
    'Corrupted Alpha Wolf': 'neutral',
    'Corrupted Rotting Zombie': 'neutral',
    'Corrupted Ice Elemental': 'water',
    'Corrupted Young Drake': 'fire',
    'Corrupted Frost Wolf': 'water',
    'Corrupted Cultist Acolyte': 'fire',
    'Corrupted Stone Golem': 'earth',
    'Corrupted Goblin King': 'neutral',
    'Corrupted Lich Apprentice': 'storm',
    'Corrupted Mountain Troll': 'neutral',
    'Ancient Green Slime': 'neutral',
    'Ancient Fire Slime': 'fire',
    'Ancient Earth Slime': 'earth',
    'Ancient Wild Boar': 'neutral',
    'Ancient Horned Rabbit': 'neutral',
    'Ancient Goblin Scout': 'neutral',
    'Ancient Goblin Grunt': 'neutral',
    'Ancient Small Bat': 'neutral',
    'Ancient Minor Spider': 'neutral',
    'Ancient Shell Crab': 'neutral',
    'Ancient Minor Water Spirit': 'water',
    'Ancient Shore Murloc': 'water',
    'Ancient Goblin Brute': 'neutral',
    'Ancient Goblin Shaman': 'storm',
    'Ancient Goblin Slinger': 'neutral',
    'Ancient Skeleton Warrior': 'neutral',
    'Ancient Ghost Wisp': 'wind',
    'Ancient Alpha Wolf': 'neutral',
    'Ancient Rotting Zombie': 'neutral',
    'Ancient Ice Elemental': 'water',
    'Ancient Young Drake': 'fire',
    'Ancient Frost Wolf': 'water',
    'Ancient Cultist Acolyte': 'fire',
    'Ancient Stone Golem': 'earth',
    'Ancient Goblin King': 'neutral',
    'Ancient Lich Apprentice': 'storm',
    'Ancient Mountain Troll': 'neutral',
    'Legendary Green Slime': 'neutral',
    'Legendary Fire Slime': 'fire',
    'Legendary Earth Slime': 'earth',
    'Legendary Wild Boar': 'neutral',
    'Legendary Horned Rabbit': 'neutral',
    'Legendary Goblin Scout': 'neutral',
    'Legendary Goblin Grunt': 'neutral',
    'Legendary Small Bat': 'neutral',
    'Legendary Minor Spider': 'neutral',
    'Legendary Shell Crab': 'neutral',
    'Legendary Minor Water Spirit': 'water',
    'Legendary Shore Murloc': 'water',
    'Legendary Goblin Brute': 'neutral',
    'Legendary Goblin Shaman': 'storm',
    'Legendary Goblin Slinger': 'neutral',
    'Legendary Skeleton Warrior': 'neutral',
    'Legendary Ghost Wisp': 'wind',
    'Legendary Alpha Wolf': 'neutral',
    'Legendary Rotting Zombie': 'neutral',
    'Legendary Ice Elemental': 'water',
    'Legendary Young Drake': 'fire',
    'Legendary Frost Wolf': 'water',
    'Legendary Cultist Acolyte': 'fire',
    'Legendary Stone Golem': 'earth',
    'Legendary Goblin King': 'neutral',
    'Legendary Lich Apprentice': 'storm',
    'Legendary Mountain Troll': 'neutral',
  };
  const element = templates[enemyName] || 'neutral';
  const colors = enemyTagColors[element] || enemyTagColors.neutral;
  return {
    background: colors.bg,
    borderColor: colors.border,
    color: colors.text
  };
}

const uniqueEnemies = computed(() => {
  const tags = new Set()
  if (!props.expedition.stages) return []
  props.expedition.stages.forEach(s => {
    if (s.enemies) {
      s.enemies.forEach(e => {
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

const assignedHeroes = computed(() => {
  if (!isActiveNode.value) return []
  return (gameState.value.heroes || []).filter(h => activeExp.value.heroIds?.includes?.(h.id))
})

const busyHeroIds = computed(() => {
  const ids = new Set()
  activeExpeditions.value.forEach(ae => {
    if (ae.id !== props.expedition.id && Array.isArray(ae.heroIds)) {
      ae.heroIds.forEach(id => ids.add(id))
    }
  })
  return ids
})

const availableHeroes = computed(() => {
  const idleHeroes = (gameState.value.heroes || []).filter(h => h.activity === 'idle')
  const all = [...assignedHeroes.value, ...idleHeroes].filter(h => !busyHeroIds.value.has(h.id))
  // De-duplicate
  const seen = new Set()
  return all.filter(h => {
    if (seen.has(h.id)) return false
    seen.add(h.id)
    return true
  })
})

// Auto-check assigned heroes
watch(() => availableHeroes.value, (heroes) => {
  if (isActiveNode.value && selectedIds.value.size === 0) {
    heroes.forEach(h => {
      if (activeExp.value.heroIds?.includes?.(h.id)) {
        selectedIds.value.add(h.id)
      }
    })
  }
}, { immediate: true })

function hpColor(h) {
  if (h.hp <= 0) return '#ff3b30'
  if (h.hp < h.maxHp * 0.5) return '#ff9500'
  return '#4cd964'
}

function hpText(h) {
  if (h.hp <= 0) return '💀 ' + t('explore_uxelm_wounded')
  return `HP: ${h.hp}/${h.maxHp}`
}

function isSelected(heroId) {
  return selectedIds.value.has(heroId)
}

function toggleHero(heroId) {
  const newSet = new Set(selectedIds.value)
  if (newSet.has(heroId)) {
    newSet.delete(heroId)
  } else {
    newSet.add(heroId)
  }
  selectedIds.value = newSet
}

const canStart = computed(() => {
  if (isLocked.value) return false
  if (!isActiveNode.value && isAtMax.value) return false
  return selectedIds.value.size > 0
})

function handleStart() {
  if (selectedIds.value.size === 0 && !isActiveNode.value) {
    alert(t('explore_uxelm_select_one_hero'))
    return
  }
  emit('start', { expId: props.expedition.id, heroIds: Array.from(selectedIds.value) })
}
</script>

<style scoped>
.expedition-detail-inline {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.active-dashboard {
  margin-bottom: var(--spacing-sm);
}

.active-expedition-dashboard {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid var(--border-color);
  background: rgba(0,0,0,0.2);
  border-radius: var(--radius-md);
}
.active-expedition-dashboard h3 {
  margin-top: 0;
  color: var(--accent-color);
  font-size: 1rem;
}
.description {
  color: var(--text-secondary);
  font-size: 0.9rem;
}
.exp-progress h4 {
  margin: 0 0 8px;
  font-size: 0.9rem;
}
.progress-bar-container {
  background: rgba(255,255,255,0.1);
  height: 10px;
  border-radius: 5px;
  margin: 10px 0;
  overflow: hidden;
}
.progress-bar {
  background: var(--accent-color);
  height: 100%;
  border-radius: 5px;
  transition: width 0.3s ease;
}
.btn-retire {
  width: 100%;
  margin-top: 10px;
}

.alert-warning {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  color: #ffc107;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
}

.expedition-profile {
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding-bottom: var(--spacing-md);
}
.profile-header {
  margin-bottom: var(--spacing-sm);
}
.profile-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.profile-badge {
  display: inline-block;
  padding: 2px 10px;
  background: rgba(74, 222, 128, 0.15);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 12px;
  font-size: 0.75rem;
  color: var(--color-primary-light);
  width: fit-content;
}
.profile-title-group h2 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-primary);
}
.exp-stats p {
  margin: 4px 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.combat-intel {
  margin-top: 12px;
}
.intel-label {
  display: block;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.enemy-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.enemy-tag {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  border: 1px solid rgba(255, 59, 48, 0.3);
  transition: all 0.2s ease;
}

.hero-selector {
  margin-top: var(--spacing-sm);
}
.hero-selector h3 {
  margin: 0 0 var(--spacing-sm);
  font-size: 0.9rem;
  color: var(--text-primary);
}

.hero-checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 10px 0;
}
.hero-checkbox-item {
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 10px 14px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.hero-checkbox-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(74, 222, 128, 0.3);
}
.hero-checkbox-item.selected {
  border-color: var(--accent-color);
  background: rgba(245, 158, 11, 0.08);
}
.hero-checkbox-item.wounded {
  cursor: not-allowed;
}
.hero-checkbox-item input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255,255,255,0.5);
  border-radius: 5px;
  background: rgba(255,255,255,0.08);
  outline: none;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  margin: 0;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
  flex-shrink: 0;
}
.hero-checkbox-item input[type="checkbox"]:hover {
  border-color: rgba(255,255,255,0.7);
  background: rgba(255,255,255,0.12);
}
.hero-checkbox-item input[type="checkbox"]:checked {
  background: var(--accent-color);
  border-color: var(--accent-color);
  box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
}
.hero-checkbox-item input[type="checkbox"]:checked::after {
  content: "✓";
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  display: block;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
.hero-checkbox-item input[type="checkbox"]:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.hero-info {
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.4;
}
.hero-info strong {
  font-weight: 600;
}

.btn-start-exp {
  width: 100%;
  margin-top: 15px;
}
</style>
