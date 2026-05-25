export class UIUtils {
    /**
     * Renders a standardized empty state.
     * @param {string} message The text to display
     * @param {string} [i18nKey] Optional translation key for data-i18n
     * @param {string} [extraStyles] Optional extra CSS styles
     * @returns {string} HTML string
     */
    static renderEmptyState(message, i18nKey = null, extraStyles = '') {
        const i18nAttr = i18nKey ? ` data-i18n="${i18nKey}"` : '';
        const styleAttr = extraStyles ? ` style="${extraStyles}"` : '';
        return `<div class="empty-state"${i18nAttr}${styleAttr}>${message}</div>`;
    }

    /**
     * Renders a standardized progress bar.
     * @param {number} current Current value
     * @param {number} max Maximum value
     * @param {string} [themeClass] e.g., 'success', 'warning', 'danger'
     * @returns {string} HTML string
     */
    static renderProgressBar(current, max, themeClass = '') {
        const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
        return `
            <div class="progress-container">
                <div class="progress-bar ${themeClass}" style="width: ${pct}%"></div>
            </div>
        `;
    }
}
