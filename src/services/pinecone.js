const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config();

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});

const index = pinecone.index(process.env.PINECONE_INDEX || 'talk-to-syllabus');

/**
 * Upsert embeddings into Pinecone
 * @param {Array<Object>} vectors - Array of { id, values, metadata }
 */
async function upsertVectors(vectors) {
    try {
        await index.upsert(vectors);
        console.log(`✅ Upserted ${vectors.length} vectors to Pinecone.`);
    } catch (error) {
        console.error('❌ Pinecone Upsert Error:', error);
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
        const queryResponse = await index.query({
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
        await index.deleteMany({ filter: { document_id: { $eq: documentId } } });
        console.log(`🗑️ Deleted vectors for document ${documentId}`);
    } catch (error) {
        console.error('❌ Pinecone Delete Error:', error);
    }
}

module.exports = { upsertVectors, queryVectors, deleteVectors };
