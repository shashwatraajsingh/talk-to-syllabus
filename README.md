# Talk-to-Syllabus 🎓

An AI-powered RAG (Retrieval Augmented Generation) system that lets students chat with their course syllabi and documents using Gemini AI and Pinecone vector search.

## 🚀 Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Vector DB**: Pinecone
- **AI**: Google Gemini API
- **File Processing**: PDF-Parse

## 📋 Prerequisites

1. **Supabase Account**: [Sign up at supabase.com](https://supabase.com)
2. **Pinecone Account**: [Sign up at pinecone.io](https://pinecone.io)
3. **Google AI Studio**: [Get API key](https://makersuite.google.com/app/apikey)
4. **Node.js 18+**

## ⚙️ Setup

### 1. Clone the Repository

```bash
git clone https://github.com/shashwatraajsingh/talk-to-syllabus.git
cd talk-to-syllabus
```

### 2. Install Dependencies

```bash
npm install
cd client && npm install && cd ..
```

### 3. Configure Supabase

1. Create a new Supabase project
2. Get your connection string from Settings → Database
3. Get your Anon Key from Settings → API

### 4. Configure Pinecone

1. Create a new Pinecone index:
   - Name: `talk-to-syllabus`
   - Dimensions: `768`
   - Metric: `cosine`

### 5. Environment Variables

Create `.env` in the root:

```env
# Server
PORT=3000

# Supabase Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.btxwyalksnisctyzpoxy.supabase.co:5432/postgres

# Supabase Auth
SUPABASE_URL=https://btxwyalksnisctyzpoxy.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Gemini API
GEMINI_API_KEY=your-gemini-api-key

# Pinecone
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_INDEX=talk-to-syllabus

# File Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=20
```

Create `client/.env`:

```env
VITE_SUPABASE_URL=https://btxwyalksnisctyzpoxy.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 6. Initialize Database

```bash
npm run setup
```

This creates the required tables in your Supabase database.

### 7. Run the Application

```bash
bash start_all.sh
```

Or manually:

```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

Access the app at **http://localhost:5173**

## 🏗️ Architecture

### Database Schema (Supabase PostgreSQL)

- `documents` - Uploaded PDFs and metadata
- `chat_sessions` - Conversation sessions
- `chat_messages` - Individual messages
- `document_shares` - Sharing permissions

### Auth Flow

1. Users sign up/login via Supabase Auth
2. Frontend receives JWT from Supabase
3. Backend validates JWT for protected routes
4. User data stored in Supabase `auth.users` table

### RAG Pipeline

1. **Upload**: User uploads PDF
2. **Processing**: Extract text → Chunk → Generate embeddings (Gemini)
3. **Indexing**: Store vectors in Pinecone
4. **Query**: User asks question → Embed query → Search Pinecone
5. **Generation**: Relevant chunks + history → Gemini → Response

## 📁 Project Structure

```
talk-to-syllabus/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/        # Route pages
│   │   ├── context/      # Auth context
│   │   └── utils/        # API client, Supabase
│   └── index.css         # AI-Native UI styles
├── src/                   # Node.js backend
│   ├── config/           # DB and Supabase setup
│   ├── middleware/       # Auth middleware
│   ├── routes/           # API routes
│   └── services/         # PDF, RAG, Pinecone
├── setup_postgres.js     # DB initialization
└── start_all.sh          # Launch script
```

## 🎨 Features

✅ **Supabase Auth** - Secure authentication
✅ **PDF Processing** - Extract and chunk documents
✅ **Vector Search** - Semantic search via Pinecone
✅ **RAG Chat** - Context-aware AI responses
✅ **Document Management** - Upload, delete, share
✅ **Modern UI** - AI-Native design with purple/cyan theme
✅ **Chat History** - Persistent conversations

## 🔒 Security

- JWT-based authentication via Supabase
- Row-level security policies (configure in Supabase)
- Environment variables for secrets
- Input validation and sanitization

## 📝 License

MIT

## 🤝 Contributing

Pull requests welcome!
