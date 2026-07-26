import { createHash } from "crypto";

// Stable, privacy-preserving visitor id. Never stores raw IP.
export function visitorId(req: Request): string {
  const h = req.headers;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "anon";
  const ua = h.get("user-agent") || "";
  const salt = process.env.VISITOR_SALT || "fde-portfolio";
  return createHash("sha256").update(`${ip}|${ua}|${salt}`).digest("hex").slice(0, 24);
}
