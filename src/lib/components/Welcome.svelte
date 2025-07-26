<script>
	import { m } from '$lib/paraglide/messages.js';
	import Button, { Label } from '@smui/button';
	import { themeStore } from '$lib/stores/theme.js';
	import { onMount } from 'svelte';

	import { cloudMotionStore, registerCloudMotion } from '$lib/stores/cloudMotion.js';
	import { base } from '$app/paths';

	// Estado para controlar se as animações estão ativas
	let cloudman = true;
	let imagesLoaded = $state(0);
	let totalImages = 17;

	// Array com todos os assets de nuvens (1-17)
	const cloudAssets = Array.from({ length: 17 }, (_, i) => i + 1);

	// Fix para hydration_attribute_changed: controlar renderização das imagens
	let showImages = $state(false);
	let currentTheme = $state('light'); // Tema padrão para SSR

	// Função para lidar com carregamento de imagens
	function handleImageLoad() {
		imagesLoaded++;

		// Quando todas as imagens carregarem, inicia as animações
		if (imagesLoaded === totalImages) {
			if (cloudman) {
				// Pequeno delay para garantir que o DOM esteja atualizado
				setTimeout(() => {
					cloudMotionStore.initializeAllAnimations();
				}, 150);
			}
		}
	}

	// Aguardar hidratação no cliente antes de mostrar as imagens com tema correto
	if (typeof window !== 'undefined') {
		$effect(() => {
			if (!showImages) {
				// Primeiro, definir o tema correto
				currentTheme = $themeStore;
				// Depois, mostrar as imagens
				showImages = true;
			} else {
				// Atualizar tema quando mudar
				currentTheme = $themeStore;
			}
		});
	}

	// Reativo: sincroniza cloudman com a store
	$effect(() => {
		cloudMotionStore.setActive(cloudman);
	});

	// Lifecycle
	onMount(() => {
		// Não inicia animações aqui - espera todas as imagens carregarem
		// As animações serão iniciadas via handleImageLoad quando todas estiverem prontas

		// Listener para mudanças de tema dinâmicas
		const handleThemeChange = () => {
			// Força atualização do tema atual para garantir rehidratação
			currentTheme = $themeStore;
		};

		// Escuta evento customizado de mudança de tema
		window.addEventListener('theme-changed', handleThemeChange);

		// Cleanup ao desmontar
		return () => {
			cloudMotionStore.cleanup();
			window.removeEventListener('theme-changed', handleThemeChange);
		};
	});
</script>

<section id="welcome" class="theme-background theme-text-transition">
	<!-- Background de nuvens -->
	<div class="clouds-background">
		{#each cloudAssets as assetNum (assetNum)}
			{#if showImages}
				<img
					src="{base}/assets/nuvens/{currentTheme}/SVG/nuvem{assetNum}.svg"
					alt=""
					class="cloud-element cloud-element--gentle"
					data-cloud-id={assetNum}
					use:registerCloudMotion={{ cloudId: assetNum, style: 'gentle' }}
					onload={handleImageLoad}
					onerror={(e) => {
						// Conta como carregada mesmo com erro para não travar
						console.error(`Erro ao carregar imagem nuvem${assetNum}.svg:`, e);
						imagesLoaded++;
						// Inicia animações se todas as imagens já foram "carregadas"
						handleImageLoad();
					}}
				/>
			{/if}
		{/each}
	</div>

	<!-- Conteúdo principal -->
	<div class="welcome-content">
		<h1 class="theme-text-transition text-outlined">{m.welcome()}!</h1>
		<div class="disclaimer-text">
			<p class="theme-text-transition text-outlined">{m.initial_disclaimer_paragraph1()}</p>
			<p class="theme-text-transition text-outlined">{m.initial_disclaimer_paragraph2()}</p>
		</div>
		<Button variant="unelevated" class="theme-interactive-transition game-start-button">
			<Label>{m.start_game()}</Label>
		</Button>
	</div>
</section>

<style lang="scss">
	@use '../styles/cloudMotion' as cloud;
	#welcome {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		max-width: 50%;
		padding: 2rem;
		text-align: center;
		position: fixed;
		background-color: var(--theme-background);
		color: var(--theme-text);
		overflow: hidden;
		line-height: 175%;

		p {
			text-align: justify;
			text-align-last: center;
			text-justify: inter-word;
		}
	}

	.disclaimer-text {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		p {
			margin: 0;
		}
	}

	.clouds-background {
		@include cloud.cloud-container();
	}

	.welcome-content {
		position: relative;
		z-index: cloud.cloud-config('z-layers', 'content');
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
	}

	.text-outlined {
		-webkit-text-stroke: 20px var(--theme-background);
		paint-order: stroke fill;
		font-weight: 600;

		// Fallback para browsers que não suportam text-stroke
		text-shadow:
			-20px -20px 0 var(--theme-background),
			20px -20px 0 var(--theme-background),
			-20px 20px 0 var(--theme-background),
			20px 20px 0 var(--theme-background),
			-20px 0 0 var(--theme-background),
			20px 0 0 var(--theme-background),
			0 -20px 0 var(--theme-background),
			0 20px 0 var(--theme-background);

		// Melhor contraste baseado no tema
		color: var(--mdc-theme-text-primary-on-background);
	}

	/* Responsividade usando mixins SCSS */
	@include cloud.respond-to('mobile') {
		#welcome {
			max-width: 80%;
		}

		.text-outlined {
			-webkit-text-stroke: 10px var(--theme-background);

			/* Ajustar text-shadow para mobile */
			text-shadow:
				-10px -10px 0 var(--theme-background),
				10px -10px 0 var(--theme-background),
				-10px 10px 0 var(--theme-background),
				10px 10px 0 var(--theme-background),
				-10px 0 0 var(--theme-background),
				10px 0 0 var(--theme-background),
				0 -10px 0 var(--theme-background),
				0 10px 0 var(--theme-background);
		}
	}

	/* Estilo para o botão de início de jogo com integração adequada ao tema */
	:global(.game-start-button) {
		transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1) !important;
		border-radius: 2rem !important;
		padding: 1rem 2rem !important;
		min-width: 12rem !important;
		height: 3rem !important;
		font-weight: 600 !important;
		font-size: 1rem !important;
		letter-spacing: 0.5px !important;
	}

	:global(.game-start-button:hover) {
		transform: translateY(-2px) !important;
	}

	:global(.game-start-button:active) {
		transform: translateY(0) !important;
	}

	/* Customização do Label do Button */
	:global(.game-start-button .mdc-button__label) {
		font-weight: 600 !important;
		letter-spacing: 0.5px !important;
	}
</style>
