import test from 'node:test';
import assert from 'node:assert/strict';
import { selectBestSimulation } from '../lib/simulationMatcher.mjs';

test('selectBestSimulation picks the closest simulation', () => {
    const simulations = [
        { name: 'First', embedding: [1, 0], script: 'first.js', parameters: [] },
        { name: 'Second', embedding: [0, 1], script: 'second.js', parameters: [] }
    ];

    const result = selectBestSimulation([1, 0], simulations);

    assert.equal(result.bestMatch.name, 'First');
    assert.equal(result.bestMatch.script, 'first.js');
    assert.equal(result.scores.length, 2);
});
