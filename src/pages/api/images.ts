import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  // @ts-ignore
  const db = locals.runtime?.env?.DB;

  if (!db) {
    return new Response(JSON.stringify({ error: "DB not found" }), {
      status: 500,
    });
  }

  const { results } = await db
    .prepare("SELECT * FROM images ORDER BY created_at DESC")
    .all();

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
