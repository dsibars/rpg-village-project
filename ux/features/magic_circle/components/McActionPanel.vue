<template>
  <div class="mc-bottom-margin mc-margin-bar">
    <div class="mc-bottom-left">
      <div v-if="spell?.element" class="mc-element-display">
        <span
          class="element-dot"
          :style="{ backgroundColor: getElementColor(spell.element) }"
        />
        <span class="element-name">{{ spell.element }}</span>
      </div>
      <div class="mc-chips-container">
        <span
          v-for="(chip, idx) in effectChips"
          :key="idx"
          class="effect-chip"
        >
          {{ chip.icon }} {{ t(chip.labelKey) }} {{ chip.value }}
        </span>
      </div>
    </div>
    <div class="mc-bottom-right">
      <input
        :value="customName"
        class="mc-name-input"
        type="text"
        maxlength="30"
        :placeholder="t('shared_uxelm_spell_name_placeholder')"
        @input="$emit('update:customName', $event.target.value)"
      />
      <Button
        variant="primary"
        size="sm"
        :disabled="!canInscribe"
        @click="$emit('inscribe')"
      >
        {{ t('magic_circle_uxelm_inscribe') }}
      </Button>
      <Button variant="secondary" size="sm" @click="$emit('clear')">
        {{ t('shared_uxelm_clear') }}
      </Button>
      <Button variant="ghost" size="sm" @click="$emit('close')">
        {{ t('shared_uxelm_close') }}
      </Button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '@/core/composables/useI18n.js'
import { getElementColor } from '../composables/useMagicCircle.js'
import Button from '@/components/Button.vue'

defineProps({
  spell: { type: Object, default: null },
  effectChips: { type: Array, default: () => [] },
  customName: { type: String, default: '' },
  canInscribe: { type: Boolean, default: false }
})

defineEmits(['update:customName', 'inscribe', 'clear', 'close'])

const { t } = useI18n()
</script>

<style scoped>
.mc-bottom-margin {
  grid-area: bottom;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mc-bottom-left {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.mc-element-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.element-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.element-name {
  font-size: 0.85rem;
  color: var(--text-primary);
  text-transform: capitalize;
}

.mc-chips-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.effect-chip {
  padding: 2px 8px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.mc-bottom-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.mc-name-input {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-base);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.85rem;
  min-width: 140px;
}

.mc-name-input::placeholder {
  color: var(--text-muted);
}

@media (max-width: 768px) {
  .mc-bottom-margin {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: flex-start;
  }
}
</style>
