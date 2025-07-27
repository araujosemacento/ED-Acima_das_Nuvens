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
	TRANSITION_DURATION: 100, // Agora usado para interpolação real
	REHYDRATION_DELAY: 16, // 1 frame para garantir DOM ready
	STORAGE_KEY: 'theme',
	INTERPOLATION: {
		ENABLED: true,
		STEPS: 30, // 30 steps para suavidade
		EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
		HSL_PRECISION: 1, // casas decimais para HSL
		FAILSAFE_TIMEOUT: 1000, // timeout para fallback instantâneo
		MAX_CONCURRENT: 20 // máximo de transições simultâneas
	},
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

// Sistema de interpolação suave de cores HSL
const createColorInterpolator = () => {
	let activeAnimations = new Map();
	let animationCounter = 0;

	// Parse HSL string para objeto
	const parseHSL = (hslString) => {
		if (!hslString || typeof hslString !== 'string') return null;

		// Suporte para diferentes formatos: hsl(h,s%,l%) e hsla(h,s%,l%,a)
		const match = hslString.match(
			/hsla?\((\d+(?:\.\d+)?),?\s*(\d+(?:\.\d+)?)%?,?\s*(\d+(?:\.\d+)?)%?(?:,?\s*(\d+(?:\.\d+)?))?\)/
		);
		if (!match) return null;

		return {
			h: parseFloat(match[1]),
			s: parseFloat(match[2]),
			l: parseFloat(match[3]),
			a: match[4] ? parseFloat(match[4]) : 1
		};
	};

	// Interpolação circular otimizada para hue (considera caminho mais curto)
	const interpolateHSL = (from, to, progress) => {
		if (!from || !to) return null;

		// Interpolação circular para hue (0-360°)
		let hDiff = to.h - from.h;
		if (Math.abs(hDiff) > 180) {
			hDiff = hDiff > 0 ? hDiff - 360 : hDiff + 360;
		}

		const eased = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

		return {
			h:
				Math.round((from.h + hDiff * eased) * THEME_CONFIG.INTERPOLATION.HSL_PRECISION) /
				THEME_CONFIG.INTERPOLATION.HSL_PRECISION,
			s:
				Math.round((from.s + (to.s - from.s) * eased) * THEME_CONFIG.INTERPOLATION.HSL_PRECISION) /
				THEME_CONFIG.INTERPOLATION.HSL_PRECISION,
			l:
				Math.round((from.l + (to.l - from.l) * eased) * THEME_CONFIG.INTERPOLATION.HSL_PRECISION) /
				THEME_CONFIG.INTERPOLATION.HSL_PRECISION,
			a: from.a + (to.a - from.a) * eased
		};
	};

	// Converter HSL objeto de volta para string
	const hslToString = (hsl) => {
		if (!hsl) return null;
		return hsl.a !== undefined && hsl.a !== 1
			? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${hsl.a})`
			: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
	};

	// Animar propriedade individual com failsafe
	const animateProperty = (
		property,
		fromColor,
		toColor,
		duration = THEME_CONFIG.TRANSITION_DURATION
	) => {
		return new Promise((resolve) => {
			// Failsafe timeout
			const timeoutId = setTimeout(() => {
				document.documentElement.style.setProperty(property, toColor);
				activeAnimations.delete(property);
				logger.actions.theme('Interpolação timeout - fallback instantâneo', {
					property,
					duration: THEME_CONFIG.INTERPOLATION.FAILSAFE_TIMEOUT
				});
				resolve();
			}, THEME_CONFIG.INTERPOLATION.FAILSAFE_TIMEOUT);

			const fromHSL = parseHSL(fromColor);
			const toHSL = parseHSL(toColor);

			// Fallback instantâneo se parsing falhar
			if (!fromHSL || !toHSL) {
				clearTimeout(timeoutId);
				document.documentElement.style.setProperty(property, toColor);
				logger.actions.theme('Parse HSL falhou - fallback instantâneo', {
					property,
					fromColor,
					toColor
				});
				resolve();
				return;
			}

			// Verificar se cores são iguais
			if (
				fromColor === toColor ||
				(fromHSL.h === toHSL.h && fromHSL.s === toHSL.s && fromHSL.l === toHSL.l)
			) {
				clearTimeout(timeoutId);
				resolve();
				return;
			}

			const animationId = ++animationCounter;
			const startTime = performance.now();
			const stepDuration = duration / THEME_CONFIG.INTERPOLATION.STEPS;

			logger.actions.theme('Iniciando interpolação', {
				property,
				animationId,
				duration,
				steps: THEME_CONFIG.INTERPOLATION.STEPS
			});

			let currentStep = 0;

			const animate = () => {
				const progress = Math.min(currentStep / THEME_CONFIG.INTERPOLATION.STEPS, 1);
				const interpolated = interpolateHSL(fromHSL, toHSL, progress);
				const colorString = hslToString(interpolated);

				if (colorString) {
					document.documentElement.style.setProperty(property, colorString);
				}

				currentStep++;

				if (progress >= 1) {
					clearTimeout(timeoutId);
					activeAnimations.delete(property);

					const totalDuration = performance.now() - startTime;
					logger.actions.theme('Interpolação concluída', {
						property,
						animationId,
						totalDuration: Math.round(totalDuration)
					});

					resolve();
				} else {
					setTimeout(animate, stepDuration);
				}
			};

			activeAnimations.set(property, animationId);
			animate();
		});
	};

	// Cancelar animação específica
	const cancelAnimation = (property) => {
		if (activeAnimations.has(property)) {
			activeAnimations.delete(property);
			logger.actions.theme('Animação cancelada', { property });
		}
	};

	// Cancelar todas as animações
	const cancelAllAnimations = () => {
		const count = activeAnimations.size;
		activeAnimations.clear();
		logger.actions.theme('Todas animações canceladas', { count });
	};

	return {
		animateProperty,
		cancelAnimation,
		cancelAllAnimations,
		getActiveAnimations: () => new Map(activeAnimations),
		isAnimating: (property) => activeAnimations.has(property)
	};
};

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

// Sistema otimizado de aplicação de tema ao DOM com interpolação suave
const createThemeApplicator = (rehydrationSystem) => {
	// Cache para evitar reaplicações desnecessárias
	let lastAppliedTheme = null;

	// Inicializar sistema de interpolação
	const colorInterpolator = createColorInterpolator();

	// Mapeamento expandido de propriedades CSS (incluindo SMUI e variáveis ED)
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

	// Mapeamento completo de variáveis ED (extraído da análise dos arquivos SMUI)
	const edVariablesMap = new Map([
		// Cores principais ED
		['--ed-text', 'text'],
		['--ed-background', 'background'],
		['--ed-primary', 'primary'],
		['--ed-secondary', 'secondary'],
		['--ed-accent', 'accent'],
		['--ed-surface', 'surface'],

		// Shades de texto (50-950)
		['--ed-text-50', 'text-50'],
		['--ed-text-100', 'text-100'],
		['--ed-text-200', 'text-200'],
		['--ed-text-300', 'text-300'],
		['--ed-text-400', 'text-400'],
		['--ed-text-500', 'text-500'],
		['--ed-text-600', 'text-600'],
		['--ed-text-700', 'text-700'],
		['--ed-text-800', 'text-800'],
		['--ed-text-900', 'text-900'],
		['--ed-text-950', 'text-950'],

		// Shades de primary (50-950)
		['--ed-primary-50', 'primary-50'],
		['--ed-primary-100', 'primary-100'],
		['--ed-primary-200', 'primary-200'],
		['--ed-primary-300', 'primary-300'],
		['--ed-primary-400', 'primary-400'],
		['--ed-primary-500', 'primary-500'],
		['--ed-primary-600', 'primary-600'],
		['--ed-primary-700', 'primary-700'],
		['--ed-primary-800', 'primary-800'],
		['--ed-primary-900', 'primary-900'],
		['--ed-primary-950', 'primary-950'],

		// Shades de secondary (50-950)
		['--ed-secondary-50', 'secondary-50'],
		['--ed-secondary-100', 'secondary-100'],
		['--ed-secondary-200', 'secondary-200'],
		['--ed-secondary-300', 'secondary-300'],
		['--ed-secondary-400', 'secondary-400'],
		['--ed-secondary-500', 'secondary-500'],
		['--ed-secondary-600', 'secondary-600'],
		['--ed-secondary-700', 'secondary-700'],
		['--ed-secondary-800', 'secondary-800'],
		['--ed-secondary-900', 'secondary-900'],
		['--ed-secondary-950', 'secondary-950'],

		// Shades de accent (50-950)
		['--ed-accent-50', 'accent-50'],
		['--ed-accent-100', 'accent-100'],
		['--ed-accent-200', 'accent-200'],
		['--ed-accent-300', 'accent-300'],
		['--ed-accent-400', 'accent-400'],
		['--ed-accent-500', 'accent-500'],
		['--ed-accent-600', 'accent-600'],
		['--ed-accent-700', 'accent-700'],
		['--ed-accent-800', 'accent-800'],
		['--ed-accent-900', 'accent-900'],
		['--ed-accent-950', 'accent-950'],

		// Shades de surface (50-950)
		['--ed-surface-50', 'surface-50'],
		['--ed-surface-100', 'surface-100'],
		['--ed-surface-200', 'surface-200'],
		['--ed-surface-300', 'surface-300'],
		['--ed-surface-400', 'surface-400'],
		['--ed-surface-500', 'surface-500'],
		['--ed-surface-600', 'surface-600'],
		['--ed-surface-700', 'surface-700'],
		['--ed-surface-800', 'surface-800'],
		['--ed-surface-900', 'surface-900'],
		['--ed-surface-950', 'surface-950'],

		// Shades de background (50-950)
		['--ed-background-50', 'background-50'],
		['--ed-background-100', 'background-100'],
		['--ed-background-200', 'background-200'],
		['--ed-background-300', 'background-300'],
		['--ed-background-400', 'background-400'],
		['--ed-background-500', 'background-500'],
		['--ed-background-600', 'background-600'],
		['--ed-background-700', 'background-700'],
		['--ed-background-800', 'background-800'],
		['--ed-background-900', 'background-900'],
		['--ed-background-950', 'background-950']
	]);

	const applyTheme = async (theme) => {
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

		// Cancelar animações ativas para evitar conflitos
		colorInterpolator.cancelAllAnimations();

		// Aplicação de classes CSS (instantânea)
		const removedClasses = ['theme-light', 'theme-dark', 'theme-system'];
		const addedClass = `theme-${theme}`;

		root.classList.remove(...removedClasses);
		root.classList.add(addedClass);

		logger.actions.theme('Classes CSS atualizadas', {
			removed: removedClasses.join(', '),
			added: addedClass
		});

		// Coletar cores atuais para interpolação
		const getCurrentColor = (cssVar) => {
			return getComputedStyle(root).getPropertyValue(cssVar).trim();
		};

		// Preparar todas as animações
		const animationPromises = [];
		let totalProperties = 0;

		// Aplicar propriedades principais com interpolação
		if (THEME_CONFIG.INTERPOLATION.ENABLED) {
			// Animar variáveis MDC e theme
			for (const [cssVar, colorKey] of cssPropertyMap) {
				const currentColor = getCurrentColor(cssVar);
				const targetColor = colors[colorKey];

				if (currentColor && targetColor && currentColor !== targetColor) {
					animationPromises.push(
						colorInterpolator.animateProperty(cssVar, currentColor, targetColor)
					);
					totalProperties++;
				} else {
					// Aplicação instantânea se interpolação não for possível
					root.style.setProperty(cssVar, targetColor);
				}
			}

			// Animar variáveis ED existentes no DOM
			for (const [cssVar, colorKey] of edVariablesMap) {
				const currentColor = getCurrentColor(cssVar);
				const targetColor = colors[colorKey];

				// Apenas animar se a variável existe no DOM e tem valor diferente
				if (currentColor && targetColor && currentColor !== targetColor) {
					animationPromises.push(
						colorInterpolator.animateProperty(cssVar, currentColor, targetColor)
					);
					totalProperties++;
				}
			}

			// Limitar animações simultâneas para performance
			const maxConcurrent = Math.min(
				animationPromises.length,
				THEME_CONFIG.INTERPOLATION.MAX_CONCURRENT
			);

			logger.actions.theme('Iniciando interpolações', {
				totalProperties,
				concurrentAnimations: maxConcurrent,
				theme
			});

			// Executar animações em lotes para não sobrecarregar
			const results = [];
			for (let i = 0; i < animationPromises.length; i += maxConcurrent) {
				const batch = animationPromises.slice(i, i + maxConcurrent);
				const batchResults = await Promise.allSettled(batch);
				results.push(...batchResults);
			}

			// Log de resultados
			const successful = results.filter((r) => r.status === 'fulfilled').length;
			const failed = results.filter((r) => r.status === 'rejected').length;

			logger.actions.theme('Interpolações concluídas', {
				successful,
				failed,
				total: results.length
			});
		} else {
			// Aplicação instantânea se interpolação estiver desabilitada
			logger.actions.theme('Interpolação desabilitada - aplicação instantânea');

			for (const [cssVar, colorKey] of cssPropertyMap) {
				root.style.setProperty(cssVar, colors[colorKey]);
				totalProperties++;
			}
		}

		// Atualizar variável de tema atual (sempre instantâneo)
		root.style.setProperty('--theme-current', theme);

		// Material Design - cores de texto específicas por tema (instantâneo)
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

		// Aplicar cores de texto instantaneamente (não precisam de interpolação)
		Object.entries(textColors).forEach(([prop, value]) => {
			root.style.setProperty(prop, value);
		});

		logger.actions.theme('Cores Material Design aplicadas', {
			themeType: theme === THEME_TYPES.DARK ? 'dark' : 'light',
			materialProperties: Object.keys(textColors).length,
			iconFilter: textColors['--icon-filter']
		});

		// Força reidratação otimizada
		rehydrationSystem.forceElementsRehydration();

		const endTime = performance.now();
		const duration = Math.round(endTime - startTime);

		logger.actions.transition('END', {
			theme,
			duration,
			totalProperties,
			interpolationEnabled: THEME_CONFIG.INTERPOLATION.ENABLED,
			performance: duration < 50 ? 'excelente' : duration < 100 ? 'boa' : 'lenta'
		});

		lastAppliedTheme = theme;
	};

	return {
		applyTheme,
		// Expor controles de interpolação
		interpolation: {
			cancel: (property) => colorInterpolator.cancelAnimation(property),
			cancelAll: () => colorInterpolator.cancelAllAnimations(),
			isAnimating: (property) => colorInterpolator.isAnimating(property),
			getActive: () => colorInterpolator.getActiveAnimations()
		}
	};
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
