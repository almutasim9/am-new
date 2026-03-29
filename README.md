# Activity Registry — Merchant Support CRM

A modern, real-time CRM web app for managing merchant support activities, store registries, and daily follow-ups. Built as a Progressive Web App (PWA) with offline support.

## Features

- **Authentication** — Secure login via Supabase Auth (admin-only access)
- **Dashboard** — Real-time overview with stats, overdue reminders, and quick actions
- **Store Registry** — Add, edit, import/export restaurants and merchants
- **Activity Log** — Log daily calls, outcomes, and follow-up tasks
- **Statistics** — Visual charts for performance tracking
- **Weekly Target** — Set and track weekly activity goals
- **Library** — Quick-access links for daily tools
- **Settings** — Manage outcomes, zones, categories, and notifications
- **Global Search** — Search across stores and activities instantly
- **PWA** — Installable on desktop and mobile, works offline

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite |
| Styling | CSS Variables + Framer Motion |
| Backend | Supabase (PostgreSQL + Realtime) |
| Auth | Supabase Auth (RLS - authenticated users only) |
| Charts | Recharts |
| Excel | XLSX |
| PWA | vite-plugin-pwa |

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/almutasim9/am-new.git
cd am-new
npm install
```

### 2. Set up environment variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Get these from your Supabase project → Settings → API

### 3. Set up the database

Run `reset_database.sql` in your Supabase SQL Editor. This will:
- Create all required tables
- Enable Row Level Security (authenticated users only)
- Seed default data (outcomes, categories)
- Enable Realtime subscriptions

### 4. Create an admin user

Go to Supabase Dashboard → Authentication → Users → Add user

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Database Schema

| Table | Description |
|-------|-------------|
| `stores` | Merchant/restaurant registry |
| `calls` | Activity log and follow-up tasks |
| `call_outcomes` | Outcome types (POS Issue, Menu Update, etc.) |
| `zones` | Geographic zones |
| `store_categories` | Store category types |
| `library_links` | Quick-access links |
| `targets` | Monthly activity targets |

## Build for Production

```bash
npm run build
```

Output goes to `dist/` — deploy to any static hosting (Vercel, Netlify, etc.)

## Security

- All database access requires Supabase Auth session
- Row Level Security enabled on all tables (`TO authenticated`)
- `.env` file excluded from version control
