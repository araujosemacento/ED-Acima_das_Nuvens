import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

function addDirsRecursively(watcher, dir) {
  if (!fs.existsSync(dir)) return
  watcher.add(dir)
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      addDirsRecursively(watcher, path.join(dir, entry.name))
    }
  }
}

function pyReloadPlugin() {
  return {
    name: 'vite-plugin-py-reload',
    configureServer(server) {
      const pyRoot = path.resolve(__dirname, 'src')
      addDirsRecursively(server.watcher, pyRoot)
      server.watcher.on('change', (file) => {
        if (file.endsWith('.py')) {
          server.ws.send({ type: 'full-reload' })
        }
      })
    }
  }
}

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
      },
      sass: {
        api: 'modern-compiler'
      }
    }
  },
  assetsInclude: ['**/*.py'],
  plugins: [pyReloadPlugin()],
})
