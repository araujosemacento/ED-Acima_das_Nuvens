import { writable, derived } from 'svelte/store';
import { tweened, spring } from 'svelte/motion';
import { cubicOut, elasticOut, sineInOut } from 'svelte/easing';

/**
 * Store simplificada para animações de nuvens usando Svelte Motion
 * Sistema refatorado usando tweened/spring com SCSS avançado
 */
class CloudMotionStore {
	constructor() {
		// Estado principal da store
		this.state = writable({
			isActive: true,
			animationStyle: 'gentle', // gentle, dynamic, elastic
			globalSpeed: 1.0,
			clouds: new Map()
		});

		// Configurações de animação por estilo
		this.animationConfigs = {
			gentle: {
				duration: 12000,
				easing: sineInOut,
				radius: 40,
				delay: { min: 0, max: 3000 }
			},
			dynamic: {
				duration: 8000,
				easing: cubicOut,
				radius: 80,
				delay: { min: 500, max: 2000 }
			},
			elastic: {
				duration: 15000,
				easing: elasticOut,
				radius: 60,
				delay: { min: 1000, max: 4000 }
			}
		};

		// Estado reativo derivado
		this.isActive = derived(this.state, ($state) => $state.isActive);
		this.currentStyle = derived(this.state, ($state) => $state.animationStyle);
		this.cloudCount = derived(this.state, ($state) => $state.clouds.size);

		// Mapa interno para clouds motions
		this.clouds = new Map();
		this.boundaryConfig = {
			margin: 8, // % de margem das bordas
			safeZone: { x: [10, 90], y: [15, 85] } // Zona segura em %
		};
	}

	/**
	 * Método subscribe para compatibilidade Svelte
	 */
	subscribe(fn) {
		return this.state.subscribe(fn);
	}

	/**
	 * Atualiza estado interno
	 */
	updateState(updates) {
		this.state.update((current) => ({ ...current, ...updates }));
	}

	/**
	 * Gera posição inicial segura
	 */
	generateSafePosition() {
		const { safeZone } = this.boundaryConfig;
		return {
			x: Math.random() * (safeZone.x[1] - safeZone.x[0]) + safeZone.x[0],
			y: Math.random() * (safeZone.y[1] - safeZone.y[0]) + safeZone.y[0]
		};
	}

	/**
	 * Cria motion tweened para uma nuvem
	 */
	createCloudMotion(cloudId, style = 'gentle') {
		const config = this.animationConfigs[style];
		const startPosition = this.generateSafePosition();

		// Cria motion para posição
		const position = tweened(startPosition, {
			duration: config.duration,
			easing: config.easing
		});

		// Cria motion para rotação sutil
		const rotation = tweened(0, {
			duration: config.duration * 2, // Rotação mais lenta
			easing: sineInOut
		});

		// Cria motion para escala (breathing effect)
		const scale = spring(1, {
			stiffness: 0.1,
			damping: 0.8
		});

		// Configuração específica da nuvem
		const cloudConfig = {
			id: cloudId,
			position,
			rotation,
			scale,
			style,
			isAnimating: false,
			config
		};

		this.clouds.set(cloudId, cloudConfig);
		this.updateState({ clouds: new Map(this.clouds) });
		return cloudConfig;
	}

	/**
	 * Inicia animação de floating para uma nuvem
	 */
	async startCloudFloating(cloudId) {
		const cloud = this.clouds.get(cloudId);
		if (!cloud || cloud.isAnimating) return;

		cloud.isAnimating = true;
		const { position, rotation, scale, config } = cloud;

		// Função recursiva para movimento contínuo
		const floatCycle = async () => {
			if (!cloud.isAnimating) return;

			// Gera nova posição aleatória dentro dos limites
			const newPosition = this.generateSafePosition();

			// Adiciona variação ao movimento
			const radiusVariation = config.radius * (0.5 + Math.random() * 0.5);
			newPosition.x = Math.max(
				this.boundaryConfig.safeZone.x[0],
				Math.min(
					this.boundaryConfig.safeZone.x[1],
					newPosition.x + (Math.random() - 0.5) * radiusVariation * 0.1
				)
			);

			// Pequena rotação aleatória
			const newRotation = (Math.random() - 0.5) * 15; // ±15 graus

			// Breathing effect sutil
			const newScale = 0.95 + Math.random() * 0.1; // 0.95 a 1.05

			// Aplica movimentos
			const delay = Math.random() * (config.delay.max - config.delay.min) + config.delay.min;

			setTimeout(async () => {
				if (cloud.isAnimating) {
					await Promise.all([
						position.set(newPosition),
						rotation.set(newRotation),
						scale.set(newScale)
					]);

					// Próximo ciclo
					setTimeout(floatCycle, 100);
				}
			}, delay);
		};

		// Inicia o ciclo
		floatCycle();
	}

