import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { logger } from './logger.js';

// Tipos de tema disponíveis
export const THEME_TYPES = {
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
};

// Detecta o tema do sistema
function detectSystemTheme() {
    if (!browser) return THEME_TYPES.LIGHT;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemTheme = prefersDark ? THEME_TYPES.DARK : THEME_TYPES.LIGHT;

    logger.theme('DETECT_SYSTEM', {
        'Media query matches': prefersDark,
        'Sistema detectado': systemTheme
    });

    return systemTheme;
}

// Cria o store do tema
function createThemeStore() {
    // Store interno para o tema selecionado pelo usuário
    const userTheme = writable(THEME_TYPES.SYSTEM);

    // Store para detectar se o usuário já fez uma escolha manual
    const hasUserInteraction = writable(false);

    // Store reativo para o tema do sistema - inicializado imediatamente
    const systemTheme = writable(browser ? detectSystemTheme() : THEME_TYPES.LIGHT);

    // Inicializar preferência do usuário automaticamente no browser
    if (browser) {
        const stored = localStorage.getItem('theme');
        const hasInteracted = localStorage.getItem('theme-user-interaction') === 'true';

        if (hasInteracted && stored && Object.values(THEME_TYPES).includes(stored)) {
            userTheme.set(stored);
            hasUserInteraction.set(true);
            logger.theme('AUTO_RESTORE_USER_PREFERENCE', {
                'Restored theme': stored
            });
        }
    }

    // Store derivado que determina o tema atual efetivo
    const currentTheme = derived(
        [userTheme, systemTheme, hasUserInteraction],
        ([$userTheme, $systemTheme, $hasUserInteraction]) => {
            let effectiveTheme;

            // Se o usuário escolheu explicitamente um tema (light ou dark) E já interagiu
            if ($hasUserInteraction && ($userTheme === THEME_TYPES.LIGHT || $userTheme === THEME_TYPES.DARK)) {
                effectiveTheme = $userTheme;
            } else {
                // Se escolheu system OU ainda não interagiu, use o tema do sistema detectado
                effectiveTheme = $systemTheme;
            }

            logger.store('currentTheme', 'DERIVED_UPDATE', undefined, {
                'User Theme': $userTheme,
                'System Theme': $systemTheme,
                'Has User Interaction': $hasUserInteraction,
                'Logic used': ($hasUserInteraction && ($userTheme === THEME_TYPES.LIGHT || $userTheme === THEME_TYPES.DARK)) ? 'User explicit choice' : 'System theme',
                'Effective Theme': effectiveTheme
            });

            return effectiveTheme;
        }
    );

    // Aplica o tema ao DOM usando JavaScript puro para transições
    const applyTheme = (theme) => {
        if (!browser) return;

        // Inicia medição de performance da transição
        const transitionId = `theme-${Date.now()}`;
        logger.transition('START', {
            id: transitionId,
            type: 'mudança de tema',
            from: document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light',
            to: theme,
            duration: 300 // Duração esperada para JavaScript
        });

        logger.theme('APPLY_THEME', {
            'Tema solicitado': theme,
            'Browser disponível': browser,
            'Document ready': !!document.documentElement,
            'ID da transição': transitionId,
            'Estratégia': 'JavaScript puro (CSS abandonado)'
        });

        // Remove classes de tema existentes
        const existingClasses = Array.from(document.documentElement.classList)
            .filter(cls => cls.startsWith('theme-'));

        logger.dom('documentElement', 'REMOVE_CLASSES', {
            'Classes removidas': existingClasses
        });

        document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-system');

        // Adiciona a classe do tema atual
        const newClass = `theme-${theme}`;
        document.documentElement.classList.add(newClass);

        logger.dom('documentElement', 'ADD_CLASS', {
            'Nova classe': newClass,
            'Classes atuais': Array.from(document.documentElement.classList)
        });

        // Implementar transição JavaScript pura
        const root = document.documentElement;

        // Obter cores atuais
        const currentBg = getComputedStyle(root).getPropertyValue('--mdc-theme-background').trim();
        const currentSurface = getComputedStyle(root).getPropertyValue('--mdc-theme-surface').trim();
        const currentText = getComputedStyle(root).getPropertyValue('--mdc-theme-on-surface').trim();

        logger.dom('CURRENT_COLORS', 'CAPTURED', {
            'Background atual': currentBg,
            'Surface atual': currentSurface,
            'Texto atual': currentText
        });

        // Definir cores de destino
        const targetColors = theme === THEME_TYPES.DARK ? {
            background: 'hsl(145, 100%, 5%)',
            surface: 'hsl(171, 28%, 10%)',
            text: 'hsl(162, 100%, 90%)',
            primary: 'hsl(162, 100%, 50%)',
            secondary: 'hsl(164, 61%, 50%)'
        } : {
            background: 'hsl(145, 100%, 95%)',
            surface: 'hsl(171, 28%, 90%)',
            text: 'hsl(162, 100%, 10%)',
            primary: 'hsl(162, 100%, 30%)',
            secondary: 'hsl(164, 61%, 30%)'
        };

        logger.dom('TARGET_COLORS', 'DEFINED', {
            'Cores de destino': targetColors,
            'Tema': theme
        });

        // Desabilitar todas as transições CSS temporariamente
        root.style.setProperty('--theme-transition-duration', '0ms');

        // Implementar transição JavaScript suave
        const duration = 300; // ms
        const steps = 60; // 60fps
        const stepDuration = duration / steps;
        let currentStep = 0;

        logger.info(`Iniciando transição JavaScript: ${steps} passos em ${duration}ms`);

        // Função para interpolar cores HSL
        const interpolateHSL = (start, end, progress) => {
            // Parse HSL strings
            const parseHSL = (hsl) => {
                const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
                return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [0, 0, 0];
            };

            const startHSL = parseHSL(start);
            const endHSL = parseHSL(end);

            const h = Math.round(startHSL[0] + (endHSL[0] - startHSL[0]) * progress);
            const s = Math.round(startHSL[1] + (endHSL[1] - startHSL[1]) * progress);
            const l = Math.round(startHSL[2] + (endHSL[2] - startHSL[2]) * progress);

            const result = `hsl(${h}, ${s}%, ${l}%)`;

            // Log interpolação apenas para alguns passos para não sobrecarregar
            if (progress === 0 || progress === 1 || progress % 0.2 < 0.05) {
                logger.colorInterpolation(start, end, progress, result);
            }

            return result;
        };

        // Função de easing
        const easeInOut = (t) => {
            const result = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            // Log easing apenas para alguns pontos chave
            if (t === 0 || t === 0.5 || t === 1) {
                logger.animation('EASING', {
                    'Entrada (t)': t,
                    'Saída (eased)': result,
                    'Tipo': t < 0.5 ? 'aceleração' : 'desaceleração'
                });
            }

            return result;
        };

        logger.animation('START', {
            'Duração total': `${duration}ms`,
            'Passos planejados': steps,
            'FPS esperado': '60fps',
            'Tipo de easing': 'ease-in-out',
            'Cores de origem': { currentBg, currentSurface, currentText },
            'Cores de destino': targetColors
        });

        const animate = () => {
            currentStep++;
            const progress = Math.min(currentStep / steps, 1);
            const easedProgress = easeInOut(progress);

            // Interpolar cores
            const newBg = interpolateHSL(currentBg || 'hsl(145, 100%, 95%)', targetColors.background, easedProgress);
            const newSurface = interpolateHSL(currentSurface || 'hsl(171, 28%, 90%)', targetColors.surface, easedProgress);
            const newText = interpolateHSL(currentText || 'hsl(162, 100%, 10%)', targetColors.text, easedProgress);

            // Aplicar cores interpoladas
            root.style.setProperty('--mdc-theme-background', newBg);
            root.style.setProperty('--mdc-theme-surface', newSurface);
            root.style.setProperty('--mdc-theme-on-surface', newText);
            root.style.setProperty('--mdc-theme-text-primary-on-background', newText);
            root.style.setProperty('--mdc-theme-primary', targetColors.primary);
            root.style.setProperty('--mdc-theme-secondary', targetColors.secondary);
            root.style.setProperty('--theme-current', theme);

            // Log progresso a cada 20%
            if (currentStep % Math.floor(steps / 5) === 0) {
                logger.animation('PROGRESS', {
                    'Progresso linear': `${Math.round(progress * 100)}%`,
                    'Progresso com easing': `${Math.round(easedProgress * 100)}%`,
                    'Passo atual': `${currentStep}/${steps}`,
                    'Background atual': newBg,
                    'Tempo decorrido': `${Math.round(currentStep * stepDuration)}ms`
                });
            }

            if (progress < 1) {
                // Continuar animação
                setTimeout(animate, stepDuration);
            } else {
                // Animação concluída
                logger.animation('COMPLETE', {
                    'Tema final aplicado': theme,
                    'Background final': targetColors.background,
                    'Passos executados': currentStep,
                    'Duração real': `${duration}ms`,
                    'Performance': 'JavaScript puro - 60fps'
                });

                logger.transition('END', {
                    id: transitionId,
                    type: 'mudança de tema (JavaScript puro)',
                    expectedDuration: duration
                });

                // Reativar transições CSS para outros elementos (se necessário)
                root.style.setProperty('--theme-transition-duration', '150ms');
            }
        };

        // Iniciar animação
        animate(); logger.dom('CSS_VARIABLES', 'UPDATE', {
            '--theme-current': root.style.getPropertyValue('--theme-current'),
            'Computed background': getComputedStyle(root).getPropertyValue('--mdc-theme-background'),
            'Applied directly': root.style.getPropertyValue('--mdc-theme-background')
        });

        // Dispara evento customizado para componentes reagirem
        const event = new CustomEvent('theme-changed', {
            detail: { theme, timestamp: Date.now() }
        });
        window.dispatchEvent(event);

        logger.theme('THEME_APPLIED', {
            'Tema final': theme,
            'Evento disparado': true,
            'Timestamp': Date.now()
        });
    };

    // Auto-inicializar no browser
    if (browser) {
        // Configurar listener do sistema imediatamente
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Atualizar tema do sistema quando muda
        const handleSystemChange = () => {
            const newSystemTheme = mediaQuery.matches ? THEME_TYPES.DARK : THEME_TYPES.LIGHT;
            logger.theme('SYSTEM_THEME_AUTO_CHANGED', {
                'New system theme': newSystemTheme,
                'Media query matches': mediaQuery.matches
            });
            systemTheme.set(newSystemTheme);
        };

        mediaQuery.addEventListener('change', handleSystemChange);

        // Aplicar tema automaticamente quando currentTheme muda
        currentTheme.subscribe(theme => {
            logger.theme('AUTO_APPLY_THEME', {
                'Theme to apply': theme
            });
            applyTheme(theme);
        });

        logger.theme('AUTO_INIT_COMPLETE', {
            'Browser detected': true,
            'System theme initialized': true,
            'Auto-apply enabled': true
        });
    }

    return {
        // Stores públicos
        subscribe: currentTheme.subscribe,
        userTheme: { subscribe: userTheme.subscribe },
        systemTheme: { subscribe: systemTheme.subscribe },
        hasUserInteraction: { subscribe: hasUserInteraction.subscribe },

        // Métodos públicos
        setTheme: (theme) => {
            if (!Object.values(THEME_TYPES).includes(theme)) {
                logger.error('Invalid theme provided', { theme, validThemes: THEME_TYPES });
                return;
            }

            logger.theme('SET_THEME_CALLED', {
                'Tema solicitado': theme,
                'Era válido': true
            });

            // Marca que o usuário fez uma interação
            hasUserInteraction.set(true);
            userTheme.set(theme);

            logger.store('hasUserInteraction', 'SET', false, true);
            logger.store('userTheme', 'SET', undefined, theme);

            if (browser) {
                localStorage.setItem('theme', theme);
                localStorage.setItem('theme-user-interaction', 'true');

                logger.info('Theme saved to localStorage', {
                    'theme': theme,
                    'interaction': 'true'
                });
            }
        },

        resetToSystem: () => {
            // Reseta para o comportamento do sistema
            hasUserInteraction.set(false);
            userTheme.set(THEME_TYPES.SYSTEM);

            if (browser) {
                localStorage.removeItem('theme');
                localStorage.removeItem('theme-user-interaction');
            }
        },

        getCurrentTheme: () => {
            let current;
            currentTheme.subscribe(value => current = value)();
            return current;
        }
    };
}

export const themeStore = createThemeStore();
