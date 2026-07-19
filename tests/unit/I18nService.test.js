globalThis.localStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {},
    clear() {}
};

import test from 'node:test';
import assert from 'node:assert';
import { I18nService } from '../../js/engine/shared/core/i18n/I18nService.js';

test('I18nService: replaces every occurrence of a param, not just the first', () => {
    const service = new I18nService();
    service.translations.en.__test_repeat = '{x} and {x} again';
    const result = service.t('__test_repeat', { x: 'gold' });
    assert.strictEqual(result, 'gold and gold again');
});

test('I18nService: missing key renders as raw key (diagnostic mode)', () => {
    const service = new I18nService();
    assert.strictEqual(service.t('__definitely_missing__'), '__definitely_missing__');
});

test('I18nService: converts escaped newlines', () => {
    const service = new I18nService();
    service.translations.en.__test_newline = 'line one\\nline two';
    assert.strictEqual(service.t('__test_newline'), 'line one\nline two');
});
