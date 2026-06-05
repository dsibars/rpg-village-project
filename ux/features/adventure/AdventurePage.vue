<template>
  <div class="adventure-page">
    <TabNav
      v-model="currentTab"
      :tabs="[
        { id: 'explore', label: t('shared_uxelm_nav_explore'), icon: '\u{1F5FA}' },
        { id: 'bestiary', label: t('shared_uxelm_nav_bestiary'), icon: '\u{1F47E}' },
        { id: 'codex', label: t('shared_uxelm_nav_codex'), icon: '\u{1F4D6}' },
        { id: 'chronicle', label: t('nav_chronicle'), icon: '\u{1F4DC}' }
      ]"
    />
    <component :is="tabs[currentTab]" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import TabNav from '@/components/TabNav.vue'
import ExploreTab from './components/ExploreTab.vue'
import BestiaryTab from './components/BestiaryTab.vue'
import CodexTab from './components/CodexTab.vue'
import ChronicleTab from './components/ChronicleTab.vue'

const { t } = useI18n()

const currentTab = ref('explore')

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
