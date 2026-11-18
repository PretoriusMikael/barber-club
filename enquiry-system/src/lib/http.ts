import { NextResponse } from "next/server";

export function json<T>(body: T, status = 200): NextResponse<T> {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/** Errors the visitor sees. Never include internal details. */
export function errorResponse(status: number, code: string, message: string) {
  return json({ error: { code, message } }, status);
}

/**
 * Last line of defence: an unexpected failure (database down, bug) returns a
 * clean 503 the widget understands, instead of an HTML error page. The widget
 * then falls back to showing the business's phone number and email.
 */
export function withErrorHandling<A extends unknown[]>(name: string, handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error(`[${name}] unhandled error`, err);
      return errorResponse(503, "unavailable", "Something went wrong on our side. Please try again, or contact the business directly.");
    }
  };
}
