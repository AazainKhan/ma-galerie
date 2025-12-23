import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const { password } = await request.json();

  // Simple password check against environment variable
  // In production, set ADMIN_PASSWORD in Cloudflare Dashboard
  // In dev, set it in .dev.vars or .env
  const validPassword = import.meta.env.ADMIN_PASSWORD || "admin123";

  if (password === validPassword) {
    // Create a simple session cookie (without HttpOnly so JS can read it)
    const headers = new Headers();
    headers.append(
      "Set-Cookie",
      `admin_session=true; Path=/; SameSite=Strict; Max-Age=86400`,
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers,
    });
  }

  return new Response(JSON.stringify({ error: "Invalid password" }), {
    status: 401,
  });
};
