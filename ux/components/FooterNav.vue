<template>
  <nav class="footer-nav" aria-label="Main navigation">
    <button
      v-for="item in items"
      :key="item.id"
      class="nav-item"
      :class="{ active: current === item.id, 'nav-locked': item.locked }"
      :disabled="item.locked"
      :aria-current="current === item.id ? 'page' : undefined"
      :aria-disabled="item.locked ? 'true' : undefined"
      @click="!item.locked && $emit('navigate', item.id)"
    >
      <span class="nav-icon" aria-hidden="true">{{ item.icon }}</span>
      <span class="nav-label">{{ item.label }}</span>
    </button>
  </nav>
</template>

<script setup>
const props = defineProps({
  current: { type: String, required: true },
  items: {
    type: Array,
    default: () => [
      { id: 'village', label: 'Main', icon: '🏡' },
      { id: 'heroes', label: 'Heroes', icon: '⚔' },
      { id: 'adventure', label: 'Adventure', icon: '🗺' },
      { id: 'town', label: 'Town', icon: '🏘' }
    ]
  }
})

defineEmits(['navigate'])
</script>

<style scoped>
.footer-nav {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 76px;
  padding: 0 var(--spacing-md);
  margin: 10px 20px 20px 20px;
  background: rgba(20, 31, 22, 0.85);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
  max-width: 1200px;
  width: calc(100% - 40px);
  align-self: center;
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  position: relative;
  padding: 8px 0;
  background: none;
  border: none;
  border-radius: 12px;
  color: var(--text-muted);
  font-family: var(--font-body);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item::before {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 6px;
  height: 6px;
  background: var(--accent-color);
  border-radius: 50%;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 8px var(--accent-color);
}

.nav-item.active::before {
  transform: translateX(-50%) scaleX(1);
}

.nav-icon {
  font-size: 1.45rem;
  transition: transform 0.3s ease;
}

.nav-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 500;
}

.nav-item:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.03);
}

.nav-item:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.nav-item.active {
  color: var(--accent-color);
  text-shadow: 0 0 15px rgba(245, 158, 11, 0.35);
}

.nav-item.active:focus-visible {
  outline-color: var(--accent-color);
}

.nav-item.active .nav-icon {
  transform: translateY(-3px) scale(1.15);
}

.nav-item.nav-locked {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-item.nav-locked:hover {
  color: var(--text-muted);
  background: none;
}

@media (max-width: 768px) {
  .footer-nav {
    margin: 8px 16px 16px 16px;
    width: calc(100% - 32px);
    height: 68px;
    padding: 0 var(--spacing-sm);
    border-radius: 14px;
  }

  .nav-icon {
    font-size: 1.3rem;
  }

  .nav-label {
    font-size: 0.65rem;
    letter-spacing: 0.5px;
  }
}

@media (max-width: 480px) {
  .footer-nav {
    margin: 8px 12px 12px 12px;
    width: calc(100% - 24px);
    height: 64px;
    padding: 0 var(--spacing-sm);
  }

  .nav-icon {
    font-size: 1.25rem;
  }

  .nav-label {
    font-size: 0.6rem;
  }
}
</style>
