![Astro Photo Grid Preview](./public/cover.png)

# Ma Galerie (Astro Photo Grid)

A responsive photo gallery built with Astro and a lightweight React admin UI. This repo is configured to run locally with Miniflare (Wrangler state in `.wrangler`) and deploy to Cloudflare Workers (R2 + D1 bindings).

## Quick Start

- Install dependencies:
```bash
pnpm install
```

- Run locally (dev server + Miniflare):
```bash
pnpm dev
```

- Build for production:
```bash
pnpm build
```

- Deploy to Cloudflare Workers (uses `wrangler.toml`):
```bash
pnpm run deploy
```

Live preview (example): https://ma-galerie.aazainkhan.workers.dev

## Features

- Responsive, justified grid layout (CSS-first).
- Fancybox lightbox integration for image previews.
- Image optimization via Astro's image utilities.
- Admin UI for album/image management (React islands).
- Cloudflare D1 (SQLite-like) for metadata and R2 for image storage.

## Project Notes

- Bindings are declared in `wrangler.toml` (R2 bucket `IMAGES`, D1 database `DB`).
- Local dev state is stored in `.wrangler/state/v3` (Miniflare-backed D1/R2/KV). Do not commit that directory.

## CI / Automatic Deploys

This repo does not auto-deploy on commit by default. To enable automatic deployments from GitHub, add a GitHub Actions workflow that runs `pnpm build` and `wrangler deploy` on push. Example workflow (place under `.github/workflows/deploy.yml`):

```yaml
name: Deploy to Cloudflare Workers
on:
	push:
		branches: [ main ]
jobs:
	deploy:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4
			- uses: pnpm/action-setup@v2
				with:
					version: 8
			- run: pnpm install
			- run: pnpm build
			- name: Deploy
				run: npx wrangler deploy --env production
				env:
					CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

You will need to create a Cloudflare API token with the appropriate permissions and add it to the repository secrets as `CLOUDFLARE_API_TOKEN`.

## Useful Commands

- `pnpm dev` — Start local dev server with Miniflare-backed D1/R2.
- `pnpm build` — Run checks and build the production bundle.
- `pnpm run deploy` — Build and deploy to Cloudflare Workers using `wrangler`.

## Credits

- Gallery layout inspiration: Helmut Wandl and SmolCSS.
- Fancybox for the lightbox UI.

---
If you want, I can add the GitHub Actions file for you and push it to a branch.
