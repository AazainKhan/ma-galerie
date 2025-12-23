import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals }) => {
  const key = params.key;
  if (!key) return new Response("Not found", { status: 404 });

  // @ts-ignore
  const bucket = locals.runtime?.env?.IMAGES;

  if (!bucket) {
    return new Response("Server Configuration Error", { status: 500 });
  }

  const object = await bucket.get(key);

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

  return new Response(object.body, {
    headers,
  });
};
