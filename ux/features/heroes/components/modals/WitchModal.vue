<template>
  <ModalFrame
    v-if="open"
    :title="'🌙 ' + t('witch_uxelm_title')"
    @close="onClose"
  >
    <div class="witch-modal">
      <div class="hero-select-row">
        <select
          v-model="selectedHeroId"
          class="witch-hero-select"
        >
          <option
            v-for="h in heroes"
            :key="h.id"
            :value="h.id"
          >
            {{ h.name }} (Tier {{ h.magicTier || 1 }})
          </option>
        </select>
      </div>

      <div class="witch-lines">
        <p
          v-for="(line, index) in dialogueLines"
          :key="index"
          class="witch-line"
        >
          <span class="element-icon">{{ elementIcon }}</span>
          "{{ line }}"
        </p>
      </div>

      <div v-if="dialogue.masteryHints?.length > 0" class="mastery-hint">
        {{ t('witch_msg_mastery_detected') }}
      </div>

      <div class="witch-footer">
        <span class="witch-meta">
          {{ t('witch_category_' + (dialogue.category || 'unknown')) }} · {{ t('witch_element_' + (dialogue.element || 'neutral')) }}
        </span>
        <Button variant="secondary" size="sm" @click="onClose">
          {{ t('shared_uxelm_close') }}
        </Button>
      </div>
    </div>
  </ModalFrame>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'
import { useAdapter } from '@/core/composables/useAdapter.js'
import { useGameState } from '@/core/composables/useGameState.js'
import ModalFrame from '@/components/ModalFrame.vue'
import Button from '@/components/Button.vue'

const props = defineProps({
  heroes: { type: Array, required: true },
  selectedHero: { type: Object, required: true },
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['close'])

const { t } = useI18n()
const { dispatch } = useAdapter()
const { gameState } = useGameState()

const selectedHeroId = ref(props.selectedHero?.id)

watch(
  () => props.selectedHero?.id,
  (newId) => {
    if (newId) selectedHeroId.value = newId
  }
)

const currentHero = computed(() =>
  props.heroes.find((h) => h.id === selectedHeroId.value) || props.selectedHero
)

const currentDay = computed(() => gameState?.value?.village?.day || 0)

const dialogue = computed(() => {
  if (!currentHero.value) {
    return { lines: [], category: '', element: 'neutral', masteryHints: [] }
  }
  return dispatch('witch', 'getDialogue', { hero: currentHero.value, day: currentDay.value }) || {
    lines: [], category: '', element: 'neutral', masteryHints: []
  }
})

const elementIcons = {
  fire: '🔥',
  water: '💧',
  wind: '🍃',
  storm: '⚡',
  light: '☀',
  dark: '🌑',
  earth: '🪨',
  neutral: '🔮'
}

const elementIcon = computed(() => elementIcons[dialogue.value.element] || '🔮')

const dialogueLines = computed(() => {
  return (dialogue.value.lines || []).map((line) => {
    if (line.params) {
      const translated = t(line.key, line.params)
      if (line.params.glyph && translated.includes('{glyph}')) {
        return translated.replace('{glyph}', t(line.params.glyph))
      }
      return translated
    }
    return t(line.key)
  })
})

function onClose() {
  if (currentHero.value) {
    dispatch('witch', 'recordVisit', { hero: currentHero.value, day: currentDay.value })
  }
  emit('close')
}
</script>

<style scoped>
.witch-modal {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  min-width: 340px;
}

.hero-select-row {
  margin-bottom: var(--spacing-xs);
}

.witch-hero-select {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 0.9rem;
}

.witch-lines {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.witch-line {
  margin: 0;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  color: var(--text-primary);
  font-style: italic;
}

.element-icon {
  margin-right: var(--spacing-xs);
}

.mastery-hint {
  margin-top: var(--spacing-xs);
  font-size: 0.8rem;
  color: var(--color-primary-light);
}

.witch-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--glass-border);
}

.witch-meta {
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  padding: 2px 10px;
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  text-transform: capitalize;
}
</style>
