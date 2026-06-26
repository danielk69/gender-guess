#!/usr/bin/env tsx
/**
 * Downloads 60 portrait photos from randomuser.me and writes:
 * - public/photos/001.jpg ... 060.jpg
 * - public/photos/manifest.json
 * - backend/sql/002_seed_images.sql
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const COUNT = 60;
const PHOTOS_DIR = path.join(process.cwd(), "public/photos");
const MANIFEST_PATH = path.join(PHOTOS_DIR, "manifest.json");
const SQL_PATH = path.join(process.cwd(), "backend/sql/002_seed_images.sql");

type ManifestEntry = {
  id: string;
  filename: string;
  public_url: string;
  is_transgender: boolean;
};

function assignLabels(count: number): boolean[] {
  const labels = Array.from({ length: count }, (_, i) => i < count / 2);
  for (let i = labels.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [labels[i], labels[j]] = [labels[j], labels[i]];
  }
  return labels;
}

async function main() {
  await mkdir(PHOTOS_DIR, { recursive: true });
  await mkdir(path.dirname(SQL_PATH), { recursive: true });

  const response = await fetch(
    `https://randomuser.me/api/?results=${COUNT}&inc=picture`
  );
  if (!response.ok) throw new Error("Failed to fetch portraits");

  const json = (await response.json()) as {
    results: { picture: { large: string } }[];
  };

  const labels = assignLabels(COUNT);
  const manifest: ManifestEntry[] = [];

  for (let i = 0; i < COUNT; i++) {
    const num = String(i + 1).padStart(3, "0");
    const filename = `${num}.jpg`;
    const filePath = path.join(PHOTOS_DIR, filename);

    const imgRes = await fetch(json.results[i].picture.large);
    if (!imgRes.ok) throw new Error(`Failed to download image ${num}`);
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    await writeFile(filePath, buffer);

    manifest.push({
      id: `local-${num}`,
      filename,
      public_url: `/photos/${filename}`,
      is_transgender: labels[i],
    });

    console.log(`✓ ${filename}`);
  }

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  const sql = [
    "-- Seed 60 game images (run after 001_schema.sql)",
    "insert into public.images (id, storage_path, public_url, is_transgender, source) values",
    ...manifest.map((entry, i) => {
      const comma = i < manifest.length - 1 ? "," : ";";
      return `  ('${entry.id}', 'photos/${entry.filename}', '${entry.public_url}', ${entry.is_transgender}, 'seed')${comma}`;
    }),
    "",
    "-- On conflict, skip if re-running:",
    "-- use: insert ... on conflict (id) do nothing;",
  ].join("\n");

  await writeFile(SQL_PATH, sql);
  console.log(`\nWrote ${MANIFEST_PATH}`);
  console.log(`Wrote ${SQL_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
