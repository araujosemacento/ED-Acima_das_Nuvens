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

    // Aplica o tema ao DOM
    const applyTheme = (theme) => {
        if (!browser) return;

        logger.theme('APPLY_THEME', {
            'Tema solicitado': theme,
            'Browser disponível': browser,
            'Document ready': !!document.documentElement
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

        // Força atualização das variáveis CSS customizadas usando apenas CSS Variables
        const root = document.documentElement;

        // ✅ SOLUÇÃO CORRIGIDA: Garante que CSS transitions funcionem ANTES do JavaScript
        const applyThemeWithRealTransition = (newTheme) => {
            // Estratégia 1: Primeiro aplica as classes CSS (que têm transições)
            // As classes CSS já foram aplicadas acima, agora esperamos um frame

            // Estratégia 2: Aguarda um frame para garantir que as transições CSS sejam ativadas
            requestAnimationFrame(() => {
                // Força layout flush antes de aplicar JavaScript
                const computedStyle = getComputedStyle(root);
                const currentBg = computedStyle.getPropertyValue('--mdc-theme-background');

                // Estratégia 3: Aplica propriedades JavaScript APENAS como fallback
                // Mas remove para permitir que CSS funcione primeiro
                logger.dom('TRANSITION_TRIGGER', 'CSS_FIRST_STRATEGY', {
                    'Theme requested': newTheme,
                    'Previous background': currentBg,
                    'Strategy': 'CSS classes first, JS as fallback only'
                });

                // ✅ COMENTADO: Permite que CSS funcione primeiro
                // Apenas mantemos se necessário para compatibilidade SMUI
                if (newTheme === THEME_TYPES.DARK) {
                    root.style.setProperty('--theme-current', 'dark');
                    // Aplicamos APENAS se as classes CSS não estiverem funcionando
                    const computedBg = getComputedStyle(root).getPropertyValue('--mdc-theme-background');
                    if (!computedBg || computedBg === currentBg) {
                        // Fallback apenas se CSS classes falharam
                        root.style.setProperty('--mdc-theme-background', 'hsl(145, 100%, 5%)');
                        root.style.setProperty('--mdc-theme-surface', 'hsl(171, 28%, 10%)');
                        root.style.setProperty('--mdc-theme-on-surface', 'hsl(162, 100%, 90%)');
                        root.style.setProperty('--mdc-theme-text-primary-on-background', 'hsl(162, 100%, 90%)');
                        logger.dom('FALLBACK', 'APPLIED', { reason: 'CSS classes not working' });
                    }
                } else {
                    root.style.setProperty('--theme-current', 'light');
                    // Aplicamos APENAS se as classes CSS não estiverem funcionando
                    const computedBg = getComputedStyle(root).getPropertyValue('--mdc-theme-background');
                    if (!computedBg || computedBg === currentBg) {
                        // Fallback apenas se CSS classes falharam
                        root.style.setProperty('--mdc-theme-background', 'hsl(145, 100%, 95%)');
                        root.style.setProperty('--mdc-theme-surface', 'hsl(171, 28%, 90%)');
                        root.style.setProperty('--mdc-theme-on-surface', 'hsl(162, 100%, 10%)');
                        root.style.setProperty('--mdc-theme-text-primary-on-background', 'hsl(162, 100%, 10%)');
                        logger.dom('FALLBACK', 'APPLIED', { reason: 'CSS classes not working' });
                    }
                }
            });
        };

        // Aplica o tema priorizando CSS transitions
        applyThemeWithRealTransition(theme);

        logger.dom('CSS_VARIABLES', 'UPDATE', {
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
