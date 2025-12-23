import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Verify Auth
  const cookie = request.headers.get("cookie");
  if (!cookie?.includes("admin_session=true")) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Get Key
  const { key, id } = await request.json();

  if (!key) return new Response("No key provided", { status: 400 });

  try {
    // @ts-ignore
    const bucket = locals.runtime?.env?.IMAGES;
    // @ts-ignore
    const db = locals.runtime?.env?.DB;

    if (!bucket || !db) {
      return new Response("Server Configuration Error", { status: 500 });
    }

    // Delete from R2
    await bucket.delete(key);

    // Delete from D1
    if (id) {
      await db.prepare("DELETE FROM images WHERE id = ?").bind(id).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Delete failed", { status: 500 });
  }
};
