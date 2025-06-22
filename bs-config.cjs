/**
 * -------------------------------------------------------------------------
 * BrowserSync Configuration for PyScript + Sass Project
 * -------------------------------------------------------------------------
 * 
 * Optimized for: HTML, Python (PyScript), Sass/CSS live reloading
 * Project: ED-Acima_das_Nuvens (RPG interativo)
 */

module.exports = {
  // Server configuration
  server: {
    baseDir: "./",
    index: "index.html",
    serveStaticOptions: {
      extensions: ["html"] // Pretty URLs
    }
  },

  // Files to watch for changes
  files: [
    "*.html",
    "*.py",
    "main.py",
    "sass/**/*.scss", // Source SCSS files
    "public/styles/output/**/*.css", // Compiled CSS from Sass
    "public/**/*.js",
    "public/**/*.json",
    "!node_modules/**/*", // Exclude node_modules
    "!.git/**/*" // Exclude git files
  ],

  // Watch options (Chokidar configuration)
  watchOptions: {
    ignoreInitial: true,
    ignored: [
      "node_modules/**/*",
      ".git/**/*",
      "*.log",
      "*.tmp",
      ".sass-cache/**/*",
      "sass/**/*.scss" // Don't watch source SCSS (handled by Sass watch)
    ],
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100
    }
  },

  // Watch events to respond to
  watchEvents: ["change", "add", "unlink"],

  // Server settings
  port: 3000,
  ui: {
    port: 3001
  },

  // Performance optimizations
  reloadDelay: 300, // Wait 300ms before reload
  reloadDebounce: 500, // Debounce rapid file changes
  injectChanges: true, // Inject CSS changes without full reload

  // Development optimizations
  notify: false, // Disable browser notifications
  open: "local", // Open local URL automatically
  cors: true, // Enable CORS for PyScript

  // Ghost mode (sync across devices)
  ghostMode: {
    clicks: true,
    forms: true,
    scroll: true
  },

  // Logging
  logLevel: "info",
  logPrefix: "ED-RPG",
  logFileChanges: true,
  logConnections: false,

  // Socket configuration
  socket: {
    namespace: "/browser-sync",
    clients: {
      heartbeatTimeout: 5000
    }
  },

  // Middleware for Python file handling
  middleware: [
    {
      route: "*.py",
      handle: function (req, res, next) {
        // Set proper headers for Python files served to PyScript
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        next();
      }
    }
  ],

  // Additional static file serving
  serveStatic: [
    {
      route: "/static",
      dir: "public"
    }
  ],

  // Custom callbacks
  callbacks: {
    ready: function (err, bs) {
      if (err) {
        console.error("BrowserSync error:", err);
        return;
      }

      console.log("\n🎮 ED-Acima das Nuvens - Development Server");
      console.log("📍 Local:", bs.options.get("urls").get("local"));
      console.log("🌐 External:", bs.options.get("urls").get("external"));
      console.log("🎛️  UI:", bs.options.get("urls").get("ui"));
      console.log("📝 Watching: HTML, Python, CSS files");
      console.log("⚡ PyScript + Sass ready!\n");
    }
  }
};