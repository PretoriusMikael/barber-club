import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { errorResponse, json, withErrorHandling } from "@/lib/http";
import { dispatchOutbox } from "@/lib/outbox/dispatch";

/**
 * Retries undelivered outbox events. Call every 5 minutes from an n8n
 * Schedule trigger (or Vercel Cron on a paid plan):
 *
 *   GET /api/cron/dispatch
 *   Authorization: Bearer <CRON_SECRET>
 */
export const GET = withErrorHandling("cron-dispatch", async (req: NextRequest) => {
  const expected = Buffer.from(`Bearer ${env().CRON_SECRET}`);
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return errorResponse(401, "unauthorised", "Unauthorised.");
  }
  return json(await dispatchOutbox({ limit: 50 }));
});
