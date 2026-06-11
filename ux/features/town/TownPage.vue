<template>
  <div class="town-page">
    <TabNav
      v-model="currentTab"
      :tabs="[
        { id: 'buildings', label: t('shared_uxelm_nav_buildings'), icon: '🏘' },
        { id: 'shop', label: t('shared_uxelm_nav_shop'), icon: '🏪' },
        { id: 'forge', label: t('shared_uxelm_nav_forge'), icon: '⚒' },
        { id: 'inventory', label: t('shared_uxelm_nav_inventory'), icon: '🎒' },
        { id: 'settings', label: t('shared_uxelm_nav_settings'), icon: '⚙️' }
      ]"
    />
    <component :is="tabs[currentTab]" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import TabNav from '@/components/TabNav.vue'
import BuildingsTab from './components/BuildingsTab.vue'
import ShopTab from './components/ShopTab.vue'
import ForgeTab from './components/ForgeTab.vue'
import InventoryTab from './components/InventoryTab.vue'
import SettingsPage from '../settings/SettingsPage.vue'

const props = defineProps({
  activeTab: { type: String, default: null }
})

const { t } = useI18n()

const currentTab = ref(props.activeTab || 'buildings')

watch(() => props.activeTab, (newTab) => {
  if (newTab) {
    currentTab.value = newTab
  }
})

const tabs = {
  buildings: BuildingsTab,
  shop: ShopTab,
  forge: ForgeTab,
  inventory: InventoryTab,
  settings: SettingsPage
}
</script>

<style scoped>
.town-page {
  height: 100%;
  overflow: hidden;
}
</style>
