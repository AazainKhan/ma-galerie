import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
  const cookie = request.headers.get("cookie");
  if (!cookie?.includes("admin_session=true")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id, title, slug, cover_image_id } = await request.json();

  if (!id) {
    return new Response("Missing required fields", { status: 400 });
  }

  try {
    // @ts-ignore
    const db = locals.runtime?.env?.DB;

    // Build dynamic update query
    const updates: string[] = [];
    const bindings: (string | number)[] = [];

    if (title !== undefined) {
      updates.push("title = ?");
      bindings.push(title);
    }

    if (slug !== undefined) {
      updates.push("slug = ?");
      bindings.push(slug);
    }

    if (cover_image_id !== undefined) {
      updates.push("cover_image_id = ?");
      bindings.push(cover_image_id);
    }

    if (updates.length === 0) {
      return new Response("No fields to update", { status: 400 });
    }

    bindings.push(id);

    await db
      .prepare(`UPDATE albums SET ${updates.join(", ")} WHERE id = ?`)
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
