# Activity Registry — Merchant Support CRM

A modern, real-time CRM web app for managing merchant support activities, store registries, and daily follow-ups. Built as a Progressive Web App (PWA) with offline support and a premium "World Class" user interface.

## 🚀 Key Features

- **Brand Management** — Track stores by `Brand ID` across the registry and activity logs.
- **Smart Data Sync (Upsert)** — Bulk import stores from Excel with intelligent synchronization; updates existing records and adds new ones in one go.
- **Premium Interaction Sheet** — Professional, bilingual (Arabic/English) logging interface with sticky glass footers and quick-action templates.
- **Real-time Collaboration** — Instantly see updates across devices via Supabase Realtime.
- **Advanced Registry** — Manage restaurants with deep categorization, zone filtering, and quick contact actions (WhatsApp/Phone).
- **PWA Excellence** — Desktop and mobile installable, optimized for high-speed offline performance.
- **Analytics & Targets** — Visual performance tracking with monthly goal setting.

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite |
| **Logic** | Custom Hooks + Context API |
| **Styling** | Vanilla CSS (Variables) + Framer Motion |
| **Backend** | Supabase (PostgreSQL + Realtime) |
| **Excel Ops** | XLSX (Indestructible Download Stream) |
| **PWA** | vite-plugin-pwa |

## 📖 Getting Started

### 1. Installation
```bash
git clone https://github.com/almutasim9/am-new.git
cd am-new
npm install
```

### 2. Environment Setup
Create a `.env` file in the root:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Sync
Run the initial `schema.sql` in your Supabase SQL Editor. 
**Important:** If updating from an older version, ensure the `brand_id` column exists:
```sql
ALTER TABLE stores ADD COLUMN IF NOT EXISTS brand_id TEXT;
```

### 4. Excel Import Requirements
To use the Bulk Import feature, your Excel file should contain the following headers:
- `ID`, `Name`, `Category`, `Zone`, `Phone`, `Brand_ID`, `Owner`

## 📊 Database Architecture

| Table | Purpose |
|-------|---------|
| `stores` | Master registry (ID, Name, Brand_ID, category, zone, etc.) |
| `calls` | Transactional activity logs and follow-up tasks |
| `call_outcomes` | Configuration for interaction results |
| `library_links` | Centralized resource management |
| `targets` | Monthly operational KPI goals |

## 🔐 Security & Deployment

- **RLS Protection:** Every table is protected by Row Level Security (`authenticated` users only).
- **MIME Safety:** File downloads use `application/octet-stream` to ensure cross-browser compatibility.
- **PWA Caching:** Service Workers handle asset caching for reliable offline access.

---
*Maintained with excellence by the Merchant Support Team.*
