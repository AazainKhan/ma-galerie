import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
  const cookie = request.headers.get("cookie");
  if (!cookie?.includes("admin_session=true")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id, album_id, alt } = await request.json();

  if (!id) return new Response("Missing ID", { status: 400 });

  try {
    // @ts-ignore
    const db = locals.runtime?.env?.DB;

    // Build dynamic update query based on provided fields
    const updates = [];
    const bindings = [];

    if (album_id !== undefined) {
      updates.push("album_id = ?");
      bindings.push(album_id);
    }

    if (alt !== undefined) {
      updates.push("alt = ?");
      bindings.push(alt);
    }

    if (updates.length === 0) {
      return new Response("No fields to update", { status: 400 });
    }

    bindings.push(id);

    await db
      .prepare(`UPDATE images SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...bindings)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Update failed", { status: 500 });
  }
};
