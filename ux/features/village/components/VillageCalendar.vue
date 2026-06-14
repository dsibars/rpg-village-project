<template>
  <div class="village-calendar">
    <div class="season-display">
      <span class="season-icon">{{ seasonIcon }}</span>
      <div class="season-info">
        <span class="season-name">{{ seasonLabel }}</span>
        <span class="season-day">{{ t('calendar_info_day').replace('{day}', dayOfSeason) }}</span>
      </div>
    </div>

    <div class="events-section">
      <h5>{{ t('calendar_uxelm_upcoming') }}</h5>
      <div v-if="events.length === 0" class="empty-state">
        {{ t('calendar_uxelm_event_none') }}
      </div>
      <div v-else class="event-list">
        <div
          v-for="ev in visibleEvents"
          :key="`${ev.day}-${ev.type}`"
          class="event-item"
          :class="{ urgent: isUrgent(ev), raid: ev.type === 'raid' }"
        >
          <span class="event-icon">{{ ev.type === 'raid' ? '⚔' : '📅' }}</span>
          <span class="event-day">{{ dayLabel(ev) }}</span>
          <span class="event-label">{{ eventLabel(ev) }}</span>
          <span v-if="ev.type === 'raid' && ev.data" class="event-meta">
            Lv{{ ev.data.level }} × {{ ev.data.enemyCount }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from '@/core/composables/useI18n.js'

const props = defineProps({
  calendar: { type: Object, default: null }
})

const { t } = useI18n()

const seasonIcon = computed(() => {
  const map = { spring: '🌸', summer: '☀', autumn: '🍂', winter: '❄' }
  return map[props.calendar?.season] || '📅'
})

const seasonLabel = computed(() => t('calendar_info_season_' + (props.calendar?.season || 'spring')))
const dayOfSeason = computed(() => props.calendar?.dayOfSeason || 1)
const events = computed(() => props.calendar?.upcomingEvents || [])
const currentDay = computed(() => props.calendar?.day || 1)

const visibleEvents = computed(() => events.value.slice(0, 5))

function isUrgent(ev) {
  return ev.type === 'raid' && (ev.day - currentDay.value) <= 2
}

function dayLabel(ev) {
  const daysAway = ev.day - currentDay.value
  if (daysAway === 0) return t('shared_uxelm_today')
  if (daysAway === 1) return t('shared_uxelm_tomorrow')
  return `D+${daysAway}`
}

function eventLabel(ev) {
  const key = ev.type === 'raid' ? 'calendar_info_event_raid' : 'calendar_info_event_' + ev.type
  const translated = t(key)
  return translated !== key ? translated : ev.type
}
</script>

<style scoped>
.village-calendar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.season-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
}

.season-icon {
  font-size: 2rem;
}

.season-info {
  display: flex;
  flex-direction: column;
}

.season-name {
  font-weight: 600;
  color: var(--text-primary);
}

.season-day {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.events-section h5 {
  margin: 0 0 var(--spacing-xs);
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.empty-state {
  color: var(--text-muted);
  font-size: 0.8rem;
  font-style: italic;
}

.event-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  background: var(--bg-card);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
}

.event-item.raid {
  border-left: 3px solid rgba(239, 68, 68, 0.5);
}

.event-item.urgent {
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.08);
  border-left: 3px solid rgba(239, 68, 68, 0.7);
}

.event-icon {
  font-size: 0.9rem;
}

.event-day {
  color: var(--text-muted);
  min-width: 60px;
}

.event-label {
  color: var(--text-primary);
  flex: 1;
}

.event-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
