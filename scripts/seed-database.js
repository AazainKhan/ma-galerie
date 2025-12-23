import { execSync } from "node:child_process";

const MOCK_ALBUMS = [
  {
    title: "Summer Vibes",
    slug: "summer-vibes",
    description: "Sunny days and warm memories",
  },
  {
    title: "Urban Dreams",
    slug: "urban-dreams",
    description: "City lights and architecture",
  },
  {
    title: "Nature Escapes",
    slug: "nature-escapes",
    description: "Mountains, forests, and trails",
  },
  {
    title: "Travel Stories",
    slug: "travel-stories",
    description: "Adventures around the world",
  },
  {
    title: "Night Photography",
    slug: "night-photography",
    description: "Stars, moon, and city nights",
  },
  {
    title: "Street Life",
    slug: "street-life",
    description: "Candid moments in the city",
  },
];

const MOCK_IMAGES = [
  // Summer Vibes
  {
    url: "https://picsum.photos/id/10/800/600",
    width: 800,
    height: 600,
    alt: "Beach sunset",
    album: "summer-vibes",
  },
  {
    url: "https://picsum.photos/id/11/1200/800",
    width: 1200,
    height: 800,
    alt: "Ocean waves",
    album: "summer-vibes",
  },
  {
    url: "https://picsum.photos/id/12/600/800",
    width: 600,
    height: 800,
    alt: "Palm tree",
    album: "summer-vibes",
  },

  // Urban Dreams
  {
    url: "https://picsum.photos/id/20/1000/750",
    width: 1000,
    height: 750,
    alt: "City skyline",
    album: "urban-dreams",
  },
  {
    url: "https://picsum.photos/id/21/800/1200",
    width: 800,
    height: 1200,
    alt: "Tall building",
    album: "urban-dreams",
  },
  {
    url: "https://picsum.photos/id/22/1400/900",
    width: 1400,
    height: 900,
    alt: "Street view",
    album: "urban-dreams",
  },

  // Nature Escapes
  {
    url: "https://picsum.photos/id/30/1600/1000",
    width: 1600,
    height: 1000,
    alt: "Mountain peak",
    album: "nature-escapes",
  },
  {
    url: "https://picsum.photos/id/31/900/1200",
    width: 900,
    height: 1200,
    alt: "Forest path",
    album: "nature-escapes",
  },
  {
    url: "https://picsum.photos/id/32/1100/800",
    width: 1100,
    height: 800,
    alt: "Lake reflection",
    album: "nature-escapes",
  },

  // Travel Stories
  {
    url: "https://picsum.photos/id/40/1300/900",
    width: 1300,
    height: 900,
    alt: "Ancient temple",
    album: "travel-stories",
  },
  {
    url: "https://picsum.photos/id/41/800/600",
    width: 800,
    height: 600,
    alt: "Local market",
    album: "travel-stories",
  },
  {
    url: "https://picsum.photos/id/42/1000/1000",
    width: 1000,
    height: 1000,
    alt: "Street food",
    album: "travel-stories",
  },

  // Night Photography
  {
    url: "https://picsum.photos/id/50/1500/1000",
    width: 1500,
    height: 1000,
    alt: "Starry sky",
    album: "night-photography",
  },
  {
    url: "https://picsum.photos/id/51/1200/800",
    width: 1200,
    height: 800,
    alt: "City lights",
    album: "night-photography",
  },
  {
    url: "https://picsum.photos/id/52/900/1350",
    width: 900,
    height: 1350,
    alt: "Moon rise",
    album: "night-photography",
  },

  // Street Life
  {
    url: "https://picsum.photos/id/60/1100/850",
    width: 1100,
    height: 850,
    alt: "Busy street",
    album: "street-life",
  },
  {
    url: "https://picsum.photos/id/61/800/1000",
    width: 800,
    height: 1000,
    alt: "Street performer",
    album: "street-life",
  },
  {
    url: "https://picsum.photos/id/62/1300/900",
    width: 1300,
    height: 900,
    alt: "Urban scene",
    album: "street-life",
  },
];

function execCommand(command, description) {
  console.log(`\n📝 ${description}...`);
  try {
    execSync(command, { stdio: "inherit" });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

async function seedDatabase(isRemote = false) {
  const remoteFlag = isRemote ? "--remote" : "--local";
  const dbName = "ma-galerie-db";

  console.log(`\n🌱 Seeding ${isRemote ? "REMOTE" : "LOCAL"} database...`);

  // 1. Clear existing data
  execCommand(
    `wrangler d1 execute ${dbName} ${remoteFlag} --command "DELETE FROM images"`,
    "Clearing images table",
  );

  execCommand(
    `wrangler d1 execute ${dbName} ${remoteFlag} --command "DELETE FROM albums"`,
    "Clearing albums table",
  );

  // 2. Insert albums
  console.log("\n📁 Creating albums...");
  for (const album of MOCK_ALBUMS) {
    const sql = `INSERT INTO albums (title, slug, description) VALUES ('${album.title}', '${album.slug}', '${album.description || ""}')`;
    execCommand(
      `wrangler d1 execute ${dbName} ${remoteFlag} --command "${sql}"`,
      `Creating album: ${album.title}`,
    );
  }

  // 3. Get album IDs and insert images
  console.log("\n🖼️  Creating images...");

  // Get album IDs
  const albumIds = {};
  for (const album of MOCK_ALBUMS) {
    try {
      const result = execSync(
        `wrangler d1 execute ${dbName} ${remoteFlag} --command "SELECT id FROM albums WHERE slug='${album.slug}'" --json`,
        { encoding: "utf-8" },
      );
      const parsed = JSON.parse(result);
      if (parsed[0]?.results?.[0]?.id) {
        albumIds[album.slug] = parsed[0].results[0].id;
      }
    } catch (_error) {
      console.warn(`Could not get ID for ${album.slug}`);
    }
  }

  // Insert images
  for (const image of MOCK_IMAGES) {
    const albumId = albumIds[image.album];
    if (albumId) {
      const sql = `INSERT INTO images (src, width, height, alt, album_id) VALUES ('${image.url}', ${image.width}, ${image.height}, '${image.alt}', ${albumId})`;
      try {
        execSync(
          `wrangler d1 execute ${dbName} ${remoteFlag} --command "${sql}"`,
          { stdio: "inherit" },
        );
        console.log(`  ✅ Added: ${image.alt}`);
      } catch (_error) {
        console.error(`  ❌ Failed to add: ${image.alt}`);
      }
    }
  }

  // 4. Verify results
  console.log("\n📊 Database summary:");
  execCommand(
    `wrangler d1 execute ${dbName} ${remoteFlag} --command "SELECT COUNT(*) as count FROM albums"`,
    "Counting albums",
  );
  execCommand(
    `wrangler d1 execute ${dbName} ${remoteFlag} --command "SELECT COUNT(*) as count FROM images"`,
    "Counting images",
  );

  console.log("\n✨ Database seeding complete!");
}

// Parse command line arguments
const args = process.argv.slice(2);
const isRemote = args.includes("--remote") || args.includes("-r");

seedDatabase(isRemote);
