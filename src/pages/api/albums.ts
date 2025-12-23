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
    .prepare(`
      SELECT 
        a.*,
        i.src as cover_image_src
      FROM albums a
      LEFT JOIN images i ON a.cover_image_id = i.id
      ORDER BY a.created_at DESC
    `)
    .all();

  return new Response(JSON.stringify(results), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  // Check auth (cookie)
  const cookie = request.headers.get("cookie");
  if (!cookie?.includes("admin_session=true")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { title, slug } = await request.json();
  // @ts-ignore
  const db = locals.runtime?.env?.DB;

  try {
    await db
      .prepare("INSERT INTO albums (title, slug) VALUES (?, ?)")
      .bind(title, slug)
      .run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    const error = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  // Check auth
  const cookie = request.headers.get("cookie");
  if (!cookie?.includes("admin_session=true")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  // @ts-ignore
  const db = locals.runtime?.env?.DB;

  await db.prepare("DELETE FROM albums WHERE id = ?").bind(id).run();
  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
