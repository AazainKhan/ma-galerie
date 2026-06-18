import { defineMiddleware } from "astro:middleware";

const STATIC_EXT =
  /\.(js|css|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf|avif)$/i;

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();

  if (!(response instanceof Response)) return response;

  const path = new URL(context.request.url).pathname;

  // Security headers on all responses
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Allow admin pages to be framed by themselves (for future embedding), but block others
  if (!path.startsWith("/admin")) {
    response.headers.set("X-Frame-Options", "DENY");
  }

  // Cache control: only static assets get long-lived immutable cache
  if (STATIC_EXT.test(path)) {
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );
  } else if (path.startsWith("/api/")) {
    // API routes must never be cached — they return dynamic data and auth-sensitive responses
    response.headers.set("Cache-Control", "no-store");
  } else if (path.startsWith("/admin")) {
    // Admin pages must never be cached — auth state must always be fresh
    response.headers.set("Cache-Control", "no-store, no-cache");
  } else {
    // HTML pages: revalidate on every request
    response.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
  }

  return response;
});
