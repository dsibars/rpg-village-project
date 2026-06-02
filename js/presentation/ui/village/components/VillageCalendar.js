import { el, diffList } from '../../shared/utils/DOMUtils.js';

/**
 * createEventItem - Creates event item DOM node.
 */
function createEventItem(ev, currentDay, t) {
    const isRaid = ev.type === 'raid';
    const daysAway = ev.day - currentDay;
    const isUrgent = isRaid && daysAway <= 2;
    const icon = isRaid ? '⚔️' : '📅';
    const label = isRaid ? t('calendar_info_event_raid') : t('calendar_info_event_' + ev.type);
    const dayLabel = daysAway === 0 ? t('shared_uxelm_today') : (daysAway === 1 ? t('shared_uxelm_tomorrow') : `D+${daysAway}`);

    return el('div', {
        class: `event-item ${isUrgent ? 'event-urgent' : ''}`,
        dataId: `${ev.day}-${ev.type}`
    }, [
        el('span', { class: 'event-icon' }, [icon]),
        el('span', { class: 'event-day' }, [dayLabel]),
        el('span', { class: 'event-label' }, [label])
    ]);
}

/**
 * VillageCalendar - Manages calendar info and event listings.
 */
export class VillageCalendar {
    constructor({ t, seasonIcon, seasonLabel, dayLabel, eventsContainer }) {
        this.t = t;
        this.seasonIcon = seasonIcon;
        this.seasonLabel = seasonLabel;
        this.dayLabel = dayLabel;
        this.eventsContainer = eventsContainer;
    }

    update(calendar) {
        if (!calendar) return;

        const SEASON_ICONS = {
            spring: '🌸',
            summer: '☀️',
            autumn: '🍂',
            winter: '❄️'
        };

        if (this.seasonIcon) {
            const expectedIcon = SEASON_ICONS[calendar.season] || '📅';
            if (this.seasonIcon.textContent !== expectedIcon) {
                this.seasonIcon.textContent = expectedIcon;
            }
        }

        if (this.seasonLabel) {
            const expectedLabel = this.t('calendar_info_season_' + calendar.season);
            if (this.seasonLabel.textContent !== expectedLabel) {
                this.seasonLabel.textContent = expectedLabel;
            }
        }

        if (this.dayLabel) {
            const expectedDay = String(calendar.dayOfSeason);
            if (this.dayLabel.textContent !== expectedDay) {
                this.dayLabel.textContent = expectedDay;
            }
        }

        if (this.eventsContainer) {
            const events = calendar.upcomingEvents || [];
            if (events.length === 0) {
                this.eventsContainer.innerHTML = '';
                this.eventsContainer.appendChild(
                    el('div', { class: 'empty-state', dataI18n: 'calendar_uxelm_event_none' }, [
                        this.t('calendar_uxelm_event_none')
                    ])
                );
            } else {
                const currentDay = calendar.day || 1;
                const newElements = events.slice(0, 5).map(ev => createEventItem(ev, currentDay, this.t));
                diffList(this.eventsContainer, newElements, 'data-id');
            }
        }
    }
}
