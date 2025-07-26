// Store do tema - Versão dinâmica e responsiva baseada nas melhores práticas do Svelte
import { writable, derived, readable, readonly, get } from 'svelte/store';
import { browser } from '$app/environment';
import { logger } from './logger.js';

// Tipos de tema disponíveis - Enum imutável
export const THEME_TYPES = Object.freeze({
	LIGHT: 'light',
	DARK: 'dark',
	SYSTEM: 'system'
});

// Configurações de transição para melhor UX
const THEME_CONFIG = Object.freeze({
	TRANSITION_DURATION: 300,
	REHYDRATION_DELAY: 16, // 1 frame para garantir DOM ready
	STORAGE_KEY: 'theme',
	CRITICAL_SELECTORS: [
		'body',
		'[class*="mdc-"]',
		'[class*="theme-"]',
		'.text-outlined',
		'.game-start-button',
		'.theme-toggle',
		'.welcome-content'
	]
});

// Paleta de cores otimizada - usando Map para melhor performance
const createThemeColors = () =>
	new Map([
		[
			'light',
			Object.freeze({
				// Cores principais
				text: 'hsl(162, 100%, 10%)',
				background: 'hsl(145, 100%, 95%)',
				primary: 'hsl(164, 61%, 50%)',
				secondary: 'hsl(290, 46%, 50%)',
				accent: 'hsl(273, 92%, 50%)',
				surface: 'hsl(171, 28%, 90%)',

				// Text shades
				'text-400': 'hsl(162, 100%, 60%)',
				'text-500': 'hsl(162, 100%, 50%)',
				'text-600': 'hsl(162, 100%, 40%)',
				'text-700': 'hsl(162, 100%, 30%)',

				// Surface variants
				'surface-100': 'hsl(171, 28%, 90%)',
				'surface-200': 'hsl(171, 28%, 80%)'
			})
		],
		[
			'dark',
			Object.freeze({
				// Cores principais (invertidas para tema escuro)
				text: 'hsl(162, 100%, 90%)',
				background: 'hsl(145, 100%, 5%)',
				primary: 'hsl(164, 61%, 50%)',
				secondary: 'hsl(290, 46%, 50%)',
				accent: 'hsl(273, 92%, 50%)',
				surface: 'hsl(171, 28%, 10%)',

				// Text shades (invertidos)
				'text-400': 'hsl(162, 100%, 40%)',
				'text-500': 'hsl(162, 100%, 50%)',
				'text-600': 'hsl(162, 100%, 60%)',
				'text-700': 'hsl(162, 100%, 70%)',

				// Surface variants
				'surface-100': 'hsl(171, 28%, 10%)',
				'surface-200': 'hsl(171, 28%, 20%)'
			})
		]
	]);

const THEME_COLORS = createThemeColors();

// Sistema de reidratação otimizado usando requestAnimationFrame
const createRehydrationSystem = () => {
	let rehydrationFrame = null;

	const scheduleRehydration = (callback) => {
		if (rehydrationFrame) {
			cancelAnimationFrame(rehydrationFrame);
		}
		rehydrationFrame = requestAnimationFrame(callback);
	};

	return {
		forceElementsRehydration: () => {
			if (!browser) {
				logger.actions.theme('Reidratação ignorada', {
					reason: 'não está no browser'
				});
				return;
			}

			const startTime = performance.now();
			let elementsProcessed = 0;

			scheduleRehydration(() => {
				// Força repaint dos elementos críticos de forma mais eficiente
				THEME_CONFIG.CRITICAL_SELECTORS.forEach((selector) => {
					const elements = document.querySelectorAll(selector);
					elements.forEach((element) => {
						// Força recálculo usando transform (mais eficiente que display)
						const originalTransform = element.style.transform;
						element.style.transform = 'translateZ(0)'; // Força layer de hardware
						void element.offsetHeight; // Força reflow
						element.style.transform = originalTransform;
						elementsProcessed++;
					});
				});

				const endTime = performance.now();
				const duration = Math.round(endTime - startTime);

				logger.actions.theme('Reidratação concluída', {
					elementsProcessed,
					selectorsUsed: THEME_CONFIG.CRITICAL_SELECTORS.length,
					duration: `${duration}ms`,
					performance: duration < 5 ? 'excelente' : duration < 16 ? 'boa' : 'lenta'
				});

				// Dispara evento customizado otimizado
				window.dispatchEvent(
					new CustomEvent('theme-changed', {
						detail: {
							timestamp: Date.now(),
							performance: performance.now(),
							elementsProcessed,
							duration
						}
					})
				);
			});
		}
	};
};

