import './setup.js';
import test from 'node:test';
import assert from 'node:assert';
import { PresentationModal } from '../../js/presentation/ui/shared/components/PresentationModal.js';

test('PresentationModal DOM Tests', async (t) => {
    const mockI18n = {
        t: (key) => {
            if (key === 'pres_ui_next') return 'Next';
            if (key === 'pres_ui_back') return 'Back';
            if (key === 'pres_ui_finish') return 'Continue';
            if (key === 'pres_ui_skip') return 'Skip';
            return `[${key}]`;
        }
    };

    t.beforeEach(() => {
        // Clear document body before each test to prevent shared DOM state issues
        document.body.innerHTML = '';
    });

    t.afterEach(() => {
        // Clear document body after each test
        document.body.innerHTML = '';
    });

    await t.test('mounts, renders first page, updates on next click, and completes', (t, done) => {
        const modal = new PresentationModal(mockI18n);
        let completed = false;
        let completedId = null;

        modal.open('pres_prologue', (id) => {
            completed = true;
            completedId = id;
            done();
        });

        // 1. First page check
        const overlay = document.querySelector('.presentation-overlay');
        assert.ok(overlay, 'Overlay should be mounted in document.body');
        
        const nextBtn = overlay.querySelector('#pres-btn-next');
        const backBtn = overlay.querySelector('#pres-btn-back');
        const textElement = overlay.querySelector('.presentation-text p');
        const dots = overlay.querySelectorAll('.presentation-dot');

        assert.strictEqual(nextBtn.textContent.trim(), 'Next');
        assert.strictEqual(backBtn.style.visibility, 'hidden', 'Back button should be hidden on page 1');
        assert.strictEqual(textElement.textContent, '[pres_prologue_p1]');
        assert.strictEqual(dots.length, 3);
        assert.ok(dots[0].classList.contains('active'), 'First dot should be active');

        // 2. Click next -> page 2
        nextBtn.click();
        
        const textElementP2 = document.querySelector('.presentation-text p');
        const backBtnP2 = document.querySelector('#pres-btn-back');
        const dotsP2 = document.querySelectorAll('.presentation-dot');
        const nextBtnP2 = document.querySelector('#pres-btn-next');

        assert.strictEqual(textElementP2.textContent, '[pres_prologue_p2]');
        assert.strictEqual(backBtnP2.style.visibility, '', 'Back button should be visible on page 2');
        assert.ok(dotsP2[1].classList.contains('active'), 'Second dot should be active');
        assert.strictEqual(nextBtnP2.textContent.trim(), 'Next');

        // 3. Click next -> page 3 (last page)
        nextBtnP2.click();

        const textElementP3 = document.querySelector('.presentation-text p');
        const nextBtnP3 = document.querySelector('#pres-btn-next');
        const dotsP3 = document.querySelectorAll('.presentation-dot');

        assert.strictEqual(textElementP3.textContent, '[pres_prologue_p3]');
        assert.strictEqual(nextBtnP3.textContent.trim(), 'Continue', 'Last button should be Continue/Finish');
        assert.ok(dotsP3[2].classList.contains('active'), 'Third dot should be active');

        // 4. Click finish
        nextBtnP3.click();

        assert.strictEqual(completed, true, 'onComplete callback should be executed');
        assert.strictEqual(completedId, 'pres_prologue');
    });

    await t.test('skips presentation on skip click', (t, done) => {
        const modal = new PresentationModal(mockI18n);
        let completed = false;

        modal.open('pres_prologue', () => {
            completed = true;
            done();
        });

        const skipBtn = document.querySelector('#pres-btn-skip');
        assert.ok(skipBtn, 'Skip button should exist');
        skipBtn.click();

        assert.strictEqual(completed, true, 'onComplete callback should execute when skipped');
    });

    await t.test('handles non-existent presentation gracefully without throwing', (t, done) => {
        const modal = new PresentationModal(mockI18n);
        let completed = false;

        modal.open('invalid_id', (id) => {
            completed = true;
            assert.strictEqual(id, 'invalid_id');
            done();
        });

        assert.strictEqual(completed, true, 'onComplete should immediately run if presentation does not exist');
    });
});
