import { el } from '../utils/DOMUtils.js';

/**
 * Creates a reusable progress/resource bar component.
 * @param {Object} props
 * @param {string} props.label - Progress bar title
 * @param {number} props.current - Current numeric value
 * @param {number} props.max - Max numeric value
 * @param {string} [props.color='var(--accent-color)'] - Fill color
 * @param {string} [props.className=''] - Additional custom CSS classes
 * @returns {{root: HTMLElement, refs: Object, update: Function}}
 */
export function createResourceBar({ label, current, max, color = 'var(--accent-color)', className = '' }) {
    const percent = max > 0 ? Math.min(100, (current / max) * 100) : 0;
    
    const labelRef = el('span', { class: 'resource-bar-label' }, [label]);
    const valueRef = el('span', { class: 'resource-bar-value' }, [`${current} / ${max}`]);
    const progressInnerRef = el('div', {
        class: 'resource-bar-fill',
        style: {
            width: `${percent}%`,
            backgroundColor: color,
            height: '100%',
            borderRadius: 'inherit',
            transition: 'width 0.3s ease'
        }
    });

    const root = el('div', {
        class: `resource-bar ${className}`,
        style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            width: '100%'
        }
    }, [
        el('div', {
            style: {
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                fontWeight: '600'
            }
        }, [labelRef, valueRef]),
        el('div', {
            class: 'resource-bar-track',
            style: {
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                overflow: 'hidden'
            }
        }, [progressInnerRef])
    ]);

    function update({ current: newCurrent, max: newMax, label: newLabel }) {
        const c = newCurrent !== undefined ? newCurrent : current;
        const m = newMax !== undefined ? newMax : max;
        const p = m > 0 ? Math.min(100, (c / m) * 100) : 0;
        
        progressInnerRef.style.width = `${p}%`;
        valueRef.textContent = `${c} / ${m}`;
        if (newLabel !== undefined) {
            labelRef.textContent = newLabel;
        }
    }

    return {
        root,
        refs: {
            label: labelRef,
            value: valueRef,
            progressInner: progressInnerRef
        },
        update
    };
}
