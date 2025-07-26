import { paraglideVitePlugin } from '@inlang/paraglide-js';
import devtoolsJson from 'vite-plugin-devtools-json';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		devtoolsJson(),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		})
	],
	css: {
		preprocessorOptions: {
			scss: {
				// Suprimir avisos de depreciação do Material Design Components
				quietDeps: true,
				logger: {
					warn: (message) => {
						// Filtrar avisos específicos de color-functions deprecated
						if (
							message.includes('color.red()') ||
							message.includes('color.green()') ||
							message.includes('color.blue()')
						) {
							return; // Ignorar esses avisos
						}
						console.warn(message);
					}
				}
			}
		}
	}
});
