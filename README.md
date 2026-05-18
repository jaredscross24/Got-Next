# Got Next 🏀

A mobile-first web app that connects basketball players worldwide — find courts, queue up for pickup games, and call next.

---

## Features

| Feature | Details |
|---|---|
| **Global Court Map** | Interactive map (MapLibre + OpenStreetMap — no API key needed) with pins for every court |
| **Got Next Queue** | Real-time queue per court via WebSocket (Socket.io). Join, leave, see who's waiting live |
| **Game Formats** | 1v1, 2v2, 3v3, 4v4, 5v5 — auto-notifies when enough players queue up |
| **Skill Levels** | 9 levels from Recreational through Semi-Pro / Pro |
| **Play Styles** | 🎮 Casual · ⚔️ Competitive · 🏆 League |
| **Phone OTP** | SMS verification via Twilio (dev mode logs the OTP to console) |
| **Add Courts** | Drop-pin map flow to add unlisted courts with photos |
| **Report Users** | Safety reporting on any player profile |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Routing | React Router v6 |
| Map | MapLibre GL JS via react-map-gl v7 (free, no API key) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Real-time | Socket.io |
| Auth | JWT (30-day tokens) + SMS OTP |
| SMS | Twilio (optional in dev) |
| File uploads | Multer → local `/uploads/` |

---

## Project Structure

```
got-next/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── api/         # Axios client
│   │   ├── components/  # Map, Queue, shared UI
│   │   ├── context/     # AuthContext, SocketContext
│   │   ├── pages/       # Home, CourtDetail, Profile, AddCourt, MyGames
│   │   └── styles/      # globals.css (dark basketball theme)
│   └── vite.config.js
└── server/          # Node.js + Express API
    ├── migrations/  # PostgreSQL schema (001_initial.sql)
    ├── seeds/       # 10 sample courts worldwide
    ├── src/
    │   ├── middleware/  # JWT auth
    │   ├── routes/      # auth, users, courts, queue, games
    │   ├── app.js
    │   ├── db.js
    │   └── socket.js
    └── uploads/     # Uploaded photos (gitignored)
```

---

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+

### 1. Clone & install

```bash
# Install server deps
cd server
npm install

# Install client deps
cd ../client
npm install
```

### 2. Configure environment

```bash
# In the server directory
cp ../.env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET at minimum
```

**Required `.env` values:**

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/got_next
JWT_SECRET=your_long_random_secret_here
```

**Optional (Twilio SMS):**

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15550001234
```

> Without Twilio, OTP codes are printed to the server console and returned in the API response (`dev_otp` field) — perfect for development.

### 3. Create database and run migration

```bash
# In PostgreSQL
createdb got_next

# Run schema migration (from the server/ directory)
cd server
npm run migrate
```

### 4. Seed sample courts

```bash
# Still in server/
npm run seed
```

This adds 10 real basketball courts worldwide:
- Rucker Park (New York)
- Venice Beach Courts (LA)
- The Cage / West 4th (New York)
- Trocadéro Courts (Paris)
- Bercy Courts (Paris)
- Ibirapuera Park (São Paulo)
- Rizal Park Courts (Manila)
- Yoyogi Park (Tokyo)
- Eko Atlantic Courts (Lagos)
- Sandton Courts (Johannesburg)

### 5. Start development servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# → http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# → http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Create account |
| `POST` | `/api/auth/login` | — | Get JWT token |
| `POST` | `/api/auth/send-otp` | JWT | Send SMS OTP |
| `POST` | `/api/auth/verify-otp` | JWT | Verify SMS OTP |
| `GET` | `/api/users/me` | JWT | Get own profile |
| `PUT` | `/api/users/me` | JWT | Update profile |
| `POST` | `/api/users/me/photo` | JWT | Upload profile photo |
| `GET` | `/api/users/:id` | JWT | Get public profile |
| `POST` | `/api/users/:id/report` | JWT | Report a user |
| `GET` | `/api/courts` | — | List / search courts (`?lat=&lng=&radius=` or `?search=`) |
| `GET` | `/api/courts/:id` | — | Court detail |
| `POST` | `/api/courts` | JWT | Add a court (multipart — up to 5 photos) |
| `GET` | `/api/queue/court/:id` | — | Get active queue |
| `POST` | `/api/queue/court/:id` | JWT | Join queue |
| `DELETE` | `/api/queue/court/:id` | JWT | Leave queue |
| `GET` | `/api/games/me` | JWT | My game history |
| `GET` | `/api/games/court/:id` | — | Court game history |

---

## WebSocket Events

Connect to `ws://localhost:5000`. All events are scoped to court rooms.

| Direction | Event | Payload |
|---|---|---|
| Client → Server | `join_court` | `courtId` |
| Client → Server | `leave_court` | `courtId` |
| Server → Client | `queue_updated` | `QueueEntry[]` |
| Server → Client | `game_ready` | `{ format, players_needed, players_in_queue }` |

---

## Data Models

### User
```
id, email, password_hash, full_name, profile_photo_url,
age, city, phone, phone_verified, skill_level, play_style,
otp_code, otp_expires_at, is_active, created_at, updated_at
```

### Court
```
id, name, latitude, longitude, added_by (user_id),
photo_urls[], description, address, city, country,
court_type, is_verified, created_at, updated_at
```

### QueueEntry
```
id, court_id, user_id, game_format (1v1–5v5),
play_style (casual|competitive|league), expires_at, created_at
```

### Game
```
id, court_id, format, status (forming|active|completed),
participant_ids[], created_at, updated_at
```

---

## Queue Rules

- **Phone verified** required to join any queue
- **One queue per court** — a user can only wait at one position per court
- **Auto-expiry** — entries expire after `QUEUE_EXPIRY_HOURS` (default: 2 hours)
- **Game ready alert** — when queue has ≥ N players for a format (1v1=2, 2v2=4, 3v3=6, 4v4=8, 5v5=10), a `game_ready` socket event fires

---

## Production Deployment

1. Set `NODE_ENV=production` and provide a real `JWT_SECRET`
2. Use a managed PostgreSQL service (Supabase, Railway, Neon, RDS)
3. For file storage, replace local `uploads/` with S3 or Cloudflare R2
4. Set `CLIENT_URL` to your deployed frontend domain
5. Deploy server to Railway, Render, or Fly.io; client to Vercel or Netlify
