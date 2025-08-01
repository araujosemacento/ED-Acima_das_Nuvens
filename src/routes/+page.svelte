<script>
	import Welcome from '$lib/components/Welcome.svelte';
	import CloudLayer from '$lib/components/CloudLayer.svelte';

	// Estados para controle do sistema de nuvens
	let cloudSystemReady = false;
	let cloudSystemStats = null;

	// Handlers para eventos do CloudLayer
	function handleCloudSystemReady(event) {
		cloudSystemReady = true;
		cloudSystemStats = event.detail.stats;
		console.log('🌤️ Sistema de nuvens inicializado:', event.detail);
	}

	function handleThemeChanged(event) {
		console.log('🎨 Tema das nuvens alterado:', event.detail);
	}

	function handlePerformanceAlert(event) {
		console.warn('⚠️ Alerta de performance das nuvens:', event.detail);
	}
</script>

<svelte:head>
	<title>ED | Acima das Nuvens</title>
	<meta name="description" content="A SvelteKit application" />
</svelte:head>

<!-- Conteúdo principal (sobreposição) -->
<section class="theme-background-transition theme-text-transition">
	<Welcome />
</section>

<!-- Camada de nuvens (fundo) -->
<CloudLayer
	enabled={true}
	opacity={0.8}
	animationSpeed={1000}
	cloudDensity="normal"
	boundaryMode="viewport"
	debugMode={false}
	on:cloudSystemReady={handleCloudSystemReady}
	on:themeChanged={handleThemeChanged}
	on:performanceAlert={handlePerformanceAlert}
/>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
		z-index: 1;
		background-color: transparent; /* Fundo transparente para mostrar nuvens */
		color: var(--theme-text);
		font-family: var(--font-body);
		padding: 2rem;
		gap: 2rem;
		min-height: 80vh;
	}
</style>