	/**
	 * Para animação de uma nuvem específica
	 */
	stopCloudFloating(cloudId) {
		const cloud = this.clouds.get(cloudId);
		if (cloud) cloud.isAnimating = false;
	}

	/**
	 * Registra e inicia animação de uma nuvem
	 */
	async registerCloud(cloudId, element, style = 'gentle') {
		if (!element || element.offsetHeight === 0) return;

		this.createCloudMotion(cloudId, style);
		await new Promise((resolve) => setTimeout(resolve, 50));

		const state = await new Promise((resolve) => {
			const unsubscribe = this.state.subscribe(resolve);
			unsubscribe();
		});

		if (state.isActive) {
			this.startCloudFloating(cloudId);
		}
	}

	/**
	 * Remove nuvem
	 */
	unregisterCloud(cloudId) {
		this.stopCloudFloating(cloudId);
		this.clouds.delete(cloudId);
		this.updateState({ clouds: new Map(this.clouds) });
	}

	/**
	 * Ativa/desativa todas as animações
	 */
	setActive(active) {
		this.updateState({ isActive: active });
		this.clouds.forEach((cloud, cloudId) => {
			if (active) {
				this.startCloudFloating(cloudId);
			} else {
				this.stopCloudFloating(cloudId);
			}
		});
	}

	/**
	 * Muda estilo de animação
	 */
	setAnimationStyle(style) {
		if (!this.animationConfigs[style]) return;

		this.updateState({ animationStyle: style });

		this.clouds.forEach((cloud, cloudId) => {
			cloud.style = style;
			cloud.config = this.animationConfigs[style];

			if (cloud.isAnimating) {
				this.stopCloudFloating(cloudId);
				setTimeout(() => this.startCloudFloating(cloudId), 100);
			}
		});
	}

	/**
	 * Ajusta velocidade global
	 */
	setGlobalSpeed(speed) {
		this.updateState({ globalSpeed: speed });

		this.clouds.forEach((cloud) => {
			const baseDuration = this.animationConfigs[cloud.style].duration;
			const newDuration = baseDuration / speed;
			cloud.position.set(cloud.position, { duration: newDuration });
			cloud.rotation.set(cloud.rotation, { duration: newDuration * 2 });
		});
	}

	/**
	 * Inicializa todas as animações
	 */
	initializeAllAnimations() {
		this.clouds.forEach((cloud, cloudId) => {
			if (!cloud.isAnimating) {
				this.startCloudFloating(cloudId);
			}
		});
	}

	/**
	 * Cleanup completo
	 */
	cleanup() {
		this.clouds.forEach((cloud, cloudId) => {
			this.stopCloudFloating(cloudId);
		});

		this.clouds.clear();
		this.updateState({
			clouds: new Map(),
			isActive: false
		});
	}
}

// Instância singleton
export const cloudMotionStore = new CloudMotionStore();

/**
 * Action Svelte para registro automático
 */
export function registerCloudMotion(node, { cloudId, style = 'gentle' }) {
	cloudMotionStore.registerCloud(cloudId, node, style);

	return {
		update({ cloudId: newCloudId, style: newStyle = 'gentle' }) {
			if (newCloudId !== cloudId) {
				cloudMotionStore.unregisterCloud(cloudId);
				cloudMotionStore.registerCloud(newCloudId, node, newStyle);
			}
		},
		destroy() {
			cloudMotionStore.unregisterCloud(cloudId);
		}
	};
}
