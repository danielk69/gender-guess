#!/usr/bin/env tsx
import { config } from "dotenv";
import { readdir, readFile } from "fs/promises";
import path from "path";

config({ path: ".env.local" });

const IMAGES_DIR = process.argv[2] ?? path.join(process.cwd(), "images");
const API_URL = process.env.SEED_API_URL ?? "http://localhost:3000/api/upload";
const UPLOAD_SECRET = process.env.UPLOAD_SECRET;

async function collectFiles(dir: string, isTransgender: boolean) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && /\.(webp|png|jpg|jpeg)$/i.test(e.name))
    .map((e) => ({ filePath: path.join(dir, e.name), isTransgender }));
}

async function upload(filePath: string, isTransgender: boolean) {
  if (!UPLOAD_SECRET) throw new Error("UPLOAD_SECRET required in .env.local");

  const buffer = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const type =
    ext === ".png" ? "image/png" : ext.match(/jpe?g/) ? "image/jpeg" : "image/webp";

  const form = new FormData();
  form.append("file", new Blob([buffer], { type }), path.basename(filePath));
  form.append("is_transgender", isTransgender ? "true" : "false");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "x-upload-secret": UPLOAD_SECRET },
    body: form,
  });
  if (!res.ok) throw new Error(`${filePath}: ${await res.text()}`);
  return res.json();
}

async function main() {
  const files = [
    ...(await collectFiles(path.join(IMAGES_DIR, "trans"), true)),
    ...(await collectFiles(path.join(IMAGES_DIR, "cis"), false)),
  ];
  if (!files.length) {
    console.error("Expected images/trans/ and images/cis/ with photos");
    process.exit(1);
  }
  for (const { filePath, isTransgender } of files) {
    const r = await upload(filePath, isTransgender);
    console.log(`✓ ${path.basename(filePath)} → ${r.image?.id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
