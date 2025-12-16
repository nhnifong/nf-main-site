// File relevant only to local development.
// when vite server is running, forwards any requests for backend API to port 8080 where fastAPI is presumed to be running

import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  server: {
    proxy: {
      // Any request starting with /telemetry goes to local control_plane
      '/telemetry': {
        target: 'ws://127.0.0.1:8080',
        ws: true,
        changeOrigin: true
      },
      '/control': {
        target: 'http://127.0.0.1:8080',
        ws: true,
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        // We list every HTML file we want Vite to process here
        main: resolve(__dirname, 'index.html'),
        playroom: resolve(__dirname, 'playroom.html'),
      }
    }
  }
})