import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, locals }) => {
  // 1. Verify Auth (Cookie check)
  const cookie = request.headers.get("cookie");
  if (!cookie?.includes("admin_session=true")) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2. Get File
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) return new Response("No file found", { status: 400 });

  // 3. Upload to R2
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const arrayBuffer = await file.arrayBuffer();

  try {
    // @ts-ignore
    const bucket = locals.runtime?.env?.IMAGES;
    // @ts-ignore
    const db = locals.runtime?.env?.DB;

    if (!bucket || !db) {
      console.error("Bindings not found");
      return new Response("Server Configuration Error", { status: 500 });
    }

    await bucket.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // 4. Insert into D1
    // We need dimensions. Since we are server-side, we can't easily get them without a library.
    // For now, we'll accept them from the client or default to 0 and update later.
    // Better approach: Client sends dimensions in FormData.
    const width = parseInt(formData.get("width") as string) || 0;
    const height = parseInt(formData.get("height") as string) || 0;
    const albumId = formData.get("album_id")
      ? parseInt(formData.get("album_id") as string)
      : null;
    const isCover = formData.get("is_cover") === "true";
    const alt = file.name.split(".")[0];
    const url = `/image/${fileName}`;

    const result = await db
      .prepare(
        "INSERT INTO images (src, width, height, alt, album_id) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(url, width, height, alt, albumId)
      .run();

    // If this is a cover image, update the album
    if (isCover && albumId && result.meta.last_row_id) {
      await db
        .prepare("UPDATE albums SET cover_image_id = ? WHERE id = ?")
        .bind(result.meta.last_row_id, albumId)
        .run();
    }

    // Ensure we're returning plain values, not D1 objects
    const imageId = result.meta.last_row_id
      ? Number(result.meta.last_row_id)
      : null;

    return new Response(
      JSON.stringify({
        url,
        fileName,
        imageId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error(e);
    return new Response("Upload failed", { status: 500 });
  }
};
