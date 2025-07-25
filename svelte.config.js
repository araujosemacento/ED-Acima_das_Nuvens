import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';

// Configuração do base path para GitHub Pages
const isGitHubPages = process.env.NODE_ENV === 'production';
const basePath = isGitHubPages ? '/ED-Acima_das_Nuvens' : '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			strict: false
		}),
		paths: {
			base: basePath
		}
	},
	preprocess: [mdsvex()],
	extensions: ['.svelte', '.svx']
};

export default config;
