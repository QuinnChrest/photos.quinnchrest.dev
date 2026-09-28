# photos.quinnchrest.dev
A website to show off photos that I've taken.

React + Vite, built with Bun and deployed to GitHub Pages. Images are hosted on Cloudflare R2 at `img.quinnchrest.dev`.

## Adding photos

1. Drop full-size originals (jpg/png/tif/webp/heic) into `originals/`. This folder is gitignored.
2. Run `bun run publish-photos`. It runs:
   - `bun run process`: resizes each photo to 640/1280/2048px in AVIF, WebP and JPEG (in `.cache/out/`), reads the EXIF data (GPS is left out), makes a blur placeholder, and updates `src/data/photos.json`.
   - `bun run upload`: uploads any new variants to R2.
3. Optionally add `title`, `caption` and `tags` in `src/data/photos.json`. They are kept when you run `process` again.
4. Commit `src/data/photos.json` and push. GitHub Actions rebuilds the site.

Neither script is part of the site. They only run on your machine.

`bun run dev` serves `.cache/out` at `/_img`, so you can preview photos before uploading them.

## One-time setup

**Cloudflare R2**
1. Create an R2 bucket (for example `photos`).
2. Go to the bucket's Settings, then Custom Domains, and connect `img.quinnchrest.dev`.
3. Go to R2, then Manage API tokens, and create a token with **Object Read & Write** access to that bucket only.
4. Copy `.env.example` to `.env` and fill in the account ID, the key pair and the bucket name.
5. Optional: add a Cache Rule for `img.quinnchrest.dev` that sets Browser TTL to 1 year. Filenames include a content hash, so a URL never changes content.

**GitHub Pages**
1. In the repo's Settings, open Pages and set Source to **GitHub Actions**.
2. At your DNS provider, add a CNAME record `photos` pointing to `quinnchrest.github.io`.
3. Once the certificate is issued, enable **Enforce HTTPS**.
