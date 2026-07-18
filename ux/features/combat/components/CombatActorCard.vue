<template>
  <div
    class="actor-card"
    :class="[
      isHero ? 'hero-card' : 'enemy-card',
      animationClass,
      {
        'current-turn': isCurrentTurn,
        targetable: isTargetable,
        'is-ko': isKo
      }
    ]"
  >
    <div class="card-name" :title="actor.name">{{ actor.name }}</div>

    <div class="portrait-frame">
      <img
        v-if="portraitSrc"
        class="portrait-img"
        :class="{ flip: !isHero }"
        :src="portraitSrc"
        :alt="actor.name"
      />
      <span v-else class="portrait-emoji" :class="{ flip: !isHero }">{{ typeEmoji }}</span>
      <span v-if="isKo" class="ko-marker">💀</span>
      <span v-if="isCurrentTurn" class="turn-marker">▶</span>
    </div>

    <div class="card-bars">
      <div class="bar hp-bar" :class="hpBarClass">
        <div class="bar-fill" :style="{ width: hpPercent + '%' }" />
        <span class="bar-text">{{ actor.hp }}/{{ actor.maxHp }}</span>
      </div>
      <template v-if="isHero">
        <div class="bar sta-bar">
          <div class="bar-fill" :style="{ width: staPercent + '%' }" />
          <span class="bar-text small">{{ actor.stamina }}/{{ actor.maxStamina }}</span>
        </div>
        <div v-if="actor.maxMp > 0" class="bar mp-bar">
          <div class="bar-fill" :style="{ width: mpPercent + '%' }" />
          <span class="bar-text small">{{ actor.mp }}/{{ actor.maxMp }}</span>
        </div>
      </template>
    </div>

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

    <!-- Targeting overlay (shiny pulse on valid targets) -->
    <div
      v-if="isTargetable"
      class="target-overlay"
      @click="$emit('target', actorIndex)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  actor: { type: Object, required: true },
  isHero: { type: Boolean, default: false },
  isCurrentTurn: { type: Boolean, default: false },
  isTargetable: { type: Boolean, default: false },
  actorIndex: { type: Number, default: 0 },
  animationClass: { type: String, default: '' },
  activeEffects: { type: Array, default: () => [] }
})

defineEmits(['target'])

const TYPE_EMOJIS = {
  beast: '🐺',
  humanoid: '👺',
  elemental: '💧',
  undead: '💀',
  dragon: '🐉'
}

const portraitSrc = computed(() => {
  if (props.isHero && props.actor.avatar) {
    return `assets/heroes/${props.actor.avatar}`
  }
  return null
})

const typeEmoji = computed(() => TYPE_EMOJIS[props.actor.type] || '👾')

const isKo = computed(() => (props.actor.hp ?? 1) <= 0)

const hpPercent = computed(() => Math.max(0, Math.min(100, (props.actor.hp / props.actor.maxHp) * 100)))
const staPercent = computed(() => props.actor.maxStamina > 0 ? Math.max(0, Math.min(100, (props.actor.stamina / props.actor.maxStamina) * 100)) : 0)
const mpPercent = computed(() => props.actor.maxMp > 0 ? Math.max(0, Math.min(100, (props.actor.mp / props.actor.maxMp) * 100)) : 0)

const hpBarClass = computed(() => {
  const pct = hpPercent.value
  if (pct > 60) return 'combat-bar-hp-high'
  if (pct > 30) return 'combat-bar-hp-mid'
  return 'combat-bar-hp-low'
})

function statusIcon(type) {
  const icons = {
    poison: '☠️',
    burn: '🔥',
    stun: '💫',
    sleep: '💤',
    haste: '💨',
    regen: '💚',
    vulnerable: '💔',
    freeze: '🧊'
  }
  return icons[type] || '⚡'
}
</script>

<style scoped>
.actor-card {
  position: relative;
  width: 118px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 5px;
  background: rgba(13, 19, 14, 0.45);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  transition: transform 0.38s cubic-bezier(0.2, 0.8, 0.25, 1), box-shadow 0.25s ease, border-color 0.25s ease, opacity 0.25s ease;
}

.card-name {
  width: 100%;
  font-size: 0.72rem;
  font-weight: 600;
  text-align: center;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.portrait-frame {
  position: relative;
  width: 96px;
  height: 96px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: rgba(0, 0, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
}

.portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.portrait-img.flip,
.portrait-emoji.flip {
  transform: scaleX(-1);
}

.portrait-emoji {
  font-size: 2.6rem;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.ko-marker {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  background: rgba(0, 0, 0, 0.45);
}

.turn-marker {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 0.7rem;
  color: var(--color-primary-light, #86efac);
  text-shadow: 0 0 6px rgba(134, 239, 172, 0.9);
  animation: turnNudge 1s ease-in-out infinite;
}

@keyframes turnNudge {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(3px); }
}

.card-bars {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.bar {
  position: relative;
  height: 10px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 5px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 5px;
  transition: width 0.3s ease;
}

.hp-bar .bar-fill { background: var(--color-success, #22c55e); }
.combat-bar-hp-mid .bar-fill { background: #eab308; }
.combat-bar-hp-low .bar-fill { background: #ef4444; }
.sta-bar .bar-fill { background: #f59e0b; }
.mp-bar .bar-fill { background: #3b82f6; }

.bar-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.55rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  letter-spacing: 0.2px;
}

.status-badges {
  position: absolute;
  top: 2px;
  left: 4px;
  display: flex;
  gap: 2px;
}

.status-badge {
  font-size: 0.7rem;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8));
}

/* Current turn glow */
.actor-card.current-turn {
  border-color: var(--color-primary-light, #86efac);
  box-shadow: 0 0 15px var(--accent-glow);
}

/* KO'd actors fade but stay in their grid slot */
.actor-card.is-ko {
  opacity: 0.45;
  filter: grayscale(0.9);
}

/* Targeting pulse — the "shiny" effect on valid targets */
.actor-card.targetable {
  border-color: rgba(74, 222, 128, 0.8);
}

.target-overlay {
  position: absolute;
  inset: 0;
  /* Must sit above the bars so clicks reach the overlay */
  z-index: 3;
  border-radius: var(--radius-md);
  background: rgba(74, 222, 128, 0.15);
  border: 2px dashed var(--color-primary);
  cursor: crosshair;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.5);
  }
  50% {
    box-shadow: 0 0 14px 4px rgba(74, 222, 128, 0.35);
  }
}
</style>
