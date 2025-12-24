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

  // Convert to plain objects
  const images = (results || []).map((img: any) => ({
    id: img.id,
    src: img.src,
    width: img.width,
    height: img.height,
    alt: img.alt,
    album_id: img.album_id,
    created_at: img.created_at,
  }));

  return new Response(JSON.stringify(images), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
