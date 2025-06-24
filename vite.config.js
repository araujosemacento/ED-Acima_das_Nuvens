import { defineConfig } from 'vite'

export default defineConfig({
  root: './src/',
  publicDir: '../public/', build: {
    outDir: '../dist/',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html'
    }
  },
  server: {
    port: 3000,
    open: true
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  assetsInclude: ['**/*.py']
})
