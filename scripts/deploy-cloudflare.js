#!/usr/bin/env node

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const ENV = process.env.NODE_ENV || "production";
const PROJECT_NAME = "ma-galerie";

console.log(`🚀 Deploying ${PROJECT_NAME} to Cloudflare Workers (${ENV})`);

try {
  // Step 1: Build the project
  console.log("📦 Building project...");
  execSync("pnpm build", { stdio: "inherit" });

  // Step 2: Optimize for Cloudflare
  console.log("⚡ Optimizing for Cloudflare...");
  const assetsIgnorePath = join("dist", ".assetsignore");
  writeFileSync(assetsIgnorePath, "_worker.js\n");
  console.log(`✅ Created ${assetsIgnorePath}`);

  // Copy raw images for direct serving
  execSync("mkdir -p dist/images && cp -R public/images/* dist/images/", {
    stdio: "inherit",
  });
  console.log("✅ Copied images to dist/images");

  // Step 3: Deploy to Cloudflare
  console.log("🌐 Deploying to Cloudflare...");
  if (ENV === "staging") {
    execSync(`wrangler deploy --env staging`, { stdio: "inherit" });
  } else {
    execSync("wrangler deploy", { stdio: "inherit" });
  }

  console.log("✅ Deployment successful!");

  // Step 4: Performance check
  console.log("🔍 Checking performance...");
  try {
    execSync("wrangler tail --format pretty", {
      stdio: "inherit",
      timeout: 10000,
    });
  } catch (err) {
    console.error("Deployment failed:", err);
  }
} catch (error) {
  console.error("❌ Deployment failed:", error.message);
  process.exit(1);
}
