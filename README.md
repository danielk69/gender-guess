# Gender Guesser

React frontend + Next.js API + Cloudflare D1 database, deployed to Cloudflare Workers via OpenNext.

## Structure

```
app/              React pages + API routes (frontend + backend entry)
backend/
  db.ts           D1 database access (Cloudflare binding)
  handlers.ts     All backend logic
  sql/            D1 schema + seed migrations
components/       Game.tsx, Shell.tsx, LastScore.tsx
hooks/useGame.ts  Game state
lib/types.ts      Shared types
lib/game.ts       Constants + helpers
public/photos/    Offline fallback images (until DB is seeded)
wrangler.jsonc    Cloudflare Worker + D1 config
```

## Setup

```bash
npm install
npm run db:migrate:local   # create local D1 tables + seed images
npm run dev
```

Check http://localhost:3000/api/health

Without a D1 binding the app still runs with a **warning banner** and local fallback photos from `public/photos/`.

### Database (Cloudflare D1)

Local development uses a simulated D1 database via Wrangler (configured in `wrangler.jsonc`):

```bash
npm run db:migrate:local    # apply schema + seed locally
npm run db:migrate:remote   # apply to production D1 (after deploy setup)
```

For production, create a remote D1 database and update `wrangler.jsonc`:

```bash
npx wrangler d1 create gender-guess
# Copy the database_id into wrangler.jsonc, then:
npm run db:migrate:remote
```

### Deploy to Cloudflare

```bash
npm run deploy
```

## API

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
