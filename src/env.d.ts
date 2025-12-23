/// <reference types="astro/client" />

type R2Bucket = import("@cloudflare/workers-types").R2Bucket;
type D1Database = import("@cloudflare/workers-types").D1Database;

interface ImportMetaEnv {
  readonly ADMIN_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

interface Env {
  IMAGES: R2Bucket;
  DB: D1Database;
}
