<template>
  <div class="adventure-page">
    <TabNav
      v-model="currentTab"
      :tabs="[
        { id: 'explore', label: t('shared_uxelm_nav_explore'), icon: '🗺' },
        { id: 'bestiary', label: t('shared_uxelm_nav_bestiary'), icon: '👾' },
        { id: 'codex', label: t('shared_uxelm_nav_codex'), icon: '📖' },
        { id: 'chronicle', label: t('nav_chronicle'), icon: '📜' }
      ]"
    />
    <component :is="tabs[currentTab]" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import TabNav from '@/components/TabNav.vue'
import ExploreTab from './components/ExploreTab.vue'
import BestiaryTab from './components/BestiaryTab.vue'
import CodexTab from './components/CodexTab.vue'
import ChronicleTab from './components/ChronicleTab.vue'

const props = defineProps({
  activeTab: { type: String, default: null }
})

const { t } = useI18n()

const currentTab = ref(props.activeTab || 'explore')

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
  height: 100%;
  overflow-y: auto;
}
</style>
