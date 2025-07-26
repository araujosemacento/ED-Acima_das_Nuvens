<script>
	import { m } from '$lib/paraglide/messages.js';
	import Button, { Label } from '@smui/button';
	import { onMount } from 'svelte';
	import { logger } from '$lib/stores/logger.js';

	let mouseGlimmer = $state({ x: 50, y: 50 });
	let mousePosition = $state({ x: 0, y: 0 }); // Posição absoluta do mouse para cálculos vetoriais
	let welcomeSection;
	let glimmerElement;

	// === SISTEMA DE NUVENS ===
	let cloudAssets = $state([]);
	let cloudControllers = $state(new Map());
	let cloudAnimationIntervals = $state(new Map());

	// Configurações do sistema de nuvens
	const CLOUD_CONFIG = {
		stepDistance: 0.25, // rem - distância de cada passo (corrigido: 0.25rem ao invés de 0.025rem)
		maxDistance: 5, // rem - raio máximo da origem
		moveInterval: 1000, // ms - intervalo base entre movimentos (~1s para estética retrô)
		intervalVariation: 250, // ms - variação para dessincronização (±250ms)
		opacity: 0.8, // 80% de opacidade
		totalClouds: 17, // Renderizar todas as 17 nuvens
		// Sistema de logging híbrido
		logging: {
			performanceThrottle: 5000, // ms - throttle para logs de performance crítica
			maxLocalLogs: 50, // máximo de logs locais em memória
			useStructuredLogs: true // usar logger store para logs estruturados
		}
	};

	// 8 direções possíveis (estilo retrô)
	const DIRECTIONS = {
		UP: { x: 0, y: -1, name: 'UP' },
		DOWN: { x: 0, y: 1, name: 'DOWN' },
		LEFT: { x: -1, y: 0, name: 'LEFT' },
		RIGHT: { x: 1, y: 0, name: 'RIGHT' },
		UP_LEFT: { x: -1, y: -1, name: 'UP_LEFT' },
		UP_RIGHT: { x: 1, y: -1, name: 'UP_RIGHT' },
		DOWN_LEFT: { x: -1, y: 1, name: 'DOWN_LEFT' },
		DOWN_RIGHT: { x: 1, y: 1, name: 'DOWN_RIGHT' }
	};

	// === SISTEMA DE LOGGING HÍBRIDO ===
	// Combina logger store (estruturado) + sistema local (performance crítica)
	let localPerformanceLogs = $state([]);
	let lastPerformanceLogTime = 0;

	// Logger híbrido com diferenciação inteligente
	const cloudLogger = {
		// Logs estruturados via logger store (para interface/desenvolvimento)
		structured: {
			init: (data) => logger.actions.component('CloudSystem', 'inicialização', data),
			animation: (action, data) => logger.actions.animation(`cloud-${action}`, data),
			error: (message, data) => logger.actions.error(`CloudSystem: ${message}`, data),
			debug: (action, data) => logger.actions.debug(`CloudSystem: ${action}`, data)
		},
		
		// Logs de performance crítica (local, com throttling otimizado)
		performance: (message, data = {}) => {
			const now = Date.now();
			if (now - lastPerformanceLogTime > CLOUD_CONFIG.logging.performanceThrottle) {
				// Log local para controle de memória
				const logEntry = {
					timestamp: now,
					message,
					data: { ...data },
					memoryUsage: performance.memory ? 
						`${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB` : 'N/A'
				};
				
				localPerformanceLogs.push(logEntry);
				
				// Limitar logs locais para controle de memória
				if (localPerformanceLogs.length > CLOUD_CONFIG.logging.maxLocalLogs) {
					localPerformanceLogs.shift();
				}
				
				// Console log direto para desenvolvimento
				console.log(`🌤️ [CloudPerf] ${message}`, logEntry);
				lastPerformanceLogTime = now;
			}
		},
		
		// Logs críticos (sempre logados, sem throttle)
		critical: (message, data = {}) => {
			logger.actions.error(`[CRÍTICO] CloudSystem: ${message}`, data);
			console.error(`🚨 [CloudSystem] ${message}`, data);
		},
		
		// Utilitários de memória
		getMemoryStats: () => ({
			localLogs: localPerformanceLogs.length,
			maxLocalLogs: CLOUD_CONFIG.logging.maxLocalLogs,
			lastPerformanceLog: lastPerformanceLogTime,
			memoryUsage: performance.memory ? 
				`${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB` : 'N/A'
		}),
		
		clearLocalLogs: () => {
			localPerformanceLogs = [];
			lastPerformanceLogTime = 0;
		}
	};

	// Controller de movimento para cada nuvem
	class CloudMovementController {
		constructor(initialPosition, cloudId) {
			this.cloudId = cloudId;
			this.originalPosition = { ...initialPosition }; // em rem
			this.currentPosition = { ...initialPosition };
			this.movementHistory = []; // Últimas 2 direções
			this.maxDistance = CLOUD_CONFIG.maxDistance; // rem
			this.stepDistance = CLOUD_CONFIG.stepDistance; // rem
			this.moveCount = 0;
		}

		calculateDistanceFromOrigin() {
			const deltaX = this.currentPosition.x - this.originalPosition.x;
			const deltaY = this.currentPosition.y - this.originalPosition.y;
			return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		}

		getOppositeDirection(directionName) {
			const opposites = {
				'UP': DIRECTIONS.DOWN,
				'DOWN': DIRECTIONS.UP,
				'LEFT': DIRECTIONS.RIGHT,
				'RIGHT': DIRECTIONS.LEFT,
				'UP_LEFT': DIRECTIONS.DOWN_RIGHT,
				'UP_RIGHT': DIRECTIONS.DOWN_LEFT,
				'DOWN_LEFT': DIRECTIONS.UP_RIGHT,
				'DOWN_RIGHT': DIRECTIONS.UP_LEFT
			};
			return opposites[directionName] || this.getRandomDirection();
		}

		getDirectionTowardsOrigin() {
			const deltaX = this.originalPosition.x - this.currentPosition.x;
			const deltaY = this.originalPosition.y - this.currentPosition.y;
			
			// Determinar direção geral para casa
			let direction;
			if (Math.abs(deltaX) > Math.abs(deltaY)) {
				// Movimento horizontal prioritário
				direction = deltaX > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
			} else {
				// Movimento vertical prioritário
				direction = deltaY > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
			}
			
			return direction;
		}

		getRandomDirection() {
			const directionKeys = Object.keys(DIRECTIONS);
			const randomKey = directionKeys[Math.floor(Math.random() * directionKeys.length)];
			return DIRECTIONS[randomKey];
		}

		getNextDirection() {
			this.moveCount++;
			
			// 1. Se moveu 2x consecutivas na mesma direção → forçar oposta
			if (this.movementHistory.length >= 2) {
				const lastTwo = this.movementHistory.slice(-2);
				if (lastTwo[0] === lastTwo[1]) {
					const oppositeDir = this.getOppositeDirection(lastTwo[1]);
					cloudLogger.structured.debug('direção-forçada', {
						cloudId: this.cloudId,
						from: lastTwo[1],
						to: oppositeDir.name,
						history: this.movementHistory,
						position: this.currentPosition
					});
					return oppositeDir;
				}
			}

			// 2. Se muito longe da origem → direcionar para casa
			const distanceFromOrigin = this.calculateDistanceFromOrigin();
			if (distanceFromOrigin > this.maxDistance) {
				const homeDir = this.getDirectionTowardsOrigin();
				cloudLogger.structured.animation('retorno-origem', {
					cloudId: this.cloudId,
					distance: distanceFromOrigin.toFixed(2),
					direction: homeDir.name,
					currentPos: this.currentPosition,
					originalPos: this.originalPosition
				});
				return homeDir;
			}

			// 3. Caso contrário → direção aleatória
			const randomDir = this.getRandomDirection();
			if (this.moveCount % 10 === 0) { // Log estruturado a cada 10 movimentos
				cloudLogger.structured.animation('movimento-aleatório', {
					cloudId: this.cloudId,
					direction: randomDir.name,
					moveCount: this.moveCount,
					distance: distanceFromOrigin.toFixed(2)
				});
			}
			return randomDir;
		}
	}

	// Função derivada para cálculos vetoriais eficientes (Svelte 5 runes)
	const calculateGradientAngle = $derived((centerX, centerY) => {
		const deltaX = mousePosition.x - centerX;
		const deltaY = mousePosition.y - centerY;
		const angleRad = Math.atan2(deltaY, deltaX);
		return (angleRad * 180 / Math.PI + 360) % 360; // Normalizar para 0-360°
	});

	// === FUNÇÕES DO SISTEMA DE NUVENS ===
	function generateRandomPosition() {
		// Gerar posição aleatória dentro do viewport em rem
		// Margem de segurança para evitar cortes
		const safeMargin = 2; // rem
		const viewportWidth = window.innerWidth / 16; // converter px para rem (assumindo 16px = 1rem)
		const viewportHeight = window.innerHeight / 16;
		
		const position = {
			x: Math.random() * (viewportWidth - safeMargin * 2) + safeMargin,
			y: Math.random() * (viewportHeight - safeMargin * 2) + safeMargin
		};
		
		cloudLogger.structured.debug('posição-gerada', {
			x: position.x.toFixed(2),
			y: position.y.toFixed(2),
			viewport: { width: viewportWidth.toFixed(2), height: viewportHeight.toFixed(2) }
		});
		
		return position;
	}

	function initializeCloudAssets() {
		const isDarkTheme = document.documentElement.classList.contains('theme-dark');
		const isMobile = window.innerWidth <= 768;
		
		cloudLogger.structured.init({
			theme: isDarkTheme ? 'dark' : 'light',
			isMobile,
			totalClouds: CLOUD_CONFIG.totalClouds,
			stepDistance: CLOUD_CONFIG.stepDistance,
			maxDistance: CLOUD_CONFIG.maxDistance
		});
		
		// TODO: Futuro workflow - implementar subconjuntos de nuvens
		// TODO: Futuro workflow - alguns assets terão posição inicial fixa
		// TODO: Futuro workflow - redução de nuvens no mobile para performance
		
		const themeFolder = isDarkTheme ? 'dark' : 'light';
		const clouds = [];
		
		for (let i = 1; i <= CLOUD_CONFIG.totalClouds; i++) {
			const initialPosition = generateRandomPosition();
			const cloud = {
				id: `cloud-${i}`,
				src: `/assets/nuvens/${themeFolder}/SVG/nuvem${i}.svg`,
				position: initialPosition, // em rem
				element: null
			};
			
			clouds.push(cloud);
			
			// Criar controller de movimento para cada nuvem
			cloudControllers.set(cloud.id, new CloudMovementController(initialPosition, cloud.id));
		}
		
		cloudAssets = clouds;
		cloudLogger.structured.init({
			message: 'assets-inicializados',
			count: clouds.length,
			theme: themeFolder
		});
	}

	function startCloudAnimations() {
		cloudLogger.structured.animation('início-animações', {
			baseInterval: CLOUD_CONFIG.moveInterval,
			intervalVariation: CLOUD_CONFIG.intervalVariation,
			totalClouds: cloudAssets.length
		});
		
		cloudAssets.forEach((cloud, index) => {
			// Intervalo dessincronizado para cada nuvem (±250ms variação)
			const baseInterval = CLOUD_CONFIG.moveInterval;
			const randomOffset = (Math.random() * 2 - 1) * CLOUD_CONFIG.intervalVariation; // ±250ms
			const interval = baseInterval + randomOffset;
			
			cloudLogger.structured.debug('intervalo-configurado', {
				cloudId: cloud.id,
				interval: interval.toFixed(0),
				offset: `${randomOffset > 0 ? '+' : ''}${randomOffset.toFixed(0)}ms`
			});
			
			// Delay inicial escalonado para evitar sincronização acidental
			const initialDelay = index * 100; // 100ms entre cada nuvem
			
			setTimeout(() => {
				const animationInterval = setInterval(() => {
					moveCloud(cloud.id);
				}, interval);
				
				cloudAnimationIntervals.set(cloud.id, animationInterval);
			}, initialDelay);
		});
	}

	function moveCloud(cloudId) {
		const controller = cloudControllers.get(cloudId);
		const cloudIndex = cloudAssets.findIndex(c => c.id === cloudId);
		
		if (!controller || cloudIndex === -1) {
			cloudLogger.critical('controller-ou-cloud-não-encontrado', { cloudId });
			return;
		}
		
		const direction = controller.getNextDirection();
		const newPosition = {
			x: controller.currentPosition.x + (direction.x * controller.stepDistance),
			y: controller.currentPosition.y + (direction.y * controller.stepDistance)
		};
		
		// Atualizar posição do controller
		controller.currentPosition = newPosition;
		controller.movementHistory.push(direction.name);
		
		// Manter apenas últimas 2 direções para análise
		if (controller.movementHistory.length > 2) {
			controller.movementHistory.shift();
		}
		
		// Atualizar posição visual da nuvem usando state reativo
		cloudAssets[cloudIndex].position = { ...newPosition };
		
		// Log de performance com sistema híbrido (a cada 20 movimentos)
		if (controller.moveCount % 20 === 0) {
			cloudLogger.performance('check-performance', {
				activeIntervals: cloudAnimationIntervals.size,
				cloudId: controller.cloudId,
				moveCount: controller.moveCount,
				memoryStats: cloudLogger.getMemoryStats()
			});
		}
	}

	onMount(() => {
		// === INICIALIZAÇÃO DO SISTEMA DE NUVENS ===
		cloudLogger.structured.init({
			message: 'montando-componente',
			timestamp: Date.now()
		});
		
		try {
			initializeCloudAssets();
			startCloudAnimations();
			cloudLogger.structured.init({
				message: 'sistema-inicializado-com-sucesso',
				activeAssets: cloudAssets.length,
				activeControllers: cloudControllers.size
			});
		} catch (error) {
			cloudLogger.critical('erro-inicialização', { 
				error: error.message, 
				stack: error.stack 
			});
		}
		const handleMouseMove = (event) => {
			// Atualizar posição global do mouse (rune para reatividade)
			mousePosition = { x: event.clientX, y: event.clientY };
			
			if (welcomeSection && glimmerElement) {
				// Usar viewport completo em vez de apenas o elemento welcome
				const x = (event.clientX / window.innerWidth) * 100;
				const y = (event.clientY / window.innerHeight) * 100;
				
				// Detectar tema atual para aplicar cores adequadas
				const isDarkTheme = document.documentElement.classList.contains('theme-dark');
				const isLightTheme = document.documentElement.classList.contains('theme-light');
				
				// Detectar se é mobile para ajustar tamanho e intensidade
				const isMobile = window.innerWidth <= 768; // 48rem = 768px
				const circleSize = isMobile ? '200px' : '300px';
				
				let glimmerColors;
				if (isDarkTheme) {
					glimmerColors = {
						center: isMobile ? 'rgba(255, 223, 186, 0.08)' : 'rgba(255, 223, 186, 0.1)',
						mid: isMobile ? 'rgba(255, 223, 186, 0.04)' : 'rgba(255, 223, 186, 0.05)',
						outer: isMobile ? 'transparent' : 'rgba(255, 223, 186, 0.025)'
					};
				} else if (isLightTheme) {
					glimmerColors = {
						center: isMobile ? 'rgba(100, 149, 237, 0.1)' : 'rgba(100, 149, 237, 0.12)',
						mid: isMobile ? 'rgba(100, 149, 237, 0.05)' : 'rgba(100, 149, 237, 0.06)',
						outer: isMobile ? 'transparent' : 'rgba(100, 149, 237, 0.03)'
					};
				} else {
					// Tema padrão/sistema
					glimmerColors = {
						center: isMobile ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.1)',
						mid: isMobile ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.05)',
						outer: isMobile ? 'transparent' : 'rgba(255, 255, 255, 0.025)'
					};
				}
				
				// Aplicar animação suave usando Web Animation API
				const gradientStops = isMobile 
					? `${glimmerColors.center} 0%, ${glimmerColors.mid} 40%, transparent 70%`
					: `${glimmerColors.center} 0%, ${glimmerColors.mid} 40%, ${glimmerColors.outer} 70%, transparent 100%`;
				
				glimmerElement.animate([
					{
						background: `radial-gradient(
							${circleSize} circle at ${x}% ${y}%,
							${gradientStops}
						)`
					}
				], {
					duration: 333, // ~1/3s para suavidade ideal
					easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
					fill: 'forwards'
				});
				
				// Manter os valores para responsividade/temas
				mouseGlimmer = { x, y };
			}

			// Animar glow dos botões - SISTEMA HÍBRIDO ACCENT-BASED
			const buttonContainers = document.querySelectorAll('.button-border-container');
			buttonContainers.forEach(container => {
				const buttonBlob = container.querySelector('.button-blob');
				if (buttonBlob) {
					const rect = container.getBoundingClientRect();
					const centerX = rect.left + rect.width / 2;
					const centerY = rect.top + rect.height / 2;
					
					// Calcular posição relativa ao mouse dentro do container
					const relativeX = event.clientX - rect.left - 60; // -60 para centralizar blob (120px/2)
					const relativeY = event.clientY - rect.top - 60;
					
					// Calcular proximidade para intensidade dinâmica
					const distance = Math.sqrt(
						Math.pow(event.clientX - centerX, 2) + 
						Math.pow(event.clientY - centerY, 2)
					);
					// Raio de influência igual ao glimmer: 200px mobile / 300px desktop
					const isMobile = window.innerWidth <= 768;
					const maxDistance = isMobile ? 200 : 300;
					const proximity = Math.max(0, 1 - distance / maxDistance);
					
					// Detectar tema para cores adequadas
					const isDarkTheme = document.documentElement.classList.contains('theme-dark');
					const isLightTheme = document.documentElement.classList.contains('theme-light');
					
					let themeColor;
					if (isDarkTheme) {
						// Dark theme: secondary-400 com intensidade aumentada para maior visibilidade
						themeColor = `hsla(290, 40%, 43%, ${proximity * 1.0})`;
					} else if (isLightTheme) {
						// Light theme: accent-600 com intensidade aumentada para maior visibilidade
						themeColor = `hsla(273, 70%, 35%, ${proximity * 0.9})`;
					} else {
						// System theme: fallback com intensidade aumentada
						themeColor = `rgba(255, 255, 255, ${proximity * 0.8})`;
					}
					
					// Animar com transform (performance) + cores temáticas
					buttonBlob.animate([
						{
							transform: `translate(${relativeX}px, ${relativeY}px)`,
							background: themeColor,
							opacity: proximity > 0.05 ? 1 : 0 // Limiar reduzido para maior sensibilidade
						}
					], {
						duration: 150, // Resposta rápida
						easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
						fill: 'forwards'
					});
					
					// Calcular ângulo vetorial do gradiente usando rune derivada
					const angleDeg = calculateGradientAngle(centerX, centerY);
					
					// Atualizar borda do container baseado na proximidade (intensidade aumentada)
					const borderIntensity = proximity; // Intensidade aumentada
					
					// Definir cores do gradiente baseadas no tema
					let gradientColors;
					if (isDarkTheme) {
						// Dark theme: usar cores secondary com variações apropriadas
						gradientColors = `${themeColor}, 
							hsla(290, 40%, 53%, ${borderIntensity * 0.99}),
							hsla(290, 40%, 53%, ${borderIntensity * 0.44})`;
					} else {
						// Light theme: usar cores accent (mantendo comportamento original)
						gradientColors = `${themeColor}, 
							hsla(273, 65%, 55%, ${borderIntensity * 0.66}),
							hsla(273, 65%, 55%, ${borderIntensity * 0.33})`;
					}
					
					container.animate([
						{
							background: `linear-gradient(${angleDeg}deg, ${gradientColors})`
						}
					], {
						duration: 150,
						easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
						fill: 'forwards'
					});
				}
			});
		};

		const handleMouseLeave = () => {
			if (glimmerElement) {
				// Detectar tema atual e responsividade para cores consistentes
				const isDarkTheme = document.documentElement.classList.contains('theme-dark');
				const isLightTheme = document.documentElement.classList.contains('theme-light');
				const isMobile = window.innerWidth <= 768;
				const circleSize = isMobile ? '200px' : '300px';
				
				let glimmerColors;
				if (isDarkTheme) {
					glimmerColors = {
						center: isMobile ? 'rgba(255, 223, 186, 0.08)' : 'rgba(255, 223, 186, 0.1)',
						mid: isMobile ? 'rgba(255, 223, 186, 0.04)' : 'rgba(255, 223, 186, 0.05)',
						outer: isMobile ? 'transparent' : 'rgba(255, 223, 186, 0.025)'
					};
				} else if (isLightTheme) {
					glimmerColors = {
						center: isMobile ? 'rgba(100, 149, 237, 0.08)' : 'rgba(100, 149, 237, 0.1)',
						mid: isMobile ? 'rgba(100, 149, 237, 0.04)' : 'rgba(100, 149, 237, 0.05)',
						outer: isMobile ? 'transparent' : 'rgba(100, 149, 237, 0.025)'
					};
				} else {
					glimmerColors = {
						center: isMobile ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.1)',
						mid: isMobile ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.05)',
						outer: isMobile ? 'transparent' : 'rgba(255, 255, 255, 0.025)'
					};
				}
				
				const gradientStops = isMobile 
					? `${glimmerColors.center} 0%, ${glimmerColors.mid} 40%, transparent 70%`
					: `${glimmerColors.center} 0%, ${glimmerColors.mid} 40%, ${glimmerColors.outer} 70%, transparent 100%`;
				
				// Suave retorno ao centro quando o mouse sai da janela
				glimmerElement.animate([
					{
						background: `radial-gradient(
							${circleSize} circle at 50% 50%,
							${gradientStops}
						)`
					}
				], {
					duration: 300,
					easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
					fill: 'forwards'
				});
			}
			
			// Reset dos botões quando mouse sai da janela
			const buttonContainers = document.querySelectorAll('.button-border-container');
			buttonContainers.forEach(container => {
				const buttonBlob = container.querySelector('.button-blob');
				if (buttonBlob) {
					buttonBlob.animate([
						{
							opacity: 0,
							transform: 'translate(0, 0)'
						}
					], {
						duration: 200,
						easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
						fill: 'forwards'
					});
					
					// Reset da borda com ângulo neutro
					container.animate([
						{
							background: `linear-gradient(45deg, 
								rgba(255, 255, 255, 0.15), 
								rgba(255, 255, 255, 0.05),
								rgba(255, 255, 255, 0.15)
							)`
						}
					], {
						duration: 300,
						easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
						fill: 'forwards'
					});
				}
			});
			
			mouseGlimmer = { x: 50, y: 50 };
			mousePosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 }; // Reset para centro da tela
		};

		// Escutar eventos no documento inteiro para capturar movimento global
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseleave', handleMouseLeave);

		return () => {
			// === CLEANUP DO SISTEMA DE NUVENS ===
			cloudLogger.structured.debug('iniciando-cleanup', {
				activeIntervals: cloudAnimationIntervals.size,
				activeControllers: cloudControllers.size,
				memoryStats: cloudLogger.getMemoryStats()
			});
			
			// Limpar todos os intervalos de animação
			cloudAnimationIntervals.forEach((interval, cloudId) => {
				clearInterval(interval);
				cloudLogger.structured.debug('intervalo-limpo', { cloudId });
			});
			cloudAnimationIntervals.clear();
			
			// Limpar controladores
			cloudControllers.clear();
			cloudAssets = [];
			
			// Limpar logs locais para liberar memória
			cloudLogger.clearLocalLogs();
			
			cloudLogger.structured.init({
				message: 'cleanup-concluído',
				finalMemoryStats: cloudLogger.getMemoryStats()
			});
			
			// Cleanup existente dos event listeners
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseleave', handleMouseLeave);
		};
	});
