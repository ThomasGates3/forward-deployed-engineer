import { Redis } from "@upstash/redis";

// Singleton Upstash client. Returns null when unconfigured so local dev / preview
// without Redis degrades to "always allow" rather than crashing.
let client: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}
