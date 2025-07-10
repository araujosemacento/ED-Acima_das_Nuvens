<script>
	import Counter from '$lib/components/Counter.svelte';
	import PyodideInteractive from '$lib/components/PyodideInteractive.svelte';
</script>

<svelte:head>
	<title>ED | Acima das Nuvens</title>
	<meta name="description" content="A SvelteKit application" />
</svelte:head>

<section>
	<PyodideInteractive />
	<Counter />
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
		background-color: var(--mdc-theme-background);
		color: var(--mdc-theme-text-primary-on-background);
		font-family: var(--font-body);
		padding: 2rem;
		gap: 2rem;
		min-height: 80vh;
	}
</style>
