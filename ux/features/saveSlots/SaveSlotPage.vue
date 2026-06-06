<template>
  <div class="save-slot-page">
    <header class="save-slots-header">
      <h1 class="save-slots-title">{{ t('shared_uxelm_save_slot_title') }}</h1>
      <p class="subtitle">{{ t('shared_uxelm_save_slot_subtitle') }}</p>
    </header>

    <div class="save-slots-lang-container">
      <label for="slots-lang-select">{{ t('settings_language_label') }}</label>
      <select
        id="slots-lang-select"
        :value="currentLanguage"
        class="select-control"
        @change="setLanguage($event.target.value)"
      >
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="ca">Català</option>
        <option value="eu">Euskara</option>
        <option value="gl">Galego</option>
      </select>
    </div>

    <div class="slots-grid">
      <button
        v-for="slot in normalizedSlots"
        :key="slot.index"
        class="slot-card"
        :class="{ empty: !slot.exists }"
        @click="$emit('selectSlot', slot.index)"
      >
        <div class="slot-header">
          <span class="slot-number-title">
            <template v-if="slot.exists">
              {{ t('shared_uxelm_save_slot_day', { day: slot.summary?.day ?? slot.day ?? 0 }) }}
            </template>
            <template v-else>
              {{ t('shared_uxelm_save_slot_empty') }}
            </template>
          </span>
          <span v-if="slot.exists" class="slot-last-played">
            {{ slot.lastPlayedFormatted || formatDate(slot.lastPlayedAt) }}
          </span>
        </div>

        <div v-if="slot.exists" class="slot-summary">
          <div class="slot-primary">{{ t('shared_uxelm_save_slot_continue') }}</div>
          <div class="slot-details">
            <span class="slot-detail" :title="t('shared_uxelm_gold')">
              <span class="detail-icon">💰</span>
              <span class="detail-val">{{ Math.floor(slot.summary?.gold ?? 0) }}</span>
            </span>
            <span class="slot-detail">
              <span class="detail-icon">⚔️</span>
              <span class="detail-val">{{ t('shared_uxelm_save_slot_heroes', { count: slot.summary?.heroes?.count ?? 0 }) }}</span>
            </span>
            <span class="slot-detail">
              <span class="detail-icon">⭐</span>
              <span class="detail-val">{{ t('shared_uxelm_save_slot_highest_level', { level: slot.summary?.heroes?.highestLevel ?? 0 }) }}</span>
            </span>
            <span class="slot-detail">
              <span class="detail-icon">🏡</span>
              <span class="detail-val">{{ slot.summary?.village?.population?.total ?? slot.summary?.village?.population ?? 0 }}</span>
            </span>
            <span class="slot-detail">
              <span class="detail-icon">🗺️</span>
              <span class="detail-val">{{ t('shared_uxelm_save_slot_regions', { count: slot.summary?.expeditions?.regionsUnlocked ?? 0 }) }}</span>
            </span>
          </div>
        </div>
        <div v-else class="slot-action-new">
          {{ t('shared_uxelm_save_slot_new_game') }}
        </div>

        <button
          v-if="slot.exists"
          class="btn-delete"
          @click.stop="confirmDelete(slot.index)"
          :title="t('shared_uxelm_save_slot_delete')"
        >
          🗑️
        </button>
      </button>
    </div>

    <!-- Confirm Delete Modal -->
    <Transition name="fade">
      <div v-if="deletingSlotIndex !== null" class="modal-overlay" @click.self="deletingSlotIndex = null">
        <div class="modal-body" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3>{{ t('shared_uxelm_save_slot_delete') }}</h3>
          </div>
          <div class="modal-text">
            <p>{{ t('shared_uxelm_save_slot_delete_confirm') }}</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="deletingSlotIndex = null">
              <span>{{ t('shared_uxelm_cancel') }}</span>
            </button>
            <button class="btn btn-danger" @click="performDelete">
              <span>{{ t('shared_uxelm_confirm') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'

const { t, setLanguage, currentLanguage } = useI18n()

const props = defineProps({
  slots: {
    type: Array,
    default: () => Array.from({ length: 10 }, (_, i) => ({ index: i, exists: false }))
  }
})

const emit = defineEmits(['selectSlot', 'deleteSlot'])

const deletingSlotIndex = ref(null)

const normalizedSlots = computed(() => {
  return props.slots.map(slot => {
    const index = slot.slotIndex !== undefined ? slot.slotIndex : slot.index
    return {
      ...slot,
      index
    }
  })
})

function formatDate(isoString) {
  if (!isoString) return ''
  try {
    return new Date(isoString).toLocaleDateString()
  } catch {
    return isoString
  }
}

function confirmDelete(index) {
  deletingSlotIndex.value = index
}

function performDelete() {
  if (deletingSlotIndex.value !== null) {
    emit('deleteSlot', deletingSlotIndex.value)
    deletingSlotIndex.value = null
  }
}
</script>

<style scoped>
.save-slot-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: var(--spacing-xl) var(--spacing-md);
  color: var(--text-primary);
  background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
}

.save-slots-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.save-slots-title {
  font-family: 'Outfit', sans-serif;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-xs) 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.save-slots-lang-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  background: rgba(30, 41, 59, 0.4);
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-lg);
  border: 1px solid var(--glass-border);
}

