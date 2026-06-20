// when vite server is running, forwards any requests for backend API to port 8080 where fastAPI is presumed to be running

import { defineConfig, type Plugin } from 'vite'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// Single source of truth for extensionless page routes, shared with the
// FastAPI backend. It lives in public/ so the build copies it into dist/,
// where the backend reads it at runtime (see app/main.py). Editing the
// route map only requires touching public/page-routes.json.
const pageRoutes: Record<string, string> = JSON.parse(
  readFileSync(resolve(__dirname, 'public/page-routes.json'), 'utf-8')
)

// In production the FastAPI backend serves these routes (e.g. /tutorial ->
// playroom.html). The Vite dev server doesn't know them, so /tutorial would
// 404 and fall back to /. This dev-only plugin internally rewrites the route
// to its HTML file (an internal rewrite, not a redirect, so the address bar
// stays /tutorial — which is what isTutorialMode() keys off of). HMR is
// preserved because Vite still serves the file locally.
function pageAliases(): Plugin {
  return {
    name: 'page-aliases',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const match = req.url?.match(/^\/([^/?#]+)\/?(\?.*)?$/)
        const target = match && pageRoutes[match[1]]
        if (target) req.url = `/${target}${match![2] ?? ''}`
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [pageAliases()],
  server: {
    host: "0.0.0.0", // allow lan connections so we can test on mobile
    proxy: {
      // List of paths that should be forwarded to the local docker telemetry server instead of being handled by vite
      '/telemetry': {
        target: 'ws://127.0.0.1:8080',
        ws: true,
        changeOrigin: true
      },
      '/control': {
        target: 'http://127.0.0.1:8080',
        ws: true,
        changeOrigin: true
      },
      '/listrobots': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/simulated/pilot': {
        target: 'http://127.0.0.1:8080',
        ws: true,
        changeOrigin: true
      },
      '/bind': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/unbind': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/share': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/list_authorized': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/ticket': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/huggingface/status': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/huggingface/exchange_code': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/lerobot/record/start': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/lerobot/record/stop': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/lerobot/eval/start': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/lerobot/eval/stop': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/lerobot/status': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      },
      '/huggingface/unlink': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        // We list every HTML file we want Vite to process here.
        // Product pages are now server-side rendered from products/ — do not add them here.
        main: resolve(__dirname, 'index.html'),
        playroom: resolve(__dirname, 'playroom.html'),
        company: resolve(__dirname, 'company.html'),
        future: resolve(__dirname, 'future.html'),
        scoreboard: resolve(__dirname, 'scoreboard.html'),
        payment_options: resolve(__dirname, 'payment_options.html'),
        "hf-redirect": resolve(__dirname, 'hf-redirect.html'),
      }
    }
  }
})