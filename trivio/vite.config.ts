import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    rollupOptions: {
      external: [
        '@luma.gl/engine',
        '@deck.gl/layers',
        '@deck.gl/aggregation-layers',
        '@deck.gl/geo-layers',
        '@deck.gl/mesh-layers',
        '@deck.gl/mapbox',
        '@developmentseed/geotiff',
        '@developmentseed/deck.gl-geotiff',
        'pmtiles',
      ],
    },
  },
})
