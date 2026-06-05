<template>
  <ModalFrame
    v-if="open"
    :title="t('intro_uxelm_title')"
    @close="$emit('close')"
  >
    <div class="intro-dialog">
      <p class="intro-era">{{ t('intro_uxelm_era') }}</p>
      <p class="intro-text">{{ t('intro_uxelm_text') }}</p>
      <div class="intro-actions">
        <Button variant="primary" @click="$emit('close')">
          {{ t('shared_uxelm_continue') }}
        </Button>
      </div>
    </div>
  </ModalFrame>
</template>

<script setup>
import { useI18n } from '@/core/composables/useI18n.js'
import ModalFrame from '@/components/ModalFrame.vue'
import Button from '@/components/Button.vue'

const props = defineProps({
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const { t } = useI18n()
</script>

<style scoped>
.intro-dialog {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  max-width: 480px;
  text-align: center;
}

.intro-era {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
}

.intro-text {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
  line-height: 1.6;
}

.intro-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-sm);
}
</style>
