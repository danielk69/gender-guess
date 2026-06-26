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

let manifestCache: GameImage[] | null = null;
let imagesCache: { images: GameImage[]; warning: string | null; at: number } | null = null;
let leaderboardCache: { entries: LeaderboardEntry[]; at: number } | null = null;
const IMAGES_CACHE_MS = 5 * 60 * 1000;
const LEADERBOARD_CACHE_MS = 30 * 1000;

function invalidateLeaderboardCache() {
  leaderboardCache = null;
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
        "Database not configured. Add Supabase credentials to .env.local and run backend/sql migrations.",
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

  const [{ count, error: imgErr }, { error: lbErr }] = await Promise.all([
    db.from("images").select("*", { count: "exact", head: true }),
    db.from("leaderboard_entries").select("*", { count: "exact", head: true }),
  ]);

  const imageCount = count ?? 0;
  let warning: string | null = null;

  if (imgErr) {
    warning = `Images table error: ${imgErr.message}. Run backend/sql/001_schema.sql`;
  } else if (imageCount === 0) {
    const fallback = await loadManifestFallback().catch(() => []);
    if (fallback.length > 0) {
      warning =
        "Database has no images yet. Using local fallback. Run backend/sql/002_seed_images.sql to seed.";
      return {
        configured: true,
        connected: true,
        imageCount: fallback.length,
        leaderboardOk: !lbErr,
        warning,
      };
    }
    warning = "No images in database. Upload images or run the seed SQL.";
  }

  return {
    configured: true,
    connected: !imgErr,
    imageCount: imageCount || 0,
    leaderboardOk: !lbErr,
    warning,
  };
}

/** All images for a game session — fetched once from DB, manifest as fallback */
export async function getImages(): Promise<{ images: GameImage[]; warning: string | null }> {
  if (imagesCache && Date.now() - imagesCache.at < IMAGES_CACHE_MS) {
    return { images: imagesCache.images, warning: imagesCache.warning };
  }

  if (isDbConfigured()) {
    const db = getDb();
    if (db) {
      const { data, error } = await db.from("images").select("id, storage_path, public_url, is_transgender");
      if (!error && data && data.length > 0) {
        const result = { images: data, warning: null as string | null };
        imagesCache = { ...result, at: Date.now() };
        return result;
      }
      if (error) {
        const fallback = await loadManifestFallback().catch(() => []);
        const warning = `Images table error: ${error.message}. Using local fallback.`;
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
  const { data } = await db
    .from("leaderboard_entries")
    .select("id, player_name, score, correct_count, rounds_played")
    .order("score", { ascending: false })
    .limit(50);

  const entries = (data ?? []) as LeaderboardEntry[];
  leaderboardCache = { entries, at: Date.now() };
  return entries;
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

  const { error } = await db.from("leaderboard_entries").insert(entry);
  if (error) return { ok: false as const, offline: false, error: error.message };
  invalidateLeaderboardCache();
  return { ok: true as const };
}
