import { BaseModal } from '../../components/modal/BaseModal.js';
import { el, diffList } from '../../shared/utils/DOMUtils.js';
import { TECHNIQUE_FAMILIES } from '../../../../engine/shared/data/GameConstants.js';
import { Hero } from '../../../../engine/heroes/models/Hero.js';

function getFamilyEffectLabel(family, tier = 1, t) {
    switch (family.id) {
        case 'single_strike':
            return t('effect_basic_attack') || 'Basic attack';
        case 'multiple_attack': {
            const hits = Math.max(1, tier);
            const perHit = Math.max(0.4, family.baseMult - family.hitDecay * Math.max(0, tier - 2));
            return `${hits} ${t('effect_hits') || 'hits'} · ${(hits * perHit).toFixed(1)}×`;
        }
        case 'power_strike': {
            const mult = family.baseMult + family.growth * (tier - 1);
            return `${mult.toFixed(1)}× ${t('effect_power') || 'power'}`;
        }
        case 'cleave':
            return t('effect_cleave') || 'Cleave';
        case 'shield_bash':
            return t('effect_stun') || 'Stun';
        case 'poison_strike':
            return t('effect_poison') || 'Poison';
        case 'plunder':
            return t('effect_steal') || 'Steal';
        default:
            return '';
    }
}

export class HeroSkillsModal {
    static show(hero, t, onLearnFamily) {
        if (!hero) return;

        const knownFamilies = hero.knownFamilies || ['single_strike'];
        const canManageSkills = hero.activity === 'idle';
        const allFamilies = Object.values(TECHNIQUE_FAMILIES);
        const knownFamilyIds = new Set(knownFamilies);
        const knownList = allFamilies.filter(f => knownFamilyIds.has(f.id));
        const lockedList = allFamilies.filter(f => !knownFamilyIds.has(f.id) && f.id !== 'single_strike');

        knownList.sort((a, b) => {
            const tierA = hero.techniqueTiers && hero.techniqueTiers[a.id] || 1;
            const tierB = hero.techniqueTiers && hero.techniqueTiers[b.id] || 1;
            return tierB - tierA;
        });

        const skillsContainer = el('div', { class: 'skills-list' });

        // Skill points alert inside modal
        const milestones = Hero.SKILL_POINT_MILESTONES || [1, 5, 10, 15, 20, 25];
        const nextMilestone = milestones.find(m => m > hero.level);
        let alertText = '';
        if (hero.skillPoints > 0 && canManageSkills) {
            alertText = t('ui_skill_points').replace('{amount}', hero.skillPoints) + ' · ' + (t('ui_spend_to_unlock') || 'Spend to unlock a new technique');
        } else if (nextMilestone) {
            alertText = t('ui_next_skill_point').replace('{level}', nextMilestone);
        } else {
            alertText = t('ui_max_families') || 'All techniques unlocked';
        }
        if (!canManageSkills) {
            alertText += ' (' + (t('ui_busy') || 'Busy') + ')';
        }

        const alertEl = el('div', {
            class: 'skill-points-alert',
            style: {
                marginBottom: '12px',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem'
            }
        }, [el('strong', {}, [alertText])]);

        const newSkillRows = [];

        knownList.forEach(family => {
            const familyId = family.id;
            const tier = hero.techniqueTiers && hero.techniqueTiers[familyId] || 1;
            const staCost = family.staminaCostBase + family.staminaCostPerTier * (tier - 1);
            const uses = hero.techniqueUses && hero.techniqueUses[familyId] || 0;
            const isBodyInscribed = hero.bodyInscription && hero.bodyInscription.glyphIds && hero.bodyInscription.glyphIds.length > 0;

            const cumulativeToCurrent = tier <= 1 ? 0 : 50 * (Math.pow(3, tier - 1) - 1);
            const tierThreshold = Math.floor(100 * Math.pow(3, tier - 1));
            const usesInTier = Math.max(0, uses - cumulativeToCurrent);
            const tierProgress = Math.min(100, Math.floor((usesInTier / tierThreshold) * 100));

            const isJustLeveled = (usesInTier === 0 && tier > 1);
            const flashClass = isJustLeveled ? 'tier-up-flash' : '';
            const effectLabel = getFamilyEffectLabel(family, tier, t);

            const row = el('div', {
                class: `skill-item skill-learned ${isBodyInscribed ? 'skill-inscribed' : ''}`,
                'data-id': familyId
            }, [
                el('div', { class: 'skill-info', style: { flex: '1', paddingRight: '15px' } }, [
                    el('span', { class: 'skill-name' }, [`${t('family_' + familyId)}${isBodyInscribed ? ' · ✦' : ''}`]),
                    el('span', { class: 'skill-meta' }, [`${effectLabel ? effectLabel + ' · ' : ''}${staCost} STA`]),
                    el('div', { class: 'skill-tier-progress-container', style: { marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' } }, [
                        el('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '2px' } }, [
                            el('span', {}, [t('ui_tier_progress') || 'Tier Progress'])
                        ]),
                        el('div', { class: `skill-tier-bar ${flashClass}`, style: { height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', position: 'relative' } }, [
                            el('div', { style: { width: `${tierProgress}%`, height: '100%', background: 'var(--accent-color)', borderRadius: '3px', transition: 'width 0.3s ease' } })
                        ])
                    ])
                ]),
                el('div', { class: 'skill-actions', style: { display: 'flex', alignItems: 'center' } }, [
                    el('span', { class: `skill-tier-badge ${flashClass}` }, [`Tier ${tier}`])
                ])
            ]);
            newSkillRows.push(row);
        });

        if (lockedList.length > 0) {
            newSkillRows.push(el('div', {
                class: 'skill-section-divider',
                'data-id': 'divider_locked',
                style: { margin: '12px 0', paddingTop: '8px', borderTop: '1px dashed var(--glass-border)' }
            }, [
                el('span', { style: { fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' } }, [t('ui_locked_families') || 'Locked'])
            ]));

            lockedList.forEach(family => {
                const familyId = family.id;
                const canLearn = canManageSkills && hero.skillPoints > 0 && knownFamilies.length < 6;
                const actionNode = canLearn
                    ? el('button', { class: 'btn btn-primary btn-sm btn-learn-family', onClick: () => onLearnFamily(familyId) }, [t('ui_learn') || 'Learn'])
                    : el('span', { class: 'skill-locked-label' }, [t('ui_locked') || 'Locked']);

                const lockedEffect = getFamilyEffectLabel(family, 1, t);
                const row = el('div', {
                    class: 'skill-item skill-locked',
                    'data-id': familyId
                }, [
                    el('div', { class: 'skill-info' }, [
                        el('span', { class: 'skill-name' }, [`🔒 ${t('family_' + familyId)}`]),
                        el('span', { class: 'skill-meta' }, [`${lockedEffect ? lockedEffect + ' · ' : ''}${family.staminaCostBase} STA`])
                    ]),
                    el('div', { class: 'skill-actions' }, [actionNode])
                ]);
                newSkillRows.push(row);
            });
        }

        diffList(skillsContainer, newSkillRows, 'data-id');

        const contentElement = el('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } }, [
            alertEl,
            skillsContainer
        ]);

        BaseModal.show({
            title: t('ui_hero_skills_title').replace('{name}', hero.name) || `${hero.name}'s Skills`,
            contentElement,
            icon: '⚔️',
            maxWidth: '520px'
        });
    }
}
