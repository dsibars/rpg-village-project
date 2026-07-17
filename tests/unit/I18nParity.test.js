/**
 * I18n locale parity — every locale must expose exactly the same key set as `en`.
 * Missing keys render as raw key names in the UI (no fallback), so drift is a
 * user-facing bug. Extra keys are reported too (usually stale or misfiled).
 */
import { test } from 'node:test';
import assert from 'node:assert';
import { en } from '../../js/engine/shared/core/i18n/translations/en.js';
import { es } from '../../js/engine/shared/core/i18n/translations/es.js';
import { ca } from '../../js/engine/shared/core/i18n/translations/ca.js';
import { eu } from '../../js/engine/shared/core/i18n/translations/eu.js';
import { gl } from '../../js/engine/shared/core/i18n/translations/gl.js';

const locales = { es, ca, eu, gl };

test('I18n: all locales have key parity with en', () => {
    const enKeys = Object.keys(en);
    for (const [name, dict] of Object.entries(locales)) {
        const missing = enKeys.filter(k => !Object.prototype.hasOwnProperty.call(dict, k));
        const extra = Object.keys(dict).filter(k => !Object.prototype.hasOwnProperty.call(en, k));
        assert.deepStrictEqual(missing, [], `${name} is missing keys: ${missing.join(', ')}`);
        assert.deepStrictEqual(extra, [], `${name} has extra keys: ${extra.join(', ')}`);
    }
});