// Cria sistema de detecção do tema do sistema usando readable com StartStopNotifier
const createSystemThemeDetector = () => {
	return readable(THEME_TYPES.DARK, (set) => {
		if (!browser) {
			logger.actions.theme('Detector de tema do sistema desabilitado', {
				reason: 'não está no browser'
			});
			return;
		}

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

		logger.actions.theme('Detector de tema do sistema inicializado', {
			initialPreference: mediaQuery.matches ? 'dark' : 'light',
			mediaQuerySupported: true
		});

		// Função de atualização otimizada
		const updateTheme = (event) => {
			const newTheme =
				(event?.matches ?? mediaQuery.matches) ? THEME_TYPES.DARK : THEME_TYPES.LIGHT;

			logger.actions.theme('Tema do sistema detectado', {
				theme: newTheme,
				triggeredBy: event ? 'mudança de preferência' : 'inicialização',
				matches: event?.matches ?? mediaQuery.matches
			});

			set(newTheme);
		};

		// Configura listener inicial
		updateTheme();

		// Adiciona listener para mudanças
		mediaQuery.addEventListener('change', updateTheme);

		// Cleanup function (StartStopNotifier)
		return () => {
			logger.actions.theme('Detector de tema do sistema desconectado', {
				reason: 'cleanup do store'
			});
			mediaQuery.removeEventListener('change', updateTheme);
		};
	});
};

// Sistema de persistência reativo para localStorage
const createThemePersistence = () => {
	const loadSavedTheme = () => {
		if (!browser) {
			logger.actions.theme('Carregamento de tema ignorado', {
				reason: 'não está no browser',
				fallback: THEME_TYPES.SYSTEM
			});
			return THEME_TYPES.SYSTEM;
		}

		try {
			const saved = localStorage.getItem(THEME_CONFIG.STORAGE_KEY);
			const isValid = Object.values(THEME_TYPES).includes(saved);
			const result = isValid ? saved : THEME_TYPES.SYSTEM;

			logger.actions.theme('Tema carregado do localStorage', {
				saved,
				isValid,
				result,
				storageKey: THEME_CONFIG.STORAGE_KEY
			});

			return result;
		} catch (error) {
			logger.actions.error('Erro ao carregar tema do localStorage', {
				error: error.message,
				fallback: THEME_TYPES.SYSTEM
			});
			return THEME_TYPES.SYSTEM;
		}
	};

	const saveTheme = (theme) => {
		if (!browser) {
			logger.actions.theme('Salvamento de tema ignorado', {
				theme,
				reason: 'não está no browser'
			});
			return;
		}

		try {
			if (theme === THEME_TYPES.SYSTEM) {
				localStorage.removeItem(THEME_CONFIG.STORAGE_KEY);
				logger.actions.theme('Tema removido do localStorage', {
					theme,
					action: 'removeItem',
					reason: 'tema system usa detecção automática'
				});
			} else {
				localStorage.setItem(THEME_CONFIG.STORAGE_KEY, theme);
				logger.actions.theme('Tema salvo no localStorage', {
					theme,
					action: 'setItem',
					storageKey: THEME_CONFIG.STORAGE_KEY
				});
			}
		} catch (error) {
			logger.actions.error('Erro ao salvar tema no localStorage', {
				theme,
				error: error.message,
				storageQuota: 'possivelmente excedida'
			});
		}
	};

	return { loadSavedTheme, saveTheme };
};

