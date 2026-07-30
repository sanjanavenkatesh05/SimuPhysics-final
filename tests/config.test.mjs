import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../lib/config.mjs';

test('config exposes deployment base URL settings', () => {
    assert.equal(typeof config.publicBaseUrl, 'string');
    assert.equal(typeof config.port, 'number');
});
