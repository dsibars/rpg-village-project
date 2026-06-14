<template>
  <div class="combat-resolution" :class="{ victory: isVictory, defeat: !isVictory }">
    <div class="result-header">
      <div class="result-icon">{{ isVictory ? '🏆' : '☠️' }}</div>
      <h2 :style="{ color: resultColor }" class="result-title">
        {{ resultText }}
      </h2>
      <div class="result-subtitle">
        {{ isVictory ? t('combat_uxelm_victory_sub') : t('combat_uxelm_defeat_sub') }}
      </div>
    </div>

    <div v-if="summary.length > 0" class="summary-box">
      <div class="summary-header">{{ t('combat_uxelm_battle_summary') }}</div>
      <div v-for="(s, idx) in summary" :key="idx" class="summary-row" :style="{ animationDelay: (idx * 80) + 'ms' }">
        <div class="summary-hero">
          <span class="summary-avatar">⚔</span>
          <span class="summary-name">{{ s.heroName }}</span>
        </div>
        <div class="summary-stats">
          <span v-if="s.hpLost > 0" class="hp-lost">-{{ s.hpLost }} {{ t('heroes_info_stat_hp') }}</span>
          <span v-else-if="s.hpLost < 0" class="hp-gained">+{{-s.hpLost}} {{ t('heroes_info_stat_hp') }}</span>
          <span v-else class="hp-unchanged">—</span>
          <span class="exp-gained">+{{ s.expEarned }} {{ t('shared_uxelm_exp_abbrev') }}</span>
          <span v-if="s.leveledUp" class="level-up">🆙 {{ t('shared_uxelm_level_up') }}</span>
        </div>
      </div>
    </div>

    <div v-if="rewards.length > 0" class="rewards-box">
      <h4 class="rewards-title">
        <span class="rewards-icon">🎁</span>
        {{ t('combat_uxelm_rewards') }}
      </h4>
      <div class="rewards-list">
        <span v-for="(reward, idx) in rewards" :key="idx" class="reward-chip" :style="{ animationDelay: (idx * 100) + 'ms' }">
          {{ reward }}
        </span>
      </div>
    </div>

    <div class="resolution-actions">
      <Button variant="primary" class="resolve-btn" @click="resolve">
        {{ t('shared_uxelm_close') }}
      </Button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import Button from '@/components/Button.vue'

const props = defineProps({
  battle: { type: Object, default: null },
  engine: { type: Object, default: null }
})

const emit = defineEmits(['close'])

const { t } = useI18n()

const preview = computed(() => props.engine?.getBattleResolutionPreview?.() || null)

const isVictory = computed(() => {
  if (preview.value) return preview.value.isVictory
  return props.battle?.winner === 'heroes'
})

const resultColor = computed(() => isVictory.value ? '#4ade80' : '#f87171')
const resultText = computed(() => isVictory.value ? t('shared_uxelm_victory') : t('shared_uxelm_defeat'))

const summary = computed(() => preview.value?.summary || [])

const rewards = computed(() => {
  const list = []
  const rw = preview.value?.rewards
  if (!rw || !preview.value?.isLastStage) return list
  if (rw.gold) list.push(`🪙 ${rw.gold} ${t('village_info_gold')}`)
  if (rw.items) {
    for (const [itemId, qty] of Object.entries(rw.items)) {
      list.push(`✨ ${qty}x ${t(itemId)}`)
    }
  }
  return list
})

function resolve() {
  props.engine?.resolveBattle?.()
  emit('close')
}
</script>

<style scoped>
.combat-resolution {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  text-align: center;
  width: 100%;
  animation: resolutionIn 0.5s cubic-bezier(0.25, 1, 0.5, 1) both;
}

@keyframes resolutionIn {
  0% { opacity: 0; transform: scale(0.92) translateY(20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

/* Victory glow */
.combat-resolution.victory {
  position: relative;
}
.combat-resolution.victory::before {
  content: '';
  position: absolute;
  inset: -40px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74, 222, 128, 0.08) 0%, transparent 70%);
  pointer-events: none;
  animation: victoryGlow 2s ease-in-out infinite;
}

@keyframes victoryGlow {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

/* Defeat vignette */
.combat-resolution.defeat::before {
  content: '';
  position: absolute;
  inset: -20px;
  border-radius: var(--radius-md);
  background: radial-gradient(ellipse at center, rgba(248, 113, 113, 0.06) 0%, transparent 70%);
  pointer-events: none;
}

.result-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.result-icon {
  font-size: 3rem;
  line-height: 1;
  animation: iconBounce 0.6s cubic-bezier(0.25, 1, 0.5, 1) both;
  animation-delay: 0.2s;
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.2));
}

@keyframes iconBounce {
  0% { transform: scale(0) rotate(-20deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); }
}

.result-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 2rem;
  font-weight: 800;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
  animation: titleSlideIn 0.5s ease-out both;
  animation-delay: 0.3s;
}

@keyframes titleSlideIn {
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}

.result-subtitle {
  font-size: 0.9rem;
  color: var(--text-muted);
  animation: fadeIn 0.5s ease-out both;
  animation-delay: 0.5s;
}

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

.summary-box {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  text-align: left;
  width: 100%;
  max-height: 240px;
  overflow-y: auto;
}

.summary-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--spacing-sm);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: var(--spacing-xs);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  animation: rowSlideIn 0.4s ease-out both;
  opacity: 0;
}

@keyframes rowSlideIn {
  0% { opacity: 0; transform: translateX(-12px); }
  100% { opacity: 1; transform: translateX(0); }
}

.summary-hero {
  display: flex;
  align-items: center;
  gap: 6px;
}

.summary-avatar {
  font-size: 1rem;
}

.summary-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.summary-stats {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  font-size: 0.85rem;
}

.hp-lost { color: #f87171; }
.hp-gained { color: #4ade80; }
.hp-unchanged { color: var(--text-muted); }
.exp-gained { color: #60a5fa; font-weight: 600; }
.level-up { color: #fbbf24; font-weight: 700; }

.rewards-box {
  margin-top: var(--spacing-sm);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: var(--spacing-sm);
  width: 100%;
  animation: fadeIn 0.5s ease-out both;
  animation-delay: 0.6s;
}

.rewards-title {
  color: #fbbf24;
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
}

.rewards-icon {
  font-size: 1.1rem;
  animation: rewardsPulse 1.5s ease-in-out infinite;
}

@keyframes rewardsPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.rewards-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  justify-content: center;
  font-size: 0.95rem;
}

.reward-chip {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  animation: chipPop 0.4s cubic-bezier(0.25, 1, 0.5, 1) both;
  opacity: 0;
}

@keyframes chipPop {
  0% { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1); }
}

.resolution-actions {
  margin-top: var(--spacing-sm);
  animation: fadeIn 0.4s ease-out both;
  animation-delay: 0.8s;
}

.resolve-btn {
  min-width: 160px;
}
</style>
