# 📚 Talk-to-Syllabus - Complete Feature Guide

## ✨ Key Features

### 1. 🔐 **Authentication (Supabase Auth)**
- **Sign Up**: Create account with email & password
- **Login**: Secure JWT-based session management
- **Password Reset**: Built-in via Supabase email
- **Session Persistence**: Stay logged in across browser sessions

**Location**: Login/Signup page at app launch

---

### 2. 📄 **PDF Document Management**

#### Upload PDFs
**Where to Upload:**
- **Option 1**: Click **"Upload"** button in left sidebar
- **Option 2**: Click **"+ Upload Document"** in Documents page

**What You Can Upload:**
- Course syllabi
- Lecture notes
- Study materials
- Any educational PDF (max 20MB)

**Document Features:**
- ✅ Automatic text extraction
- ✅ Add course metadata (course name, code, semester)
- ✅ Processing status tracking
- ✅ View all uploaded documents
- ✅ Delete documents
- ✅ Share with other students (coming soon)

---

### 3. 🤖 **AI-Powered RAG Chat**

**How It Works:**
1. Upload your PDF → System extracts & chunks text
2. Generates embeddings using Google Gemini
3. Stores vectors in Pinecone for fast search
4. When you ask a question:
   - Searches for relevant passages
   - Sends context to Gemini AI
   - Returns accurate, cited answers

**Chat Features:**
- ✅ Context-aware responses
- ✅ Source citations with page numbers
- ✅ Chat history persistence
- ✅ Multiple chat sessions per document
- ✅ Follow-up questions with memory

**Smart Suggestions:**
- Exam schedules
- Grading policies
- Course topics
- Prerequisites

---

### 4. 🎓 **BTech Year Selector**

**NEW! Located above the chat input**

Select your current BTech year (1-4) to customize:
- Relevant course recommendations
- Year-specific document filtering
- Tailored responses based on curriculum level

**How to Use:**
- Click on year buttons (1, 2, 3, or 4) above the chat input
- Active year is highlighted with purple gradient
- Changes apply immediately to your session

---

### 5. 💬 **Session Management**

- Create multiple chat sessions
- Auto-generated session titles
- Link chats to specific documents
- View chat history
- Delete/archive old sessions
- Track message count and timestamps

---

### 6. 🎨 **Modern UI/UX**

**Design Highlights:**
- **AI-Native Theme**: Purple (#7c3aed) + Cyan (#06b6d4) accents
- **Glassmorphism**: Translucent surfaces with backdrop blur
- **Floating Input**: Modern chat interface
- **Smooth Animations**: Micro-interactions for better UX
- **Dark Mode**: Optimized for extended study sessions
- **Responsive**: Works on desktop, tablet, and mobile

---

## 🚀 Quick Start Guide

### For Students:

1. **Sign Up** → Create your account
2. **Upload PDF** → Click sidebar "Upload" button
3. **Fill Details** → Add course info
4. **Wait for Processing** → Usually 30-60 seconds
5. **Start Chat** → Click on your document
6. **Select Year** → Choose your BTech year (1-4)
7. **Ask Questions** → Get AI-powered answers!

---

## 📊 Technical Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (JWT)
- **Vector DB**: Pinecone (768-dim embeddings)
- **AI Model**: Google Gemini API
- **PDF Processing**: pdf-parse + custom chunking

---

## 🔒 Privacy & Security

- ✅ Documents are private by default
- ✅ Encrypted connections (HTTPS)
- ✅ Secure password hashing
- ✅ JWT-based authentication
- ✅ Row-level security in database

---

## 📝 Tips for Best Results

1. **Upload Clear PDFs**: Scanned documents work, but text-based PDFs are better
2. **Add Metadata**: Fill in course details for better organization
3. **Be Specific**: Ask detailed questions for precise answers
4. **Check Sources**: Always verify citations and page numbers
5. **Use Follow-ups**: AI remembers conversation context
6. **Select Correct Year**: Helps filter relevant content

---

## 🎯 Common Use Cases

- 📅 "When is the final exam?"
- 📊 "What's the grading breakdown?"
- 📚 "Summarize chapter 5"
- ❓ "What are the prerequisites?"
- 🔍 "Find all mentions of 'data structures'"
- 💡 "Explain the project requirements"

---

## 🌟 Upcoming Features

- Document sharing between students
- Course-specific discussion forums
- OCR for scanned documents
- Multi-document search
- Export chat history
- Mobile app

---

**Repository**: https://github.com/shashwatraajsingh/talk-to-syllabus

**Need Help?** Check the README.md or create an issue on GitHub!