// Sistema otimizado de aplicação de tema ao DOM
const createThemeApplicator = (rehydrationSystem) => {
	// Cache para evitar reaplicações desnecessárias
	let lastAppliedTheme = null;

	// Mapeamento otimizado de propriedades CSS
	const cssPropertyMap = new Map([
		// Material Design Core
		['--mdc-theme-primary', 'primary'],
		['--mdc-theme-secondary', 'secondary'],
		['--mdc-theme-background', 'background'],
		['--mdc-theme-surface', 'surface'],
		['--mdc-theme-on-primary', 'background'],
		['--mdc-theme-on-secondary', 'background'],
		['--mdc-theme-on-surface', 'text'],
		['--mdc-theme-on-background', 'text'],

		// Aplicação customizada
		['--theme-background', 'background'],
		['--theme-surface', 'surface'],
		['--theme-text', 'text'],
		['--theme-primary', 'primary'],
		['--theme-secondary', 'secondary'],
		['--theme-accent', 'accent']
	]);

	const applyTheme = (theme) => {
		if (!browser || theme === lastAppliedTheme) {
			logger.actions.theme('Aplicação de tema ignorada', {
				theme,
				lastApplied: lastAppliedTheme,
				reason: !browser ? 'não está no browser' : 'tema já aplicado'
			});
			return;
		}

		const startTime = performance.now();
		logger.actions.transition('START', { from: lastAppliedTheme, to: theme });

		const colors = THEME_COLORS.get(theme) || THEME_COLORS.get(THEME_TYPES.DARK);
		const root = document.documentElement;

		// Aplicação em lote para melhor performance
		const cssUpdates = [];

		// Remove e adiciona classes de tema
		const removedClasses = ['theme-light', 'theme-dark', 'theme-system'];
		const addedClass = `theme-${theme}`;

		root.classList.remove(...removedClasses);
		root.classList.add(addedClass);

		logger.actions.theme('Classes CSS atualizadas', {
			removed: removedClasses.join(', '),
			added: addedClass
		});

		// Atualiza variável de tema atual
		cssUpdates.push(['--theme-current', theme]);

		// Aplica propriedades principais usando o mapa otimizado
		for (const [cssVar, colorKey] of cssPropertyMap) {
			cssUpdates.push([cssVar, colors[colorKey]]);
		}

		logger.actions.theme('Propriedades CSS mapeadas', {
			totalProperties: cssUpdates.length,
			theme,
			sampleProperty: cssUpdates[0]?.[0]
		});

		// Material Design - cores de texto específicas por tema
		const textColors =
			theme === THEME_TYPES.DARK
				? {
					'--mdc-theme-text-primary-on-background': 'rgba(255, 255, 255, 0.87)',
					'--mdc-theme-text-secondary-on-background': 'rgba(255, 255, 255, 0.60)',
					'--mdc-theme-text-hint-on-background': 'rgba(255, 255, 255, 0.38)',
					'--mdc-theme-text-disabled-on-background': 'rgba(255, 255, 255, 0.38)',
					'--mdc-theme-text-icon-on-background': 'rgba(255, 255, 255, 0.38)',
					'--mdc-theme-text-primary-on-dark': 'rgba(255, 255, 255, 0.87)',
					'--mdc-theme-text-secondary-on-dark': 'rgba(255, 255, 255, 0.60)',
					'--mdc-theme-text-hint-on-dark': 'rgba(255, 255, 255, 0.38)',
					'--mdc-theme-text-disabled-on-dark': 'rgba(255, 255, 255, 0.38)',
					'--mdc-theme-text-icon-on-dark': 'rgba(255, 255, 255, 0.38)',
					'--icon-filter': 'invert(1)'
				}
				: {
					'--mdc-theme-text-primary-on-background': 'rgba(0, 0, 0, 0.87)',
					'--mdc-theme-text-secondary-on-background': 'rgba(0, 0, 0, 0.60)',
					'--mdc-theme-text-hint-on-background': 'rgba(0, 0, 0, 0.38)',
					'--mdc-theme-text-disabled-on-background': 'rgba(0, 0, 0, 0.38)',
					'--mdc-theme-text-icon-on-background': 'rgba(0, 0, 0, 0.38)',
					'--mdc-theme-text-primary-on-light': 'rgba(0, 0, 0, 0.87)',
					'--mdc-theme-text-secondary-on-light': 'rgba(0, 0, 0, 0.60)',
					'--mdc-theme-text-hint-on-light': 'rgba(0, 0, 0, 0.38)',
					'--mdc-theme-text-disabled-on-light': 'rgba(0, 0, 0, 0.38)',
					'--mdc-theme-text-icon-on-light': 'rgba(0, 0, 0, 0.38)',
					'--icon-filter': 'none'
				};

		// Adiciona cores de texto ao lote
		Object.entries(textColors).forEach(([prop, value]) => {
			cssUpdates.push([prop, value]);
		});

		logger.actions.theme('Cores Material Design aplicadas', {
			themeType: theme === THEME_TYPES.DARK ? 'dark' : 'light',
			materialProperties: Object.keys(textColors).length,
			iconFilter: textColors['--icon-filter']
		});

		// Aplica todas as atualizações em lote
		cssUpdates.forEach(([property, value]) => {
			root.style.setProperty(property, value);
		});

		logger.actions.theme('Variáveis CSS atualizadas', {
			totalUpdates: cssUpdates.length,
			theme,
			sampleUpdates: cssUpdates.slice(0, 3).map(([prop, val]) => `${prop}: ${val}`)
		});

		// Força reidratação otimizada
		rehydrationSystem.forceElementsRehydration();

		const endTime = performance.now();
		const duration = Math.round(endTime - startTime);

		logger.actions.transition('END', {
			theme,
			duration,
			totalCSSUpdates: cssUpdates.length,
			performance: duration < 16 ? 'excelente' : duration < 50 ? 'boa' : 'lenta'
		});

		lastAppliedTheme = theme;
	};

	return { applyTheme };
};

