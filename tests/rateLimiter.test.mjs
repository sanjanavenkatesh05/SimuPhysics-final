import test from 'node:test';
import assert from 'node:assert/strict';
import { isRateLimited } from '../lib/rateLimiter.mjs';

test('blocks requests after the configured limit is reached', () => {
    const key = 'test-client';

    for (let index = 0; index < 10; index += 1) {
        isRateLimited(key, 60000, 10);
    }

    const blocked = isRateLimited(key, 60000, 10);
    assert.equal(blocked, true);
});
