import { el } from '../utils/DOMUtils.js';

/**
 * Creates a reusable icon button component.
 * @param {Object} props
 * @param {string|HTMLElement} props.icon - Emoji or HTML element representing the icon
 * @param {Function} props.onClick - Event handler
 * @param {boolean} [props.disabled=false] - Initial disabled state
 * @param {string} [props.variant='secondary'] - CSS class suffix for color variant (e.g. 'primary')
 * @param {string} [props.size='md'] - CSS class suffix for size variant (e.g. 'sm')
 * @param {string} [props.className=''] - Additional custom CSS classes
 * @param {string} [props.title=''] - Tooltip text
 * @returns {{root: HTMLElement, update: Function}}
 */
export function createIconButton({ icon, onClick, disabled = false, variant = 'secondary', size = 'md', className = '', title = '' }) {
    const root = el('button', {
        class: `btn btn-${variant} btn-${size} ${className}`,
        title: title,
        disabled: disabled,
        onClick: onClick,
        style: {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
        }
    }, [icon]);

    function update(newProps) {
        if (newProps.disabled !== undefined) {
            root.disabled = newProps.disabled;
        }
        if (newProps.icon !== undefined) {
            root.innerHTML = '';
            root.append(newProps.icon);
        }
    }

    return {
        root,
        refs: {},
        update
    };
}
