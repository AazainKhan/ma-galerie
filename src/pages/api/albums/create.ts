import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
  const cookie = request.headers.get("cookie");
  if (!cookie?.includes("admin_session=true")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { title, slug } = await request.json();

  if (!title || !slug)
    return new Response("Missing title or slug", { status: 400 });

  try {
    // @ts-ignore
    const db = locals.runtime?.env?.DB;

    await db
      .prepare("INSERT INTO albums (title, slug) VALUES (?, ?)")
      .bind(title, slug)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Create failed", { status: 500 });
  }
};
