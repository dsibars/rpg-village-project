<template>
  <div
    class="combat-card"
    :class="[
      isHero ? 'hero-card' : 'enemy-card',
      animationClass,
      { active: isCurrentTurn, dead: isDead, targetable: isTargetable }
    ]"
  >
    <!-- Floating Combat Text Overlay -->
    <div class="floating-effects-container">
      <transition-group name="float-up">
        <div
          v-for="eff in activeEffects"
          :key="eff.id"
          class="floating-effect"
          :class="eff.type"
        >
          {{ eff.text }}
        </div>
      </transition-group>
    </div>

    <div class="card-avatar">
      {{ isDead ? '💀' : (isHero ? '⚔' : '👾') }}
    </div>

    <div class="card-info">
      <div class="card-header">
        <span class="card-name">{{ displayName }}</span>
        <span class="card-level">Lv.{{ actor.level || 1 }}</span>
      </div>

      <!-- HP Bar with Delayed Catch-up Bar -->
      <div class="bar-container">
        <div class="hp-delayed-bar" :style="{ width: `${delayedHpPct}%` }" />
        <div class="bar hp-bar" :class="hpBarClass" :style="{ width: `${hpPct}%` }" />
      </div>
      <div class="bar-text">
        <span>{{ t('heroes_info_stat_hp') }}</span>
        <span>{{ actor.hp }}/{{ actor.maxHp }}</span>
      </div>

      <!-- Stamina Bar (heroes only) -->
      <template v-if="isHero && actor.maxStamina > 0">
        <div class="bar-container thin">
          <div class="bar stamina-bar" :style="{ width: `${staminaPct}%` }" />
        </div>
        <div class="bar-text small">
          <span>{{ t('shared_uxelm_stamina') }}</span>
          <span>{{ actor.stamina }}/{{ actor.maxStamina }}</span>
        </div>
      </template>

      <!-- MP Bar (heroes only) -->
      <template v-if="isHero && actor.maxMp > 0">
        <div class="bar-container thin">
          <div class="bar mp-bar" :style="{ width: `${mpPct}%` }" />
        </div>
        <div class="bar-text small">
          <span>{{ t('heroes_info_stat_mp') }}</span>
          <span>{{ actor.mp }}/{{ actor.maxMp }}</span>
        </div>
      </template>

      <!-- Status Effects -->
      <div v-if="actor.statusEffects?.length > 0" class="status-badges">
        <span
          v-for="(st, idx) in actor.statusEffects"
          :key="idx"
          class="status-badge"
          :title="`${st.type} (${st.duration} turns)`"
        >
          {{ statusIcon(st.type) }}
        </span>
      </div>
    </div>

    <!-- Targeting overlay -->
    <div
      v-if="isTargetable"
      class="target-overlay"
      @click="$emit('target', actorIndex)"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'

const props = defineProps({
  actor: { type: Object, required: true },
  isHero: { type: Boolean, default: false },
  isCurrentTurn: { type: Boolean, default: false },
  isTargetable: { type: Boolean, default: false },
  actorIndex: { type: Number, default: 0 },
  animationClass: { type: String, default: '' },
  activeEffects: { type: Array, default: () => [] }
})

const emit = defineEmits(['target'])

const { t } = useI18n()

const isDead = computed(() => props.actor.hp <= 0)
const delayTimeout = ref(null)

const displayName = computed(() => {
  if (props.isHero) return props.actor.name

  const actor = props.actor
  if (!actor.templateId) return actor.name

  const translationKey = 'combat_info_' + actor.templateId
  const baseName = t(translationKey)
  if (baseName === translationKey) return actor.name

  if (actor.isElite) {
    const prefixKey = 'combat_info_elite_tier_' + actor.eliteTier
    const prefix = t(prefixKey)
    if (prefix !== prefixKey) {
      return t('combat_info_elite_format', { prefix, name: baseName })
    }
    const defaultPrefixes = ['Fierce', 'Corrupted', 'Ancient', 'Legendary']
    return `${defaultPrefixes[actor.eliteTier] || 'Fierce'} ${baseName}`
  }
  return baseName
})

const hpPct = computed(() => {
  const max = props.actor.maxHp || 1
  return Math.max(0, Math.min(100, (props.actor.hp / max) * 100))
})

const delayedHpPct = ref(hpPct.value)

watch(hpPct, (newVal, oldVal) => {
  if (newVal < oldVal) {
    // HP decreased: delay drainage
    setTimeout(() => {
      delayedHpPct.value = newVal
    }, 450)
  } else {
    // Healed or reset: immediate
    delayedHpPct.value = newVal
  }
}, { immediate: true })

const hpBarClass = computed(() => {
  const pct = hpPct.value
  if (pct >= 70) return 'combat-bar-hp-high'
  if (pct >= 30) return 'combat-bar-hp-mid'
  return 'combat-bar-hp-low'
})

const staminaPct = computed(() => {
  const max = props.actor.maxStamina || 1
  return Math.max(0, Math.min(100, (props.actor.stamina / max) * 100))
})