function createThemeStore() {
	logger.actions.store('Inicializando Theme Store', {
		browser,
		availableThemes: Object.values(THEME_TYPES)
	});

	// Inicializa sistemas auxiliares
	const rehydrationSystem = createRehydrationSystem();
	const persistence = createThemePersistence();
	const themeApplicator = createThemeApplicator(rehydrationSystem);

	// Store para tema escolhido pelo usuário
	const initialUserTheme = persistence.loadSavedTheme();
	const userTheme = writable(initialUserTheme);

	logger.actions.store('Store userTheme criado', {
		initialValue: initialUserTheme
	});

	// Store reativo para tema do sistema usando readable com StartStopNotifier
	const systemTheme = createSystemThemeDetector();

	// Store derivado principal - tema efetivo
	const currentTheme = derived([userTheme, systemTheme], ([user, system]) => {
		const result = user === THEME_TYPES.SYSTEM ? system : user;
		logger.actions.store('Theme derivado calculado', {
			userTheme: user,
			systemTheme: system,
			effectiveTheme: result,
			logic: user === THEME_TYPES.SYSTEM ? 'usando sistema' : 'usando preferência'
		});
		return result;
	});

	// Stores derivados granulares para diferentes aspectos
	const isDarkMode = derived(currentTheme, (theme) => theme === THEME_TYPES.DARK);
	const isLightMode = derived(currentTheme, (theme) => theme === THEME_TYPES.LIGHT);
	const isSystemMode = derived(userTheme, (theme) => theme === THEME_TYPES.SYSTEM);
	const themeColors = derived(currentTheme, (theme) => THEME_COLORS.get(theme));

	// Sistema reativo de aplicação automática
	if (browser) {
		logger.actions.store('Configurando reatividade automática', {
			hasCurrentThemeSubscription: true,
			hasUserThemeSubscription: true
		});

		// Aplica tema automaticamente quando muda
		currentTheme.subscribe((theme) => {
			logger.actions.store('Reatividade: currentTheme mudou', { theme });
			themeApplicator.applyTheme(theme);
		});

		// Reação a mudanças do tema do usuário para persistência
		userTheme.subscribe((theme) => {
			logger.actions.store('Reatividade: userTheme mudou', { theme });
			persistence.saveTheme(theme);
		});
	} else {
		logger.actions.store('Reatividade desabilitada', {
			reason: 'não está no browser'
		});
	}

	return {
		// Store principal - apenas leitura para evitar mutações acidentais
		subscribe: readonly(currentTheme).subscribe,

		// Stores derivados granulares - interface mais funcional e responsiva
		isDarkMode: readonly(isDarkMode),
		isLightMode: readonly(isLightMode),
		isSystemMode: readonly(isSystemMode),
		themeColors: readonly(themeColors),

		// Stores específicos - exposição controlada
		userTheme: readonly(userTheme),
		systemTheme: readonly(systemTheme),

		// API funcional otimizada
		actions: {
			setTheme: (theme) => {
				logger.actions.theme('Solicitação de mudança de tema', {
					requestedTheme: theme,
					currentTheme: get(currentTheme),
					userTheme: get(userTheme)
				});

				if (!Object.values(THEME_TYPES).includes(theme)) {
					logger.actions.error('Tema inválido rejeitado', {
						theme,
						validThemes: Object.values(THEME_TYPES)
					});
					return false;
				}

				userTheme.set(theme);

				logger.actions.theme('Tema atualizado com sucesso', {
					newTheme: theme,
					willTriggerReactivity: true
				});

				return true;
			},

			resetToSystem: () => {
				const currentUserTheme = get(userTheme);
				logger.actions.theme('Reset para tema do sistema', {
					from: currentUserTheme,
					to: THEME_TYPES.SYSTEM
				});
				userTheme.set(THEME_TYPES.SYSTEM);
			},

			toggleTheme: () => {
				const current = get(currentTheme);
				const currentUser = get(userTheme);
				const next = current === THEME_TYPES.DARK ? THEME_TYPES.LIGHT : THEME_TYPES.DARK;

				logger.actions.theme('Toggle de tema executado', {
					currentEffective: current,
					currentUser: currentUser,
					next,
					logic: `${current} → ${next}`
				});

				userTheme.set(next);
				return next;
			},

			reapplyTheme: () => {
				if (browser) {
					const current = get(currentTheme);
					logger.actions.theme('Reaplicação forçada de tema', {
						theme: current,
						reason: 'solicitação manual'
					});
					themeApplicator.applyTheme(current);
				} else {
					logger.actions.theme('Reaplicação ignorada', {
						reason: 'não está no browser'
					});
				}
			}
		},

		// Utilities funcionais
		utils: {
			getCurrentTheme: () => get(currentTheme),
			getThemeColors: (theme = null) => {
				const targetTheme = theme || get(currentTheme);
				return THEME_COLORS.get(targetTheme);
			},
			isValidTheme: (theme) => Object.values(THEME_TYPES).includes(theme)
		}
	};
}

export const themeStore = createThemeStore();
