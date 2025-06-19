/**
 * Development utilities for ED-Acima das Nuvens
 */

const bs = require('browser-sync').create();
const fs = require('fs');

// Custom BrowserSync setup with advanced PyScript support
function startDevServer(options = {}) {
  // Configuração inline sem duplicar bs-config.js
  const config = {
    server: {
      baseDir: "./",
      index: "index.html"
    },
    port: 3000,
    notify: false,
    open: "local",
    cors: true,

    // Apenas CSS para auto-inject (Sass compilado)
    files: [
      "public/styles/output/**/*.css"
    ],

    // Merge com opções customizadas
    ...options
  };

  bs.init(config);

  // Watch customizado para Python (reload completo)
  bs.watch("*.py", (event, file) => {
    console.log(`🐍 Python file changed: ${file}`);
    bs.reload();
  });

  // Watch inteligente para HTML
  bs.watch("*.html", (event, file) => {
    console.log(`📄 HTML file changed: ${file}`);
    const content = fs.readFileSync(file, 'utf8');

    if (content.includes('<py-script>') || content.includes('<py-config>')) {
      console.log("🔄 PyScript detected - full reload");
      bs.reload();
    } else {
      console.log("📄 Simple HTML - injecting changes");
      bs.reload(file);
    }
  });

  return bs;
}

module.exports = { startDevServer };