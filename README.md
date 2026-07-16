# Unified QR Platform

**Enterprise Digital Identity & Smart QR Management System**
NxtGenSec Development Internship 2026 — Capstone Project

A full-stack SaaS application for generating, customizing, managing, and tracking Static & Dynamic QR codes — including multi-link QR, digital business cards, Wi-Fi, UPI, Google Maps, WhatsApp, and file/image/video QR types.

---

## Features

- **User Authentication** — JWT-based register/login, protected routes
- **Dashboard** — search, filter by type/mode, scan counts at a glance
- **Profile Management** — name, company, bio, avatar upload
- **Static & Dynamic QR Codes** — dynamic codes are editable after creation and are scan-tracked; static codes bake content directly into the image
- **QR CRUD** — create, read, update (title/content/style/status), delete
- **QR Customization** — foreground/background color, size
- **QR Analytics** — total scans, scans-over-time chart, device/browser/OS breakdown, recent scan log (dynamic codes only)
- **Multi-Link QR** — one QR code that opens a landing page listing several links
- **Digital Business Card** — vCard QR (name, org, title, phone, email, website, address)
- **Website, WhatsApp, Phone, Email & SMS QR**
- **Google Maps QR** (address or coordinates)
- **UPI Payment QR**
- **PDF, Image & Video QR** (via file upload)
- **File Uploads** — multer-based, served statically
- **Download QR** — PNG and SVG
- **Search & Filters** — by title/tag, type, mode
- **Responsive Design** — mobile-first Tailwind layout

## Tech Stack

**Frontend:** React 19 (Vite), React Router, Tailwind CSS, Recharts, lucide-react, Axios
**Backend:** Node.js + Express
**Database:** SQLite (via `better-sqlite3`) — file-based, zero-config, easy to swap for PostgreSQL/Supabase later (schema uses standard SQL and is a near-drop-in port)
**Authentication:** JWT (jsonwebtoken) + bcrypt password hashing
**File uploads:** Multer
**QR generation:** `qrcode` npm package (PNG/SVG buffers generated server-side)
**Deployment target:** Vercel (frontend) + any Node host (backend) — see Deployment section

> **Note on the database choice:** the brief recommends PostgreSQL/Supabase. SQLite was used here to keep local setup to zero external services (no account signup required to run this project), while keeping the schema and query style (`db.prepare(...).run/get/all`) close enough to a Postgres client that migrating is straightforward if required.

## Folder Structure

```
unified-qr-platform/
├── backend/
│   ├── src/
│   │   ├── db/init.js          # SQLite schema + connection
│   │   ├── middleware/         # auth guard, error handler
│   │   ├── routes/
│   │   │   ├── auth.js         # register / login / me
│   │   │   ├── profile.js      # profile + avatar upload
│   │   │   ├── qr.js           # QR CRUD, image generation, analytics
│   │   │   └── redirect.js     # public /r/:shortCode dynamic redirect + scan logging
│   │   ├── utils/qrEncoder.js  # type -> encoded QR string (url/wifi/vcard/upi/...)
│   │   ├── uploads/            # uploaded files (gitignored)
│   │   └── server.js           # app entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js       # axios instance + auth interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/         # Layout, QrCard, DynamicIcon
│   │   ├── pages/               # Login, Register, Dashboard, CreateQr, QrDetail, Profile
│   │   └── qrTypes.js          # single source of truth for QR type form fields
│   ├── .env.example
│   └── package.json
└── README.md
```

## Database Design

- **users**: id, name, email (unique), password_hash, avatar_url, company, bio, timestamps
- **qr_codes**: id, user_id (FK), title, type, mode (static/dynamic), short_code (unique, dynamic only), target_data (JSON), fg_color, bg_color, size, is_active, folder, tags, timestamps
- **qr_links**: id, qr_id (FK), label, url, order_index — child rows for `multilink` type
- **scans**: id, qr_id (FK), scanned_at, ip_hash (SHA-256, not raw IP), user_agent, device_type, browser, os, referrer — one row per dynamic-QR scan

