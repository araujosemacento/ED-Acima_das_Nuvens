<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import { logger } from '$lib/stores/logger.js';
	import { dev } from '$app/environment';
	import { base } from '$app/paths';

	// Props para configuração externa (Svelte 5 runes)
	let {
		enabled = true,
		opacity = 0.8,
		animationSpeed = 1000,
		cloudDensity = 'normal', // 'low', 'normal', 'high'
		boundaryMode = 'container', // 'viewport', 'container'
		debugMode = false
	} = $props();

	const dispatch = createEventDispatcher();

	// === SISTEMA DE NUVENS ===
	let cloudAssets = $state([]);
	let cloudControllers = $state(new Map());
	let cloudAnimationIntervals = $state(new Map());

	// Sistema de posicionamento com exclusão de proximidade
	let placementManager = $state(null);

	// Sistema de detecção e reidratação de tema
	let currentTheme = $state('dark');
	let themeObserver = $state(null);

	// === SISTEMA DE VIEWPORT RESPONSIVO ===
	let viewportDimensions = $state({ width: 0, height: 0 });
	let isMobile = $derived(viewportDimensions.width <= 768);
	let isTablet = $derived(viewportDimensions.width > 768 && viewportDimensions.width <= 1024);
	let isDesktop = $derived(viewportDimensions.width > 1024);
	let viewportObserver = $state(null);

	// === SISTEMA DE ESTADOS DE TRANSIÇÃO ===
	let gameState = $state('waiting'); // 'waiting', 'transitioning', 'playing'
	let transitionProgress = $state(0); // 0-1 progresso da transição
	let transitionStartTime = $state(null);
	let transitionAnimationFrame = $state(null);

	// Configurações do sistema de nuvens (refatorado e configurável)
	const CLOUD_CONFIG = $derived({
		stepDistance: 0.25,
		maxDistance: 5,
		moveInterval: animationSpeed,
		intervalVariation: Math.min(animationSpeed * 0.25, 250),
		opacity: opacity,
		placement: {
			minDistance: cloudDensity === 'high' ? 2 : cloudDensity === 'low' ? 4 : 3,
			maxAttempts: 50,
			gridCellSize: 2,
			safetyMargin: 0.7
		},
		logging: {
			performanceThrottle: 5000,
			maxLocalLogs: 50,
			useStructuredLogs: debugMode
		},
		themeSystem: {
			observerDebounce: 150,
			preloadAssets: true,
			preserveState: true,
			fallbackTheme: 'dark'
		},
		sizes: {
			fixa: cloudDensity === 'high' ? 30 : cloudDensity === 'low' ? 20 : 25,
			grande: cloudDensity === 'high' ? 18 : cloudDensity === 'low' ? 12 : 15,
			mediana: cloudDensity === 'high' ? 12 : cloudDensity === 'low' ? 8 : 10,
			pequena: cloudDensity === 'high' ? 9 : cloudDensity === 'low' ? 5 : 7,
			detalhe: cloudDensity === 'high' ? 3 : cloudDensity === 'low' ? 2 : 2.5
		},
		detalheCopies: cloudDensity === 'high' ? 12 : cloudDensity === 'low' ? 4 : 8
	});

	// Mapeamento das nuvens por categoria e lado
	const CLOUD_DEFS = [
		{ id: 'nuvem10', categoria: 'fixa', lado: 'direita' },
		{ id: 'nuvem11', categoria: 'fixa', lado: 'esquerda' },
		{ id: 'nuvem13', categoria: 'grande', lado: 'esquerda' },
		{ id: 'nuvem14', categoria: 'grande', lado: 'esquerda' },
		{ id: 'nuvem15', categoria: 'grande', lado: 'esquerda' },
		{ id: 'nuvem12', categoria: 'mediana', lado: 'direita' },
		{ id: 'nuvem16', categoria: 'mediana', lado: 'direita' },
		{ id: 'nuvem17', categoria: 'mediana', lado: 'esquerda' },
		{ id: 'nuvem1', categoria: 'mediana', lado: 'direita' },
		{ id: 'nuvem4', categoria: 'mediana', lado: 'direita' },
		{ id: 'nuvem5', categoria: 'mediana', lado: 'esquerda' },
		{ id: 'nuvem2', categoria: 'pequena', lado: 'esquerda' },
		{ id: 'nuvem3', categoria: 'pequena', lado: 'esquerda' },
		{ id: 'nuvem7', categoria: 'pequena', lado: 'direita' },
		{ id: 'nuvem8', categoria: 'pequena', lado: 'direita' },
		{ id: 'nuvem9', categoria: 'pequena', lado: 'direita' }
		// nuvem6 (detalhe) será tratada separadamente
	];

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
	let localPerformanceLogs = $state([]);
	let lastPerformanceLogTime = 0;

	// Logger híbrido com diferenciação inteligente
	const cloudLogger = {
		structured: {
			init: (data) => {
				if (debugMode) logger.actions.component('CloudLayer', 'inicialização', data);
			},
			animation: (action, data) => {
				if (debugMode) logger.actions.animation(`cloud-${action}`, data);
			},
			theme: (action, data) => {
				if (debugMode) logger.actions.component('CloudLayer', `theme-${action}`, data);
			},
			error: (message, data) => logger.actions.error(`CloudLayer: ${message}`, data),
			debug: (action, data) => {
				if (debugMode) logger.actions.debug(`CloudLayer: ${action}`, data);
			}
		},

		performance: (message, data = {}) => {
			const now = Date.now();
			if (now - lastPerformanceLogTime > CLOUD_CONFIG.logging.performanceThrottle) {
				const logEntry = {
					timestamp: now,
					message,
					data: { ...data },
					memoryUsage: performance.memory
						? `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`
						: 'N/A'
				};

				localPerformanceLogs.push(logEntry);

				if (localPerformanceLogs.length > CLOUD_CONFIG.logging.maxLocalLogs) {
					localPerformanceLogs.shift();
				}

				// Disparar evento de performance
				if (logEntry.memoryUsage !== 'N/A') {
					const memoryMB = parseFloat(logEntry.memoryUsage);
					if (memoryMB > 100) {
						dispatch('performanceAlert', { memoryUsage: memoryMB, message });
					}
				}

				if (dev && debugMode) {
					console.log(`🌤️ [CloudPerf] ${message}`, logEntry);
				}
				lastPerformanceLogTime = now;
			}
		},

		critical: (message, data = {}) => {
			logger.actions.error(`[CRÍTICO] CloudLayer: ${message}`, data);
			if (dev) {
				console.error(`🚨 [CloudLayer] ${message}`, data);
			}
		},

		getMemoryStats: () => ({
			localLogs: localPerformanceLogs.length,
			maxLocalLogs: CLOUD_CONFIG.logging.maxLocalLogs,
			lastPerformanceLog: lastPerformanceLogTime,
			memoryUsage: performance.memory
				? `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`
				: 'N/A'
		}),

		clearLocalLogs: () => {
			localPerformanceLogs = [];
			lastPerformanceLogTime = 0;
		}
	};

	// === SISTEMA DE POSICIONAMENTO COM EXCLUSÃO DE PROXIMIDADE ===
	class CloudPlacementManager {
		constructor() {
			this.placedClouds = [];
			this.minDistance = CLOUD_CONFIG.placement.minDistance;
			this.safeMargin = 2; // porcentagem da viewport
			this.gridCellSize = CLOUD_CONFIG.placement.gridCellSize;
			this.occupiedCells = new Set();

			// Calcular dimensões do grid para otimização (agora em porcentagem)
			this.gridWidth = Math.ceil(100 / this.gridCellSize); // 100% / gridCellSize
			this.gridHeight = Math.ceil(100 / this.gridCellSize); // 100% / gridCellSize
		}

		calculateDistance(pos1, pos2) {
			const deltaX = pos1.x - pos2.x;
			const deltaY = pos1.y - pos2.y;
			return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		}

		isPositionValid(newPosition, minDistance = this.minDistance) {
			return this.placedClouds.every(
				(cloud) => this.calculateDistance(newPosition, cloud.position) >= minDistance
			);
		}

		generateValidPosition(maxAttempts = CLOUD_CONFIG.placement.maxAttempts) {
			// Sistema de coordenadas em porcentagem (0-100)
			for (let attempt = 0; attempt < maxAttempts; attempt++) {
				const position = {
					x: Math.random() * (100 - this.safeMargin * 2) + this.safeMargin, // 2% a 98%
					y: Math.random() * (100 - this.safeMargin * 2) + this.safeMargin // 2% a 98%
				};

				if (this.isPositionValid(position)) {
					cloudLogger.structured.debug('posição-válida-encontrada', {
						position: { x: position.x.toFixed(2), y: position.y.toFixed(2) },
						attempt: attempt + 1,
						totalPlaced: this.placedClouds.length
					});
					return position;
				}
			}

			cloudLogger.structured.debug('posição-válida-não-encontrada', {
				maxAttempts,
				totalPlaced: this.placedClouds.length,
				minDistance: this.minDistance
			});
			return null;
		}

		addPlacedCloud(cloud) {
			this.placedClouds.push(cloud);
			this.markCellsAsOccupied(cloud.position);
		}

		markCellsAsOccupied(position) {
			const radiusInCells = Math.ceil(this.minDistance / this.gridCellSize);
			const centerCellX = Math.floor(position.x / this.gridCellSize);
			const centerCellY = Math.floor(position.y / this.gridCellSize);

			for (let dx = -radiusInCells; dx <= radiusInCells; dx++) {
				for (let dy = -radiusInCells; dy <= radiusInCells; dy++) {
					const cellKey = `${centerCellX + dx},${centerCellY + dy}`;
					this.occupiedCells.add(cellKey);
				}
			}
		}

		canPlaceMoreClouds(remainingClouds) {
			const viewportArea = 100 * 100; // 100% x 100% = 10000 unidades²
			const cloudExclusionArea = Math.PI * Math.pow(this.minDistance, 2);
			const usedArea = this.placedClouds.length * cloudExclusionArea;
			const availableArea = viewportArea - usedArea;
			const requiredArea = remainingClouds * cloudExclusionArea;

			const canPlace = requiredArea <= availableArea * CLOUD_CONFIG.placement.safetyMargin;

			cloudLogger.structured.debug('análise-área-disponível', {
				viewportArea: viewportArea.toFixed(2),
				usedArea: usedArea.toFixed(2),
				availableArea: availableArea.toFixed(2),
				requiredArea: requiredArea.toFixed(2),
				remainingClouds,
				canPlace,
				utilizationPercentage: ((usedArea / viewportArea) * 100).toFixed(1)
			});

			return canPlace;
		}

		getPlacementStats() {
			const viewportArea = 100 * 100; // 100% x 100%
			const cloudExclusionArea = Math.PI * Math.pow(this.minDistance, 2);
			const usedArea = this.placedClouds.length * cloudExclusionArea;

			return {
				placedClouds: this.placedClouds.length,
				minDistance: this.minDistance,
				viewportArea: viewportArea.toFixed(2),
				usedArea: usedArea.toFixed(2),
				utilizationPercentage: ((usedArea / viewportArea) * 100).toFixed(1),
				occupiedCells: this.occupiedCells.size,
				totalCells: this.gridWidth * this.gridHeight
			};
		}

		reset() {
			this.placedClouds = [];
			this.occupiedCells.clear();
		}
	}

	// Controller de movimento para cada nuvem
	class CloudMovementController {
		constructor(initialPosition, cloudId, lado = 'ambos') {
			this.cloudId = cloudId;
			this.lado = lado; // 'esquerda', 'direita', 'ambos'
			this.originalPosition = { ...initialPosition };
			this.currentPosition = { ...initialPosition };
			this.movementHistory = [];
			this.maxDistance = CLOUD_CONFIG.maxDistance;
			this.stepDistance = CLOUD_CONFIG.stepDistance;
			this.moveCount = 0;

			// Sistema de transição
			this.isTransitioning = false;
			this.transitionTarget = null;
			this.transitionStartTime = null;
			this.transitionDuration = 2000; // 2s de duração
			this.transitionStartPosition = null;
			this.preTransitionState = null;
		}

		calculateDistanceFromOrigin() {
			const deltaX = this.currentPosition.x - this.originalPosition.x;
			const deltaY = this.currentPosition.y - this.originalPosition.y;
			return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		}

		getOppositeDirection(directionName) {
			const opposites = {
				UP: DIRECTIONS.DOWN,
				DOWN: DIRECTIONS.UP,
				LEFT: DIRECTIONS.RIGHT,
				RIGHT: DIRECTIONS.LEFT,
				UP_LEFT: DIRECTIONS.DOWN_RIGHT,
				UP_RIGHT: DIRECTIONS.DOWN_LEFT,
				DOWN_LEFT: DIRECTIONS.UP_RIGHT,
				DOWN_RIGHT: DIRECTIONS.UP_LEFT
			};
			return opposites[directionName] || this.getRandomDirection();
		}

		getDirectionTowardsOrigin() {
			const deltaX = this.originalPosition.x - this.currentPosition.x;
			const deltaY = this.originalPosition.y - this.currentPosition.y;

			let direction;
			if (Math.abs(deltaX) > Math.abs(deltaY)) {
				direction = deltaX > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
			} else {
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
			// Se estiver em transição, não usar lógica de movimento normal
			if (this.isTransitioning) {
				return { x: 0, y: 0, name: 'TRANSITION' };
			}

			this.moveCount++;

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

			const randomDir = this.getRandomDirection();
			if (this.moveCount % 10 === 0) {
				cloudLogger.structured.animation('movimento-aleatório', {
					cloudId: this.cloudId,
					direction: randomDir.name,
					moveCount: this.moveCount,
					distance: distanceFromOrigin.toFixed(2)
				});
			}
			return randomDir;
		}

		// === MÉTODOS DE TRANSIÇÃO ===
		startExitTransition(targetPosition) {
			this.preTransitionState = {
				originalPosition: { ...this.originalPosition },
				currentPosition: { ...this.currentPosition },
				movementHistory: [...this.movementHistory],
				moveCount: this.moveCount
			};

			this.isTransitioning = true;
			this.transitionTarget = { ...targetPosition };
			this.transitionStartPosition = { ...this.currentPosition };
			this.transitionStartTime = Date.now();

			cloudLogger.structured.animation('transição-iniciada', {
				cloudId: this.cloudId,
				lado: this.lado,
				from: this.transitionStartPosition,
				to: this.transitionTarget,
				duration: this.transitionDuration
			});
		}

		updateTransitionState(progress) {
			if (!this.isTransitioning || !this.transitionTarget || !this.transitionStartPosition) {
				return;
			}

			// Bezier easing para transição suave (ease-in-out-cubic)
			const easedProgress = this.easeInOutCubic(progress);

			// Interpolação das posições
			this.currentPosition = {
				x:
					this.transitionStartPosition.x +
					(this.transitionTarget.x - this.transitionStartPosition.x) * easedProgress,
				y:
					this.transitionStartPosition.y +
					(this.transitionTarget.y - this.transitionStartPosition.y) * easedProgress
			};
		}

		completeTransition() {
			if (!this.isTransitioning) return;

			// Nova origem = posição final da transição (nas bordas)
			this.originalPosition = { ...this.transitionTarget };
			this.currentPosition = { ...this.transitionTarget };

			// Reset dos estados de transição
			this.isTransitioning = false;
			this.transitionTarget = null;
			this.transitionStartPosition = null;
			this.transitionStartTime = null;

			// Reset do histórico de movimento para novo comportamento
			this.movementHistory = [];
			this.moveCount = 0;

			cloudLogger.structured.animation('transição-concluída', {
				cloudId: this.cloudId,
				newOrigin: this.originalPosition
			});
		}

		rollbackTransition() {
			if (!this.preTransitionState) return;

			this.originalPosition = { ...this.preTransitionState.originalPosition };
			this.currentPosition = { ...this.preTransitionState.currentPosition };
			this.movementHistory = [...this.preTransitionState.movementHistory];
			this.moveCount = this.preTransitionState.moveCount;

			this.isTransitioning = false;
			this.transitionTarget = null;
			this.transitionStartPosition = null;
			this.transitionStartTime = null;
			this.preTransitionState = null;

			cloudLogger.structured.animation('transição-revertida', {
				cloudId: this.cloudId
			});
		}

		// Função de easing cubic-bezier para movimento suave
		easeInOutCubic(t) {
			return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
		}
	}

	// === SISTEMA DE DETECÇÃO E REIDRATAÇÃO DE TEMA ===
	function detectCurrentTheme() {
		if (document.documentElement.classList.contains('theme-dark')) return 'dark';
		if (document.documentElement.classList.contains('theme-light')) return 'light';
		return CLOUD_CONFIG.themeSystem.fallbackTheme;
	}

	function getCurrentAssetsTheme() {
		if (!cloudAssets.length) return null;
		const firstAssetSrc = cloudAssets[0].src;
		if (firstAssetSrc.includes('/dark/')) return 'dark';
		if (firstAssetSrc.includes('/light/')) return 'light';
		return null;
	}

	function rehydrateCloudAssets(newTheme) {
		if (!cloudAssets.length) {
			cloudLogger.structured.debug('reidratação-ignorada-sem-assets', { newTheme });
			return;
		}

		const oldTheme = getCurrentAssetsTheme();
		if (oldTheme === newTheme) {
			cloudLogger.structured.debug('reidratação-ignorada-tema-igual', {
				currentTheme: oldTheme,
				requestedTheme: newTheme
			});
			return;
		}

		cloudLogger.structured.theme('reidratação-iniciada', {
			oldTheme,
			newTheme,
			totalAssets: cloudAssets.length
		});

		const updatedAssets = cloudAssets.map((cloud) => {
			let assetName;
			if (cloud.id.startsWith('nuvem6')) {
				assetName = 'nuvem6.svg';
			} else if (cloud.id.startsWith('nuvem')) {
				assetName = `${cloud.id}.svg`;
			} else {
				assetName = 'nuvem1.svg';
			}
			const newSrc = `${base}/assets/nuvens/${newTheme}/SVG/${assetName}`;
			return {
				...cloud,
				src: newSrc
			};
		});

		cloudAssets = updatedAssets;
		currentTheme = newTheme;

		// Disparar evento de mudança de tema
		dispatch('themeChanged', { newTheme, oldTheme });

		cloudLogger.structured.theme('reidratação-concluída', {
			newTheme,
			assetsAtualizados: updatedAssets.length
		});

		cloudLogger.performance('reidratação-tema', {
			oldTheme,
			newTheme,
			assetsCount: updatedAssets.length,
			preservedControllers: cloudControllers.size,
			preservedIntervals: cloudAnimationIntervals.size
		});
	}

	let themeChangeTimeout = null;

	function handleThemeChange(mutations) {
		if (themeChangeTimeout) {
			clearTimeout(themeChangeTimeout);
		}

		themeChangeTimeout = setTimeout(() => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
					const newTheme = detectCurrentTheme();

					if (newTheme !== currentTheme) {
						cloudLogger.structured.theme('mudança-detectada', {
							oldTheme: currentTheme,
							newTheme,
							trigger: 'mutation-observer'
						});

						rehydrateCloudAssets(newTheme);
					}
				}
			});
		}, CLOUD_CONFIG.themeSystem.observerDebounce);
	}

	function setupThemeObserver() {
		if (themeObserver) {
			themeObserver.disconnect();
		}

		themeObserver = new MutationObserver(handleThemeChange);
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class'],
			attributeOldValue: true
		});

		cloudLogger.structured.theme('observer-configurado', {
			debounce: CLOUD_CONFIG.themeSystem.observerDebounce,
			target: 'document.documentElement'
		});

		return themeObserver;
	}

	function cleanupThemeObserver() {
		if (themeObserver) {
			themeObserver.disconnect();
			themeObserver = null;

			if (themeChangeTimeout) {
				clearTimeout(themeChangeTimeout);
				themeChangeTimeout = null;
			}

			cloudLogger.structured.debug('theme-observer-desconectado');
		}
	}

	// === FUNÇÕES DO SISTEMA DE NUVENS ===

	// Função para calcular posições de saída (parcialmente visíveis nas bordas)
	function calculateExitPosition(cloud) {
		const isDesktop = window.innerWidth > 768;

		// Obter tamanho do asset em porcentagem baseado na categoria
		const getAssetSizePercentage = (categoria) => {
			const sizeInRem = CLOUD_CONFIG.sizes[categoria];
			// Converter rem para porcentagem aproximada da viewport
			// 1rem ≈ 16px, viewport padrão ≈ 1200px desktop / 375px mobile
			const viewportWidth = isDesktop ? 1200 : 375;
			const sizeInPx = sizeInRem * 16;
			return (sizeInPx / viewportWidth) * 100;
		};

		const assetSizePercentage = getAssetSizePercentage(cloud.categoria);

		// Margem fixa de 5% da tela para garantir visibilidade
		const visibilityMargin = 5;

		// Calcular posição baseada na extremidade oposta do asset
		// Para nuvens da esquerda: extremidade direita fica a 5% da borda esquerda
		// Para nuvens da direita: extremidade esquerda fica a 5% da borda direita

		// Variação no eixo Y para movimento mais natural
		const yVariation = (Math.random() - 0.5) * 15; // ±7.5% de variação

		let exitPosition;

		switch (cloud.lado) {
			case 'esquerda':
				// Extremidade direita do asset fica a 5% da borda esquerda
				// Posição do centro = 5% - (metade do tamanho do asset)
				exitPosition = {
					x: visibilityMargin + 5 - assetSizePercentage / 2,
					y: Math.max(5, Math.min(95, cloud.position.y + yVariation))
				};
				break;
			case 'direita':
				// Extremidade esquerda do asset fica a 5% da borda direita
				// Posição do centro = (100% - 5%) + (metade do tamanho do asset)
				exitPosition = {
					x: 85 - visibilityMargin + assetSizePercentage / 2,
					y: Math.max(5, Math.min(95, cloud.position.y + yVariation))
				};
				break;
			case 'ambos': // nuvens detalhe escolhem lado baseado na posição atual
				const goLeft = cloud.position.x < 50;
				if (goLeft) {
					// Vai para esquerda
					exitPosition = {
						x: visibilityMargin - assetSizePercentage / 2,
						y: Math.max(5, Math.min(95, cloud.position.y + yVariation))
					};
				} else {
					// Vai para direita
					exitPosition = {
						x: 100 - visibilityMargin + assetSizePercentage / 2,
						y: Math.max(5, Math.min(95, cloud.position.y + yVariation))
					};
				}
				break;
			default:
				// Fallback: vai para o lado mais próximo
				const defaultGoLeft = cloud.position.x < 50;
				if (defaultGoLeft) {
					exitPosition = {
						x: visibilityMargin - assetSizePercentage / 2,
						y: Math.max(5, Math.min(95, cloud.position.y + yVariation))
					};
				} else {
					exitPosition = {
						x: 100 - visibilityMargin + assetSizePercentage / 2,
						y: Math.max(5, Math.min(95, cloud.position.y + yVariation))
					};
				}
		}

		// Debug log para verificar cálculos
		console.log(`🎯 [PositionCalc] ${cloud.id}:`, {
			categoria: cloud.categoria,
			lado: cloud.lado,
			assetSizeRem: CLOUD_CONFIG.sizes[cloud.categoria],
			assetSizePercentage: assetSizePercentage.toFixed(2) + '%',
			visibilityMargin: visibilityMargin + '%',
			currentPos: `${cloud.position.x.toFixed(1)}%, ${cloud.position.y.toFixed(1)}%`,
			exitPos: `${exitPosition.x.toFixed(1)}%, ${exitPosition.y.toFixed(1)}%`,
			calculation:
				cloud.lado === 'esquerda'
					? `5% - (${assetSizePercentage.toFixed(1)}% / 2) = ${exitPosition.x.toFixed(1)}%`
					: `95% + (${assetSizePercentage.toFixed(1)}% / 2) = ${exitPosition.x.toFixed(1)}%`,
			note: 'Nuvem pode vazar do container com overflow:visible - escala mantida'
		});

		return exitPosition;
	}

	function generateValidPosition() {
		if (!placementManager) {
			cloudLogger.critical('placement-manager-não-inicializado');
			return null;
		}

		const position = placementManager.generateValidPosition();

		if (position) {
			cloudLogger.structured.debug('posição-gerada-com-sucesso', {
				x: position.x.toFixed(2),
				y: position.y.toFixed(2),
				totalPlaced: placementManager.placedClouds.length
			});
		} else {
			cloudLogger.structured.debug('falha-ao-gerar-posição-válida', {
				totalPlaced: placementManager.placedClouds.length,
				minDistance: placementManager.minDistance
			});
		}

		return position;
	}

	function initializeCloudAssets() {
		const detectedTheme = detectCurrentTheme();
		currentTheme = detectedTheme;
		const isMobile = window.innerWidth <= 768;
		placementManager = new CloudPlacementManager();
		cloudLogger.structured.init({ theme: detectedTheme, isMobile });
		const themeFolder = detectedTheme;
		const clouds = [];
		let successfulPlacements = 0;
		let failedPlacements = 0;

		// 1. Renderizar nuvens fixas primeiro (posições em porcentagem)
		for (const def of CLOUD_DEFS.filter((n) => n.categoria === 'fixa')) {
			let xPerc = def.lado === 'direita' ? (isMobile ? 60 : 80) : isMobile ? 2 : 5; // 2%-5% a 60%-80%
			let yPerc = isMobile ? 85 : 75; // 75% a 85%
			const position = {
				x: xPerc,
				y: yPerc
			};
			const cloud = {
				id: def.id,
				src: `${base}/assets/nuvens/${themeFolder}/SVG/${def.id}.svg`,
				position,
				element: null,
				categoria: def.categoria,
				lado: def.lado
			};
			clouds.push(cloud);
			placementManager.addPlacedCloud(cloud);
			successfulPlacements++;
			cloudControllers.set(cloud.id, new CloudMovementController(position, cloud.id, def.lado));
		}

		// 2. Renderizar grandes, medianas, pequenas (posições em porcentagem)
		for (const cat of ['grande', 'mediana', 'pequena']) {
			for (const def of CLOUD_DEFS.filter((n) => n.categoria === cat)) {
				let attempts = 0;
				let position = null;
				while (attempts < CLOUD_CONFIG.placement.maxAttempts && !position) {
					attempts++;
					// Sistema de coordenadas em porcentagem (0-100)
					const xMin = def.lado === 'direita' ? 50 : 0; // 0% a 50% ou 50% a 100%
					const xMax = def.lado === 'direita' ? 100 : 50;
					const x = Math.random() * (xMax - xMin) + xMin;
					const y = Math.random() * 80 + 10; // 10% a 80%
					const candidate = { x, y };
					if (placementManager.isPositionValid(candidate)) {
						position = candidate;
					}
				}
				if (position) {
					const cloud = {
						id: def.id,
						src: `${base}/assets/nuvens/${themeFolder}/SVG/${def.id}.svg`,
						position,
						element: null,
						categoria: def.categoria,
						lado: def.lado
					};
					clouds.push(cloud);
					placementManager.addPlacedCloud(cloud);
					successfulPlacements++;
					cloudControllers.set(cloud.id, new CloudMovementController(position, cloud.id, def.lado));
				} else {
					failedPlacements++;
				}
			}
		}

		// 3. Renderizar até N cópias de nuvem6 (detalhe), exceto em mobile
		if (!isMobile) {
			let detalheCount = 0;
			let flip = false;
			while (detalheCount < CLOUD_CONFIG.detalheCopies) {
				let attempts = 0;
				let position = null;
				while (attempts < CLOUD_CONFIG.placement.maxAttempts && !position) {
					attempts++;
					// Sistema de coordenadas em porcentagem (0-100) para toda a viewport
					const x = Math.random() * 100; // 0% a 100% (cobertura total)
					const y = Math.random() * 80 + 5; // 5% a 85%
					const candidate = { x, y };
					if (placementManager.isPositionValid(candidate)) {
						position = candidate;
					}
				}
				if (position) {
					const cloud = {
						id: `nuvem6-${detalheCount}`,
						src: `${base}/assets/nuvens/${themeFolder}/SVG/nuvem6.svg`,
						position,
						element: null,
						categoria: 'detalhe',
						lado: 'ambos',
						flip: flip
					};
					clouds.push(cloud);
					placementManager.addPlacedCloud(cloud);
					successfulPlacements++;
					cloudControllers.set(cloud.id, new CloudMovementController(position, cloud.id, 'ambos'));
					detalheCount++;
					flip = !flip;
				} else {
					failedPlacements++;
					break; // Evitar loop infinito se não conseguir colocar mais nuvens
				}
			}
		}

		cloudAssets = clouds;
		const finalStats = placementManager.getPlacementStats();

		// DEBUG: Verificar se cloudAssets foi populado
		console.log('🔍 [DEBUG] cloudAssets criado:', {
			totalClouds: clouds.length,
			cloudIds: clouds.map((c) => c.id),
			firstCloudSrc: clouds[0]?.src || 'N/A',
			coordinateSystem: 'percentage-based',
			samplePositions: clouds
				.slice(0, 3)
				.map((c) => ({ id: c.id, x: c.position.x + '%', y: c.position.y + '%' }))
		});

		// Disparar evento de sistema pronto
		dispatch('cloudSystemReady', {
			stats: finalStats,
			successfulPlacements,
			failedPlacements,
			theme: themeFolder
		});

		cloudLogger.structured.init({
			message: 'posicionamento-concluído',
			successfulPlacements,
			failedPlacements,
			totalAttempted: clouds.length,
			theme: themeFolder,
			placementStats: finalStats
		});

		cloudLogger.performance('posicionamento-final', {
			...finalStats,
			successfulPlacements,
			failedPlacements
		});
	}

	function startCloudAnimations() {
		cloudLogger.structured.animation('início-animações', {
			baseInterval: CLOUD_CONFIG.moveInterval,
			intervalVariation: CLOUD_CONFIG.intervalVariation,
			totalClouds: cloudAssets.length
		});

		cloudAssets.forEach((cloud, index) => {
			const baseInterval = CLOUD_CONFIG.moveInterval;
			const randomOffset = (Math.random() * 2 - 1) * CLOUD_CONFIG.intervalVariation;
			const interval = baseInterval + randomOffset;

			cloudLogger.structured.debug('intervalo-configurado', {
				cloudId: cloud.id,
				interval: interval.toFixed(0),
				offset: `${randomOffset > 0 ? '+' : ''}${randomOffset.toFixed(0)}ms`
			});

			const initialDelay = index * 100;

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
		const cloudIndex = cloudAssets.findIndex((c) => c.id === cloudId);

		if (!controller || cloudIndex === -1) {
			cloudLogger.critical('controller-ou-cloud-não-encontrado', { cloudId });
			return;
		}

		const direction = controller.getNextDirection();
		const newPosition = {
			x: controller.currentPosition.x + direction.x * controller.stepDistance,
			y: controller.currentPosition.y + direction.y * controller.stepDistance
		};

		// Durante o jogo (após transição), permitir movimento além do viewport
		// mas com limites expandidos para evitar nuvens muito distantes
		if (gameState === 'playing') {
			// Limites expandidos: -20% a 120% para permitir movimento nas bordas
			newPosition.x = Math.max(-20, Math.min(120, newPosition.x));
			newPosition.y = Math.max(-10, Math.min(110, newPosition.y));
		} else {
			// Durante estado inicial, manter dentro do viewport original
			newPosition.x = Math.max(0, Math.min(100, newPosition.x));
			newPosition.y = Math.max(0, Math.min(100, newPosition.y));
		}

		controller.currentPosition = newPosition;
		controller.movementHistory.push(direction.name);

		if (controller.movementHistory.length > 2) {
			controller.movementHistory.shift();
		}

		cloudAssets[cloudIndex].position = { ...newPosition };

		if (controller.moveCount % 20 === 0) {
			cloudLogger.performance('check-performance', {
				activeIntervals: cloudAnimationIntervals.size,
				cloudId: controller.cloudId,
				moveCount: controller.moveCount,
				memoryStats: cloudLogger.getMemoryStats()
			});
		}
	}

	// APIs públicas para controle externo
	export function pauseAnimations() {
		cloudAnimationIntervals.forEach((interval) => {
			clearInterval(interval);
		});
		cloudAnimationIntervals.clear();
		cloudLogger.structured.debug('animações-pausadas');
	}

	export function resumeAnimations() {
		if (cloudAnimationIntervals.size === 0) {
			startCloudAnimations();
			cloudLogger.structured.debug('animações-retomadas');
		}
	}

	// === SISTEMA DE TRANSIÇÃO DAS NUVENS ===
	export function startCloudTransition() {
		if (gameState === 'transitioning') {
			cloudLogger.structured.debug('transição-já-em-andamento');
			return;
		}

		gameState = 'transitioning';
		transitionStartTime = Date.now();
		transitionProgress = 0;

		cloudLogger.structured.animation('transição-global-iniciada', {
			totalClouds: cloudAssets.length,
			gameState: 'waiting -> transitioning'
		});

		// Pausar animações atuais
		pauseAnimations();

		// Calcular e iniciar transições para cada nuvem
		cloudAssets.forEach((cloud) => {
			const controller = cloudControllers.get(cloud.id);
			if (controller) {
				const exitPosition = calculateExitPosition(cloud);
				controller.startExitTransition(exitPosition);

				// Log detalhado da transição para debug
				const assetSizeRem = CLOUD_CONFIG.sizes[cloud.categoria];
				const assetSizePercentage = (() => {
					const isDesktop = window.innerWidth > 768;
					const viewportWidth = isDesktop ? 1200 : 375;
					const sizeInPx = assetSizeRem * 16;
					return (sizeInPx / viewportWidth) * 100;
				})();

				cloudLogger.structured.debug('transição-cloud-configurada', {
					cloudId: cloud.id,
					lado: cloud.lado,
					categoria: cloud.categoria,
					assetSizeRem: assetSizeRem,
					assetSizePercentage: assetSizePercentage.toFixed(2) + '%',
					from: {
						x: controller.currentPosition.x.toFixed(2) + '%',
						y: controller.currentPosition.y.toFixed(2) + '%'
					},
					to: {
						x: exitPosition.x.toFixed(2) + '%',
						y: exitPosition.y.toFixed(2) + '%'
					},
					visibilityCalculation:
						cloud.lado === 'esquerda'
							? `extremidade direita a 5% da borda esquerda`
							: `extremidade esquerda a 5% da borda direita`
				});
			}
		});

		// Iniciar loop de animação
		animateTransition();
	}

	function animateTransition() {
		const elapsed = Date.now() - transitionStartTime;
		const progress = Math.min(elapsed / 2000, 1); // 2s de duração

		// Atualizar progresso global
		transitionProgress = progress;

		// Atualizar posições de todas as nuvens
		cloudAssets.forEach((cloud, index) => {
			const controller = cloudControllers.get(cloud.id);
			if (controller) {
				controller.updateTransitionState(progress);

				// Atualizar posição visual reativa
				cloudAssets[index].position = { ...controller.currentPosition };
			}
		});

		// Continuar animação ou finalizar
		if (progress < 1) {
			transitionAnimationFrame = requestAnimationFrame(animateTransition);
		} else {
			completeTransition();
		}
	}

	function completeTransition() {
		// Cancelar qualquer frame pendente
		if (transitionAnimationFrame) {
			cancelAnimationFrame(transitionAnimationFrame);
			transitionAnimationFrame = null;
		}

		// Redefinir origens e finalizar transições individuais
		cloudAssets.forEach((cloud) => {
			const controller = cloudControllers.get(cloud.id);
			if (controller) {
				controller.completeTransition();
			}
		});

		gameState = 'playing';
		transitionProgress = 1;

		// Reiniciar animações com novos pontos de origem
		startCloudAnimations();

		// Disparar evento de transição completa
		dispatch('cloudTransitionComplete', {
			duration: Date.now() - transitionStartTime,
			cloudsTransitioned: cloudAssets.length,
			newGameState: gameState
		});

		cloudLogger.structured.animation('transição-global-concluída', {
			duration: Date.now() - transitionStartTime,
			cloudsTransitioned: cloudAssets.length,
			gameState: 'transitioning -> playing'
		});
	}

	// Função para reverter transição (caso necessário)
	export function rollbackCloudTransition() {
		if (gameState !== 'transitioning') return;

		// Cancelar animação em andamento
		if (transitionAnimationFrame) {
			cancelAnimationFrame(transitionAnimationFrame);
			transitionAnimationFrame = null;
		}

		// Reverter cada controller
		cloudAssets.forEach((cloud) => {
			const controller = cloudControllers.get(cloud.id);
			if (controller) {
				controller.rollbackTransition();
			}
		});

		gameState = 'waiting';
		transitionProgress = 0;

		// Reiniciar animações normais
		startCloudAnimations();

		cloudLogger.structured.animation('transição-revertida', {
			gameState: 'transitioning -> waiting'
		});
	}

	export function getSystemStats() {
		return {
			cloudCount: cloudAssets.length,
			activeControllers: cloudControllers.size,
			activeAnimations: cloudAnimationIntervals.size,
			currentTheme,
			gameState,
			transitionProgress,
			isTransitioning: gameState === 'transitioning',
			placementStats: placementManager?.getPlacementStats(),
			memoryStats: cloudLogger.getMemoryStats()
		};
	}

	onMount(() => {
		if (!enabled) {
			cloudLogger.structured.debug('sistema-desabilitado-via-prop');
			return;
		}

		cloudLogger.structured.init({
			message: 'montando-cloud-layer',
			timestamp: Date.now(),
			config: {
				enabled,
				opacity,
				animationSpeed,
				cloudDensity,
				boundaryMode,
				debugMode
			}
		});

		try {
			initializeCloudAssets();
			startCloudAnimations();
			setupThemeObserver();

			cloudLogger.structured.init({
				message: 'cloud-layer-inicializada-com-sucesso',
				activeAssets: cloudAssets.length,
				activeControllers: cloudControllers.size,
				themeSystem: 'ativo',
				currentTheme
			});
		} catch (error) {
			cloudLogger.critical('erro-inicialização', {
				error: error.message,
				stack: error.stack
			});
		}

		return () => {
			cloudLogger.structured.debug('iniciando-cleanup-cloud-layer', {
				activeIntervals: cloudAnimationIntervals.size,
				activeControllers: cloudControllers.size,
				themeObserverActive: themeObserver !== null,
				gameState,
				transitionActive: transitionAnimationFrame !== null,
				memoryStats: cloudLogger.getMemoryStats()
			});

			// Cleanup de transição em andamento
			if (transitionAnimationFrame) {
				cancelAnimationFrame(transitionAnimationFrame);
				transitionAnimationFrame = null;
			}

			cleanupThemeObserver();

			cloudAnimationIntervals.forEach((interval, cloudId) => {
				clearInterval(interval);
				cloudLogger.structured.debug('intervalo-limpo', { cloudId });
			});
			cloudAnimationIntervals.clear();

			cloudControllers.clear();
			cloudAssets = [];

			if (placementManager) {
				placementManager.reset();
				placementManager = null;
			}

			// Reset estados de transição
			gameState = 'waiting';
			transitionProgress = 0;
			transitionStartTime = null;

			currentTheme = CLOUD_CONFIG.themeSystem.fallbackTheme;
			cloudLogger.clearLocalLogs();

			cloudLogger.structured.init({
				message: 'cleanup-cloud-layer-concluído',
				finalMemoryStats: cloudLogger.getMemoryStats()
			});
		};
	});
</script>

{#if enabled}
	<div class="cloud-layer" style="opacity: {opacity};">
		<!-- Debug: Total de nuvens = {cloudAssets.length} -->
		{#each cloudAssets as cloud (cloud.id)}
			<img
				src={cloud.src}
				alt="Nuvem decorativa ({cloud.id})"
				class="cloud-asset cloud-{cloud.categoria}"
				style="left: {cloud.position.x}%; top: {cloud.position.y}%; {cloud.flip
					? 'transform: scaleX(-1);'
					: ''} max-width: {CLOUD_CONFIG.sizes[cloud.categoria]}rem; max-height: {CLOUD_CONFIG
					.sizes[cloud.categoria]}rem;"
				bind:this={cloud.element}
				onerror={(e) => {
					console.error('❌ Erro ao carregar imagem:', cloud.src, e);
					cloudLogger.critical('erro-carregamento-imagem', { src: cloud.src, cloudId: cloud.id });
				}}
				onload={(e) => {
					console.log('✅ Imagem carregada:', cloud.src);
				}}
			/>
		{/each}
	</div>
{/if}

<style lang="scss">
	.cloud-layer {
		position: fixed;
		top: -5%;
		left: -10%;
		width: 120%; /* Container ajustado para 110% */
		height: 110%;
		pointer-events: none;
		transition: opacity 300ms cubic-bezier(0.4, 0, 0.2, 1);
		overflow: visible; /* Permitir que nuvens vazem do container sem redimensionar */
	}

	.cloud-asset {
		position: absolute;
		opacity: 0.8;
		pointer-events: none;
		width: auto;
		height: auto;
		transition: none;
		transform-origin: center;
		image-rendering: pixelated;
		image-rendering: -moz-crisp-edges;
		image-rendering: crisp-edges;
		/* Garantir que as nuvens mantenham escala fixa */
		flex-shrink: 0;
		min-width: 0; /* Resetar constraints de width */
		min-height: 0; /* Resetar constraints de height */
		object-fit: none; /* Não redimensionar a imagem */
		/* Forçar dimensões baseadas no max-width/height definido inline */
		box-sizing: content-box;
	}

	.cloud-fixa {
		z-index: 1;
	}
	.cloud-grande {
		z-index: 1;
	}
	.cloud-mediana {
		z-index: 1;
	}
	.cloud-pequena {
		z-index: 1;
	}
	.cloud-detalhe {
		z-index: 0;
	}

	/* Responsividade */
	@media (max-width: 48rem) {
		.cloud-asset {
			max-width: 6rem;
			max-height: 6rem;
		}
	}
</style>
