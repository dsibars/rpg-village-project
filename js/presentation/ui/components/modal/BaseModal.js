export class BaseModal {
    /**
     * @param {string} title
     * @param {string} contentHtml
     * @param {Object} options
     * @param {string} options.icon - Emoji or icon string for header
     * @param {string} options.className - Additional class for the dialogue box
     * @param {string} options.maxWidth - Max width (e.g., '480px')
     * @param {Function} options.onClose - Callback when closed
     */
    static show({ title, contentHtml, icon = '', className = '', maxWidth = '480px', onClose = null }) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.zIndex = '2000';

        overlay.innerHTML = `
            <div class="modal-body ${className}" style="max-width: ${maxWidth}; display: flex; flex-direction: column;">
                <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px;">
                    <h3 style="margin: 0; font-size:1.1rem; color: var(--accent-color);">
                        ${icon ? `<span style="margin-right:8px;">${icon}</span>` : ''}${title}
                    </h3>
                    <button class="btn btn-secondary btn-sm btn-close-modal" style="padding: 4px 8px; font-size: 0.8rem;">❌</button>
                </div>
                
                <div class="modal-content-area" style="flex: 1; overflow-y: auto; padding-right: 5px;">
                    ${contentHtml}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = () => {
            if (overlay.parentNode) {
                overlay.style.opacity = '0';
                overlay.style.transition = 'opacity 0.3s ease';
                setTimeout(() => {
                    if (overlay.parentNode) {
                        document.body.removeChild(overlay);
                    }
                    if (onClose) onClose();
                }, 300);
            }
        };

        overlay.querySelector('.btn-close-modal').addEventListener('click', close);
        
        // Close on clicking outside the modal-body
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                close();
            }
        });

        return { overlay, close };
    }
}
