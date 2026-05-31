import { el } from '../../shared/utils/DOMUtils.js';

/**
 * ExpeditionTree — renders a bottom-up branching tree of expedition nodes
 * for a single region. Completed (✕), available (○), active (◎), closed (⬡).
 * Designed to fill the entire detail pane.
 */
export function createExpeditionTree({ onNodeClick, t }) {
    const root = el('div', { class: 'expedition-tree-root' });
    let nodesMap = new Map();
    let svgOverlay = null;

    function update({ regionId, regionData, activeExpeditions, selectedId }) {
        const activeIds = new Set((activeExpeditions || []).map(e => e.id));
        const nodes = regionData?.availableNodes || [];

        root.innerHTML = '';
        nodesMap = new Map();

        if (nodes.length === 0) {
            root.appendChild(el('div', { class: 'tree-empty-state' }, [
                el('div', { style: { fontSize: '3rem', opacity: 0.2, marginBottom: '12px' } }, ['🌲']),
                el('p', { style: { color: 'var(--text-muted)' } }, [
                    t('explore_uxelm_no_expeditions')
                ])
            ]));
            return;
        }

        // Region title bar at top
        const rName = t(regionId);
        const clears = regionData.clears || 0;
        const titleBar = el('div', { class: 'tree-region-title-bar' }, [
            el('span', { class: 'tree-region-title-name' }, [rName]),
            el('span', { class: 'tree-region-title-meta' }, [
                `${clears} ${t('explore_uxelm_clears')}`
            ])
        ]);
        root.appendChild(titleBar);

        // Build parent/child relationships
        const nodesByParent = {};
        const nodesById = {};

        nodes.forEach(node => {
            nodesById[node.id] = node;
            const parentId = node.parentId || 'root';
            if (!nodesByParent[parentId]) nodesByParent[parentId] = [];
            nodesByParent[parentId].push(node);
        });

        // Calculate levels (distance from root)
        const levelMap = new Map();
        function setLevel(nodeId, level) {
            const node = nodesById[nodeId];
            if (!node || levelMap.has(nodeId)) return;
            levelMap.set(nodeId, level);
            const children = nodesByParent[nodeId] || [];
            children.forEach(child => setLevel(child.id, level + 1));
        }

        const rootNodes = nodes.filter(n => !n.parentId);
        rootNodes.forEach(r => setLevel(r.id, 0));

        // Group by level
        const maxLevel = Math.max(0, ...Array.from(levelMap.values()));
        const levels = [];
        for (let i = 0; i <= maxLevel; i++) levels.push([]);
        nodes.forEach(node => {
            const level = levelMap.get(node.id) || 0;
            levels[level].push(node);
        });

        // Create scrollable container for nodes
        const scrollContainer = el('div', { class: 'tree-scroll-container' });
        const treeWrapper = el('div', { class: 'tree-wrapper' });

        // Create SVG overlay for connectors
        svgOverlay = el('svg', { class: 'tree-svg-overlay' });

        // Render levels from bottom to top (column-reverse handles this)
        const levelEls = [];
        for (let i = 0; i <= maxLevel; i++) {
            const levelNodes = levels[i];
            if (!levelNodes || levelNodes.length === 0) continue;

            const row = el('div', { class: 'tree-level-row' });
            levelNodes.forEach(node => {
                const isActive = activeIds.has(node.id);
                const isSelected = selectedId === node.id;
                const nodeEl = createTreeNode(node, isActive, isSelected, t);
                row.appendChild(nodeEl);
                nodesMap.set(node.id, { el: nodeEl, node, level: i });
            });
            levelEls.push(row);
        }

        // Append in reverse order for column-reverse (deepest at top)
        for (let i = levelEls.length - 1; i >= 0; i--) {
            treeWrapper.appendChild(levelEls[i]);
        }

        scrollContainer.appendChild(treeWrapper);
        scrollContainer.appendChild(svgOverlay);
        root.appendChild(scrollContainer);

        // Draw connectors after DOM update
        requestAnimationFrame(() => drawConnectors());
    }

    function createTreeNode(node, isActive, isSelected, t) {
        const status = node.status || 'available';
        let icon = '○';
        let stateClass = 'available';

        if (status === 'completed') { icon = '✕'; stateClass = 'completed'; }
        else if (status === 'closed') { icon = '⬡'; stateClass = 'closed'; }
        else if (isActive) { icon = '◎'; stateClass = 'active'; }
        else if (status === 'locked') { icon = '△'; stateClass = 'locked'; }

        // Tooltip content
        const stageCount = (node.stages || []).length;
        const tooltipText = `${node.name} — ${stageCount} ${t('explore_uxelm_stages')}`;

        const nodeEl = el('div', {
            class: ['tree-node', stateClass, isSelected ? 'selected' : ''],
            dataId: node.id,
            title: tooltipText,
            onClick: (e) => {
                e.stopPropagation();
                if (onNodeClick) onNodeClick(node);
            }
        }, [icon]);

        return nodeEl;
    }

    function drawConnectors() {
        if (!svgOverlay || nodesMap.size === 0) return;
        svgOverlay.innerHTML = '';

        const scrollContainer = root.querySelector('.tree-scroll-container');
        if (!scrollContainer) return;

        const containerRect = scrollContainer.getBoundingClientRect();
        if (containerRect.width === 0) return;

        svgOverlay.setAttribute('width', containerRect.width);
        svgOverlay.setAttribute('height', containerRect.height);
        svgOverlay.style.width = containerRect.width + 'px';
        svgOverlay.style.height = containerRect.height + 'px';

        for (const [nodeId, { el: childEl, node }] of nodesMap) {
            if (!node.parentId) continue;
            const parentEntry = nodesMap.get(node.parentId);
            if (!parentEntry) continue;

            const childRect = childEl.getBoundingClientRect();
            const parentRect = parentEntry.el.getBoundingClientRect();

            const x1 = parentRect.left + parentRect.width / 2 - containerRect.left;
            const y1 = parentRect.top + parentRect.height / 2 - containerRect.top;
            const x2 = childRect.left + childRect.width / 2 - containerRect.left;
            const y2 = childRect.top + childRect.height / 2 - containerRect.top;

            const line = el('line', {
                x1, y1, x2, y2,
                stroke: 'rgba(255,255,255,0.15)',
                'stroke-width': '1.5'
            });
            svgOverlay.appendChild(line);
        }
    }

    // Redraw connectors on resize
    const resizeObserver = new ResizeObserver(() => drawConnectors());
    resizeObserver.observe(root);

    return { root, update };
}
