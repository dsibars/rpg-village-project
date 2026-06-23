<template>
  <div
    v-if="visible"
    class="tutorial-spotlight"
    :class="{ flash: config.flash }"
    :style="spotlightStyle"
    aria-hidden="true"
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** Spotlight configuration from TutorialService.getState().what */
  config: {
    type: Object,
    default: () => ({})
  },
  /** Whether the spotlight is currently visible */
  visible: {
    type: Boolean,
    default: false
  }
})

/**
 * Compute the CSS style for the spotlight hole.
 * Uses a massive box-shadow to darken everything except the hole.
 */
const spotlightStyle = computed(() => {
  const { target, padding = 8, rounded = true, flash = false } = props.config || {}

  // If we have pre-computed bounds (x, y, width, height), use them directly.
  // Otherwise, the parent component (TutorialOverlay) will compute bounds
  // from the DOM element matching data-tutorial-target.
  if (props.config?.x !== undefined) {
    const { x, y, width, height } = props.config
    return {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
      borderRadius: rounded ? 'var(--radius-md, 8px)' : '0',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
      pointerEvents: 'none',
      zIndex: 9998,
      animation: flash ? 'tutorial-flash 2s infinite alternate' : 'none'
    }
  }

  // Fallback: if only target ID is provided, the parent handles measurement.
  // Return a style that will be updated by the parent via config bounds.
  return {
    position: 'fixed',
    left: '0px',
    top: '0px',
    width: '0px',
    height: '0px',
    borderRadius: rounded ? 'var(--radius-md, 8px)' : '0',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
    pointerEvents: 'none',
    zIndex: 9998,
    animation: flash ? 'tutorial-flash 2s infinite alternate' : 'none'
  }
})
</script>

<style scoped>
.tutorial-spotlight {
  /* The box-shadow creates the darkening effect around the hole */
  transition: all 0.3s ease-out;
}

@keyframes tutorial-flash {
  0% {
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
  }
  100% {
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85);
  }
}
</style>
