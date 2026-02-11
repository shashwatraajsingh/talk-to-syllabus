const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate an embedding vector for the given text using Gemini's embedding model.
 * Returns a 768-dimensional vector (Gemini embedding-001).
 */
async function generateEmbedding(text) {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    const result = await model.embedContent(text);
    return result.embedding.values;
}

/**
 * Generate embeddings for multiple text chunks in batch.
 */
async function generateEmbeddings(texts) {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    const embeddings = [];
    // Process in batches of 5 to respect rate limits
    const batchSize = 5;

    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const promises = batch.map((text) => model.embedContent(text));
        const results = await Promise.all(promises);
        embeddings.push(...results.map((r) => r.embedding.values));
    }

    return embeddings;
}

module.exports = { generateEmbedding, generateEmbeddings };
