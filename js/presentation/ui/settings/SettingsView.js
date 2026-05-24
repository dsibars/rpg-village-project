const DEBUG = false;

import { BaseView } from '../BaseView.js';
import { persistence } from '../../../engine/shared/core/Persistence.js';

/**
 * SettingsView - Manages the game settings and data wiping.
 */
export class SettingsView extends BaseView {
    constructor() {
        super('settings');
    }

    onMount() {
        this.elements = {
            langSelect: this.$('#lang-select'),
            btnWipe: this.$('#btn-wipe-data'),
            btnDevCheat: this.$('#btn-dev-cheat'),
            btnMagicSimulator: this.$('#btn-magic-simulator')
        };

        this.root.addEventListener('click', (e) => {
            const subviewBtn = e.target.closest('[data-subview]');
            if (subviewBtn) {
                this.ui.switchView(subviewBtn.dataset.subview);
                return;
            }
        });

        // Initialize Select with current language
        if (this.elements.langSelect) {
            this.elements.langSelect.value = this.ui.i18n.currentLang;
            
            this.elements.langSelect.addEventListener('change', (e) => {
                const newLang = e.target.value;
                if (DEBUG) console.log(`Settings: Changing language to ${newLang}`);
                this.ui.setLanguage(newLang);
            });
        }

        // Wipe Data logic
        if (this.elements.btnWipe) {
            this.elements.btnWipe.addEventListener('click', () => {
                if (DEBUG) console.log('SettingsView: Wipe button clicked');
                
                this.ui.showConfirmDialog({
                    title: 'ui_settings_wipe_data',
                    message: 'ui_settings_wipe_confirm',
                    onConfirm: () => {
                        if (DEBUG) console.warn('SettingsView: USER CONFIRMED WIPE. Executing persistence.clear()...');
                        persistence.clear();
                        
                        if (DEBUG) console.log('SettingsView: Wipe complete. Reloading page...');
                        // Small delay to ensure logs are processed
                        setTimeout(() => {
                            window.location.reload();
                        }, 100);
                    }
                });
            });
        }

        // Developer Cheat logic
        if (this.elements.btnDevCheat) {
            this.elements.btnDevCheat.addEventListener('click', () => {
                if (DEBUG) console.log('SettingsView: Dev Cheat button clicked');
                this.emit('devCheatActivate', {});

                // Brief visual feedback on the button
                const btn = this.elements.btnDevCheat;
                btn.textContent = '✓ Done!';
                btn.disabled = true;
                setTimeout(() => {
                    btn.innerHTML = '<span class="icon">⚡</span><span>' + (this.t('ui_settings_dev_cheat') || 'Activate Developer Cheat') + '</span>';
                    btn.disabled = false;
                }, 1500);
            });
        }

        // Magic Circle Simulator
        if (this.elements.btnMagicSimulator) {
            this.elements.btnMagicSimulator.addEventListener('click', () => {
                const fakeHero = {
                    id: 'simulator_fake_hero',
                    name: this.t('simulator_hero_name') || 'Archmage Simulator',
                    magicTier: 25,
                    maxMp: 9999,
                    knownGlyphs: [
                        'glyph_fire', 'glyph_water', 'glyph_wind', 'glyph_storm', 'glyph_light', 'glyph_dark', 'glyph_earth',
                        'glyph_potentiate', 'glyph_focus', 'glyph_extend',
                        'glyph_multi', 'glyph_pierce', 'glyph_venom', 'glyph_slumber', 'glyph_aegis', 'glyph_celerity', 'glyph_reflect', 'glyph_leech',
                        'glyph_streamline'
                    ],
                    glyphMastery: {
                        glyph_fire: { tier: 7 },
                        glyph_water: { tier: 7 },
                        glyph_wind: { tier: 7 },
                        glyph_storm: { tier: 7 },
                        glyph_light: { tier: 7 },
                        glyph_dark: { tier: 7 },
                        glyph_earth: { tier: 7 },
                        glyph_potentiate: { tier: 7 },
                        glyph_focus: { tier: 7 },
                        glyph_extend: { tier: 7 },
                        glyph_multi: { tier: 1 },
                        glyph_pierce: { tier: 7 },
                        glyph_venom: { tier: 7 },
                        glyph_slumber: { tier: 7 },
                        glyph_aegis: { tier: 1 },
                        glyph_celerity: { tier: 7 },
                        glyph_reflect: { tier: 7 },
                        glyph_leech: { tier: 7 },
                        glyph_streamline: { tier: 7 }
                    }
                };
                this.ui.openMagicCircleOverlay({
                    heroName: fakeHero.name,
                    magicTier: fakeHero.magicTier,
                    maxMp: fakeHero.maxMp,
                    knownGlyphs: fakeHero.knownGlyphs,
                    glyphMastery: fakeHero.glyphMastery,
                    isSimulator: true
                });
            });
        }
    }

    onUpdate(state) {
        // Gate Magic Circle Simulator behind Arcane Sanctum construction
        const hasSanctum = (state.village?.infrastructure?.arcane_sanctum || 0) >= 1;
        if (this.elements.btnMagicSimulator) {
            this.elements.btnMagicSimulator.style.display = hasSanctum ? 'inline-flex' : 'none';
        }
    }
}
