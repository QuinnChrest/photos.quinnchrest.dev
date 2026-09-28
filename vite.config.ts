import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const CONTENT_TYPES: Record<string, string> = {
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
}

// Dev only: serve the variants from `bun run process` at /_img so the gallery
// works locally before anything is uploaded to R2.
function localImages(): Plugin {
  const root = resolve('.cache/out')
  return {
    name: 'local-images',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/_img', (req, res, next) => {
        const file = normalize(join(root, decodeURIComponent(req.url ?? '').split('?')[0]))
        if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) return next()
        res.setHeader('Content-Type', CONTENT_TYPES[extname(file)] ?? 'application/octet-stream')
        createReadStream(file).pipe(res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localImages()],
})
