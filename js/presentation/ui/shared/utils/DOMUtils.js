export function el(tag, props = {}, children = []) {
    const isSvg = ['svg', 'path', 'g', 'circle', 'rect', 'line'].includes(tag);
    const element = isSvg 
        ? document.createElementNS('http://www.w3.org/2000/svg', tag) 
        : document.createElement(tag);

    if (props) {
        for (const [key, value] of Object.entries(props)) {
            if (key.startsWith('on') && typeof value === 'function') {
                const eventName = key.slice(2).toLowerCase();
                element.addEventListener(eventName, value);
            } else if (key === 'className' || key === 'class') {
                if (Array.isArray(value)) {
                    const cls = value.filter(Boolean).join(' ');
                    if (isSvg) element.setAttribute('class', cls);
                    else element.className = cls;
                } else if (typeof value === 'object' && value !== null) {
                    const cls = Object.entries(value)
                        .filter(([_, condition]) => condition)
                        .map(([cls, _]) => cls)
                        .join(' ');
                    if (isSvg) element.setAttribute('class', cls);
                    else element.className = cls;
                } else if (value) {
                    if (isSvg) element.setAttribute('class', value);
                    else element.className = value;
                }
            } else if (key === 'style' && typeof value === 'object' && value !== null) {
                for (const [styleKey, styleValue] of Object.entries(value)) {
                    element.style[styleKey] = styleValue;
                }
            } else if (key === 'ref' && typeof value === 'function') {
                value(element);
            } else if (typeof value === 'boolean') {
                element[key] = value;
                if (value) {
                    element.setAttribute(key, '');
                } else {
                    element.removeAttribute(key);
                }
            } else {
                if (key.startsWith('data')) {
                    const dataAttr = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                    element.setAttribute(dataAttr, value);
                } else if (key.startsWith('aria')) {
                    const ariaAttr = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                    element.setAttribute(ariaAttr, value);
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else {
                    element.setAttribute(key, value);
                }
            }
        }
    }

    if (children !== null && children !== undefined) {
        if (!Array.isArray(children)) {
            children = [children];
        }
        
        const fragment = document.createDocumentFragment();
        children.flat().filter(child => child !== null && child !== undefined && child !== false).forEach(child => {
            if (child instanceof HTMLElement || child instanceof DocumentFragment || child instanceof SVGElement || typeof child === 'object' && child.nodeType) {
                fragment.appendChild(child);
            } else {
                fragment.appendChild(document.createTextNode(String(child)));
            }
        });
        element.appendChild(fragment);
    }

    return element;
}

/**
 * Surgically reconciles a DOM container's children to match a new list of elements.
 * 
 * DESIGN CONSTRAINTS:
 * 1. Keyed Items: Every element passed to this function MUST have a unique identifier 
 *    matching the keyAttr (default 'data-id'). Elements without keys will trigger a console warning 
 *    and may be appended or cleaned up unsafely.
 * 2. Coarse-grained Reconciliation: Node equality is evaluated using `isEqualNode()`. 
 *    If any child node or attribute in a list item differs (e.g. an HP stat update inside a card), 
 *    the entire list item node is replaced via `replaceWith()`. For fine-grained updates 
 *    inside a complex list item, the component representing that item should perform 
 *    its own internal surgical updates instead of relying solely on diffList.
 * 
 * @param {HTMLElement} container - The DOM parent node holding the list.
 * @param {HTMLElement[]} newElements - The array of new/updated child elements.
 * @param {string} keyAttr - The attribute used to identify and map elements (default 'data-id').
 */
export function diffList(container, newElements, keyAttr = 'data-id') {
    const oldChildren = Array.from(container.children);
    const oldKeyMap = new Map();
    const reusedElements = new Set();
    
    oldChildren.forEach(child => {
        const key = child.getAttribute(keyAttr);
        if (key) {
            oldKeyMap.set(key, child);
        }
    });

    let i = 0;
    for (; i < newElements.length; i++) {
        const newEl = newElements[i];
        const newKey = newEl.getAttribute(keyAttr);
        
        if (!newKey) {
            console.warn(`diffList element missing keyAttr: ${keyAttr}`, newEl);
            if (i < container.children.length) {
                container.insertBefore(newEl, container.children[i]);
            } else {
                container.appendChild(newEl);
            }
            reusedElements.add(newEl);
            continue;
        }

        const oldEl = oldKeyMap.get(newKey);
        
        if (oldEl) {
            oldKeyMap.delete(newKey);
            
            if (container.children[i] !== oldEl) {
                container.insertBefore(oldEl, container.children[i]);
            }
            
            if (!oldEl.isEqualNode(newEl)) {
                // If text content, classes, or attributes changed, isEqualNode returns false.
                // Replace the old element with the new one to apply changes.
                oldEl.replaceWith(newEl);
                reusedElements.add(newEl);
            } else {
                // Keep the old element intact (preserves event listeners, animations, focus)
                reusedElements.add(oldEl);
            }
        } else {
            if (i < container.children.length) {
                container.insertBefore(newEl, container.children[i]);
            } else {
                container.appendChild(newEl);
            }
            reusedElements.add(newEl);
        }
    }
    
    // Clean up any remaining children that were not part of the new list.
    // This handles both old keyed elements that were removed AND any non-keyed elements.
    Array.from(container.children).forEach(child => {
        if (!reusedElements.has(child)) {
            child.remove();
        }
    });
}
