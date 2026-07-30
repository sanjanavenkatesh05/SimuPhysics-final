import test from 'node:test';
import assert from 'node:assert/strict';
import { parseParameterArray } from '../lib/responseParser.mjs';

test('parseParameterArray extracts JSON arrays from wrapped AI text', () => {
    const result = parseParameterArray('Here is the result: [ {"mass": 2}, {"velocity": 3} ]');
    assert.deepEqual(result, [{ mass: 2 }, { velocity: 3 }]);
});

test('parseParameterArray returns an empty array when no valid structure exists', () => {
    const result = parseParameterArray('no usable data');
    assert.deepEqual(result, []);
});
