import { el } from '../../shared/utils/DOMUtils.js';

/**
 * CombatLogConsole - Surgically appends new combat logs to preserve scrolling and performance.
 */
export class CombatLogConsole {
    constructor({ t, formatLogEntryHtml }) {
        this.t = t;
        this.formatLogEntryHtml = formatLogEntryHtml;
        this.consoleEl = el('div', { class: 'combat-log-console', id: 'combat-log-console' });
        this.root = el('div', { class: 'combat-log-section' }, [
            el('div', { class: 'combat-column-title' }, [this.t('combat_log')]),
            this.consoleEl
        ]);
        this.lastLogLength = 0;
    }

    update(battle) {
        if (!battle) return;

        const log = battle.log || [];
        
        if (log.length < this.lastLogLength || this.lastLogLength === 0) {
            this.consoleEl.innerHTML = '';
            this.lastLogLength = 0;
        }

        if (log.length > this.lastLogLength) {
            const newEvents = log.slice(this.lastLogLength);
            newEvents.forEach(entry => {
                const line = el('div', {
                    style: 'margin-bottom:4px;line-height:1.4;'
                });
                line.innerHTML = this.formatLogEntryHtml(entry);
                this.consoleEl.appendChild(line);
            });
            this.lastLogLength = log.length;

            while (this.consoleEl.children.length > 20) {
                this.consoleEl.removeChild(this.consoleEl.firstChild);
            }

            this.consoleEl.scrollTop = this.consoleEl.scrollHeight;
        }
    }
}