## API Overview

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account, returns JWT |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/profile` | Update name/company/bio |
| POST | `/api/profile/avatar` | Upload avatar |
| POST | `/api/qr` | Create QR code |
| GET | `/api/qr` | List QR codes (search, type, mode, folder, sort) |
| GET | `/api/qr/:id` | Get one QR code |
| PUT | `/api/qr/:id` | Update QR code |
| DELETE | `/api/qr/:id` | Delete QR code |
| POST | `/api/qr/upload` | Upload file for file/image/video/pdf QR types |
| GET | `/api/qr/:id/image?format=png\|svg\|dataurl` | Generate/download the QR image |
| GET | `/api/qr/:id/analytics` | Scan stats for a dynamic QR |
| GET | `/r/:shortCode` | **Public.** Resolves a dynamic QR, logs the scan, redirects |

All `/api/*` routes except register/login require `Authorization: Bearer <token>`.

## How Static vs Dynamic Works

- **Static**: the QR image directly encodes the final content (a URL, vCard text, WIFI: string, etc). Nothing to track, nothing editable — regenerating the image is the only way to change it.
- **Dynamic**: the QR image encodes a short link (`BASE_URL/r/<shortCode>`). The server looks up the short code on every scan, logs analytics (device/browser/OS/time, IP is hashed — not stored raw), and 302-redirects to the current destination. Because the QR image never changes, you can edit the destination, disable the code, or view analytics after printing/distributing it.

## Local Setup

### Backend
```bash
cd backend
cp .env.example .env      # edit JWT_SECRET to a random string
npm install
npm run dev                # http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.example .env       # set VITE_API_URL if backend isn't on localhost:5000
npm install
npm run dev                 # http://localhost:5173
```

### Environment Variables

**backend/.env**
| Variable | Description |
|---|---|
| `PORT` | API port (default 5000) |
| `JWT_SECRET` | Secret used to sign auth tokens — set to a long random string |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `BASE_URL` | Public URL of the backend (used to build short redirect links and file URLs) |
| `FRONTEND_URL` | Used for CORS |
| `DB_PATH` | SQLite file path |
| `UPLOAD_DIR` | Where uploaded files are stored |
| `MAX_FILE_SIZE_MB` | Upload size limit |

**frontend/.env**
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL, e.g. `http://localhost:5000` |

## Deployment

- **Frontend → Vercel**: `vercel --cwd frontend`, set `VITE_API_URL` to your deployed backend URL as an environment variable in the Vercel project settings.
- **Backend → Render / Railway / Fly.io / a VPS**: any Node host works since it's plain Express + SQLite (mount a persistent volume for the `.sqlite` file and `uploads/` folder, since these must survive restarts). Set the env vars above; set `BASE_URL` to the backend's public URL and `FRONTEND_URL` to the deployed frontend's URL.
- **Live Deployment Link:** *add after deploying*

## Progress vs. Development Phases

| Phase | Status |
|---|---|
| 1 — Planning (requirements, DB design, project setup, repo) | ✅ Complete |
| 2 — Core Development (auth, dashboard, QR CRUD, dynamic QR, profile) | ✅ Complete |
| 3 — Advanced Features (analytics, customization, multi-link, business card, security, uploads) | ✅ Complete |
| 4 — Optimization (responsive UI, validation, error handling, docs) | ✅ Complete |
| 5 — Deployment (final testing, deploy, README) | ⏳ Pending — deploy to Vercel/Render and fill in the live link above |

**Fully working:** auth, QR CRUD, all 14 QR types, static + dynamic modes, scan analytics, image download (PNG/SVG), search/filter, profile + avatar upload, file uploads.
**Partially working / left for iteration:** folders/tags exist in the schema and API but have no dedicated UI for managing folders; no password-reset flow; rate limiting is basic (IP-based, not per-user).
**Future improvements:** QR logo embedding in the image itself, bulk CSV import/export of QR codes, team/workspace sharing, geolocation lookup for scans (currently country field exists in schema but isn't populated), custom short-domain support.

## Security Notes

- Passwords hashed with bcrypt (10 rounds)
- JWT auth on all private routes
- `helmet` for HTTP security headers, `express-rate-limit` on `/api`
- Scan logs store a SHA-256 hash of the IP, not the raw address
- File uploads size-limited via Multer

## AI Tool Usage Disclosure

Built with AI assistance (Claude) for scaffolding and boilerplate; the implementation, schema design, and QR encoding logic (`utils/qrEncoder.js`) were reviewed and are understood in full for the project validation interview.