const mpPct = computed(() => {
  const max = props.actor.maxMp || 1
  return Math.max(0, Math.min(100, (props.actor.mp / max) * 100))
})

function statusIcon(type) {
  const map = {
    poison: '🤢',
    burn: '🔥',
    regen: '💚',
    haste: '⭐',
    sleep: '💤',
    stun: '💫'
  }
  return map[type] || type
}
</script>

<style scoped>
.combat-card {
  position: relative;
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  margin: 8px 18px; /* Visual buffer to prevent clipping during scale/shake */
}

/* Card Active Turn & Breathing Effect */
@keyframes activeBreathing {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-4px) scale(1.02); }
}
.combat-card.active {
  border-color: var(--accent-color) !important;
  box-shadow: 0 0 15px var(--accent-glow) !important;
  animation: activeBreathing 2.5s ease-in-out infinite;
  z-index: 5;
}

/* Defeated grayscale state */
.combat-card.dead {
  opacity: 0.4 !important;
  filter: grayscale(1) !important;
  transform: scale(0.95);
  border-color: rgba(255, 255, 255, 0.02) !important;
  box-shadow: none !important;
}

.combat-card.dead .card-name,
.combat-card.dead .card-level,
.combat-card.dead .bar-text {
  color: rgba(255, 255, 255, 0.55);
}

/* Card Impact Shake Animation */
@keyframes cardShake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
.animate-shake {
  animation: cardShake 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  border-color: var(--danger) !important;
  box-shadow: 0 0 15px rgba(244, 67, 54, 0.4) !important;
}

/* Card Attack Lunge Animations */
@keyframes heroLunge {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(18px) scale(1.02); }
}
.hero-card.animate-lunge {
  animation: heroLunge 0.35s cubic-bezier(0.25, 1, 0.5, 1) both;
}

@keyframes enemyLunge {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-18px) scale(1.02); }
}
.enemy-card.animate-lunge {
  animation: enemyLunge 0.35s cubic-bezier(0.25, 1, 0.5, 1) both;
}

/* Card Status Damage Tick Flash (Poison / Burn) */
@keyframes statusFlash {
  0%, 100% { background: var(--bg-card); }
  50% { background: rgba(156, 39, 176, 0.25); }
}
.animate-status-flash {
  animation: statusFlash 0.5s ease-out;
}

/* Floating Combat Text Container */
.floating-effects-container {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

/* Floating Combat Text Item */
@keyframes floatUpAndFade {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.6);
  }
  15% {
    opacity: 1;
    transform: translateY(0) scale(1.2);
  }
  35% {
    transform: translateY(-8px) scale(1.05);
  }
  100% {
    opacity: 0;
    transform: translateY(-45px) scale(0.85);
  }
}
.floating-effect {
  font-family: 'Outfit', sans-serif;
  font-weight: 900;
  font-size: 1.35rem;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9), 0 0 4px rgba(0, 0, 0, 0.5);
  animation: floatUpAndFade 1.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  white-space: nowrap;
}

.floating-effect.damage { color: #ff5252; }
.floating-effect.crit { 
  color: #ff9100; 
  font-size: 1.6rem;
  animation-duration: 1.4s;
  text-shadow: 0 0 10px rgba(255, 145, 0, 0.4), 0 2px 6px rgba(0,0,0,0.9);
}
.floating-effect.heal { color: #00e676; }
.floating-effect.miss { color: #ffd600; font-size: 1.15rem; }
.floating-effect.status { color: #d500f9; }
.floating-effect.buff { color: #00b0ff; }
.floating-effect.system { color: #ffff00; }

/* HP Bar Color States */
.combat-bar-hp-high {
  background: #10b981 !important;
}
.combat-bar-hp-mid {
  background: #fbbf24 !important;
}
.combat-bar-hp-low {
  background: #ef4444 !important;
}

.card-avatar {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.card-level {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-left: var(--spacing-xs);
  margin-right: var(--spacing-xs);
}

.bar-container {
  position: relative;
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  overflow: hidden;
}

.bar-container.thin {
  height: 4px;
}

.bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.hp-bar {
  z-index: 2;
  transition: width 0.2s ease-out;
}

.hp-delayed-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 4px;
  background: rgba(239, 68, 68, 0.45);
  z-index: 1;
  transition: width 0.8s cubic-bezier(0.25, 1, 0.5, 1);
}

.stamina-bar {
  background: #f59e0b;
  z-index: 2;
}

.mp-bar {
  background: #3b82f6;
  z-index: 2;
}

.bar-text {
  display: flex;
  justify-content: space-between;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.bar-text.small {
  font-size: 0.65rem;
}

.status-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 2px;
}

.status-badge {
  font-size: 0.8rem;
  padding: 1px 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-sm);
}

.target-overlay {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-md);
  background: rgba(74, 222, 128, 0.15);
  border: 2px dashed var(--color-primary);
  cursor: crosshair;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
</style>
