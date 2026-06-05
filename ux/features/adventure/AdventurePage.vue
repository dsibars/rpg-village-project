<template>
  <div class="adventure-page">
    <h1>{{ t('shared_uxelm_nav_adventure') }}</h1>

    <TabNav
      v-model="currentTab"
      :tabs="[
        { id: 'explore', label: t('shared_uxelm_nav_explore'), icon: '\u{1F5FA}' },
        { id: 'bestiary', label: t('shared_uxelm_nav_bestiary'), icon: '\u{1F431}' },
        { id: 'codex', label: t('codex_uxelm_title'), icon: '\u{1F4D6}' },
        { id: 'chronicle', label: t('chronicle_title'), icon: '\u{1F4DC}' }
      ]"
    />

    <div class="tab-content">
      <EmptyState
        :icon="currentTabIcon"
        :title="currentTabTitle"
        :message="currentTabMessage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onErrorCaptured } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import TabNav from '@/components/TabNav.vue'
import EmptyState from '@/components/EmptyState.vue'

const { t } = useI18n()

const currentTab = ref('explore')

const tabConfig = {
  explore: {
    icon: '\u{1F5FA}',
    title: () => t('shared_uxelm_nav_explore'),
    message: () => 'Expedition map and region selection will appear here.'
  },
  bestiary: {
    icon: '\u{1F431}',
    title: () => t('shared_uxelm_nav_bestiary'),
    message: () => t('bestiary_uxelm_empty')
  },
  codex: {
    icon: '\u{1F4D6}',
    title: () => t('codex_uxelm_title'),
    message: () => t('codex_uxelm_intro')
  },
  chronicle: {
    icon: '\u{1F4DC}',
    title: () => t('chronicle_title'),
    message: () => 'A log of village events and milestones will appear here.'
  }
}

const currentTabIcon = computed(() => tabConfig[currentTab.value].icon)
const currentTabTitle = computed(() => tabConfig[currentTab.value].title())
const currentTabMessage = computed(() => tabConfig[currentTab.value].message())

onErrorCaptured((err, instance, info) => {
  console.error('AdventurePage error:', err, info)
  return false
})
</script>

<style scoped>
.adventure-page {
  padding: var(--spacing-lg);
  color: var(--text-primary);
}

.adventure-page h1 {
  font-family: var(--font-heading);
  color: var(--color-primary);
  margin-top: 0;
}

.tab-content {
  margin-top: var(--spacing-md);
}
</style>
