const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.index(process.env.PINECONE_INDEX || 'talk-to-syllabus');

/**
 * Upsert embeddings into Pinecone (v7 API)
 * @param {Array<Object>} vectors - Array of { id, values, metadata }
 */
async function upsertVectors(vectors) {
    try {
        console.log(`  Debug: Upserting ${vectors.length} vectors to Pinecone`);

        // Pinecone v7 expects just an array of vectors
        const result = await index.namespace('').upsert(vectors);

        console.log(`✅ Upserted ${vectors.length} vectors to Pinecone.`);
        return result;
    } catch (error) {
        console.error('❌ Pinecone Upsert Error:', error);
        console.error('  Vector sample:', JSON.stringify(vectors[0], null, 2).slice(0, 300));
        throw error;
    }
}

/**
 * Query Pinecone for similar vectors
 * @param {Array<number>} vector - Query embedding
 * @param {Object} filter - Metadata filter (e.g., { document_id: "xyz" })
 * @param {number} topK - Number of results to return
 */
async function queryVectors(vector, filter, topK = 5) {
    try {
        const queryResponse = await index.namespace('').query({
            vector,
            topK,
            filter,
            includeMetadata: true,
        });
        return queryResponse.matches;
    } catch (error) {
        console.error('❌ Pinecone Query Error:', error);
        throw error;
    }
}

/**
 * Delete vectors by document ID prefix
 */
async function deleteVectors(documentId) {
    try {
        // Pinecone delete by metadata filter
        await index.namespace('').deleteMany({ filter: { document_id: { $eq: documentId } } });
        console.log(`🗑️ Deleted vectors for document ${documentId}`);
    } catch (error) {
        console.error('❌ Pinecone Delete Error:', error);
    }
}

module.exports = { upsertVectors, queryVectors, deleteVectors };
