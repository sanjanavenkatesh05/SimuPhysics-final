import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldAllowPrompt } from '../lib/promptGate.mjs';

test('allows physics-related prompts', () => {
    const result = shouldAllowPrompt('How do I solve a projectile motion problem with velocity 10 m/s?');
    assert.equal(result.allowed, true);
});

test('rejects non-physics prompts', () => {
    const result = shouldAllowPrompt('Write me a poem about the ocean.');
    assert.equal(result.allowed, false);
});
