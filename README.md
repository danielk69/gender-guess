# Gender Guesser

React frontend + Node.js API (Next.js) + Supabase database.

## Structure

```
app/              React pages + API routes (frontend + backend entry)
backend/
  db.ts           Database connection (Supabase)
  handlers.ts     All backend logic
  sql/            PostgreSQL schema + seed
components/       Game.tsx, Shell.tsx, LastScore.tsx
hooks/useGame.ts  Game state
lib/types.ts      Shared types
lib/game.ts       Constants + helpers
public/photos/    Offline fallback images (until DB is seeded)
```

## Setup

```bash
npm install
npm run dev
```

### Database (Supabase)

1. Fill `.env.local` (see `.env.local.example`)
2. Run `backend/sql/001_schema.sql` then `002_seed_images.sql` in Supabase SQL editor
3. Check http://localhost:3000/api/health

Without credentials the app still runs with a **warning banner** and local fallback photos.

## API (Node.js backend)

| Route | Description |
|-------|-------------|
| `GET /api/health` | Database status + warnings |
| `GET /api/images` | All images (fetched once per game) |
| `GET /api/leaderboard` | Top scores |
| `POST /api/leaderboard` | Submit score |

## Game

- 60-second timer starts when the round begins
- **T** = Transgender, **C** = Cisgender
- Results grid at end (photos not clickable)
