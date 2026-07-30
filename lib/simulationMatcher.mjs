import cosineSimilarity from 'compute-cosine-similarity';

export function selectBestSimulation(promptEmbedding, simulations) {
    const scores = [];
    let bestMatch = null;
    let bestScore = -Infinity;

    for (const sim of simulations) {
        const score = cosineSimilarity(promptEmbedding, sim.embedding);
        scores.push({ name: sim.name, score });

        if (score > bestScore) {
            bestScore = score;
            bestMatch = sim;
        }
    }

    scores.sort((a, b) => b.score - a.score);

    return {
        bestMatch,
        bestScore,
        scores
    };
}
