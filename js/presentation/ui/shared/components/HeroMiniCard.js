import { el } from '../utils/DOMUtils.js';

/**
 * Creates a reusable Hero card component with variants.
 * @param {Object} props
 * @param {Object} props.hero - Hero data model
 * @param {string} [props.variant='list'] - 'list' | 'header' | 'defense-chip'
 * @param {boolean} [props.selected=false] - If active/selected (mainly for list variant)
 * @param {Function} props.onClick - Click event callback
 * @param {Function} props.t - Translation function
 * @returns {{root: HTMLElement, refs: Object, update: Function}}
 */
export function createHeroMiniCard({ hero, variant = 'list', selected = false, onClick = null, t }) {
    let root;
    let refs = {};

    const getLevelText = (lvl) => `${t('ui_level') || 'Level'} ${lvl}`;
    const getActivityEmoji = (act) => act === 'idle' ? '💤' : '⚔️';
    const getActivityTitle = (act) => act === 'idle' 
        ? (t('ui_activity_idle') || 'Idle')
        : (t('ui_activity_expedition') || 'On Expedition');

    if (variant === 'list') {
        const titleRef = el('span', { class: 'list-item-title' }, [hero.name]);
        const levelRef = el('span', { class: 'list-item-level' }, [getLevelText(hero.level)]);
        const activityRef = el('span', {
            class: 'hero-activity-badge',
            title: getActivityTitle(hero.activity)
        }, [getActivityEmoji(hero.activity)]);

        const mealRef = el('span', {
            class: 'hero-activity-badge',
            title: t('ui_has_meal_buff') || 'Meal buff active',
            style: {
                marginLeft: '4px',
                display: (hero.mealBuffs && hero.mealBuffs.length > 0) ? 'inline-block' : 'none'
            }
        }, ['🍖']);

        refs = { title: titleRef, level: levelRef, activity: activityRef, meal: mealRef };

        root = el('div', {
            class: `list-item hero-card ${selected ? 'active' : ''}`,
            'data-id': hero.id,
            onClick: onClick ? (e) => onClick(hero.id, e) : null
        }, [
            el('div', { class: 'list-item-header' }, [
                titleRef,
                levelRef,
                activityRef,
                mealRef
            ])
        ]);

        root.update = (newHero, newSelected) => {
            if (newHero) {
                titleRef.textContent = newHero.name;
                levelRef.textContent = getLevelText(newHero.level);
                activityRef.textContent = getActivityEmoji(newHero.activity);
                activityRef.title = getActivityTitle(newHero.activity);
                mealRef.style.display = (newHero.mealBuffs && newHero.mealBuffs.length > 0) ? 'inline-block' : 'none';
            }
            if (newSelected !== undefined) {
                root.classList.toggle('active', newSelected);
            }
        };

    } else if (variant === 'header') {
        const titleRef = el('h3', { style: { margin: 0, fontSize: '1.1rem', color: 'var(--accent-color)' } }, [hero.name]);
        const levelRef = el('span', { style: { fontSize: '0.8rem', color: 'var(--text-muted)' } }, [
            `${getLevelText(hero.level)} | ${getActivityTitle(hero.activity)}`
        ]);

        refs = { title: titleRef, level: levelRef };

        root = el('div', {
            class: 'hero-card-header-variant',
            style: {
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            },
            onClick: onClick ? (e) => onClick(hero.id, e) : null
        }, [
            el('span', { style: { fontSize: '1.8rem', filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.2))' } }, ['🦸']),
            el('div', {}, [
                titleRef,
                levelRef
            ])
        ]);

        root.update = (newHero) => {
            if (newHero) {
                titleRef.textContent = newHero.name;
                levelRef.textContent = `${getLevelText(newHero.level)} | ${getActivityTitle(newHero.activity)}`;
            }
        };

    } else {
        // defense-chip
        const labelRef = el('span', {}, [`🛡️ ${hero.name} (Lvl ${hero.level})`]);
        refs = { label: labelRef };

        root = el('div', {
            class: 'hero-defense-chip',
            style: {
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                fontSize: '0.8rem',
                color: 'var(--text-primary)'
            },
            onClick: onClick ? (e) => onClick(hero.id, e) : null
        }, [labelRef]);

        root.update = (newHero) => {
            if (newHero) {
                labelRef.textContent = `🛡️ ${newHero.name} (Lvl ${newHero.level})`;
            }
        };
    }

    return {
        root,
        refs,
        update: root.update
    };
}
