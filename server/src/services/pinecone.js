const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

// Make Pinecone optional - don't crash if API key is missing
let index = null;

if (process.env.PINECONE_API_KEY) {
    try {
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        index = pinecone.index(process.env.PINECONE_INDEX || 'talk-to-syllabus');
        console.log('✅ Pinecone connected');
    } catch (error) {
        console.warn('⚠️  Pinecone initialization failed:', error.message);
    }
} else {
    console.warn('⚠️  PINECONE_API_KEY not set — Pinecone disabled (using direct PDF context instead)');
}

/**
 * Upsert embeddings into Pinecone
 */
async function upsertVectors(vectors) {
    if (!index) {
        console.warn('⚠️  Pinecone not available, skipping upsert');
        return;
    }
    try {
        await index.namespace('').upsert(vectors);
        console.log(`✅ Upserted ${vectors.length} vectors to Pinecone.`);
    } catch (error) {
        console.error('❌ Pinecone Upsert Error:', error.message);
        throw error;
    }
}

/**
 * Query Pinecone for similar vectors
 */
async function queryVectors(vector, filter, topK = 5) {
    if (!index) {
        console.warn('⚠️  Pinecone not available, returning empty results');
        return [];
    }
    try {
        const queryResponse = await index.namespace('').query({
            vector,
            topK,
            filter,
            includeMetadata: true,
        });
        return queryResponse.matches;
    } catch (error) {
        console.error('❌ Pinecone Query Error:', error.message);
        return [];
    }
}

/**
 * Delete vectors by document ID
 */
async function deleteVectors(documentId) {
    if (!index) return;
    try {
        await index.namespace('').deleteMany({ filter: { document_id: { $eq: documentId } } });
        console.log(`🗑️ Deleted vectors for document ${documentId}`);
    } catch (error) {
        console.error('❌ Pinecone Delete Error:', error.message);
    }
}

module.exports = { upsertVectors, queryVectors, deleteVectors };
