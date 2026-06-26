import type { APIRoute } from "astro";

// Editable copy for the About page sections (everything except the "About Moi"
// image blocks, which keep their own about_moi table). Stored as one JSON blob
// per section in a key/value site_content table, created + seeded on demand so a
// fresh local or production D1 needs no manual migration.
const DEFAULTS: Record<string, unknown> = {
  galerie: {
    title: "About Ma Galerie",
    body: "Welcome to Ma Galerie, a curated collection of photography that captures moments, emotions, and the beauty of the world around us.\n\nThis gallery showcases a variety of photographic styles and subjects, from landscapes and nature to portraits and street photography. Each image tells a story and invites you to see the world through a different lens.\n\nThe gallery is built with modern web technologies to provide a seamless viewing experience across all devices, featuring a responsive design and an intuitive lightbox for exploring images in detail.",
  },
  vision: {
    title: "Ma Vision",
    lead: "My vision is to capture the essence of",
    words: [
      {
        text: "life",
        img: "https://images.unsplash.com/photo-1718969604981-de826f44ce15?w=440&h=300&fit=crop&auto=format",
      },
      {
        text: "emotion",
        img: "https://images.unsplash.com/photo-1476180814856-a36609db0493?w=440&h=300&fit=crop&auto=format",
      },
      {
        text: "beauty",
        img: "https://images.unsplash.com/photo-1595407660626-db35dcd16609?w=440&h=300&fit=crop&auto=format",
      },
    ],
    close:
      "in every frame. Through my lens, I strive to tell stories that resonate, inspire, and connect us to the world and each other.",
  },
  gear: {
    title: "Ma Gear",
    description:
      "Behind every great photograph is the right equipment. Here's a look at the gear that helps bring these images to life.",
    items: [
      { icon: "📷", name: "Sony A7IV", category: "Body" },
      { icon: "🔍", name: "Sony 35mm f/1.4 GM", category: "Lens" },
      { icon: "🔍", name: "Sony 85mm f/1.8", category: "Lens" },
      { icon: "📐", name: "Peak Design Tripod", category: "Accessory" },
    ],
  },
};

const SECTIONS = ["galerie", "vision", "gear"] as const;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// biome-ignore lint/suspicious/noExplicitAny: D1 runtime binding
async function ensureTable(db: any) {
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS site_content (key TEXT PRIMARY KEY, value TEXT)",
    )
    .run();
}

// biome-ignore lint/suspicious/noExplicitAny: D1 runtime binding
async function readSection(db: any, key: string) {
  const row = await db
    .prepare("SELECT value FROM site_content WHERE key = ?")
    .bind(key)
    .first();
  if (row?.value) {
    try {
      return JSON.parse(row.value);
    } catch {
      /* fall through to default */
    }
  }
  return DEFAULTS[key];
}

export const GET: APIRoute = async ({ locals }) => {
  // @ts-ignore
  const db = locals.runtime?.env?.DB;
  if (!db) {
    return json({
      galerie: DEFAULTS.galerie,
      vision: DEFAULTS.vision,
      gear: DEFAULTS.gear,
    });
  }
  await ensureTable(db);
  const out: Record<string, unknown> = {};
  for (const key of SECTIONS) out[key] = await readSection(db, key);
  return json(out);
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
  const section = String(form.get("section") || "");
  if (!SECTIONS.includes(section as (typeof SECTIONS)[number])) {
    return new Response("Invalid section", { status: 400 });
  }

  // biome-ignore lint/suspicious/noExplicitAny: parsed JSON payload
  let data: any = {};
  try {
    data = JSON.parse(String(form.get("data") || "{}"));
  } catch {
    return new Response("Invalid data", { status: 400 });
  }

  // Vision: upload any new word preview images and write their URLs back in.
  if (section === "vision" && bucket && Array.isArray(data.words)) {
    for (let i = 0; i < data.words.length; i++) {
      const file = form.get(`vimg${i}`) as File | null;
      if (file && file.size > 0) {
        const fileName = `vision-${i}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
        await bucket.put(fileName, await file.arrayBuffer(), {
          httpMetadata: { contentType: file.type },
        });
        data.words[i].img = `/image/${fileName}`;
      }
    }
  }

  await db
    .prepare(
      "INSERT INTO site_content (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .bind(section, JSON.stringify(data))
    .run();

  return json({ success: true, data });
};