</script>

<section id="welcome" class="theme-background theme-text-transition" bind:this={welcomeSection}>
	<!-- NOVA: Camada de nuvens (z-index: -10) -->
	<!-- TODO: Futuro workflow - esta área será expandida para outros componentes -->
	<div class="cloud-layer">
		{#each cloudAssets as cloud (cloud.id)}
			<img 
				src={cloud.src} 
				alt="Nuvem decorativa"
				class="cloud-asset"
				style="transform: translate({cloud.position.x}rem, {cloud.position.y}rem);"
				bind:this={cloud.element}
			/>
		{/each}
	</div>
	
	<!-- Glimmer radial que segue o mouse -->
	<div 
		class="mouse-glimmer"
		bind:this={glimmerElement}
	></div>
	
	<!-- Conteúdo principal -->
	<div class="welcome-content">
		<div class="text-container">
			<h1 class="theme-text-transition text-outlined title-text" data-text="{m.welcome()}!">{m.welcome()}!</h1>
		</div>
		<div class="disclaimer-text">
			<div class="text-container">
				<p class="theme-text-transition text-outlined" data-text="{m.initial_disclaimer_paragraph1()}">{m.initial_disclaimer_paragraph1()}</p>
			</div>
			<div class="text-container">
				<p class="theme-text-transition text-outlined" data-text="{m.initial_disclaimer_paragraph2()}">{m.initial_disclaimer_paragraph2()}</p>
			</div>
		</div>
		<div class="button-border-container">
			<Button variant="unelevated" class="theme-interactive-transition game-start-button">
				<Label>{m.start_game()}</Label>
			</Button>
			<div class="button-blob"></div>
		</div>
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

	/* Glimmer radial que segue o mouse */
	.mouse-glimmer {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: -2; /* Acima do pseudo-elemento do outline (z-index: -1), mas abaixo do conteúdo (z-index: 10) */
		pointer-events: none;
		/* Removemos a transition CSS - será controlada via Web Animation API */
		
		background: radial-gradient(
			300px circle at 50% 50%, /* Posição inicial centralizada */
			rgba(255, 255, 255, 0.06) 0%,
			rgba(255, 255, 255, 0.03) 40%,
			rgba(255, 255, 255, 0.01) 70%,
			transparent 100%
		);
	}

	/* NOVA: Camada de nuvens */
	/* TODO: Futuro workflow - esta área será expandida para outros componentes */
	.cloud-layer {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: -10; /* Abaixo do outline dos textos (z-index: -1) */
		pointer-events: none;
		overflow: hidden; /* Confinar nuvens ao viewport inicial */
	}

	.cloud-asset {
		position: absolute;
		opacity: 0.8; /* 80% conforme especificado */
		pointer-events: none;
		
		/* TODO: Futuro workflow - implementar tamanhos proporcionais diferentes */
		width: auto;
		height: auto;
		max-width: 8rem; /* Tamanho duplicado: 4rem → 8rem */
		max-height: 8rem;
		
		/* Movimento step-based sem interpolação (estética pixelada/retrô) */
		transition: none; /* Remover suavização para movimento discreto */
		
		/* Sem rotação conforme especificado */
		transform-origin: center;
		
		/* Evitar blur/antialiasing para manter estética pixelada */
		image-rendering: pixelated;
		image-rendering: -moz-crisp-edges;
		image-rendering: crisp-edges;
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
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
	}

	/* Container para texto com outline */
	.text-container {
		position: relative;
		display: inline-block;
	}

	.text-outlined {
		position: relative;
		z-index: 2;
		font-weight: 600;
		color: var(--mdc-theme-text-primary-on-background);

		/* MÉTODO PRINCIPAL: Pseudo-elemento para outline com blur independente */
		&::before {
			position: absolute;
			top: 0;
			left: 0;
			z-index: -1;
			font-family: inherit;
			font-size: inherit;
			font-weight: inherit;
			line-height: inherit;
			text-align: inherit;
			color: transparent;
			pointer-events: none;
			
			/* Outline com blur aplicado apenas ao pseudo-elemento */
			-webkit-text-stroke: 0.5rem var(--theme-background);
			filter: blur(0.04rem);
		}

		/* FALLBACK: text-shadow para browsers que não suportam -webkit-text-stroke */
		@supports not (-webkit-text-stroke: 1px) {
			&::before {
				display: none;
			}
			
			text-shadow:
				-0.5rem -0.5rem 0 var(--theme-background),
				0.5rem -0.5rem 0 var(--theme-background),
				-0.5rem 0.5rem 0 var(--theme-background),
				0.5rem 0.5rem 0 var(--theme-background);
		}

		/* Ajuste especial para títulos */
		&.title-text::before {
			-webkit-text-stroke: 0.7rem var(--theme-background);
			filter: blur(0.06rem);
		}
		
		&.title-text {
			@supports not (-webkit-text-stroke: 1px) {
				text-shadow:
					-0.7rem -0.7rem 0 var(--theme-background),
					0.7rem -0.7rem 0 var(--theme-background),
					-0.7rem 0.7rem 0 var(--theme-background),
					0.7rem 0.7rem 0 var(--theme-background);
			}
		}
	}

	/* Responsividade */
	@media (max-width: 48rem) {
		#welcome {
			max-width: 80%;
		}

		/* TODO: Futuro workflow - reduzir quantidade de nuvens para performance */
		.cloud-asset {
			max-width: 6rem; /* Tamanho mobile duplicado: 3rem → 6rem */
			max-height: 6rem;
		}

		.text-outlined {
			/* Mobile: reduzir intensidade do outline e blur */
			&::before {
				-webkit-text-stroke: 0.3rem var(--theme-background);
				filter: blur(0.03rem);
			}

			&.title-text::before {
				-webkit-text-stroke: 0.4rem var(--theme-background);
				filter: blur(0.04rem);
			}

			/* Fallback mobile para text-shadow */
			@supports not (-webkit-text-stroke: 1px) {
				&::before {
					display: none;
				}
				
				text-shadow:
					-0.3rem -0.3rem 0 var(--theme-background),
					0.3rem -0.3rem 0 var(--theme-background),
					-0.3rem 0.3rem 0 var(--theme-background),
					0.3rem 0.3rem 0 var(--theme-background);

				&.title-text {
					text-shadow:
						-0.4rem -0.4rem 0 var(--theme-background),
						0.4rem -0.4rem 0 var(--theme-background),
						-0.4rem 0.4rem 0 var(--theme-background),
						0.4rem 0.4rem 0 var(--theme-background);
				}
			}
		}
	}

	/* Container da borda - estrutura similar à referência */
	.button-border-container {
		position: relative;
		border-radius: 2rem;
		padding: 3px; /* Largura da borda */
		overflow: hidden; /* Confina o blob à área da borda */
		background: linear-gradient(45deg, 
			rgba(255, 255, 255, 0.15), 
			rgba(255, 255, 255, 0.05),
			rgba(255, 255, 255, 0.15)
		);
		transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Estilo para o botão - agora filho do container */
	:global(.game-start-button) {
		position: relative !important;
		border-radius: 2rem !important;
		padding: 1rem 2rem !important;
		min-width: 12rem !important;
		height: 3rem !important;
		font-weight: 600 !important;
		font-size: 1rem !important;
		letter-spacing: 0.5px !important;
		border: none !important; /* Remove borda, será feita pelo container */
		margin: 0 !important;
		width: 100% !important;
		box-sizing: border-box !important;
		background: var(--mdc-theme-primary) !important;
		transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1) !important;
	}

	/* Blob que segue o mouse - baseado na referência */
	.button-blob {
		position: absolute;
		top: 0;
		left: 0;
		width: 120px;
		height: 120px;
		border-radius: 50%;
		pointer-events: none;
		z-index: -1;
		filter: blur(20px);
		opacity: 0;
		transition: opacity 200ms ease-out;
		/* Cor inicial - será atualizada dinamicamente */
		background: rgba(255, 255, 255, 0.6);
	}

	/* Hover states */
	.button-border-container:hover .button-blob {
		opacity: 1;
	}

	.button-border-container:hover {
		transform: translateY(-2px);
		box-shadow: 
			0 8px 25px rgba(0, 0, 0, 0.15),
			0 0 15px rgba(255, 255, 255, 0.2);
	}

	:global(.game-start-button:active) {
		transform: translateY(0) !important;
	}

	/* Customização do Label do Button */
	:global(.game-start-button .mdc-button__label) {
		position: relative;
		z-index: 2;
		font-weight: 600 !important;
		letter-spacing: 0.5px !important;
	}

	/*
	 * === DOCUMENTAÇÃO DE FUTUROS WORKFLOWS ===
	 * 
	 * 1. SUBCONJUNTOS DE NUVENS:
	 *    - Grupo A: Posição inicial fixa (não pode ser ocultado)
	 *    - Grupo B: Posição aleatória (pode ser ocultado no mobile)
	 *    - Grupo C: Nuvens temáticas/especiais
	 * 
	 * 2. REDIMENSIONAMENTO PROPORCIONAL:
	 *    - Pequenas (2-3rem), Médias (4-5rem), Grandes (6-7rem)
	 *    - Distribuição baseada em peso visual
	 * 
	 * 3. OTIMIZAÇÃO MOBILE:
	 *    - Reduzir quantidade de nuvens ativas
	 *    - Priorizar Grupo A (posição fixa)
	 *    - Intervalos de movimento mais longos
	 * 
	 * 4. EXPANSÃO DE ÁREA DE MOVIMENTO:
	 *    - Permitir movimento além do viewport
	 *    - Integração com outros componentes
	 *    - Sistema de "entrada/saída" de nuvens
	 *    - Área de movimento expandida para acomodar novos componentes
	 */
</style>
