const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate an embedding vector using Gemini 2.5 Flash's text generation
 * We'll use a simple approach: hash the text to create consistent vectors
 * For production, consider using a dedicated embedding service
 */
async function generateEmbedding(text) {
    // Simple embedding: use first 768 chars and convert to numbers
    // This is a placeholder - for production use OpenAI embeddings or similar
    const vector = new Array(768).fill(0);
    for (let i = 0; i < Math.min(text.length, 768); i++) {
        vector[i] = text.charCodeAt(i) / 255.0;
    }
    return vector;
}

/**
 * Generate embeddings for multiple text chunks
 */
async function generateEmbeddings(texts) {
    const promises = texts.map(text => generateEmbedding(text));
    return await Promise.all(promises);
}

module.exports = { generateEmbedding, generateEmbeddings };
