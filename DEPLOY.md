# 🚀 Deployment Guide — Talk-to-Syllabus

> **Frontend** → Vercel  
> **Backend** → Render  
> **Database** → Supabase (already hosted)

---

## 📋 Prerequisites

Before deploying, make sure you have:

- ✅ A [GitHub](https://github.com) account with the repo pushed
- ✅ A [Vercel](https://vercel.com) account (free tier works)
- ✅ A [Render](https://render.com) account (free tier works)
- ✅ Your Supabase project running at [supabase.com](https://supabase.com)
- ✅ A valid Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

---

## Part 1: Deploy Backend on Render

### Step 1 — Create a New Web Service

1. Go to [render.com/dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `shashwatraajsingh/talk-to-syllabus`
4. Configure the service:

| Setting           | Value                          |
|-------------------|--------------------------------|
| **Name**          | `talk-to-syllabus-api`         |
| **Region**        | Choose closest to your users   |
| **Root Directory** | `server`                      |
| **Runtime**       | `Node`                         |
| **Build Command** | `npm install`                  |
| **Start Command** | `node src/server.js`           |
| **Instance Type** | Free                           |

### Step 2 — Set Environment Variables

In the Render dashboard, go to **Environment** tab and add these variables:

```env
PORT=3000

# Supabase
DATABASE_URL=postgresql://postgres:<YOUR_PASSWORD>@db.<YOUR_PROJECT_REF>.supabase.co:5432/postgres
SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>

# Gemini AI
GEMINI_API_KEY=<your-gemini-api-key>

# Pinecone (optional, currently bypassed)
PINECONE_API_KEY=<your-pinecone-api-key>
PINECONE_INDEX=talk-to-syllabus
```

> ⚠️ **Important:** Replace all `<...>` placeholders with your actual credentials. Never commit these values to Git.

### Step 3 — Deploy

1. Click **"Create Web Service"**
2. Render will automatically build and deploy
3. Wait for the deploy to finish (usually 2–5 minutes)
4. Note your backend URL, it will look like:
   ```
   https://talk-to-syllabus-api.onrender.com
   ```

### Step 4 — Verify Backend

Visit your Render URL with `/api/health`:
```
https://talk-to-syllabus-api.onrender.com/api/health
```

You should see:
```json
{ "status": "ok", "timestamp": "2026-..." }
```

### Step 5 — Run Database Setup

After the first deploy, open the **Shell** tab in Render and run:
```bash
node setup_postgres.js
```

This creates the required database tables in Supabase.

---

## Part 2: Deploy Frontend on Vercel

### Step 1 — Update API Base URL

Before deploying, you need to update the frontend to point to your Render backend URL.

**Option A: Environment Variable (Recommended)**

Create/update `client/.env.production`:
```env
VITE_API_BASE_URL=https://talk-to-syllabus-api.onrender.com
VITE_SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

Then update `client/src/utils/api.js` to use the environment variable:
```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api`
    : '/api';
```

**Option B: Hardcode (Quick & Simple)**

Update `client/src/utils/api.js`:
```javascript
const API_BASE = 'https://talk-to-syllabus-api.onrender.com/api';
```

### Step 2 — Update CORS on Backend

Make sure your backend allows requests from your Vercel domain. Update `server/src/server.js`:

```javascript
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://talk-to-syllabus.vercel.app',     // your Vercel URL
        'https://talk-to-syllabus-*.vercel.app',    // preview deploys
    ],
    credentials: true,
}));
```

Commit and push this change so Render picks it up.

### Step 3 — Import Project on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your repo: `shashwatraajsingh/talk-to-syllabus`
4. Configure the project:

| Setting              | Value                                   |
|----------------------|-----------------------------------------|
| **Framework Preset** | `Vite`                                  |
| **Root Directory**   | `client`                                |
| **Build Command**    | `npm run build`                         |
| **Output Directory** | `dist`                                  |
| **Install Command**  | `npm install`                           |

### Step 4 — Set Environment Variables on Vercel

In the Vercel project settings → **Environment Variables**, add:

```env
VITE_API_BASE_URL=https://talk-to-syllabus-api.onrender.com
VITE_SUPABASE_URL=https://<YOUR_PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

> 💡 **Note:** Vite requires environment variables to be prefixed with `VITE_` to be exposed to the client.

### Step 5 — Deploy

1. Click **"Deploy"**
2. Vercel will build and deploy (usually 1–2 minutes)
3. Your frontend URL will look like:
   ```
   https://talk-to-syllabus.vercel.app
   ```

### Step 6 — Verify Frontend

Visit your Vercel URL. You should see the login page!

---

## Part 3: Post-Deployment Checklist

### ✅ Update Supabase Auth Settings

1. Go to Supabase Dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL:
   ```
   https://talk-to-syllabus.vercel.app
   ```
3. Add **Redirect URLs**:
   ```
   https://talk-to-syllabus.vercel.app/**
   http://localhost:5173/**
   ```

### ✅ Update CORS (if not done already)

Make sure the Render backend allows your Vercel frontend domain in CORS.

### ✅ Test the Full Flow

1. Visit `https://talk-to-syllabus.vercel.app`
2. Sign up with a new account
3. Start a new chat
4. Ask: "What is cybercrime?"
5. Verify you get an AI-powered response ✨

---

## 🔄 Automatic Deployments

Both Vercel and Render support **auto-deploy on push**:

- **Push to `main`** → Both frontend and backend redeploy automatically
- **Pull Requests** → Vercel creates preview deployments

---

## 🏗️ Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐
│   Vercel (CDN)  │         │  Render (Server)  │
│                 │  HTTPS  │                   │
│  React + Vite   │ ──────► │  Express + Node   │
│  (Static Files) │  /api/* │  (API Server)     │
│                 │         │                   │
└─────────────────┘         └────────┬──────────┘
                                     │
                            ┌────────┴──────────┐
                            │                   │
                     ┌──────▼──────┐    ┌───────▼───────┐
                     │  Supabase   │    │  Gemini 2.5   │
                     │  (Postgres  │    │  Flash (AI)   │
                     │   + Auth)   │    │               │
                     └─────────────┘    └───────────────┘
```

---

## 🔧 Troubleshooting

### Backend not responding?
- Check Render logs in the dashboard
- Verify all environment variables are set correctly
- Render free tier spins down after 15 min of inactivity (first request takes ~30s to cold-start)

### Frontend blank page?
- Check browser console for errors
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in Vercel
- Make sure `VITE_API_BASE_URL` points to your Render URL

### CORS errors?
- Update `server/src/server.js` CORS config with your Vercel domain
- Push the change and wait for Render to redeploy

### Auth not working?
- Check Supabase Dashboard → Authentication → URL Configuration
- Make sure Site URL matches your Vercel domain
- Add your Vercel URL to Redirect URLs

### Render free tier cold starts?
- First request after inactivity takes ~30 seconds
- Consider upgrading to a paid plan for production use
- Alternatively, set up a cron job to ping `/api/health` every 14 minutes

---

## 💰 Cost Estimate (Free Tier)

| Service   | Plan   | Cost     | Limits                           |
|-----------|--------|----------|----------------------------------|
| Vercel    | Hobby  | **Free** | 100GB bandwidth/month            |
| Render    | Free   | **Free** | 750 hours/month, spins down      |
| Supabase  | Free   | **Free** | 500MB DB, 50k monthly users      |
| Gemini AI | Free   | **Free** | 15 RPM, 1M tokens/min            |

**Total: $0/month** for development and small-scale usage! 🎉

---

## 📝 Quick Reference

| What                  | URL                                                  |
|-----------------------|------------------------------------------------------|
| **Frontend (Vercel)** | `https://talk-to-syllabus.vercel.app`                |
| **Backend (Render)**  | `https://talk-to-syllabus-api.onrender.com`          |
| **Health Check**      | `https://talk-to-syllabus-api.onrender.com/api/health` |
| **Supabase Dashboard**| `https://supabase.com/dashboard`                     |
| **GitHub Repo**       | `https://github.com/shashwatraajsingh/talk-to-syllabus` |
