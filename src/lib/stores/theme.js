// Store do tema - Versão dinâmica e responsiva baseada nas melhores práticas do Svelte
import { writable, derived, readable, readonly, get } from 'svelte/store';
import { browser } from '$app/environment';

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
			if (!browser) return;

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
					});
				});

				// Dispara evento customizado otimizado
				window.dispatchEvent(
					new CustomEvent('theme-changed', {
						detail: {
							timestamp: Date.now(),
							performance: performance.now()
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
		if (!browser) return;

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

		// Função de atualização otimizada
		const updateTheme = (event) => {
			const newTheme =
				(event?.matches ?? mediaQuery.matches) ? THEME_TYPES.DARK : THEME_TYPES.LIGHT;
			set(newTheme);
		};

		// Configura listener inicial
		updateTheme();

		// Adiciona listener para mudanças
		mediaQuery.addEventListener('change', updateTheme);

		// Cleanup function (StartStopNotifier)
		return () => {
			mediaQuery.removeEventListener('change', updateTheme);
		};
	});
};

// Sistema de persistência reativo para localStorage
const createThemePersistence = () => {
	const loadSavedTheme = () => {
		if (!browser) return THEME_TYPES.SYSTEM;

		try {
			const saved = localStorage.getItem(THEME_CONFIG.STORAGE_KEY);
			return Object.values(THEME_TYPES).includes(saved) ? saved : THEME_TYPES.SYSTEM;
		} catch {
			return THEME_TYPES.SYSTEM;
		}
	};

	const saveTheme = (theme) => {
		if (!browser) return;

		try {
			if (theme === THEME_TYPES.SYSTEM) {
				localStorage.removeItem(THEME_CONFIG.STORAGE_KEY);
			} else {
				localStorage.setItem(THEME_CONFIG.STORAGE_KEY, theme);
			}
		} catch (error) {
			console.warn('Falha ao salvar tema:', error);
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
		if (!browser || theme === lastAppliedTheme) return;

		const colors = THEME_COLORS.get(theme) || THEME_COLORS.get(THEME_TYPES.DARK);
		const root = document.documentElement;

		// Aplicação em lote para melhor performance
		const cssUpdates = [];

		// Remove e adiciona classes de tema
		root.classList.remove('theme-light', 'theme-dark', 'theme-system');
		root.classList.add(`theme-${theme}`);

		// Atualiza variável de tema atual
		cssUpdates.push(['--theme-current', theme]);

		// Aplica propriedades principais usando o mapa otimizado
		for (const [cssVar, colorKey] of cssPropertyMap) {
			cssUpdates.push([cssVar, colors[colorKey]]);
		}

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

		// Aplica todas as atualizações em lote
		cssUpdates.forEach(([property, value]) => {
			root.style.setProperty(property, value);
		});

		// Força reidratação otimizada
		rehydrationSystem.forceElementsRehydration();

		lastAppliedTheme = theme;
	};

	return { applyTheme };
};

function createThemeStore() {
	// Inicializa sistemas auxiliares
	const rehydrationSystem = createRehydrationSystem();
	const persistence = createThemePersistence();
	const themeApplicator = createThemeApplicator(rehydrationSystem);

	// Store para tema escolhido pelo usuário
	const userTheme = writable(persistence.loadSavedTheme());

	// Store reativo para tema do sistema usando readable com StartStopNotifier
	const systemTheme = createSystemThemeDetector();

	// Store derivado principal - tema efetivo
	const currentTheme = derived([userTheme, systemTheme], ([user, system]) =>
		user === THEME_TYPES.SYSTEM ? system : user
	);

	// Stores derivados granulares para diferentes aspectos
	const isDarkMode = derived(currentTheme, (theme) => theme === THEME_TYPES.DARK);
	const isLightMode = derived(currentTheme, (theme) => theme === THEME_TYPES.LIGHT);
	const isSystemMode = derived(userTheme, (theme) => theme === THEME_TYPES.SYSTEM);
	const themeColors = derived(currentTheme, (theme) => THEME_COLORS.get(theme));

	// Sistema reativo de aplicação automática
	if (browser) {
		// Aplica tema automaticamente quando muda
		currentTheme.subscribe(themeApplicator.applyTheme);

		// Reação a mudanças do tema do usuário para persistência
		userTheme.subscribe(persistence.saveTheme);
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
				if (!Object.values(THEME_TYPES).includes(theme)) {
					console.error('Tema inválido:', theme);
					return false;
				}
				userTheme.set(theme);
				return true;
			},

			resetToSystem: () => {
				userTheme.set(THEME_TYPES.SYSTEM);
			},

			toggleTheme: () => {
				const current = get(currentTheme);
				const next = current === THEME_TYPES.DARK ? THEME_TYPES.LIGHT : THEME_TYPES.DARK;
				userTheme.set(next);
				return next;
			},

			reapplyTheme: () => {
				if (browser) {
					const current = get(currentTheme);
					themeApplicator.applyTheme(current);
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
