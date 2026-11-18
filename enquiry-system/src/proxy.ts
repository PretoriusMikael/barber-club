import { NextResponse, type NextRequest } from "next/server";
import { loadTenant } from "@/lib/tenants/load";

/**
 * Per-tenant embedding policy for the widget page.
 *
 * The widget runs in an iframe served from this app, so the browser — not our
 * code — enforces which websites may embed a tenant's assistant, via
 * `frame-ancestors`. A copied embed snippet on someone else's site renders
 * nothing, and cannot spend the tenant's API budget through the UI.
 *
 * (This does not stop a script calling /api/chat directly. Rate limits, the
 * daily cap and the per-conversation cap are what bound that.)
 */
export async function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2] ?? "";
  let ancestors = "'none'";
  try {
    const tenant = await loadTenant(slug);
    if (tenant) {
      // "https://*.vercel.app"-style wildcards are valid CSP, but allow every site on that
      // host to embed the widget. Use them for preview testing only, never in production.
      const origins = tenant.allowedOrigins.filter((o) => /^https?:\/\/(\*\.)?[a-z0-9.-]+(:\d+)?$/i.test(o));
      ancestors = ["'self'", ...origins].join(" ");
    }
  } catch (err) {
    console.error("[proxy] tenant lookup failed", err);
  }

  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", `frame-ancestors ${ancestors}`);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: "/embed/:slug*",
};
