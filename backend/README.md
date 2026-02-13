# PharmaSearch Backend

A Node.js/Express API serving as the orchestration layer between the frontend and Supabase.

## 🛡️ Core Responsibilities

### 1. API Services
*   **Search Engine**: Full-text search (FTS) integration with Supabase for fast brand and generic name lookups.
*   **Management API**: CRUD operations for medicine listings.
*   **Profile Management**: Handling user records and verification status.

### 2. Security & Verification
*   **Auth Middleware**: Token validation via Supabase JWTs.
*   **RBAC (Role Based Access Control)**: Enforcing Pharmacist vs Wholesaler permissions.
*   **Verification Gates**: Logic to restrict medicine posting to `approved` wholesalers only.
*   **Data Integrity**: Automatic timestamping and cleanup.

### 3. Database Management (Supabase)
*   **Remote Database**: PostgreSQL via Supabase.
*   **RLS Policies**: Row Level Security to ensure wholesalers only manage their own data.
*   **FTS Vector**: Custom search vector including Brand, Generic, and Manufacturer fields.

## 🛠️ Tech Stack
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database**: Supabase (PostgreSQL)
*   **Security**: Helmet, CORS, JWT
*   **Environment**: Dotenv

## 📦 Setup & Installation
1.  `cd backend`
2.  `npm install`
3.  Configure `.env`:
    *   `SUPABASE_URL`
    *   `SUPABASE_ANON_KEY`
    *   `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)
4.  `node index.js`
