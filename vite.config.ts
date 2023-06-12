import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
  assetsInclude: ['**/*.mp4'],
  server: { https: true },
  plugins: [
    mkcert(),
    react(),
  ],
})
