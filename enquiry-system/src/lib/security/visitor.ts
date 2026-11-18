import { createHash } from "node:crypto";
import { env } from "@/lib/env";

/**
 * A stable, non-reversible visitor id for rate limiting and abuse review.
 *
 * Raw IP addresses are personal information under POPIA; we have no need to
 * store them, so we don't. The salt is a server secret, which stops anyone
 * with database access brute-forcing the IPv4 space back out of the hash.
 */
export function clientIp(headers: Headers): string {
  // Vercel and most proxies put the original client first in x-forwarded-for.
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}

export function visitorHash(headers: Headers): string {
  const ua = headers.get("user-agent") ?? "";
  return createHash("sha256")
    .update(`${env().VISITOR_HASH_SALT}|${clientIp(headers)}|${ua}`)
    .digest("hex")
    .slice(0, 32);
}
