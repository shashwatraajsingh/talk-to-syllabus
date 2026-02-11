/* src/services/rag.js - Direct PDF context + Gemini 2.5 Flash */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Cache the PDF text in memory so we don't re-read it every time
let cachedPdfText = null;

/**
 * Load the default PDF text (Unit 1 Cyber Security)
 */
async function loadDefaultPdfText() {
    if (cachedPdfText) return cachedPdfText;

    const pdfPath = path.join(__dirname, '..', 'unit 1_PPT.pdf');

    if (!fs.existsSync(pdfPath)) {
        console.warn('⚠️  Default PDF not found at:', pdfPath);
        return '';
    }

    try {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdfParse(dataBuffer);
        cachedPdfText = data.text;
        console.log(`📄 Loaded PDF: ${data.numpages} pages, ${cachedPdfText.length} chars`);
        return cachedPdfText;
    } catch (error) {
        console.error('❌ Failed to load PDF:', error.message);
        return '';
    }
}

/**
 * Retrieve relevant context - uses the default PDF directly
 * No Pinecone needed!
 */
async function retrieveRelevantChunks(queryText, documentId = null, limit = 5) {
    const pdfText = await loadDefaultPdfText();

    // Return the full PDF text as a single chunk since it's small
    return [{
        id: 'unit1-cybersecurity',
        similarity: 1.0,
        chunk_text: pdfText,
        page_number: null,
        document_title: 'Unit 1: Introduction to Cybercrime',
        course_name: 'Cyber Security (BCC-301/BCC-401)',
        chunk_index: 0,
        metadata: {}
    }];
}

/**
 * Generate an AI response using Gemini 2.5 Flash with the PDF context
 */
async function generateRAGResponse(userQuery, retrievedChunks, chatHistory = []) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build context from PDF text
    const context = retrievedChunks.map(chunk => chunk.chunk_text).join('\n\n');

    const systemPrompt = `You are "Talk-to-Syllabus", an intelligent academic assistant for BTech students.
You specialize in answering questions about Cyber Security - Unit 1: Introduction to Cybercrime.

Answer questions based on the provided syllabus content below. Be thorough, clear, and educational.
If the content doesn't cover a topic, say so politely and stick to what's available.
Use markdown formatting for better readability.
Include relevant examples when helpful.

SYLLABUS CONTENT:
${context}

IMPORTANT: This is from AKTU BTech syllabus, course codes BCC-301 (3rd Sem) / BCC-401 (4th Sem).`;

    const contents = [];
    for (const msg of chatHistory.slice(-8)) {
        contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
        });
    }
    contents.push({ role: 'user', parts: [{ text: userQuery }] });

    const result = await model.generateContent({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
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
