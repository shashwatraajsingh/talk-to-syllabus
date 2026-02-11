const fs = require('fs').promises;
const path = require('path');
const { processPDF } = require('./src/services/pdfProcessor');
const pool = require('./src/config/database');
require('dotenv').config();

async function setupDefaultDocument() {
    const client = await pool.connect();

    try {
        console.log('📄 Setting up default document: Unit 1 Cyber Security...\n');

        // Create a default user if not exists (for system documents)
        const userResult = await client.query(`
            INSERT INTO auth.users (id, email)
            VALUES ('00000000-0000-0000-0000-000000000001', 'system@talktosyllabus.com')
            ON CONFLICT (id) DO NOTHING
            RETURNING id
        `);

        const userId = '00000000-0000-0000-0000-000000000001';

        // Check if document already exists
        const existingDoc = await client.query(
            'SELECT id FROM documents WHERE file_name = $1',
            ['unit 1_PPT.pdf']
        );

        if (existingDoc.rows.length > 0) {
            console.log('✅ Default document already exists!');
            console.log('Document ID:', existingDoc.rows[0].id);
            return;
        }

        // Create document record
        const pdfPath = path.join(__dirname, 'src', 'unit 1_PPT.pdf');
        const stats = await fs.stat(pdfPath);

        const docResult = await client.query(`
            INSERT INTO documents (
                user_id, 
                title, 
                description,
                file_name, 
                file_url, 
                file_size_bytes,
                course_name,
                course_code,
                semester,
                processing_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `, [
            userId,
            'Unit 1: Introduction to Cybercrime',
            'Cyber Security Unit 1 - Introduction to Cybercrime and fundamentals',
            'unit 1_PPT.pdf',
            pdfPath,
            stats.size,
            'Cyber Security',
            'CS101',
            'Semester 1',
            'pending'
        ]);

        const documentId = docResult.rows[0].id;
        console.log('✅ Document created with ID:', documentId);
        console.log('📦 Processing PDF and generating embeddings...\n');

        // Process PDF (extract, chunk, embed, upload to Pinecone)
        await processPDF(documentId, pdfPath);

        console.log('\n✅ Default document setup complete!');
        console.log('📚 Unit 1 Cyber Security is now available for chat\n');

    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

setupDefaultDocument();
