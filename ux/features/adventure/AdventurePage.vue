<template>
  <div class="adventure-page">
    <div v-if="pageError" class="page-error-banner" role="alert">
      <p>{{ pageError }}</p>
      <Button size="sm" variant="secondary" @click="pageError = null">
        {{ t('shared_uxelm_dismiss') }}
      </Button>
    </div>

    <TabNav
      v-model="currentTab"
      :tabs="[
        { id: 'explore', label: t('shared_uxelm_nav_explore'), icon: '🗺' },
        { id: 'bestiary', label: t('shared_uxelm_nav_bestiary'), icon: '👾' },
        { id: 'codex', label: t('shared_uxelm_nav_codex'), icon: '📖' },
        { id: 'chronicle', label: t('nav_chronicle'), icon: '📜' }
      ]"
    />
    <component
      :is="tabs[currentTab]"
      @navigate="$emit('navigate', $event)"
      @tutorial:event="$emit('tutorial:event', $event)"
    />
  </div>
</template>

<script setup>
import { ref, watch, onErrorCaptured } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import TabNav from '@/components/TabNav.vue'
import ExploreTab from './components/ExploreTab.vue'
import BestiaryTab from './components/BestiaryTab.vue'
import CodexTab from './components/CodexTab.vue'
import ChronicleTab from './components/ChronicleTab.vue'
import Button from '@/components/Button.vue'

const props = defineProps({
  activeTab: { type: String, default: null }
})

defineEmits(['navigate', 'tutorial:event'])

const { t } = useI18n()

const currentTab = ref(props.activeTab || 'explore')
const pageError = ref(null)

onErrorCaptured((err, instance, info) => {
  console.error('AdventurePage error:', err, info)
  pageError.value = err?.message || 'An error occurred in the Adventure page.'
  return false
})

watch(() => props.activeTab, (newTab) => {
  if (newTab) {
    currentTab.value = newTab
  }
})

const tabs = {
  explore: ExploreTab,
  bestiary: BestiaryTab,
  codex: CodexTab,
  chronicle: ChronicleTab
}
</script>

<style scoped>
.adventure-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.page-error-banner {
  padding: var(--spacing-md);
  margin: var(--spacing-md) var(--spacing-md) 0;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-sm);
  flex-shrink: 0;
}

.page-error-banner p {
  margin: 0;
}

.adventure-page > :deep(.tab-nav) {
  flex-shrink: 0;
}

.adventure-page > :deep(.tab-nav) + * {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
