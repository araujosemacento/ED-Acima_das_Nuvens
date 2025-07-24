<script>
	import '../app.scss';
	import { setLocale, locales } from '$lib/paraglide/runtime';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		const browserLanguages = navigator.languages || [navigator.language];

		// Encontra o primeiro idioma suportado
		const supportedLanguage = browserLanguages.find((lang) => {
			const normalized = lang.toLowerCase().replace('_', '-');
			return locales.includes(normalized) || locales.includes(normalized.split('-')[0]);
		});

		if (supportedLanguage) {
			const normalized = supportedLanguage.toLowerCase().replace('_', '-');
			const targetLang = locales.includes(normalized)
				? normalized
				: locales.find((tag) => tag.startsWith(normalized.split('-')[0]));

			if (targetLang) {
				setLocale(targetLang);
			}
		}

		// A inicialização do tema agora é feita no ThemeToggle
		// para evitar duplicação e conflitos
	});
</script>

<div class="app theme-background-transition">
	<main class="theme-background-transition">
		{@render children()}
	</main>
	<ThemeToggle />
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		background-color: var(--theme-background);
		color: var(--theme-text);
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
		background-color: var(--theme-background);
	}

	@media (max-width: 576px) {
		main {
			padding: 0.75rem;
		}
	}
</style>
