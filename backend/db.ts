import { getCloudflareContext } from "@opennextjs/cloudflare";

export function getDb() {
  try {
    const { env } = getCloudflareContext();
    return env.DB ?? null;
  } catch {
    return null;
  }
}

export function isDbConfigured() {
  return getDb() !== null;
}
