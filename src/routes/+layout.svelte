<script>
	import '../app.scss';
	import { setLocale, locales } from "$lib/paraglide/runtime";
	import { onMount } from "svelte";

	let { children } = $props();

	onMount(() => {
		const browserLanguages = navigator.languages || [navigator.language];
		
		// Encontra o primeiro idioma suportado
		const supportedLanguage = browserLanguages.find(lang => {
			const normalized = lang.toLowerCase().replace('_', '-');
			return locales.includes(normalized) ||
				   locales.includes(normalized.split('-')[0]);
		});
		
		if (supportedLanguage) {
			const normalized = supportedLanguage.toLowerCase().replace('_', '-');
			const targetLang = locales.includes(normalized) 
				? normalized 
				: locales.find(tag => tag.startsWith(normalized.split('-')[0]));
			
			if (targetLang) {
				setLocale(targetLang);
			}
		}
	});
</script>

<div class="app">
	<main>
		{@render children()}
	</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: var(--mdc-theme-background);
		color: var(--mdc-theme-text-primary-on-background);
		font-family: var(--font-body);
	}

	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 64rem;
		margin: 0 auto;
		box-sizing: border-box;
		background-color: var(--mdc-theme-background);
	}
</style>
