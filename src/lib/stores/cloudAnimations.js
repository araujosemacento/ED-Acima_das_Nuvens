import { writable } from 'svelte/store';
import { tick } from 'svelte';
import { logger } from './logger.js';

/**
 * Store para gerenciar animações de nuvens no projeto ED | Acima das Nuvens
 */
class CloudAnimationsStore {
    constructor() {
        // Estado interno da store
        this.store = writable({
            isActive: true,
            elements: new Map(),
            animations: new Map(),
            config: {
                stepDuration: 200, // ms por step (efeito choppy)
                minSteps: 15,
                maxSteps: 25,
                minTotalDuration: 8000, // ms
                maxTotalDuration: 20000, // ms
                movementRadius: 60, // pixels de movimento máximo por step
                boundaryMargin: 10 // % de margem das bordas
            }
        });

        // Direções de movimento possíveis (8 direções + parada)
        this.movementDirections = [
            { x: 0, y: 0 },     // parado
            { x: 1, y: 0 },     // direita
            { x: -1, y: 0 },    // esquerda  
            { x: 0, y: 1 },     // baixo
            { x: 0, y: -1 },    // cima
            { x: 1, y: 1 },     // diagonal inferior direita
            { x: 1, y: -1 },    // diagonal superior direita
            { x: -1, y: 1 },    // diagonal inferior esquerda
            { x: -1, y: -1 }    // diagonal superior esquerda
        ];

        // State accessors
        this.elements = new Map();
        this.animations = new Map();
        this.isActive = true;
        this.config = {
            stepDuration: 200,
            minSteps: 15,
            maxSteps: 25,
            minTotalDuration: 8000,
            maxTotalDuration: 20000,
            movementRadius: 60,
            boundaryMargin: 10
        };
    }

    /**
     * Subscribe method para Svelte store compatibility
     */
    subscribe(fn) {
        return this.store.subscribe(fn);
    }

    /**
     * Atualiza o estado interno da store
     */
    updateStore() {
        this.store.set({
            isActive: this.isActive,
            elements: this.elements,
            animations: this.animations,
            config: this.config
        });
    }

    /**
     * Ativa ou desativa as animações
     */
    setActive(active) {
        logger.animation('STORE_SET_ACTIVE', {
            'De': this.isActive,
            'Para': active,
            'Animações': this.animations.size
        });

        this.isActive = active;

        if (active) {
            this.initializeAllAnimations();
        } else {
            this.pauseAllAnimations();
        }

        this.updateStore();
    }

    /**
     * Atualiza configurações das animações
     */
    updateConfig(newConfig) {
        logger.animation('STORE_UPDATE_CONFIG', {
            'Função': 'updateConfig',
            'Config anterior': this.config,
            'Nova config': newConfig
        });

        this.config = { ...this.config, ...newConfig };
        this.updateStore();

        // Reinicia animações se estiverem ativas
        if (this.isActive && this.animations.size > 0) {
            this.restartAllAnimations();
        }
    }

    /**
     * Gera posição inicial aleatória respeitando margens
     */
    generateInitialPosition() {
        logger.animation('STORE_GENERATE_POSITION_START', {
            'Função': 'generateInitialPosition',
            'Margem configurada': `${this.config.boundaryMargin}%`
        });

        const position = {
            x: Math.random() * (100 - 2 * this.config.boundaryMargin) + this.config.boundaryMargin,
            y: Math.random() * (100 - 2 * this.config.boundaryMargin) + this.config.boundaryMargin
        };

        logger.animation('STORE_GENERATE_POSITION_COMPLETE', {
            'Posição gerada': `x: ${position.x.toFixed(2)}%, y: ${position.y.toFixed(2)}%`,
            'Dentro dos limites': position.x >= this.config.boundaryMargin &&
                position.x <= (100 - this.config.boundaryMargin) &&
                position.y >= this.config.boundaryMargin &&
                position.y <= (100 - this.config.boundaryMargin)
        });

        return position;
    }

