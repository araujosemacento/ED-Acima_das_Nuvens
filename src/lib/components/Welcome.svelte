<script>
	import { m } from '$lib/paraglide/messages.js';
	import Button, { Label } from '@smui/button';
	import { onMount } from 'svelte';
	import { logger } from '$lib/stores/logger.js';
	import { createOutlineThemeObserver, isMobileDevice } from '$lib/utils/textOutline.js';
	import { dev } from '$app/environment';
	import { base } from '$app/paths';

	let mousePosition = $state({ x: 0, y: 0 }); // Posição absoluta do mouse para cálculos vetoriais
	let welcomeSection;
	let glimmerElement;

	// === SISTEMA DE OUTLINE MATEMÁTICO ===
	let outlineObserverCleanup = null;
	let titleElement = null;
	let paragraphElements = [];

	// === SISTEMA DE NUVENS ===
	let cloudAssets = $state([]);
	let cloudControllers = $state(new Map());
	let cloudAnimationIntervals = $state(new Map());

	// Sistema de posicionamento com exclusão de proximidade
	let placementManager = $state(null);

	// Sistema de detecção e reidratação de tema
	let currentTheme = $state('dark');
	let themeObserver = $state(null);

	// Configurações do sistema de nuvens (refatorado)
	const CLOUD_CONFIG = {
		stepDistance: 0.25,
		maxDistance: 5,
		moveInterval: 1000,
		intervalVariation: 250,
		opacity: 0.9,
		placement: {
			minDistance: 3,
			maxAttempts: 50,
			gridCellSize: 2,
			safetyMargin: 0.7
		},
		logging: {
			performanceThrottle: 5000,
			maxLocalLogs: 50,
			useStructuredLogs: true
		},
		themeSystem: {
			observerDebounce: 150,
			preloadAssets: true,
			preserveState: true,
			fallbackTheme: 'dark'
		},
		sizes: {
			fixa: 25,
			grande: 15,
			mediana: 10,
			pequena: 7,
			detalhe: 2.5
		},
		detalheCopies: 8 // máximo de cópias de nuvem detalhe
	};

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
	// Combina logger store (estruturado) + sistema local (performance crítica)
	let localPerformanceLogs = $state([]);
	let lastPerformanceLogTime = 0;

	// Logger híbrido com diferenciação inteligente
	const cloudLogger = {
		// Logs estruturados via logger store (para interface/desenvolvimento)
		structured: {
			init: (data) => logger.actions.component('CloudSystem', 'inicialização', data),
			animation: (action, data) => logger.actions.animation(`cloud-${action}`, data),
			theme: (action, data) => logger.actions.component('CloudSystem', `theme-${action}`, data),
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
					memoryUsage: performance.memory
						? `${(performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB`
						: 'N/A'
				};

				localPerformanceLogs.push(logEntry);

				// Limitar logs locais para controle de memória
				if (localPerformanceLogs.length > CLOUD_CONFIG.logging.maxLocalLogs) {
					localPerformanceLogs.shift();
				}

				// Console log apenas para desenvolvimento
				if (dev) {
					console.log(`🌤️ [CloudPerf] ${message}`, logEntry);
				}
				lastPerformanceLogTime = now;
			}
		},

		// Logs críticos (sempre logados, sem throttle)
		critical: (message, data = {}) => {
			logger.actions.error(`[CRÍTICO] CloudSystem: ${message}`, data);
			if (dev) {
				console.error(`🚨 [CloudSystem] ${message}`, data);
			}
		},

		// Utilitários de memória
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
			this.safeMargin = 2; // rem
			this.gridCellSize = CLOUD_CONFIG.placement.gridCellSize;
			this.occupiedCells = new Set();

			// Calcular dimensões do grid para otimização
			const viewportWidth = window.innerWidth / 16;
			const viewportHeight = window.innerHeight / 16;
			this.gridWidth = Math.ceil(viewportWidth / this.gridCellSize);
			this.gridHeight = Math.ceil(viewportHeight / this.gridCellSize);
		}

		// Calcular distância euclidiana entre duas posições
		calculateDistance(pos1, pos2) {
			const deltaX = pos1.x - pos2.x;
			const deltaY = pos1.y - pos2.y;
			return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		}

		// Verificar se uma posição é válida (não conflita com nuvens existentes)
		isPositionValid(newPosition, minDistance = this.minDistance) {
			return this.placedClouds.every(
				(cloud) => this.calculateDistance(newPosition, cloud.position) >= minDistance
			);
		}

		// Gerar posição válida com múltiplas tentativas
		generateValidPosition(maxAttempts = CLOUD_CONFIG.placement.maxAttempts) {
			const viewportWidth = window.innerWidth / 16;
			const viewportHeight = window.innerHeight / 16;

			for (let attempt = 0; attempt < maxAttempts; attempt++) {
				const position = {
					x: Math.random() * (viewportWidth - this.safeMargin * 2) + this.safeMargin,
					y: Math.random() * (viewportHeight - this.safeMargin * 2) + this.safeMargin
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
			return null; // Não foi possível encontrar posição válida
		}

		// Adicionar nuvem à lista de posicionadas
		addPlacedCloud(cloud) {
			this.placedClouds.push(cloud);
			this.markCellsAsOccupied(cloud.position);
		}

		// Marcar células do grid como ocupadas (otimização)
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

		// Verificar se ainda é matematicamente possível posicionar mais nuvens
		canPlaceMoreClouds(remainingClouds) {
			const viewportWidth = window.innerWidth / 16;
			const viewportHeight = window.innerHeight / 16;
			const viewportArea = viewportWidth * viewportHeight;

			// Área ocupada por cada nuvem (círculo com raio = minDistance)
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

		// Obter estatísticas de posicionamento
		getPlacementStats() {
			const viewportWidth = window.innerWidth / 16;
			const viewportHeight = window.innerHeight / 16;
			const viewportArea = viewportWidth * viewportHeight;
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

		// Reset do sistema (para cleanup)
		reset() {
			this.placedClouds = [];
			this.occupiedCells.clear();
		}
	}

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
			if (this.moveCount % 10 === 0) {
				// Log estruturado a cada 10 movimentos
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
		return ((angleRad * 180) / Math.PI + 360) % 360; // Normalizar para 0-360°
	});

	// === SISTEMA DE DETECÇÃO E REIDRATAÇÃO DE TEMA ===

	// Detector de tema atual baseado nas classes CSS
	function detectCurrentTheme() {
		if (document.documentElement.classList.contains('theme-dark')) return 'dark';
		if (document.documentElement.classList.contains('theme-light')) return 'light';
		return CLOUD_CONFIG.themeSystem.fallbackTheme;
	}

	// Extrair tema atual dos assets (para comparação)
	function getCurrentAssetsTheme() {
		if (!cloudAssets.length) return null;
		const firstAssetSrc = cloudAssets[0].src;
		if (firstAssetSrc.includes('/dark/')) return 'dark';
		if (firstAssetSrc.includes('/light/')) return 'light';
		return null;
	}

	// Reidratação inteligente dos assets (preserva estado)
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

		// Preservar estado atual e apenas trocar URLs dos assets
		const updatedAssets = cloudAssets.map((cloud) => {
			let assetName;
			if (cloud.id.startsWith('nuvem6')) {
				assetName = 'nuvem6.svg';
			} else if (cloud.id.startsWith('nuvem')) {
				assetName = `${cloud.id}.svg`;
			} else {
				assetName = 'nuvem1.svg'; // fallback
			}
			const newSrc = `${base}/assets/nuvens/${newTheme}/SVG/${assetName}`;
			return {
				...cloud,
				src: newSrc
			};
		});

		// Trigger reatividade do Svelte com novo array
		cloudAssets = updatedAssets;

		// Atualizar tema atual
		currentTheme = newTheme;

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

	// Debounce para mudanças de tema (evitar múltiplas execuções)
	let themeChangeTimeout = null;

	function handleThemeChange(mutations) {
		// Limpar timeout anterior se existir
		if (themeChangeTimeout) {
			clearTimeout(themeChangeTimeout);
		}

		// Debounce das mudanças
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

	// Configurar observador de mudanças de tema
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

	// Cleanup do observador de tema
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
	function generateValidPosition() {
		// Usar o placement manager para gerar posição válida
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

		// 1. Renderizar nuvens fixas primeiro, com posicionamento circuncêntrico
		for (const def of CLOUD_DEFS.filter((n) => n.categoria === 'fixa')) {
			let xPerc = def.lado === 'direita' ? (isMobile ? 0.52 : 0.75) : 0;
			let yPerc = isMobile ? 0.92 : 0.8;
			const viewportWidth = window.innerWidth / 16;
			const viewportHeight = window.innerHeight / 16;
			const position = {
				x: viewportWidth * xPerc,
				y: viewportHeight * yPerc
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
			cloudControllers.set(cloud.id, new CloudMovementController(position, cloud.id));
		}

		// 2. Renderizar grandes, medianas, pequenas (respeitando lado preferencial)
		for (const cat of ['grande', 'mediana', 'pequena']) {
			for (const def of CLOUD_DEFS.filter((n) => n.categoria === cat)) {
				let attempts = 0;
				let position = null;
				while (attempts < CLOUD_CONFIG.placement.maxAttempts && !position) {
					attempts++;
					const viewportWidth = window.innerWidth / 16;
					const viewportHeight = window.innerHeight / 16;
					const xMin = def.lado === 'direita' ? viewportWidth * 0.5 : 0;
					const xMax = def.lado === 'direita' ? viewportWidth : viewportWidth * 0.5;
					const x = Math.random() * (xMax - xMin) + xMin;
					const y = Math.random() * (viewportHeight * 0.8) + viewportHeight * 0.1;
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
					cloudControllers.set(cloud.id, new CloudMovementController(position, cloud.id));
				}
			}
		}

		// 3. Renderizar até 8 cópias de nuvem6 (detalhe), alternando orientação, exceto em mobile
		if (!isMobile) {
			let detalheCount = 0;
			let flip = false;
			while (detalheCount < CLOUD_CONFIG.detalheCopies) {
				let attempts = 0;
				let position = null;
				while (attempts < CLOUD_CONFIG.placement.maxAttempts && !position) {
					attempts++;
					const viewportWidth = window.innerWidth / 16;
					const viewportHeight = window.innerHeight / 16;
					const x = Math.random() * viewportWidth;
					const y = Math.random() * (viewportHeight * 0.8) + viewportHeight * 0.1;
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
					cloudControllers.set(cloud.id, new CloudMovementController(position, cloud.id));
					detalheCount++;
					flip = !flip;
				}
			}
		}

		cloudAssets = clouds;
		const finalStats = placementManager.getPlacementStats();
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

			// Configurar observador de mudanças de tema
			setupThemeObserver();

			// === INICIALIZAÇÃO DO SISTEMA DE OUTLINE MATEMÁTICO ===
			// Coletar elementos que precisam de outline
			const outlineElements = [
				{ element: titleElement, preset: 'title' },
				...paragraphElements.map((el) => ({ element: el, preset: 'normal' }))
			].filter((item) => item.element); // Filtrar elementos válidos

			if (outlineElements.length > 0) {
				// Criar observador integrado com sistema de temas (sem função personalizada)
				outlineObserverCleanup = createOutlineThemeObserver(outlineElements);

				logger.actions.component('OutlineSystem', 'inicialização', {
					elementsCount: outlineElements.length,
					isMobile: isMobileDevice(),
					themeIntegration: 'ativo-paleta-ed'
				});
			}

			cloudLogger.structured.init({
				message: 'sistema-inicializado-com-sucesso',
				activeAssets: cloudAssets.length,
				activeControllers: cloudControllers.size,
				themeSystem: 'ativo',
				outlineSystem: 'ativo',
				currentTheme
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
						center: isMobile ? 'rgba(100, 149, 237, 0.2)' : 'rgba(100, 149, 237, 0.3)',
						mid: isMobile ? 'rgba(100, 149, 237, 0.1)' : 'rgba(100, 149, 237, 0.15)',
						outer: isMobile ? 'transparent' : 'rgba(100, 149, 237, 0.075)'
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

				glimmerElement.animate(
					[
						{
							background: `radial-gradient(
                            ${circleSize} circle at ${x}% ${y}%,
                            ${gradientStops}
                        )`
						}
					],
					{
						duration: 333, // ~1/3s para suavidade ideal
						easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
						fill: 'forwards'
					}
				);

				// Manter os valores para responsividade/temas (comentado - não sendo usado)
				// mouseGlimmer = { x, y };
			}

			// Animar glow dos botões - SISTEMA HÍBRIDO ACCENT-BASED
			const buttonContainers = document.querySelectorAll('.button-border-container');
			buttonContainers.forEach((container) => {
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
						Math.pow(event.clientX - centerX, 2) + Math.pow(event.clientY - centerY, 2)
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
					buttonBlob.animate(
						[
							{
								transform: `translate(${relativeX}px, ${relativeY}px)`,
								background: themeColor,
								opacity: proximity > 0.05 ? 1 : 0 // Limiar reduzido para maior sensibilidade
							}
						],
						{
							duration: 150, // Resposta rápida
							easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
							fill: 'forwards'
						}
					);

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

					container.animate(
						[
							{
								background: `linear-gradient(${angleDeg}deg, ${gradientColors})`
							}
						],
						{
							duration: 150,
							easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
							fill: 'forwards'
						}
					);
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
						center: isMobile ? 'rgba(100, 149, 237, 0.2)' : 'rgba(100, 149, 237, 0.3)',
						mid: isMobile ? 'rgba(100, 149, 237, 0.1)' : 'rgba(100, 149, 237, 0.15)',
						outer: isMobile ? 'transparent' : 'rgba(100, 149, 237, 0.075)'
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
				glimmerElement.animate(
					[
						{
							background: `radial-gradient(
                            ${circleSize} circle at 50% 50%,
                            ${gradientStops}
                        )`
						}
					],
					{
						duration: 300,
						easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
						fill: 'forwards'
					}
				);
			}

			// Reset dos botões quando mouse sai da janela
			const buttonContainers = document.querySelectorAll('.button-border-container');
			buttonContainers.forEach((container) => {
				const buttonBlob = container.querySelector('.button-blob');
				if (buttonBlob) {
					buttonBlob.animate(
						[
							{
								opacity: 0,
								transform: 'translate(0, 0)'
							}
						],
						{
							duration: 200,
							easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
							fill: 'forwards'
						}
					);

					// Reset da borda com ângulo neutro
					container.animate(
						[
							{
								background: `linear-gradient(45deg, 
                                rgba(255, 255, 255, 0.15), 
                                rgba(255, 255, 255, 0.05),
                                rgba(255, 255, 255, 0.15)
                            )`
							}
						],
						{
							duration: 300,
							easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
							fill: 'forwards'
						}
					);
				}
			});

			// Reset para estado inicial (comentado - não sendo usado)
			// mouseGlimmer = { x: 50, y: 50 };
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
				themeObserverActive: themeObserver !== null,
				outlineObserverActive: outlineObserverCleanup !== null,
				memoryStats: cloudLogger.getMemoryStats()
			});

			// Limpar observador de outline matemático
			if (outlineObserverCleanup) {
				outlineObserverCleanup();
				outlineObserverCleanup = null;
				logger.actions.component('OutlineSystem', 'cleanup', { status: 'concluído' });
			}

			// Limpar observador de tema
			cleanupThemeObserver();

			// Limpar todos os intervalos de animação
			cloudAnimationIntervals.forEach((interval, cloudId) => {
				clearInterval(interval);
				cloudLogger.structured.debug('intervalo-limpo', { cloudId });
			});
			cloudAnimationIntervals.clear();

			// Limpar controladores
			cloudControllers.clear();
			cloudAssets = [];

			// Reset do placement manager
			if (placementManager) {
				placementManager.reset();
				placementManager = null;
			}

			// Reset das variáveis de tema
			currentTheme = CLOUD_CONFIG.themeSystem.fallbackTheme;

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
				class="cloud-asset cloud-{cloud.categoria}"
				style="transform: translate({cloud.position.x}rem, {cloud.position.y}rem){cloud.flip
					? ' scaleX(-1)'
					: ''}; max-width: {CLOUD_CONFIG.sizes[cloud.categoria]}rem; max-height: {CLOUD_CONFIG
					.sizes[cloud.categoria]}rem;"
				bind:this={cloud.element}
			/>
		{/each}
	</div>

	<!-- Glimmer radial que segue o mouse -->
	<div class="mouse-glimmer" bind:this={glimmerElement}></div>

	<!-- Conteúdo principal -->
	<div class="welcome-content">
		<div class="text-container">
			<h1
				class="theme-text-transition text-outlined title-text"
				data-text="{m.welcome()}!"
				bind:this={titleElement}
			>
				{m.welcome()}!
			</h1>
		</div>
		<div class="disclaimer-text">
			<div class="text-container">
				<p
					class="theme-text-transition text-outlined"
					data-text={m.initial_disclaimer_paragraph1()}
					bind:this={paragraphElements[0]}
				>
					{m.initial_disclaimer_paragraph1()}
				</p>
			</div>
			<div class="text-container">
				<p
					class="theme-text-transition text-outlined"
					data-text={m.initial_disclaimer_paragraph2()}
					bind:this={paragraphElements[1]}
				>
					{m.initial_disclaimer_paragraph2()}
				</p>
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
			300px circle at 50% 50%,
			/* Posição inicial centralizada */ rgba(255, 255, 255, 0.06) 0%,
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
		left: -50%; /* Para cobrir toda a largura do viewport */
		width: 100%;
		height: 100%;
		z-index: -10; /* Abaixo do outline dos textos (z-index: -1) */
		pointer-events: none;
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
		color: var(--ed-text, var(--mdc-theme-text-primary-on-background));

		/* 
         * SISTEMA HÍBRIDO DE PERFORMANCE OTIMIZADA:
         * 
         * OUTLINE: CSS transitions via --outline-color variable
         * - Usa CSS custom property --outline-color para transições automáticas
         * - text-shadow aplicado via JavaScript usando var(--outline-color)
         * - CSS transition gerencia mudanças de tema (muito mais performático)
         * 
         * TEXTO: Interpolação suave mantida para cores sólidas
         * - Continua usando sistema de interpolação do theme.js
         * - Transições suaves apenas para propriedades simples (color, background)
         * 
         * Vantagens do sistema híbrido:
         * - Outline: CSS transitions >> interpolação de múltiplas sombras
         * - Responsivo por padrão (unidades em)
         * - Outline sutil e elegante 
         * - Performance maximizada
         */

		/* CSS Transition para --outline-color (performance otimizada) */
		transition:
			color 300ms cubic-bezier(0.4, 0, 0.2, 1),
			--outline-color 300ms cubic-bezier(0.4, 0, 0.2, 1);
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

		/* 
         * OUTLINE RESPONSIVO: Tratado automaticamente pelo sistema JavaScript
         * - Mobile: radius reduzido (5px normal, 6px title)
         * - Desktop: radius padrão (8px normal, 11px title)
         * - Detecção automática via viewport width
         */
	}

	/* Container da borda - estrutura similar à referência */
	.button-border-container {
		position: relative;
		border-radius: 2rem;
		padding: 3px; /* Largura da borda */
		overflow: hidden; /* Confina o blob à área da borda */
		background: linear-gradient(
			45deg,
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
