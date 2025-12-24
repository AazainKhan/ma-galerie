import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, locals }) => {
  const rawKey = params.key;
  if (!rawKey) return new Response("Not found", { status: 404 });

  let key: string;
  try {
    key = decodeURIComponent(rawKey);
  } catch {
    key = rawKey;
  }

  // @ts-ignore
  const bucket = locals.runtime?.env?.IMAGES;

  if (!bucket) {
    return new Response("Server Configuration Error", { status: 500 });
  }

  let object: any;
  try {
    object = await bucket.get(key);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers();
  try {
    object.writeHttpMetadata(headers);
  } catch {
    // Some local/dev R2 implementations can throw here.
  }

  const ext = key.toLowerCase().split(".").pop();
  const fallbackType =
    ext === "jpg" || ext === "jpeg"
      ? "image/jpeg"
      : ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : "application/octet-stream";
  if (!headers.has("content-type")) {
    headers.set("content-type", fallbackType);
  }

  if (object?.httpEtag) {
    headers.set("etag", String(object.httpEtag));
  }
  headers.set("Cache-Control", "public, max-age=31536000"); // Cache for 1 year

  // Convert body to arrayBuffer for proper serialization
  let body: ArrayBuffer;
  try {
    body = await object.arrayBuffer();
  } catch {
    return new Response("Not found", { status: 404 });
  }

  return new Response(body, {
    headers,
  });
};
