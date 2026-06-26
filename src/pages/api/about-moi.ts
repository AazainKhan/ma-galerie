import type { APIRoute } from "astro";

// The three "About Moi" story blocks shown on the About page. Stored in their
// own table (not in albums). The table is created + seeded on demand so it
// works on a fresh local or production D1 with no manual migration.
const DEFAULTS = [
  {
    slot: 0,
    title: "Behind the lens",
    text: "I picked up a borrowed camera years ago and never handed it back. Photography became how I hold onto the things that pass too quickly.",
  },
  {
    slot: 1,
    title: "Chasing light",
    text: "Golden hour, blue hour, and the soft grey in between — I follow the light wherever it decides to fall.",
  },
  {
    slot: 2,
    title: "Moments, not poses",
    text: "The frames I love most are the unguarded ones: a glance, a laugh, the quiet pause between heartbeats.",
  },
];

// biome-ignore lint/suspicious/noExplicitAny: D1 runtime binding
async function ensureTable(db: any) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS about_moi (
        slot INTEGER PRIMARY KEY,
        title TEXT,
        text TEXT,
        image_src TEXT
      )`,
    )
    .run();
  const { results } = await db.prepare("SELECT slot FROM about_moi").all();
  const existing = new Set(
    (results || []).map((r: { slot: number }) => r.slot),
  );
  for (const d of DEFAULTS) {
    if (!existing.has(d.slot)) {
      await db
        .prepare(
          "INSERT INTO about_moi (slot, title, text, image_src) VALUES (?, ?, ?, NULL)",
        )
        .bind(d.slot, d.title, d.text)
        .run();
    }
  }
}

export const GET: APIRoute = async ({ locals }) => {
  // @ts-ignore
  const db = locals.runtime?.env?.DB;
  if (!db) return new Response(JSON.stringify([]), { status: 200 });
  await ensureTable(db);
  const { results } = await db
    .prepare(
      "SELECT slot, title, text, image_src FROM about_moi ORDER BY slot ASC",
    )
    .all();
  return new Response(JSON.stringify(results || []), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const cookie = request.headers.get("cookie");
  if (!cookie?.includes("admin_session=true")) {
    return new Response("Unauthorized", { status: 401 });
  }
  // @ts-ignore
  const db = locals.runtime?.env?.DB;
  // @ts-ignore
  const bucket = locals.runtime?.env?.IMAGES;
  if (!db) return new Response("Server Configuration Error", { status: 500 });
  await ensureTable(db);

  const form = await request.formData();
  const slot = Number.parseInt(form.get("slot") as string, 10);
  const title = ((form.get("title") as string) ?? "").trim();
  const text = ((form.get("text") as string) ?? "").trim();
  if (Number.isNaN(slot) || slot < 0 || slot > 2) {
    return new Response("Invalid slot", { status: 400 });
  }

  let imageSrc: string | null = null;
  const file = form.get("file") as File | null;
  if (file && file.size > 0 && bucket) {
    const fileName = `aboutmoi-${slot}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    await bucket.put(fileName, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type },
    });
    imageSrc = `/image/${fileName}`;
  }

  if (imageSrc) {
    await db
      .prepare(
        "UPDATE about_moi SET title = ?, text = ?, image_src = ? WHERE slot = ?",
      )
      .bind(title, text, imageSrc, slot)
      .run();
  } else {
    await db
      .prepare("UPDATE about_moi SET title = ?, text = ? WHERE slot = ?")
      .bind(title, text, slot)
      .run();
  }

  return new Response(JSON.stringify({ success: true, image_src: imageSrc }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