.save-slots-lang-container label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.select-control {
  background: var(--bg-base);
  border: 1px solid var(--glass-border);
  color: var(--text-primary);
  padding: 4px 8px;
  border-radius: var(--radius-md);
  outline: none;
  font-family: var(--font-body);
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.select-control:focus {
  border-color: var(--color-primary);
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  width: 100%;
  max-width: 900px;
}

.slot-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  cursor: pointer;
  text-align: left;
  font-family: var(--font-body);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 160px;
  backdrop-filter: blur(8px);
}

.slot-card.empty {
  justify-content: center;
  align-items: center;
  border-style: dashed;
  opacity: 0.7;
}

.slot-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-primary-light);
  box-shadow: 0 10px 20px -10px rgba(99, 102, 241, 0.4);
  opacity: 1;
}

.slot-card.empty:hover {
  border-color: var(--color-primary-light);
  background: rgba(99, 102, 241, 0.05);
}

.slot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: var(--spacing-sm);
}

.slot-number-title {
  font-weight: 600;
  font-family: var(--font-heading);
  color: var(--color-primary-light);
  font-size: 1.1rem;
}

.slot-card:not(.empty) .slot-number-title {
  font-size: 0.7rem;
  color: var(--accent-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.slot-card.empty .slot-number-title {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.slot-last-played {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.slot-summary {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
}

.slot-primary {
  font-family: 'Outfit', sans-serif;
  font-size: 1.1rem;
  color: var(--text-primary);
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
}

.slot-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-xs) var(--spacing-sm);
  background: rgba(15, 23, 42, 0.3);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.03);
}

.slot-detail {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.detail-icon {
  font-size: 0.9rem;
}

.detail-val {
  font-weight: 600;
}

.slot-action-new {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--accent-color);
}

.btn-delete {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.2);
  border-radius: 50%;
  color: var(--color-danger);
  cursor: pointer;
  font-size: 0.85rem;
  opacity: 0;
  transition: all 0.2s ease;
}

.slot-card:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  background: var(--color-danger);
  color: white;
  transform: scale(1.1);
}

/* Confirm Dialog Styling */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: var(--bg-overlay);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-body {
  background: #1e293b;
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  text-align: left;
}

.modal-header h3 {
  font-family: var(--font-heading);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.modal-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: var(--spacing-lg);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
  font-family: var(--font-body);
  transition: all 0.2s ease;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  border: 1px solid var(--glass-border);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-danger:hover {
  background: #ff5252;
}

/* Responsive */
@media (max-width: 640px) {
  .slots-grid {
    grid-template-columns: 1fr;
  }

  .save-slots-title {
    font-size: 1.3rem;
  }

  .slot-card {
    min-height: 90px;
    padding: 12px 14px;
  }

  .btn-delete {
    opacity: 1;
  }
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
