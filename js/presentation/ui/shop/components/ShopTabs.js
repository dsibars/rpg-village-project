/**
 * Initializes and manages Shop navigation tabs surgically.
 * @param {HTMLElement} container - The container hosting the .shop-tab buttons
 * @param {string} currentTab - The initial active tab mode
 * @param {Function} onTabSwitch - Callback when tab is switched
 * @returns {{root: HTMLElement, update: Function}}
 */
export function initShopTabs(container, currentTab, onTabSwitch) {
    if (!container) return { root: null, update: () => {} };

    const tabs = container.querySelectorAll('.shop-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const mode = tab.getAttribute('data-tab');
            onTabSwitch(mode);
        });
    });

    function update(activeTab) {
        tabs.forEach(t => {
            t.classList.toggle('active', t.getAttribute('data-tab') === activeTab);
        });
    }

    // Set initial active state
    update(currentTab);

    return {
        root: container,
        update
    };
}
