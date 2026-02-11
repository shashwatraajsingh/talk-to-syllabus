/* src/services/rag.js REFRACTORED FOR MYSQL + PINECONE */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { queryVectors } = require('./pinecone');
const { generateEmbedding } = require('./embedding');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Search for the most relevant document chunks using Pinecone vector similarity.
 */
async function retrieveRelevantChunks(queryText, documentId = null, limit = 5) {
    // Generate embedding for the user's query
    const queryEmbedding = await generateEmbedding(queryText);

    // Build filter for Pinecone
    const filter = {};
    if (documentId) {
        filter.document_id = { $eq: documentId };
    }

    // Query Pinecone
    const matches = await queryVectors(queryEmbedding, filter, limit);

    // Map Pinecone results to a cleaner format
    return matches.map((match) => ({
        id: match.id,
        similarity: match.score,
        chunk_text: match.metadata.text,
        page_number: match.metadata.page_number,
        document_title: match.metadata.document_title,
        course_name: match.metadata.course_name,
        chunk_index: match.metadata.chunk_index,
        metadata: match.metadata,
    }));
}

/**
 * Generate an AI response using retrieved context (Generation).
 * (Unchanged logic, just updated imports/flow if needed)
 */
async function generateRAGResponse(userQuery, retrievedChunks, chatHistory = []) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build context from retrieved chunks
    const contextParts = retrievedChunks.map((chunk, i) => {
        const source = chunk.document_title || 'Unknown Document';
        const page = chunk.page_number ? ` (Page ${chunk.page_number})` : '';
        return `[Source ${i + 1}: ${source}${page}]\n${chunk.chunk_text}`;
    });

    const context = contextParts.join('\n\n---\n\n');

    const systemPrompt = `You are "Talk-to-Syllabus", an intelligent academic assistant. 
Answer questions ONLY based on the provided syllabus context below. 
If the answer is not found, say so. 
Cite sources/pages when possible.

CONTEXT:
${context}`;

    const contents = [];
    for (const msg of chatHistory) {
        contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        });
    }
    contents.push({ role: 'user', parts: [{ text: userQuery }] });

    const result = await model.generateContent({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    });

    const response = result.response;
    const usage = response.usageMetadata;

    return {
        content: response.text(),
        model: 'gemini-2.5-flash',
        promptTokens: usage?.promptTokenCount || 0,
        completionTokens: usage?.candidatesTokenCount || 0,
        totalTokens: usage?.totalTokenCount || 0,
    };
}

module.exports = { retrieveRelevantChunks, generateRAGResponse };
