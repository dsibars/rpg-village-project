<template>
  <div class="town-page">
    <div v-if="pageError" class="page-error-banner" role="alert">
      <p>{{ pageError }}</p>
      <Button size="sm" variant="secondary" @click="pageError = null">
        {{ t('shared_uxelm_dismiss') }}
      </Button>
    </div>

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
    <component
      :is="tabs[currentTab]"
      :initial-building-id="currentTab === 'buildings' ? activeBuildingId : null"
    />
  </div>
</template>

<script setup>
import { ref, watch, onErrorCaptured } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import TabNav from '@/components/TabNav.vue'
import BuildingsTab from './components/BuildingsTab.vue'
import ShopTab from './components/ShopTab.vue'
import ForgeTab from './components/ForgeTab.vue'
import InventoryTab from './components/InventoryTab.vue'
import SettingsPage from '../settings/SettingsPage.vue'
import Button from '@/components/Button.vue'

const props = defineProps({
  activeTab: { type: String, default: null },
  activeBuildingId: { type: String, default: null }
})

const { t } = useI18n()

const currentTab = ref(props.activeTab || 'buildings')
const pageError = ref(null)

onErrorCaptured((err, instance, info) => {
  console.error('TownPage error:', err, info)
  pageError.value = err?.message || 'An error occurred in the Town page.'
  return false
})

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

.town-page > :deep(.tab-nav) {
  flex-shrink: 0;
}

.town-page > :deep(.tab-nav) + * {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
