import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request, locals }) => {
  const db = (locals as any).runtime?.env?.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: "DB not available" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  try {
    if (slug) {
      const result = await db
        .prepare(
          "SELECT COUNT(*) as imageCount FROM images WHERE album_id = (SELECT id FROM albums WHERE slug = ?)",
        )
        .bind(slug)
        .first();
      return new Response(
        JSON.stringify({ imageCount: result?.imageCount ?? 0 }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const result = await db
      .prepare(
        "SELECT (SELECT COUNT(*) FROM images) as totalImages, (SELECT COUNT(*) FROM albums) as totalAlbums",
      )
      .first();
    return new Response(
      JSON.stringify({
        totalImages: result?.totalImages ?? 0,
        totalAlbums: result?.totalAlbums ?? 0,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch {
    return new Response(JSON.stringify({ error: "Query failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
