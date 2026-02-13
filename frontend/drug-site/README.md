# PharmaSearch Frontend (MVP)

A modern, mobile-responsive React application designed to connect pharmacists with medicine wholesalers instantly.

## 🚀 Key Features

### 1. Search-First Journey
*   **Zero-Login Access**: Pharmacists can immediately search for medicines without creating an account.
*   **3-Click Flow**: Optimised path from searching a drug to initiating contact (Call/WhatsApp).

### 2. Intelligent Authentication
*   **Google Social Login**: Fast onboarding via Google OAuth.
*   **Smart Onboarding**: Role selection (Pharmacist vs Wholesaler) is mandatory for new users.
*   **Role Locking**: Chosen roles are locked during profile setup to prevent registration errors.
*   **Modern Notifications**: Replaced native browser alerts with sleek `react-hot-toast` notifications.

### 3. Wholesaler Portal
*   **Inventory Management**: Wholesalers can Add, Edit, and Delete medicine listings.
*   **Verification System**: Wholesalers register with a license number and are marked as `Pending` until admin approval.
*   **Restricted Access**: Unverified wholesalers are blocked from posting new listings via Row Level Security (RLS).
*   **Trust Badges**: Verified wholesalers display a green check badge (✓) in search results.

### 4. Rich Data Fields
*   Manufacturer, Batch Number, and Expiry Date tracking.
*   Availability status (In Stock / Out of Stock).
*   Automatic "Last Updated" timestamps.

## 🛠️ Tech Stack
*   **Framework**: React (Vite)
*   **Styling**: Tailwind CSS / Lucide React Icons
*   **State & Logic**: Context API (Auth), Axios
*   **Feedback**: React Hot Toast
*   **Backend Sync**: Supabase JS Client

## 📦 Setup & Installation
1.  `cd frontend/drug-site`
2.  `npm install`
3.  Configure `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4.  `npm run dev`
