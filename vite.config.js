import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/ed-acima_das_nuvens/' : '/',
  server: {
    watch: {
      include: ['**/*.py', '**/*.html', '**/*.css', '**/*.scss', '**/*.js']
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: './src/index.html'
      }
    },
    assetsDir: 'assets',
    sourcemap: false
  }
})