    /**
     * Gera sequência de movimento choppy
     */
    generateMovementSequence(startPos) {
        logger.animation('STORE_SEQUENCE_START', {
            'Função': 'generateMovementSequence',
            'Posição inicial': `x: ${startPos.x.toFixed(2)}%, y: ${startPos.y.toFixed(2)}%`,
            'Config': this.config
        });

        const steps = Math.floor(Math.random() * (this.config.maxSteps - this.config.minSteps + 1)) + this.config.minSteps;
        const sequence = [];
        let currentPos = { ...startPos };

        logger.animation('STORE_SEQUENCE_CONFIG', {
            'Steps calculados': steps,
            'Direções disponíveis': this.movementDirections.length
        });

        for (let i = 0; i < steps; i++) {
            // Escolhe direção aleatória
            const direction = this.movementDirections[Math.floor(Math.random() * this.movementDirections.length)];

            // Calcula nova posição
            const movement = Math.random() * this.config.movementRadius;
            const newPos = {
                x: Math.max(this.config.boundaryMargin,
                    Math.min(100 - this.config.boundaryMargin,
                        currentPos.x + (direction.x * movement / window.innerWidth * 100))),
                y: Math.max(this.config.boundaryMargin,
                    Math.min(100 - this.config.boundaryMargin,
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

        logger.animation('STORE_SEQUENCE_COMPLETE', {
            'Keyframes gerados': sequence.length,
            'Primeiro keyframe': sequence[0]?.transform,
            'Último keyframe': sequence[sequence.length - 1]?.transform,
            'Loop fechado': sequence[sequence.length - 1]?.transform === `translate(${startPos.x}vw, ${startPos.y}vh)`
        });

        return sequence;
    }

    /**
     * Cria animação choppy para um elemento de nuvem
     */
    createChoppyAnimation(element, assetId) {
        logger.animation('STORE_CREATE_ANIMATION', {
            'Função': 'createChoppyAnimation',
            'Asset ID': assetId,
            'Elemento válido': !!element,
            'Tag do elemento': element?.tagName,
            'Classes do elemento': element?.className
        });

        const startPos = this.generateInitialPosition();
        const keyframes = this.generateMovementSequence(startPos);

        // Define posição inicial
        element.style.left = `${startPos.x}vw`;
        element.style.top = `${startPos.y}vh`;

        logger.animation('STORE_INITIAL_POSITION_SET', {
            'Asset ID': assetId,
            'Posição aplicada': `left: ${startPos.x}vw, top: ${startPos.y}vh`,
            'Style aplicado': !!element.style.left
        });

        // Duração aleatória
        const duration = Math.random() * (this.config.maxTotalDuration - this.config.minTotalDuration) + this.config.minTotalDuration;

        // Delay inicial aleatório
        const delay = Math.random() * 5000;

        logger.animation('STORE_ANIMATION_CONFIG_GENERATED', {
            'Asset ID': assetId,
            'Duração': `${duration.toFixed(0)}ms`,
            'Delay': `${delay.toFixed(0)}ms`,
            'Keyframes': keyframes.length,
            'Easing': 'steps(1, end)'
        });

        // Cria animação com Web Animations API
        try {
            const animation = element.animate(keyframes, {
                duration: duration,
                delay: delay,
                iterations: Infinity,
                easing: 'steps(1, end)', // Efeito choppy
                fill: 'both'
            });

            logger.animation('STORE_ANIMATION_CREATED', {
                'Asset ID': assetId,
                'Animação criada': !!animation,
                'Estado da animação': animation.playState,
                'Ready state': animation.ready !== undefined ? 'Suportado' : 'Não suportado'
            });

            this.animations.set(assetId, {
                animation,
                config: { startPos, duration, delay },
                element
            });

            this.updateStore();

            // Verifica se a animação começou
            animation.ready.then(() => {
                logger.animation('STORE_ANIMATION_READY', {
                    'Asset ID': assetId,
                    'Estado': animation.playState,
                    'Tempo atual': animation.currentTime
                });
            }).catch(error => {
                logger.animation('STORE_ANIMATION_ERROR', {
                    'Asset ID': assetId,
                    'Erro': error.message,
                    'Stack': error.stack
                });
            });

            return animation;
        } catch (error) {
            logger.animation('STORE_ANIMATION_CREATION_ERROR', {
                'Asset ID': assetId,
                'Erro': error.message,
                'Stack': error.stack,
                'Keyframes válidos': keyframes.length > 0,
                'Elemento válido': !!element
            });
            return null;
        }
    }

    /**
     * Inicializa animações para todas as nuvens carregadas
     */
    initializeAllAnimations() {
        logger.animation('STORE_INIT_START', {
            'Elementos': this.elements.size,
            'Animações': this.animations.size
        });

        if (this.elements.size === 0) {
            logger.animation('STORE_INIT_NO_ELEMENTS', {
                'Status': 'Nenhum elemento registrado'
            });
            return;
        }

        let animationsCreated = 0;
        let animationsFailed = 0;

        this.elements.forEach((element, assetId) => {
            logger.animation('STORE_INIT_ELEMENT', {
                'Asset ID': assetId,
                'Elemento existe': !!element,
                'No DOM': document.contains(element),
                'Visível': element.offsetParent !== null
            });

            try {
                const animation = this.createChoppyAnimation(element, assetId);
                if (animation) {
                    animationsCreated++;
                    logger.animation('STORE_INIT_SUCCESS', {
                        'ID': assetId,
                        'Estado': animation.playState
                    });
                } else {
                    animationsFailed++;
                    logger.animation('STORE_INIT_FAILED', {
                        'ID': assetId,
                        'Erro': 'Animação null'
                    });
                }
            } catch (error) {
                animationsFailed++;
                logger.animation('STORE_INIT_ERROR', {
                    'ID': assetId,
                    'Erro': error.message
                });
            }
        });

        logger.animation('STORE_INIT_COMPLETE', {
            'Total': this.elements.size,
            'Criadas': animationsCreated,
            'Falhas': animationsFailed,
            'Taxa': `${(animationsCreated / this.elements.size * 100).toFixed(0)}%`
        });

        this.updateStore();
    }

    /**
     * Pausa todas as animações
     */
    pauseAllAnimations() {
        logger.animation('STORE_PAUSE_ALL', {
            'Função': 'pauseAllAnimations',
            'Animações para pausar': this.animations.size
        });

        let pausedCount = 0;
        this.animations.forEach(({ animation }, assetId) => {
            try {
                animation.pause();
                pausedCount++;
                logger.animation('STORE_PAUSE_SUCCESS', {
                    'Asset ID': assetId,
                    'Estado': animation.playState
                });
            } catch (error) {
                logger.animation('STORE_PAUSE_ERROR', {
                    'Asset ID': assetId,
                    'Erro': error.message
                });
            }
        });

        logger.animation('STORE_PAUSE_COMPLETE', {
            'Animações pausadas': pausedCount,
            'Total animações': this.animations.size
        });
    }

    /**
     * Retoma todas as animações
     */
    resumeAllAnimations() {
        logger.animation('STORE_RESUME_ALL', {
            'Função': 'resumeAllAnimations',
            'Animações para retomar': this.animations.size
        });

        let resumedCount = 0;
        this.animations.forEach(({ animation }, assetId) => {
            try {
                animation.play();
                resumedCount++;
                logger.animation('STORE_RESUME_SUCCESS', {
                    'Asset ID': assetId,
                    'Estado': animation.playState
                });
            } catch (error) {
                logger.animation('STORE_RESUME_ERROR', {
                    'Asset ID': assetId,
                    'Erro': error.message
                });
            }
        });

        logger.animation('STORE_RESUME_COMPLETE', {
            'Animações retomadas': resumedCount,
            'Total animações': this.animations.size
        });
    }

    /**
     * Reinicia todas as animações com nova configuração
     */
    restartAllAnimations() {
        logger.animation('STORE_RESTART_ALL', {
            'Função': 'restartAllAnimations',
            'Animações para reiniciar': this.animations.size
        });

        // Cancela animações existentes
        this.cancelAllAnimations();

        // Reinicia com nova configuração
        this.initializeAllAnimations();
    }

    /**
     * Cancela todas as animações
     */
    cancelAllAnimations() {
        logger.animation('STORE_CANCEL_ALL', {
            'Função': 'cancelAllAnimations',
            'Animações para cancelar': this.animations.size
        });

        let canceledCount = 0;
        this.animations.forEach(({ animation }, assetId) => {
            try {
                animation.cancel();
                canceledCount++;
            } catch (error) {
                logger.animation('STORE_CANCEL_ERROR', {
                    'Asset ID': assetId,
                    'Erro': error.message
                });
            }
        });

        this.animations.clear();
        this.updateStore();

        logger.animation('STORE_CANCEL_COMPLETE', {
            'Animações canceladas': canceledCount,
            'Animations map limpo': this.animations.size === 0
        });
    }

    /**
     * Registra um elemento de nuvem para animação
     */
    async registerElement(element, assetId) {
        logger.animation('STORE_REGISTER_ELEMENT', {
            'Função': 'registerElement',
            'Asset ID': assetId,
            'Elemento existe': !!element,
            'Tag do elemento': element?.tagName,
            'Classes': element?.className,
            'Parent': element?.parentElement?.tagName
        });

        // Aguarda um tick para garantir que o elemento está renderizado
        await tick();

        logger.animation('STORE_REGISTER_AFTER_TICK', {
            'Asset ID': assetId,
            'No DOM': document.contains(element),
            'Visível': element.offsetParent !== null,
            'Dimensões': {
                width: element.offsetWidth,
                height: element.offsetHeight
            }
        });

        this.elements.set(assetId, element);
        this.updateStore();

        logger.animation('STORE_REGISTER_SUCCESS', {
            'Asset ID': assetId,
            'Total elementos registrados': this.elements.size,
            'IDs atuais': Array.from(this.elements.keys())
        });

        // Se as animações estiverem ativas, inicia animação imediatamente
        if (this.isActive) {
            logger.animation('STORE_REGISTER_IMMEDIATE_ANIMATION', {
                'Asset ID': assetId,
                'Store ativa': true,
                'Iniciando animação': true
            });

            try {
                const animation = this.createChoppyAnimation(element, assetId);
                if (animation) {
                    logger.animation('STORE_REGISTER_ANIMATION_SUCCESS', {
                        'Asset ID': assetId,
                        'Estado': animation.playState
                    });
                } else {
                    logger.animation('STORE_REGISTER_ANIMATION_FAILED', {
                        'Asset ID': assetId,
                        'Erro': 'createChoppyAnimation retornou null'
                    });
                }
            } catch (error) {
                logger.animation('STORE_REGISTER_ANIMATION_ERROR', {
                    'Asset ID': assetId,
                    'Erro': error.message,
                    'Stack': error.stack
                });
            }
        } else {
            logger.animation('STORE_REGISTER_INACTIVE', {
                'Asset ID': assetId,
                'Store ativa': false,
                'Animação adiada': true
            });
        }
    }

    /**
     * Remove um elemento de nuvem
     */
    unregisterElement(assetId) {
        logger.animation('STORE_UNREGISTER_ELEMENT', {
            'Asset ID': assetId,
            'Removendo elemento': true
        });

        this.elements.delete(assetId);

        // Para a animação se existir
        const animationData = this.animations.get(assetId);
        if (animationData) {
            animationData.animation.cancel();
            this.animations.delete(assetId);

            logger.animation('STORE_UNREGISTER_SUCCESS', {
                'Asset ID': assetId,
                'Animação cancelada': true,
                'Elementos restantes': this.elements.size
            });
        }

        this.updateStore();
    }

    /**
     * Limpa todos os elementos e animações
     */
    cleanup() {
        logger.animation('STORE_CLEANUP', {
            'Função': 'cleanup',
            'Animações para cancelar': this.animations.size,
            'Elementos para limpar': this.elements.size
        });

        this.cancelAllAnimations();
        this.elements.clear();
        this.updateStore();

        logger.animation('STORE_CLEANUP_COMPLETE', {
            'Maps limpos': this.animations.size === 0 && this.elements.size === 0
        });
    }
}

// Instância singleton da store
export const cloudAnimationsStore = new CloudAnimationsStore();

/**
 * Action para uso fácil em componentes Svelte
 */
export function registerCloudElement(node, assetId) {
    // Registra o elemento
    cloudAnimationsStore.registerElement(node, assetId);

    return {
        destroy() {
            cloudAnimationsStore.unregisterElement(assetId);
        }
    };
}
