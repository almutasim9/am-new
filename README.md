# Registry v2.7 — Merchant Support CRM (UNIVERSAL)

A world-class, real-time CRM web application designed for high-performance merchant support, store registries, and daily interaction logging. Built as a **Progressive Web App (PWA)**, it offers a seamless "App-like" experience across laptops, tablets, and smartphones.

---

## 🌟 What's New in v2.7 UNIVERSAL

- **Universal Modal Engine** — A completely redesigned modal system that is 100% consistent across all screen sizes. No more missing headers on mobile; the layout is anchored, professional, and adaptive.
- **Premium Outcome Selector** — Replaced basic search with a high-end, searchable dropdown and "Quick Pick" chips for lightning-fast logging.
- **Enhanced Responsiveness** — Adaptive "Card Views" for mobile that transform complex data tables into touch-friendly interfaces automatically.
- **Mobile-First UX** — Optimized touch targets, centered modals, and streamlined navigation (Hamburger drawer).

---

## 🚀 Key Features

- **Store & Brand Registry** — Track merchants by `Brand ID` with deep categorization and zone filtering.
- **Smart Data Sync (Upsert)** — Intelligent bulk import from Excel that synchronizes existing records and adds new ones seamlessly.
- **Interaction Logging** — Bilingual (Arabic/English) interface with quick-action templates and detailed feedback fields.
- **Real-time Collaboration** — Instantly synchronize data across your entire team using Supabase Realtime.
- **Operational Targets** — Set and track monthly performance goals with visual progress indicators.
- **PWA Excellence** — Installable on iOS/Android/Desktop with reliable offline asset caching.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | React 19 + Vite |
| **Motion & Animation** | Framer Motion (Smooth Transitions) |
| **Icons & Visuals** | Lucide React |
| **Backend & Auth** | Supabase (PostgreSQL + Realtime + RLS) |
| **Data Processing** | XLSX (Indestructible Stream Logic) |
| **Mobile Integration** | Vite PWA Plugin |

---

## 📖 Getting Started

### 1. Installation
```bash
git clone https://github.com/almutasim9/am-new.git
cd am-new
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Initialization
Execute the `schema.sql` file in your Supabase SQL Editor to set up tables and **Row Level Security (RLS)**.

### 4. Excel Import Requirements
To use the Bulk Import feature, ensure your Excel file contains these headers:
- `ID`, `Name`, `Category`, `Zone`, `Phone`, `Brand_ID`, `Owner`

---

## 📊 Core Architecture

| Component | Responsibility |
|-----------|----------------|
| `ActivityForm` | Universal modal for recording merchant interactions. |
| `StoreList` | Master registry with directory search and filtering. |
| `StoreProfile` | Deep-dive view for individual merchant history and stats. |
| `ActivityLog` | Daily operational timeline with adaptive mobile card views. |
| `Library` | Centralized repository for merchant resources and links. |

---

## 🔐 Security & Operations

- **Full RLS Policy:** Data is strictly protected via Supabase Policies (Authenticated users only).
- **MIME Safety:** File downloads use specialized stream logic for cross-browser stability.
- **Offline Reliability:** Service Workers manage caching to ensure the app works even on weak connections.

---
*Maintained with excellence by the Merchant Support Team.*
