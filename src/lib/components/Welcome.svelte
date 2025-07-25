<script>
	import { m } from '$lib/paraglide/messages.js';
	import Button from '@smui/button';
	import { themeStore } from '$lib/stores/theme.js';
	import { onMount } from 'svelte';
	import { logger } from '$lib/stores/logger.js';
	import { cloudAnimationsStore, registerCloudElement } from '$lib/stores/cloudAnimations.js';
	import { base } from '$app/paths';

	// Estado para controlar se as animações estão ativas
	let cloudman = true;

	// Array com todos os assets de nuvens (1-17)
	const cloudAssets = Array.from({ length: 17 }, (_, i) => i + 1);

	// Fix para hydration_attribute_changed: controlar renderização das imagens
	let showImages = $state(false);
	let currentTheme = $state('light'); // Tema padrão para SSR

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
		cloudAnimationsStore.setActive(cloudman);
	});

	// Lifecycle
	onMount(() => {
		logger.animation('COMPONENT_MOUNT', {
			Componente: 'Welcome',
			'Animações ativas': cloudman,
			'Imagens carregadas': showImages,
			'Tema atual': currentTheme
		});

		// Pequeno delay para garantir que elementos estejam renderizados
		setTimeout(() => {
			logger.animation('MOUNT_INIT_CALL', {
				Ação: 'Inicializando animações das nuvens'
			});

			cloudAnimationsStore.initializeAllAnimations();
		}, 100);

		// Cleanup ao desmontar
		return () => {
			logger.animation('COMPONENT_UNMOUNT', {
				Componente: 'Welcome'
			});

			cloudAnimationsStore.cleanup();

			logger.animation('COMPONENT_UNMOUNT_COMPLETE', {
				Status: 'Limpeza concluída'
			});
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
					class="cloud-asset"
					data-cloud-id={assetNum}
					use:registerCloudElement={assetNum}
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
		<Button
			style="background-color: var(--ed-complementary); color: var(--ed-text-100); font-weight: 600;"
			class="theme-interactive-transition"
		>
			{m.start_game()}
		</Button>
	</div>
</section>

<style lang="scss">
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
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 1;
	}

	.cloud-asset {
		position: fixed;
		opacity: 0.7;
		pointer-events: none;
		width: clamp(60px, 8vw, 120px);
		height: auto;
		/* Removida animação CSS - agora controlada por JavaScript */
		will-change: transform;
		transform-origin: center;
	}

	.welcome-content {
		position: relative;
		z-index: 2;
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
	}

	@media (max-width: 576px) {
		#welcome {
			max-width: 80%;
		}

		.cloud-asset {
			width: clamp(40px, 10vw, 80px);
		}

		.text-outlined {
			-webkit-text-stroke: 10px var(--theme-background);

			// Ajustar text-shadow para mobile
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
</style>
