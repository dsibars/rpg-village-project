<template>
  <div
    v-if="visible"
    class="tutorial-message"
    :style="positionStyle"
    @click="handleClick"
  >
    <div class="tutorial-message-bubble">
      <p class="tutorial-message-text">{{ currentText }}</p>
      <div class="tutorial-message-indicator">
        <span
          v-for="(msg, idx) in messages"
          :key="idx"
          class="tutorial-message-dot"
          :class="{ active: idx === currentIndex }"
        />
      </div>
      <span class="tutorial-message-hint">{{ hintText }}</span>
    </div>
    <div class="tutorial-message-arrow" />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** Array of i18n message keys */
  messages: {
    type: Array,
    default: () => []
  },
  /** Current message index */
  currentIndex: {
    type: Number,
    default: 0
  },
  /** Position object { x, y } in pixels */
  position: {
    type: Object,
    default: () => ({ x: 20, y: 20 })
  },
  /** Whether the component is visible */
  visible: {
    type: Boolean,
    default: false
  },
  /** Resolved text for the current message (already translated) */
  currentText: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['advance'])

const positionStyle = computed(() => {
  const { x = 20, y = 20 } = props.position || {}
  return {
    position: 'fixed',
    left: `${x}px`,
    top: `${y}px`,
    zIndex: 9999
  }
})

const hintText = computed(() => {
  if (props.messages.length <= 1) return ''
  if (props.currentIndex < props.messages.length - 1) {
    return 'Click to continue'
  }
  return 'Click to dismiss'
})

function handleClick() {
  emit('advance')
}
</script>

<style scoped>
.tutorial-message {
  pointer-events: auto;
  max-width: 320px;
}

.tutorial-message-bubble {
  background: var(--color-bg-elevated, #1e1e2e);
  border: 2px solid var(--color-accent, #f5c542);
  border-radius: var(--radius-md, 8px);
  padding: 16px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  position: relative;
}

.tutorial-message-text {
  margin: 0 0 12px 0;
  font-size: 15px;
  line-height: 1.5;
  color: var(--color-text-primary, #ececec);
}

.tutorial-message-indicator {
  display: flex;
  gap: 6px;
  justify-content: center;
  margin-bottom: 8px;
}

.tutorial-message-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-muted, #666);
  transition: background 0.2s ease;
}

.tutorial-message-dot.active {
  background: var(--color-accent, #f5c542);
}

.tutorial-message-hint {
  display: block;
  text-align: center;
  font-size: 11px;
  color: var(--color-text-muted, #888);
  font-style: italic;
}

.tutorial-message-arrow {
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid var(--color-accent, #f5c542);
  margin: 0 auto;
}

@media (max-width: 480px) {
  .tutorial-message {
    max-width: 280px;
  }

  .tutorial-message-bubble {
    padding: 12px 16px;
  }

  .tutorial-message-text {
    font-size: 14px;
  }
}
</style>
