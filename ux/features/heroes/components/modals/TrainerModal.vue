<template>
  <ModalFrame
    v-if="open"
    :title="t('trainer_uxelm_title')"
    @close="$emit('close')"
  >
    <div class="trainer-modal">
      <div class="trainer-lines">
        <p
          v-for="(line, index) in dialogueLines"
          :key="index"
          class="trainer-line"
        >
          "{{ line }}"
        </p>
      </div>

      <div class="trainer-footer">
        <span class="trainer-category">{{ dialogueCategory }}</span>
        <Button variant="secondary" size="sm" @click="$emit('close')">
          {{ t('shared_uxelm_close') }}
        </Button>
      </div>
    </div>
  </ModalFrame>
</template>

<script setup>
import { computed } from 'vue'
import { useAdapter } from '@/core/composables/useAdapter.js'
import { useI18n } from '@/core/composables/useI18n.js'
import ModalFrame from '@/components/ModalFrame.vue'
import Button from '@/components/Button.vue'

const props = defineProps({
  hero: { type: Object, required: true },
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const { t } = useI18n()
const { dispatch } = useAdapter()

const dialogue = computed(() => {
  if (!props.hero) return { lines: [], category: '' }
  const result = dispatch('trainer', 'getDialogue', { hero: props.hero })
  return result.success ? result.data : { lines: [], category: '' }
})

const dialogueLines = computed(() => {
  return (dialogue.value.lines || []).map((line) => {
    if (line.params) {
      const translated = t(line.key, line.params)
      // Replace {family} placeholder if the translated string still contains it
      if (line.params.family && translated.includes('{family}')) {
        return translated.replace('{family}', t(line.params.family))
      }
      return translated
    }
    return t(line.key)
  })
})

const dialogueCategory = computed(() => {
  const cat = dialogue.value.category || 'unknown'
  return t('trainer_category_' + cat)
})
</script>

<style scoped>
.trainer-modal {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-width: 320px;
}

.trainer-lines {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.trainer-line {
  margin: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  color: var(--text-primary);
  font-style: italic;
}

.trainer-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--glass-border);
}

.trainer-category {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: capitalize;
}
</style>
