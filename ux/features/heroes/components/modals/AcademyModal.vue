<template>
  <ModalFrame
    v-if="open"
    :title="t('academy_uxelm_title')"
    @close="$emit('close')"
  >
    <div class="academy-modal">
      <div class="design-section">
        <h4 class="section-title">{{ t('academy_uxelm_design_library') }}</h4>

        <div v-if="designs.length === 0" class="empty-state">
          {{ t('academy_uxelm_no_designs') }}
        </div>

        <div v-else class="design-list">
          <div
            v-for="(design, index) in designs"
            :key="index"
            class="design-card"
          >
            <strong class="design-name">{{ design.name }}</strong>
            <span class="design-meta">
              — {{ design.glyphIds?.length || 0 }} {{ t('shared_uxelm_glyphs') }}, {{ design.mpCost }} {{ t('shared_uxelm_mp') }}
            </span>
          </div>
        </div>
      </div>

      <div class="academy-footer">
        <Button variant="secondary" size="sm" @click="$emit('close')">
          {{ t('shared_uxelm_close') }}
        </Button>
      </div>
    </div>
  </ModalFrame>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import ModalFrame from '@/components/ModalFrame.vue'
import Button from '@/components/Button.vue'

const props = defineProps({
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const { t } = useI18n()
const { dispatch } = useAdapter()

const designs = computed(() => {
  const result = dispatch('academy', 'getSpellDesigns') || { success: false }
  return result.success ? result.data : []
})
</script>

<style scoped>
.academy-modal {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-width: 360px;
}

.section-title {
  margin: 0 0 var(--spacing-sm);
  font-size: 0.9rem;
  color: var(--text-muted);
}

.empty-state {
  color: var(--text-muted);
  font-size: 0.85rem;
  font-style: italic;
}

.design-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.design-card {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--text-primary);
}

.design-name {
  color: var(--color-primary-light);
}

.design-meta {
  color: var(--text-secondary);
}

.academy-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--glass-border);
}
</style>
