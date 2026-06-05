<template>
  <div class="town-page">
    <TabNav
      v-model="currentTab"
      :tabs="[
        { id: 'buildings', label: t('shared_uxelm_nav_buildings'), icon: '\u{1F3D8}' },
        { id: 'shop', label: t('shared_uxelm_nav_shop'), icon: '\u{1F3EA}' },
        { id: 'forge', label: t('shared_uxelm_nav_forge'), icon: '\u{2692}' },
        { id: 'inventory', label: t('shared_uxelm_nav_inventory'), icon: '\u{1F392}' }
      ]"
    />
    <component :is="tabs[currentTab]" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import TabNav from '@/components/TabNav.vue'
import BuildingsTab from './components/BuildingsTab.vue'
import ShopTab from './components/ShopTab.vue'
import ForgeTab from './components/ForgeTab.vue'
import InventoryTab from './components/InventoryTab.vue'

const { t } = useI18n()

const currentTab = ref('buildings')

const tabs = {
  buildings: BuildingsTab,
  shop: ShopTab,
  forge: ForgeTab,
  inventory: InventoryTab
}
</script>

<style scoped>
.town-page {
  height: 100%;
  overflow-y: auto;
}
</style>
