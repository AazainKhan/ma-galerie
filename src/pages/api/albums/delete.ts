import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
  const cookie = request.headers.get("cookie");
  if (!cookie?.includes("admin_session=true")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await request.json();

  if (!id) return new Response("Missing ID", { status: 400 });

  try {
    // @ts-ignore
    const db = locals.runtime?.env?.DB;

    // First, unassign images from this album
    await db
      .prepare("UPDATE images SET album_id = NULL WHERE album_id = ?")
      .bind(id)
      .run();

    // Then delete the album
    await db.prepare("DELETE FROM albums WHERE id = ?").bind(id).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Delete failed", { status: 500 });
  }
};
