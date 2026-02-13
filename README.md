# PharmaSearch MVP 💊

PharmaSearch is a unified platform connecting pharmacists and medicine wholesalers across Uganda. It provides real-time medicine availability search with fuzzy matching, typo tolerance, and a streamlined wholesaler verification system.

## 🏗️ Repository Structure

This is a monorepo setup:
- `/frontend`: React + Vite + TailwindCSS application.
- `/backend`: Node.js + Express API layer.
- `/supabase`: (See `supabase_schema.sql`) Database schema, RLS policies, and stored procedures.

## 🚀 Key Features

- **Autocomplete Search**: Typo-tolerant medicine search using PostgreSQL Trigrams.
- **Wholesaler Dashboard**: Inventory management and stock status updates.
- **Admin Command Center**: Business verification and license approval flow.
- **Mobile Responsive**: Fully optimized UI for pharmacists searching on mobile devices.

## 🛠️ Tech Stack

- **Frontend**: React, React Router, Lucide Icons, Axios.
- **Backend**: Node.js, Express, Helmet, Supabase-js.
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS).

## 🏁 Getting Started

### Prerequisites
- Node.js (v18+)
- Supabase Account

### Setup

1. **Database Setup**:
   - Run the scripts in [supabase_schema.sql](./supabase_schema.sql) in your Supabase SQL Editor.

2. **Backend**:
   ```bash
   cd backend
   npm install
   # Create a .env file with:
   # PORT=5000
   # SUPABASE_URL=...
   # SUPABASE_ANON_KEY=...
   # SUPABASE_SERVICE_ROLE_KEY=...
   npm start
   ```

3. **Frontend**:
   ```bash
   cd frontend/drug-site
   npm install
   # Ensure .env labels match your Supabase config
   npm run dev
   ```

## 🌐 Deployment (Vercel)

Since this is a monorepo, you must tell Vercel which folder to build.

### 1. Frontend (React)
When creating a new project on Vercel:
- **Root Directory**: Set this to `frontend/drug-site`.
- **Build Command**: `npm run build` (Automatically detected).
- **Output Directory**: `dist` (Automatically detected).
- **Environment Variables**: Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### 2. Backend (Express)
For the backend, we recommend a platform like **Railway**, **Render**, or **DigitalOcean** (since Vercel is primarily for frontend/serverless). 
- **Root Directory**: `backend`
- **Start Command**: `node index.js`

## 📜 License
MVP Internal Use Only - PharmaSearch Team.
