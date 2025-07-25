<script>
	import { m } from '$lib/paraglide/messages.js';
	import Button from '@smui/button';
	import { themeStore } from '$lib/stores/theme.js';
	import { onMount } from 'svelte';

	// Array com todos os assets de nuvens (1-17)
	const cloudAssets = Array.from({ length: 17 }, (_, i) => i + 1);

	// Map para armazenar referências dos elementos e animações
	const cloudElements = new Map();
	const cloudAnimations = new Map();

	// Configurações da animação
	const ANIMATION_CONFIG = {
		stepDuration: 200, // ms por step (efeito choppy)
		minSteps: 15,
		maxSteps: 25,
		minTotalDuration: 8000, // ms
		maxTotalDuration: 20000, // ms
		movementRadius: 60, // pixels de movimento máximo por step
		boundaryMargin: 10 // % de margem das bordas
	};

	// Direções de movimento possíveis (8 direções + parada)
	const MOVEMENT_DIRECTIONS = [
		{ x: 0, y: 0 },     // parada
		{ x: -1, y: 0 },    // ←
		{ x: 1, y: 0 },     // →
		{ x: 0, y: -1 },    // ↑
		{ x: 0, y: 1 },     // ↓
		{ x: -1, y: -1 },   // ↖
		{ x: 1, y: -1 },    // ↗
		{ x: -1, y: 1 },    // ↙
		{ x: 1, y: 1 }      // ↘
	];

	/**
	 * Gera posição inicial aleatória para uma nuvem
	 */
	function generateInitialPosition() {
		return {
			x: Math.random() * (100 - ANIMATION_CONFIG.boundaryMargin * 2) + ANIMATION_CONFIG.boundaryMargin,
			y: Math.random() * (100 - ANIMATION_CONFIG.boundaryMargin * 2) + ANIMATION_CONFIG.boundaryMargin
		};
	}

	/**
	 * Gera sequência de movimento errático para uma nuvem
	 */
	function generateMovementSequence(startPos) {
		const steps = Math.floor(Math.random() * (ANIMATION_CONFIG.maxSteps - ANIMATION_CONFIG.minSteps + 1)) + ANIMATION_CONFIG.minSteps;
		const sequence = [];
		let currentPos = { ...startPos };

		for (let i = 0; i < steps; i++) {
			// Escolhe direção aleatória
			const direction = MOVEMENT_DIRECTIONS[Math.floor(Math.random() * MOVEMENT_DIRECTIONS.length)];
			
			// Calcula nova posição
			const movement = Math.random() * ANIMATION_CONFIG.movementRadius;
			const newPos = {
				x: Math.max(ANIMATION_CONFIG.boundaryMargin, 
					Math.min(100 - ANIMATION_CONFIG.boundaryMargin, 
						currentPos.x + (direction.x * movement / window.innerWidth * 100))),
				y: Math.max(ANIMATION_CONFIG.boundaryMargin, 
					Math.min(100 - ANIMATION_CONFIG.boundaryMargin, 
						currentPos.y + (direction.y * movement / window.innerHeight * 100)))
			};

			sequence.push({
				transform: `translate(${newPos.x}vw, ${newPos.y}vh)`,
				offset: i / (steps - 1)
			});

			currentPos = newPos;
		}

		// Garante retorno à posição inicial (loop fechado)
		sequence[sequence.length - 1] = {
			transform: `translate(${startPos.x}vw, ${startPos.y}vh)`,
			offset: 1
		};

		return sequence;
	}

	/**
	 * Cria animação choppy para um elemento de nuvem
	 */
	function createChoppyAnimation(element, assetId) {
		const startPos = generateInitialPosition();
		const keyframes = generateMovementSequence(startPos);
		
		// Define posição inicial
		element.style.left = `${startPos.x}vw`;
		element.style.top = `${startPos.y}vh`;

		// Duração aleatória
		const duration = Math.random() * (ANIMATION_CONFIG.maxTotalDuration - ANIMATION_CONFIG.minTotalDuration) + ANIMATION_CONFIG.minTotalDuration;
		
		// Delay inicial aleatório
		const delay = Math.random() * 5000;

		// Cria animação com Web Animations API
		const animation = element.animate(keyframes, {
			duration: duration,
			delay: delay,
			iterations: Infinity,
			easing: 'steps(1, end)', // Efeito choppy
			fill: 'both'
		});

		cloudAnimations.set(assetId, {
			animation,
			config: { startPos, duration, delay },
			element
		});

		return animation;
	}

	/**
	 * Inicializa animações de todas as nuvens
	 */
	function initializeCloudAnimations() {
		cloudElements.forEach((element, assetId) => {
			createChoppyAnimation(element, assetId);
		});
	}

	/**
	 * API pública para controle das animações (extensibilidade futura)
	 */
	export const cloudAnimationController = {
		pause: () => cloudAnimations.forEach(({ animation }) => animation.pause()),
		play: () => cloudAnimations.forEach(({ animation }) => animation.play()),
		setSpeed: (multiplier) => cloudAnimations.forEach(({ animation }) => {
			animation.playbackRate = multiplier;
		}),
		pauseCloud: (assetId) => {
			const cloud = cloudAnimations.get(assetId);
			if (cloud) cloud.animation.pause();
		},
		restartCloud: (assetId) => {
			const cloud = cloudAnimations.get(assetId);
			if (cloud) {
				cloud.animation.cancel();
				createChoppyAnimation(cloud.element, assetId);
			}
		},
		getCloudState: (assetId) => cloudAnimations.get(assetId)?.config || null
	};

	/**
	 * Ação Svelte para registrar elementos de nuvem
	 */
	function registerCloudElement(element, assetId) {
		cloudElements.set(assetId, element);
		
		return {
			destroy() {
				cloudElements.delete(assetId);
				const animation = cloudAnimations.get(assetId);
				if (animation) {
					animation.animation.cancel();
					cloudAnimations.delete(assetId);
				}
			}
		};
	}

	// Lifecycle
	onMount(() => {
		// Pequeno delay para garantir que elementos estejam renderizados
		setTimeout(initializeCloudAnimations, 100);
		
		// Cleanup ao desmontar
		return () => {
			cloudAnimations.forEach(({ animation }) => animation.cancel());
			cloudAnimations.clear();
		};
	});
</script>

<section id="welcome" class="theme-background theme-text-transition">
	<!-- Background de nuvens -->
	<div class="clouds-background">
		{#each cloudAssets as assetNum}
			<img 
				src="/assets/nuvens/{$themeStore}/SVG/nuvem{assetNum}.svg"
				alt=""
				class="cloud-asset"
				data-cloud-id={assetNum}
				use:registerCloudElement={assetNum}
			/>
		{/each}
	</div>

	<!-- Conteúdo principal -->
	<div class="welcome-content">
		<h1 class="theme-text-transition text-outlined">{`${m.welcome()}!`}</h1>
		<p class="theme-text-transition text-outlined">{@html m.initial_disclaimer()}</p>
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
