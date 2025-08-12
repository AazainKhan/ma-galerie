import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  // Add Cloudflare-specific headers for better performance
  const response = await next();

  if (response instanceof Response) {
    // Add security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Add performance headers
    response.headers.set(
      "Cache-Control",
      "public, max-age=31536000, immutable",
    );

    // Add Cloudflare-specific headers
    response.headers.set("CF-Cache-Status", "DYNAMIC");

    // Add compression hint
    response.headers.set("Accept-Encoding", "gzip, deflate, br");
  }

  return response;
});

