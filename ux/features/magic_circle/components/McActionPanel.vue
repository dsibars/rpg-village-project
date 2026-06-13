<template>
  <div class="mc-bottom-margin mc-margin-bar">
    <div class="mc-bottom-left">
      <div v-if="spell?.element" class="mc-element-display">
        <span>{{ getElementEmoji(spell.element) }} {{ capitalize(spell.element) }}</span>
      </div>
      <div v-else class="mc-element-display">
        <span>🔮 {{ t('magic_circle_info_effect_none') }}</span>
      </div>
      <div class="mc-chips-container">
        <template v-if="spell">
          <template v-if="effectChips.length > 0">
            <span
              v-for="(chip, idx) in effectChips"
              :key="idx"
              class="mc-effect-chip"
            >
              {{ chip.icon }} {{ t(chip.labelKey) }} {{ chip.value }}{{ chip.suffix }}
            </span>
          </template>
          <template v-else-if="isSupport">
            <span class="mc-effect-chip no-harm">
              💚 {{ t('magic_circle_info_effect_no_harm') }}
            </span>
          </template>
          <template v-else>
            <span class="mc-effect-chip">
              {{ t('magic_circle_info_effect_none') }}
            </span>
          </template>
        </template>
        <template v-else>
          <span class="mc-effect-chip">
            {{ t('magic_circle_info_effect_none') }}
          </span>
        </template>
      </div>
    </div>
    <div class="mc-bottom-right">
      <div class="mc-name-input-wrapper">
        <input
          :value="customName"
          class="mc-name-input"
          type="text"
          maxlength="30"
          :placeholder="t('shared_uxelm_spell_name_placeholder')"
          @input="$emit('update:customName', $event.target.value)"
        />
      </div>
      <button
        class="mc-btn mc-btn-primary"
        :disabled="!canInscribe"
        @click="$emit('inscribe')"
      >
        {{ isSimulator ? t('magic_circle_uxelm_inscribe_disabled') : t('magic_circle_uxelm_inscribe') }}
      </button>
      <button class="mc-btn mc-btn-secondary" @click="$emit('clear')">
        {{ t('shared_uxelm_clear') }}
      </button>
      <button class="mc-btn mc-btn-secondary" @click="$emit('close')">
        {{ t('shared_uxelm_close') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '@/core/composables/useI18n.js'

const props = defineProps({
  spell: { type: Object, default: null },
  effectChips: { type: Array, default: () => [] },
  customName: { type: String, default: '' },
  canInscribe: { type: Boolean, default: false },
  isSimulator: { type: Boolean, default: false },
  isSupport: { type: Boolean, default: false }
})

defineEmits(['update:customName', 'inscribe', 'clear', 'close'])

const { t } = useI18n()

function getElementEmoji(element) {
  const map = {
    fire: '🔥', water: '💧', wind: '🌪️',
    storm: '⚡', light: '✨', dark: '🌑', earth: '🪨'
  }
  return map[element] || '🔮'
}

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}
</script>

<style scoped>
.mc-bottom-margin {
  grid-area: bottom;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 10;
}

.mc-bottom-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.mc-element-display {
  font-size: 1.05rem;
  font-weight: 600;
  text-transform: capitalize;
  color: #ffffff;
  padding-right: 16px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  min-width: 100px;
}

.mc-chips-container {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  max-width: 45%;
  padding: 4px 0;
}

.mc-chips-container::-webkit-scrollbar {
  display: none;
}
.mc-chips-container {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.mc-effect-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 4px 10px;
  border-radius: 14px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  color: #e2e8f0;
}

.mc-effect-chip.no-harm {
  background: rgba(16, 185, 129, 0.05);
  border-color: rgba(16, 185, 129, 0.15);
  color: #6ee7b7;
}

.mc-bottom-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.mc-name-input-wrapper {
  position: relative;
  width: 180px;
}

.mc-name-input {
  width: 100%;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.8rem;
  color: #ffffff;
  font-family: inherit;
  outline: none;
  transition: all 0.2s ease;
}

.mc-name-input:focus {
  border-color: rgba(255, 255, 255, 0.25);
  background: rgba(0, 0, 0, 0.5);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.05);
}

.mc-name-input::placeholder {
  color: #64748b;
}

.mc-btn {
  padding: 9px 18px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  font-family: inherit;
}

.mc-btn-primary {
  background: linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #b45309 100%);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.25);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.55);
}

.mc-btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #fbbf24 0%, #fbbf24 30%, #f59e0b 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.65), inset 0 1px 2px rgba(255, 255, 255, 0.4);
}

.mc-btn-primary:disabled {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.08);
  color: #64748b;
  cursor: not-allowed;
  box-shadow: none;
}

.mc-btn-secondary {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
}

.mc-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

@media (max-width: 768px) {
  .mc-bottom-margin {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
    padding: 12px 16px;
    height: auto;
  }
  .mc-bottom-left {
    flex-wrap: wrap;
  }
  .mc-chips-container {
    max-width: 100%;
  }
}
</style>
