<script>
	import { m } from '$lib/paraglide/messages.js';
	import Button from '@smui/button';
	import { themeStore } from '$lib/stores/theme.js';
	import { onMount } from 'svelte';
	import { logger } from '$lib/stores/logger.js';
	import { cloudMotionStore, registerCloudMotion } from '$lib/stores/cloudMotion.js';
	import { base } from '$app/paths';

	// Estados do componente
	let cloudAnimationsActive = $state(true);
	let animationStyle = $state('gentle'); // gentle, dynamic, elastic
	let imagesLoaded = $state(0);
	let allImagesReady = $state(false);
	const totalImages = 17;

	// Array com todos os assets de nuvens (1-17)
	const cloudAssets = Array.from({ length: 17 }, (_, i) => i + 1);

	// Fix para hydration: controlar renderização das imagens
	let showImages = $state(false);
	let currentTheme = $state('light');

	// Estados derivados do motion store
	let storeState = $state({});
	let cloudCount = $state(0);

	// Função para carregar imagens
	function handleImageLoad() {
		imagesLoaded++;
		logger.animation('MOTION_IMAGE_LOADED', {
			'Imagens carregadas': imagesLoaded,
			'Total': totalImages,
			'Progresso': `${((imagesLoaded / totalImages) * 100).toFixed(0)}%`
		});

		// Quando todas carregarem, marca como pronto
		if (imagesLoaded === totalImages) {
			allImagesReady = true;
			logger.animation('MOTION_ALL_IMAGES_READY', {
				'Iniciando animações': cloudAnimationsActive,
				'Estilo': animationStyle
			});

			// Inicia animações após pequeno delay
			if (cloudAnimationsActive) {
				setTimeout(() => {
					cloudMotionStore.initializeAllAnimations();
				}, 150);
			}
		}
	}

	// Função para lidar com erro de imagem
	function handleImageError(assetNum, error) {
		logger.animation('MOTION_IMAGE_ERROR', {
			'Asset': assetNum,
			'Erro': error.detail || 'Falha ao carregar imagem'
		});
		// Conta como carregada para não travar
		handleImageLoad();
	}

	// Controle de hidratação
	if (typeof window !== 'undefined') {
		$effect(() => {
			if (!showImages) {
				currentTheme = $themeStore;
				showImages = true;
			} else {
				currentTheme = $themeStore;
			}
		});
	}

	// Sincronização com motion store
	$effect(() => {
		cloudMotionStore.setActive(cloudAnimationsActive);
	});

	$effect(() => {
		cloudMotionStore.setAnimationStyle(animationStyle);
	});

	// Subscribe para estados da store
	$effect(() => {
		const unsubscribe = cloudMotionStore.subscribe((state) => {
			storeState = state;
			cloudCount = state.clouds.size;
		});

		return unsubscribe;
	});

	// Debug functions (apenas em desenvolvimento)
	function toggleAnimationStyle() {
		const styles = ['gentle', 'dynamic', 'elastic'];
		const currentIndex = styles.indexOf(animationStyle);
		animationStyle = styles[(currentIndex + 1) % styles.length];
		
		logger.animation('STYLE_CHANGE', {
			'Novo estilo': animationStyle
		});
	}

	function adjustGlobalSpeed(speed) {
		cloudMotionStore.setGlobalSpeed(speed);
		logger.animation('SPEED_CHANGE', { speed });
	}

	// Lifecycle
	onMount(() => {
		logger.animation('MOTION_COMPONENT_MOUNT', {
			Componente: 'Welcome (Motion)',
			'Animações ativas': cloudAnimationsActive,
			'Estilo': animationStyle,
			'Tema atual': currentTheme
		});

		// Cleanup
		return () => {
			logger.animation('MOTION_COMPONENT_UNMOUNT', {
				Componente: 'Welcome (Motion)',
				'Nuvens limpas': cloudCount
			});

			cloudMotionStore.cleanup();
		};
	});
</script>

<section id="welcome" class="theme-background theme-text-transition">
	<!-- Container de nuvens com classes SCSS avançadas -->
	<div class="clouds-background" class:cloud-debug={false}>
		{#each cloudAssets as assetNum (assetNum)}
			{#if showImages}
				<img
					src="{base}/assets/nuvens/{currentTheme}/SVG/nuvem{assetNum}.svg"
					alt=""
					class="cloud-element cloud-element--{animationStyle}"
					class:theme-light={currentTheme === 'light'}
					class:theme-dark={currentTheme === 'dark'}
					data-cloud-id={assetNum}
					data-motion-state={cloudAnimationsActive ? 'active' : 'paused'}
					use:registerCloudMotion={{ cloudId: assetNum, style: animationStyle }}
					onload={handleImageLoad}
					onerror={(e) => handleImageError(assetNum, e)}
					style="
						transform: translate({storeState.clouds?.get(assetNum)?.position?.x || 50}%, {storeState.clouds?.get(assetNum)?.position?.y || 50}%) 
						           rotate({storeState.clouds?.get(assetNum)?.rotation || 0}deg) 
						           scale({storeState.clouds?.get(assetNum)?.scale || 1});
					"
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
		
		<!-- Controles de desenvolvimento (apenas se logger ativo) -->
		{#if typeof window !== 'undefined' && window.location.hostname === 'localhost'}
			<div class="dev-controls">
				<div class="control-row">
					<label>
						<input 
							type="checkbox" 
							bind:checked={cloudAnimationsActive}
						/>
						Animações Ativas ({cloudCount} nuvens)
					</label>
				</div>
				
				<div class="control-row">
					<label>
						Estilo: 
						<select bind:value={animationStyle}>
							<option value="gentle">Suave</option>
							<option value="dynamic">Dinâmico</option>
							<option value="elastic">Elástico</option>
						</select>
					</label>
				</div>
				
				<div class="control-row">
					<button onclick={() => adjustGlobalSpeed(0.5)}>0.5x</button>
					<button onclick={() => adjustGlobalSpeed(1.0)}>1x</button>
					<button onclick={() => adjustGlobalSpeed(2.0)}>2x</button>
				</div>
			</div>
		{/if}
		
		<Button
			style="background-color: var(--ed-complementary); color: var(--ed-text-100); font-weight: 600;"
			class="theme-interactive-transition"
		>
			{m.start_game()}
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

	.welcome-content {
		position: relative;
		z-index: cloud.cloud-config('z-layers', 'content');
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
	}

	/* Text outline usando funções do SCSS */
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

	/* Controles de desenvolvimento */
	.dev-controls {
		position: fixed;
		top: 10px;
		right: 10px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 1rem;
		border-radius: 8px;
		font-size: 0.8rem;
		z-index: 1000;
		
		.control-row {
			margin-bottom: 0.5rem;
			display: flex;
			align-items: center;
			gap: 0.5rem;
			
			label {
				display: flex;
				align-items: center;
				gap: 0.25rem;
			}
			
			button {
				padding: 0.25rem 0.5rem;
				margin: 0 0.125rem;
				border: none;
				border-radius: 4px;
				background: #333;
				color: white;
				cursor: pointer;
				
				&:hover {
					background: #555;
				}
			}
		}
	}

	/* Responsividade usando mixins SCSS */
	@include cloud.respond-to('mobile') {
		#welcome {
			max-width: 80%;
		}

		.text-outlined {
			-webkit-text-stroke: 10px var(--theme-background);
			
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
		
		.dev-controls {
			position: relative;
			width: 100%;
			margin-top: 1rem;
		}
	}
</style>
