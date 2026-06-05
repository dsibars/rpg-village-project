<template>
  <div class="town-page">
    <h1>{{ t('shared_uxelm_nav_town') }}</h1>

    <TabNav
      v-model="currentTab"
      :tabs="[
        { id: 'buildings', label: t('shared_uxelm_nav_buildings'), icon: '\u{1F3D7}' },
        { id: 'shop', label: t('shop_uxelm_title'), icon: '\u{1F3EA}' },
        { id: 'forge', label: t('shared_uxelm_nav_forge'), icon: '\u{2692}' },
        { id: 'inventory', label: t('inventory_uxelm_inventory'), icon: '\u{1F392}' }
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

const currentTab = ref('buildings')

const tabConfig = {
  buildings: {
    icon: '\u{1F3D7}',
    title: () => t('shared_uxelm_nav_buildings'),
    message: () => 'Village building construction and upgrades will appear here.'
  },
  shop: {
    icon: '\u{1F3EA}',
    title: () => t('shop_uxelm_title'),
    message: () => t('shop_uxelm_subtitle')
  },
  forge: {
    icon: '\u{2692}',
    title: () => t('shared_uxelm_nav_forge'),
    message: () => t('forge_uxelm_locked_desc')
  },
  inventory: {
    icon: '\u{1F392}',
    title: () => t('inventory_uxelm_inventory'),
    message: () => t('inventory_uxelm_equipment_desc')
  }
}

const currentTabIcon = computed(() => tabConfig[currentTab.value].icon)
const currentTabTitle = computed(() => tabConfig[currentTab.value].title())
const currentTabMessage = computed(() => tabConfig[currentTab.value].message())

onErrorCaptured((err, instance, info) => {
  console.error('TownPage error:', err, info)
  return false
})
</script>

<style scoped>
.town-page {
  padding: var(--spacing-lg);
  color: var(--text-primary);
}

.town-page h1 {
  font-family: var(--font-heading);
  color: var(--color-primary);
  margin-top: 0;
}

.tab-content {
  margin-top: var(--spacing-md);
}
</style>
