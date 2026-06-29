import { readFile } from "fs/promises";
import path from "path";
import { getDb, isDbConfigured } from "./db";
import type { GameImage, LeaderboardEntry } from "@/lib/types";

export type HealthStatus = {
  configured: boolean;
  connected: boolean;
  imageCount: number;
  leaderboardOk: boolean;
  warning: string | null;
};

type ImageRow = {
  id: string;
  storage_path: string;
  public_url: string;
  is_transgender: number;
};

let manifestCache: GameImage[] | null = null;
let imagesCache: { images: GameImage[]; warning: string | null; at: number } | null = null;
let leaderboardCache: { entries: LeaderboardEntry[]; at: number } | null = null;
const IMAGES_CACHE_MS = 5 * 60 * 1000;
const LEADERBOARD_CACHE_MS = 30 * 1000;

function invalidateLeaderboardCache() {
  leaderboardCache = null;
}

function mapImage(row: ImageRow): GameImage {
  return {
    id: row.id,
    storage_path: row.storage_path,
    public_url: row.public_url,
    is_transgender: Boolean(row.is_transgender),
  };
}

async function loadManifestFallback(): Promise<GameImage[]> {
  if (manifestCache) return manifestCache;
  const file = path.join(process.cwd(), "public/photos/manifest.json");
  const raw = await readFile(file, "utf-8");
  const data = JSON.parse(raw) as GameImage[];
  manifestCache = data.map((img) => ({
    id: img.id,
    storage_path: img.storage_path ?? `photos/${img.public_url.split("/").pop()}`,
    public_url: img.public_url,
    is_transgender: img.is_transgender,
  }));
  return manifestCache;
}

export async function getHealth(): Promise<HealthStatus> {
  if (!isDbConfigured()) {
    const fallback = await loadManifestFallback().catch(() => []);
    return {
      configured: false,
      connected: false,
      imageCount: fallback.length,
      leaderboardOk: false,
      warning:
        "Database not configured. Run `npm run db:migrate:local` for local dev, or deploy with a D1 binding.",
    };
  }

  const db = getDb();
  if (!db) {
    return {
      configured: true,
      connected: false,
      imageCount: 0,
      leaderboardOk: false,
      warning: "Could not connect to database.",
    };
  }

  try {
    const [imageResult, leaderboardResult] = await Promise.all([
      db.prepare("SELECT COUNT(*) AS count FROM images").first<{ count: number }>(),
      db.prepare("SELECT COUNT(*) AS count FROM leaderboard_entries").first<{ count: number }>(),
    ]);

    const imageCount = imageResult?.count ?? 0;
    let warning: string | null = null;

    if (imageCount === 0) {
      const fallback = await loadManifestFallback().catch(() => []);
      if (fallback.length > 0) {
        warning =
          "Database has no images yet. Using local fallback. Run `npm run db:migrate:local` to seed.";
        return {
          configured: true,
          connected: true,
          imageCount: fallback.length,
          leaderboardOk: leaderboardResult !== null,
          warning,
        };
      }
      warning = "No images in database. Run migrations to seed images.";
    }

    return {
      configured: true,
      connected: true,
      imageCount,
      leaderboardOk: leaderboardResult !== null,
      warning,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown database error";
    return {
      configured: true,
      connected: false,
      imageCount: 0,
      leaderboardOk: false,
      warning: `Database error: ${message}. Run backend/sql migrations via wrangler.`,
    };
  }
}

/** All images for a game session — fetched once from DB, manifest as fallback */
export async function getImages(): Promise<{ images: GameImage[]; warning: string | null }> {
  if (imagesCache && Date.now() - imagesCache.at < IMAGES_CACHE_MS) {
    return { images: imagesCache.images, warning: imagesCache.warning };
  }

  if (isDbConfigured()) {
    const db = getDb();
    if (db) {
      try {
        const { results } = await db
          .prepare(
            "SELECT id, storage_path, public_url, is_transgender FROM images"
          )
          .all<ImageRow>();

        if (results.length > 0) {
          const images = results.map(mapImage);
          const result = { images, warning: null as string | null };
          imagesCache = { ...result, at: Date.now() };
          return result;
        }
      } catch (err) {
        const fallback = await loadManifestFallback().catch(() => []);
        const message = err instanceof Error ? err.message : "Unknown database error";
        const warning = `Images table error: ${message}. Using local fallback.`;
        const result = { images: fallback, warning };
        if (fallback.length) imagesCache = { ...result, at: Date.now() };
        return result;
      }
    }
  }

  const fallback = await loadManifestFallback().catch(() => []);
  const result = {
    images: fallback,
    warning: fallback.length ? "Using offline image pool." : "No images available.",
  };
  if (fallback.length) imagesCache = { ...result, at: Date.now() };
  return result;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  if (leaderboardCache && Date.now() - leaderboardCache.at < LEADERBOARD_CACHE_MS) {
    return leaderboardCache.entries;
  }

  const db = getDb();
  if (!db) return [];

  try {
    const { results } = await db
      .prepare(
        `SELECT id, player_name, score, correct_count, wrong_count, max_streak, rounds_played, created_at
         FROM leaderboard_entries
         ORDER BY score DESC
         LIMIT 50`
      )
      .all<LeaderboardEntry>();

    const entries = results ?? [];
    leaderboardCache = { entries, at: Date.now() };
    return entries;
  } catch {
    return [];
  }
}

export async function submitScore(entry: {
  player_name: string;
  score: number;
  correct_count: number;
  wrong_count: number;
  max_streak: number;
  rounds_played: number;
}) {
  if (!isDbConfigured()) {
    return { ok: false as const, offline: true, error: "Database not configured" };
  }
  const db = getDb();
  if (!db) return { ok: false as const, offline: true, error: "Database unavailable" };

  const name = entry.player_name.trim();
  if (name.length < 2 || name.length > 24) {
    return { ok: false as const, offline: false, error: "Name must be 2–24 characters" };
  }
  if (entry.rounds_played <= 0) {
    return { ok: false as const, offline: false, error: "Invalid round count" };
  }
  if (entry.score > entry.rounds_played * 100 + entry.max_streak * 25) {
    return { ok: false as const, offline: false, error: "Invalid score" };
  }

  try {
    const result = await db
      .prepare(
        `INSERT INTO leaderboard_entries
         (id, player_name, score, correct_count, wrong_count, max_streak, rounds_played)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        crypto.randomUUID(),
        name,
        entry.score,
        entry.correct_count,
        entry.wrong_count,
        entry.max_streak,
        entry.rounds_played
      )
      .run();

    if (!result.success) {
      return { ok: false as const, offline: false, error: "Failed to save score" };
    }

    invalidateLeaderboardCache();
    return { ok: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save score";
    return { ok: false as const, offline: false, error: message };
  }
}
