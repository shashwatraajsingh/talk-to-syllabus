/* src/services/pdfProcessor.js REFRACTORED FOR MYSQL + PINECONE */

const fs = require('fs');
const pdfParse = require('pdf-parse');
const { query, getConnection } = require('../config/database');
const { generateEmbeddings } = require('./embedding');
const { upsertVectors } = require('./pinecone');

/**
 * Chunk text (unchanged logic)
 */
function chunkText(text, chunkSize = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        let end = start + chunkSize;
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('.', end);
            const lastNewline = text.lastIndexOf('\n', end);
            const breakPoint = Math.max(lastPeriod, lastNewline);
            if (breakPoint > start + chunkSize * 0.5) end = breakPoint + 1;
        }
        const chunk = text.slice(start, end).trim();
        if (chunk.length > 50) chunks.push(chunk);
        start = end - overlap;
    }
    return chunks;
}

/**
 * Process PDF: Extract -> Chunk -> Embed -> Store in MySQL (metadata) + Pinecone (vectors)
 */
async function processPDF(documentId, filePath) {
    try {
        // 1. Get document metadata from MySQL
        const [rows] = await query('SELECT title, course_name FROM documents WHERE id = ?', [documentId]);
        if (rows.length === 0) throw new Error('Document not found');
        const docMeta = rows[0];

        // Mark as processing
        await query('UPDATE documents SET processing_status = ?, updated_at = NOW() WHERE id = ?', ['processing', documentId]);

        // 2. Extract Text
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        const fullText = pdfData.text;
        const pageCount = pdfData.numpages;

        await query('UPDATE documents SET page_count = ? WHERE id = ?', [pageCount, documentId]);

        // 3. Chunk + Embed
        const chunks = chunkText(fullText);
        if (chunks.length === 0) throw new Error('No text found in PDF');

        console.log(`📄 Extracted ${chunks.length} chunks. Generating embeddings...`);
        const embeddings = await generateEmbeddings(chunks);

        // 4. Prepare vectors for Pinecone
        const vectors = chunks.map((chunk, i) => ({
            id: `${documentId}_${i}`, // Unique ID: docId_chunkIndex
            values: embeddings[i],
            metadata: {
                document_id: documentId,
                document_title: docMeta.title,
                course_name: docMeta.course_name || '',
                text: chunk,
                page_number: 1, // pdf-parse basic usage doesn't give per-page text easily, defaulting to 1 or would need robust logic
                chunk_index: i,
            },
        }));

        // 5. Upsert to Pinecone (batching in 100s if needed, Pinecone handles decent batch sizes)
        // Pinecone rec limit is usually 1000 vectors per call, safely do 100
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            await upsertVectors(batch);
        }

        // 6. Mark complete in MySQL
        await query(
            'UPDATE documents SET processing_status = ?, processed_at = NOW(), total_chunks = ?, updated_at = NOW() WHERE id = ?',
            ['completed', chunks.length, documentId]
        );

        console.log(`✅ Document ${documentId} processed successfully.`);
        return { chunks: chunks.length, pages: pageCount };

    } catch (error) {
        console.error(`❌ Processing failed for ${documentId}:`, error);
        await query(
            'UPDATE documents SET processing_status = ?, processing_error =?, updated_at = NOW() WHERE id = ?',
            ['failed', error.message.substring(0, 255), documentId]
        );
        throw error;
    }
}

module.exports = { processPDF, chunkText };
