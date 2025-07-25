import { writable, derived } from 'svelte/store';
import { tweened, spring } from 'svelte/motion';
import { cubicOut, elasticOut, sineInOut } from 'svelte/easing';
import { logger } from './logger.js';

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

        logger.animation('MOTION_STORE_INITIALIZED', {
            'Estilos disponíveis': Object.keys(this.animationConfigs),
            'Configuração padrão': this.animationConfigs.gentle,
            'Zona segura': this.boundaryConfig.safeZone
        });
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
        this.state.update(current => ({ ...current, ...updates }));
    }

    /**
     * Gera posição inicial segura
     */
    generateSafePosition() {
        const { safeZone } = this.boundaryConfig;
        const position = {
            x: Math.random() * (safeZone.x[1] - safeZone.x[0]) + safeZone.x[0],
            y: Math.random() * (safeZone.y[1] - safeZone.y[0]) + safeZone.y[0]
        };

        logger.animation('SAFE_POSITION_GENERATED', {
            'Posição': `${position.x.toFixed(1)}%, ${position.y.toFixed(1)}%`,
            'Dentro da zona segura':
                position.x >= safeZone.x[0] && position.x <= safeZone.x[1] &&
                position.y >= safeZone.y[0] && position.y <= safeZone.y[1]
        });

        return position;
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

        logger.animation('CLOUD_MOTION_CREATED', {
            'Cloud ID': cloudId,
            'Estilo': style,
            'Posição inicial': `${startPosition.x.toFixed(1)}%, ${startPosition.y.toFixed(1)}%`,
            'Duração': `${config.duration}ms`,
            'Easing': config.easing.name || 'custom'
        });

        // Atualiza estado da store
        this.updateState({
            clouds: new Map(this.clouds)
        });

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

        logger.animation('CLOUD_FLOATING_START', {
            'Cloud ID': cloudId,
            'Configuração': config
        });

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
        if (cloud) {
            cloud.isAnimating = false;
            logger.animation('CLOUD_FLOATING_STOP', {
                'Cloud ID': cloudId,
                'Estava animando': cloud.isAnimating
            });
        }
    }

    /**
     * Registra e inicia animação de uma nuvem
     */
    async registerCloud(cloudId, element, style = 'gentle') {
        // Verifica se elemento está pronto
        if (!element || element.offsetHeight === 0) {
            logger.animation('CLOUD_REGISTER_SKIP', {
                'Cloud ID': cloudId,
                'Motivo': 'Elemento não pronto',
                'Height': element?.offsetHeight
            });
            return;
        }

        // Cria motion
        this.createCloudMotion(cloudId, style);

        // Aguarda um tick
        await new Promise(resolve => setTimeout(resolve, 50));

        // Inicia animação se store estiver ativa
        const state = await new Promise(resolve => {
            const unsubscribe = this.state.subscribe(resolve);
            unsubscribe();
        });

        if (state.isActive) {
            this.startCloudFloating(cloudId);
        }

        logger.animation('CLOUD_REGISTERED', {
            'Cloud ID': cloudId,
            'Elemento pronto': true,
            'Animação iniciada': state.isActive,
            'Total nuvens': this.clouds.size
        });
    }

    /**
     * Remove nuvem
     */
    unregisterCloud(cloudId) {
        this.stopCloudFloating(cloudId);
        this.clouds.delete(cloudId);

        this.updateState({
            clouds: new Map(this.clouds)
        });

        logger.animation('CLOUD_UNREGISTERED', {
            'Cloud ID': cloudId,
            'Nuvens restantes': this.clouds.size
        });
    }

    /**
     * Ativa/desativa todas as animações
     */
    setActive(active) {
        logger.animation('MOTION_STORE_SET_ACTIVE', {
            'De': this.state.isActive,
            'Para': active,
            'Nuvens afetadas': this.clouds.size
        });

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
        if (!this.animationConfigs[style]) {
            logger.animation('INVALID_STYLE', { style, 'Estilos válidos': Object.keys(this.animationConfigs) });
            return;
        }

        logger.animation('ANIMATION_STYLE_CHANGE', {
            'De': this.currentStyle,
            'Para': style,
            'Nuvens para atualizar': this.clouds.size
        });

        this.updateState({ animationStyle: style });

        // Reaplica o estilo a todas as nuvens
        this.clouds.forEach((cloud, cloudId) => {
            cloud.style = style;
            cloud.config = this.animationConfigs[style];

            // Reinicia animação com novo estilo
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
        logger.animation('GLOBAL_SPEED_CHANGE', {
            'Velocidade anterior': this.state.globalSpeed,
            'Nova velocidade': speed
        });

        this.updateState({ globalSpeed: speed });

        // Atualiza duração de todas as animações
        this.clouds.forEach((cloud) => {
            const baseDuration = this.animationConfigs[cloud.style].duration;
            const newDuration = baseDuration / speed;

            // Atualiza configurações do tweened
            cloud.position.set(cloud.position, { duration: newDuration });
            cloud.rotation.set(cloud.rotation, { duration: newDuration * 2 });
        });
    }

    /**
     * Inicializa todas as animações
     */
    initializeAllAnimations() {
        logger.animation('INITIALIZE_ALL_ANIMATIONS', {
            'Nuvens registradas': this.clouds.size,
            'Store ativa': this.state.isActive
        });

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
        logger.animation('MOTION_STORE_CLEANUP', {
            'Nuvens para limpar': this.clouds.size
        });

        this.clouds.forEach((cloud, cloudId) => {
            this.stopCloudFloating(cloudId);
        });

        this.clouds.clear();
        this.updateState({
            clouds: new Map(),
            isActive: false
        });

        logger.animation('MOTION_STORE_CLEANUP_COMPLETE', {
            'Limpeza finalizada': true
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
