const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const pool = require('../config/database');
const { generateEmbeddings } = require('./embedding');
const { upsertVectors } = require('./pinecone');

/**
 * Process PDF: Extract text, chunk, embed, store in Pinecone
 */
async function processPDF(documentId, filePath) {
    let client;
    try {
        client = await pool.connect();

        // Update status
        await client.query('UPDATE documents SET processing_status = $1 WHERE id = $2', ['processing', documentId]);

        // Fetch metadata
        const docResult = await client.query('SELECT title, user_id, course_name FROM documents WHERE id = $1', [documentId]);
        if (docResult.rows.length === 0) throw new Error('Document not found');
        const doc = docResult.rows[0];

        // Parse PDF
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);

        const pageCount = data.numpages;
        const fullText = data.text;

        // Chunk text
        const chunks = chunkText(fullText, 500, 100);
        console.log(`📄 Document ${documentId}: ${chunks.length} chunks from ${pageCount} pages`);

        // Generate embeddings
        const embeddings = await generateEmbeddings(chunks);

        // Prepare vectors for Pinecone
        const vectors = chunks.map((chunkText, i) => ({
            id: `${documentId}_chunk_${i}`,
            values: embeddings[i],
            metadata: {
                document_id: documentId,
                chunk_text: chunkText,
                chunk_index: i,
                document_title: doc.title,
                course_name: doc.course_name || '',
                user_id: doc.user_id,
            }
        }));

        console.log(`📦 Prepared ${vectors.length} vectors for Pinecone`);

        // Batch upsert to Pinecone
        const batchSize = 100;
        for (let i = 0; i < vectors.length; i += batchSize) {
            const batch = vectors.slice(i, i + batchSize);
            if (batch.length > 0) {
                console.log(`  Upserting batch ${Math.floor(i / batchSize) + 1}: ${batch.length} vectors`);
                await upsertVectors(batch);
            }
        }

        // Update document status
        await client.query(
            `UPDATE documents 
             SET processing_status = $1, total_chunks = $2, page_count = $3, processed_at = NOW() 
             WHERE id = $4`,
            ['completed', chunks.length, pageCount, documentId]
        );

        console.log(`✅ Document ${documentId} processed successfully`);

    } catch (error) {
        console.error(`❌ PDF processing failed for ${documentId}:`, error);
        if (client) {
            await client.query(
                'UPDATE documents SET processing_status = $1, processing_error = $2 WHERE id = $3',
                ['failed', error.message, documentId]
            );
        }
        throw error;
    } finally {
        if (client) client.release();
    }
}

/**
 * Chunk text into smaller segments
 */
function chunkText(text, maxChunkSize = 500, overlap = 100) {
    const sentences = text.match(/[^\.!\?]+[\.!\?]+/g) || [text];
    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
        if ((currentChunk + sentence).length > maxChunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            const words = currentChunk.split(' ');
            currentChunk = words.slice(-Math.floor(overlap / 5)).join(' ') + ' ' + sentence;
        } else {
            currentChunk += ' ' + sentence;
        }
    }

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks.filter(c => c.length > 20);
}

module.exports = { processPDF };
