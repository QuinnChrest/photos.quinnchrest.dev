# photos.quinnchrest.dev
A website to show off photos that I've taken.

React + Vite, built with Bun and deployed to GitHub Pages. Photos are served from the site itself (`public/img/`).

## Adding photos

1. Drop full-size originals (jpg/png/tif/webp/heic) into `originals/`. This folder is gitignored, so originals never go into git.
2. Run `bun run process`. For each photo it:
   - makes 640/1280/2048px copies in AVIF, WebP and JPEG under `public/img/<id>/`
   - reads the EXIF data, leaving out GPS
   - makes a blur placeholder
   - updates `src/data/photos.json`

   Photos that haven't changed are skipped. Copies for photos you removed from `originals/` are deleted.
3. Optionally add `title`, `caption` and `tags` in `src/data/photos.json`. They are kept when you run `process` again.
4. Preview with `bun run dev`.
5. Commit `public/img/` and `src/data/photos.json`, then push. GitHub Actions rebuilds the site.

The script only runs on your machine and isn't part of the site.

### Keeping the repo small

Git keeps every committed image forever, even after you delete it. To keep the repo small:

- Avoid re-exporting the same photo many times.
- Avoid changing `WIDTHS` in `src/data/types.ts` or the quality settings in `scripts/process.ts` unless you mean it. Either change regenerates every photo.

GitHub Pages sites have a 1 GB limit, which is roughly 1,000+ photos at these sizes.

## One-time setup

1. In the repo's Settings, open Pages and set Source to **GitHub Actions**. On the same page, set Custom domain to `photos.quinnchrest.dev`.
2. At Porkbun, add a CNAME record `photos` pointing to `quinnchrest.github.io`.
3. Once the certificate is issued, enable **Enforce HTTPS**.
