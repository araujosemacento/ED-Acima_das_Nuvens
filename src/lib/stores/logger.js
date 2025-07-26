// Store de Logger - Versão dinâmica e responsiva baseada nas melhores práticas do Svelte
import { writable, derived, readonly, get } from 'svelte/store';
import { dev } from '$app/environment';

/**
 * Logger reativo e dinâmico para desenvolvimento
 * Sistema de logs em tempo real com filtragem, histórico e throttling inteligente
 */

// Configurações do logger
const LOGGER_CONFIG = Object.freeze({
	MAX_LOGS: 100,
	THROTTLE_WINDOW: 1000, // ms - janela para detectar logs repetitivos
	MAX_SIMILAR_LOGS: 3, // máximo de logs similares na janela
	CATEGORIES: {
		THEME: 'theme',
		ANIMATION: 'animation',
		COMPONENT: 'component',
		STORE: 'store',
		TRANSITION: 'transition',
		ERROR: 'error',
		INFO: 'info',
		DEBUG: 'debug'
	},
	LEVELS: {
		DEBUG: 0,
		INFO: 1,
		WARN: 2,
		ERROR: 3
	}
});

// Estrutura de log otimizada
const createLogEntry = (category, action, data = {}, level = LOGGER_CONFIG.LEVELS.INFO) => ({
	id: crypto.randomUUID(),
	timestamp: Date.now(),
	category,
	action,
	data,
	level,
	formatted: formatLogMessage(category, action, data),
	// Chave para detectar logs similares (usado no throttling)
	similarityKey: `${category}:${action}:${JSON.stringify(Object.keys(data).sort())}`
});

const formatLogMessage = (category, action, data) => {
	const icons = {
		[LOGGER_CONFIG.CATEGORIES.THEME]: '🎨',
		[LOGGER_CONFIG.CATEGORIES.ANIMATION]: '🎭',
		[LOGGER_CONFIG.CATEGORIES.COMPONENT]: '🧩',
		[LOGGER_CONFIG.CATEGORIES.STORE]: '📦',
		[LOGGER_CONFIG.CATEGORIES.TRANSITION]: '🎬',
		[LOGGER_CONFIG.CATEGORIES.ERROR]: '❌',
		[LOGGER_CONFIG.CATEGORIES.INFO]: 'ℹ️',
		[LOGGER_CONFIG.CATEGORIES.DEBUG]: '🔍'
	};

	const icon = icons[category] || '📝';

	// Formatação inteligente dos dados
	const dataEntries = Object.entries(data).filter(([, value]) => value !== undefined && value !== null);
	const summary = dataEntries.length > 0
		? dataEntries.map(([key, value]) => {
			// Trunca strings muito longas para melhor legibilidade
			const displayValue = typeof value === 'string' && value.length > 50
				? `${value.substring(0, 47)}...`
				: value;
			return `${key}: ${displayValue}`;
		}).join(', ')
		: '';

	return `${icon} [${category.toUpperCase()}] ${action}${summary ? ` | ${summary}` : ''}`;
};

// Sistema de throttling inteligente
const createThrottleSystem = () => {
	const recentLogs = new Map(); // similarityKey -> [timestamps]

	const shouldThrottle = (logEntry) => {
		const now = logEntry.timestamp;
		const key = logEntry.similarityKey;

		// Limpa entradas antigas
		if (recentLogs.has(key)) {
			const timestamps = recentLogs.get(key).filter(
				ts => now - ts < LOGGER_CONFIG.THROTTLE_WINDOW
			);
			recentLogs.set(key, timestamps);
		}

		// Verifica se deve throttle
		const currentCount = recentLogs.get(key)?.length || 0;
		if (currentCount >= LOGGER_CONFIG.MAX_SIMILAR_LOGS) {
			return true;
		}

		// Adiciona timestamp atual
		const timestamps = recentLogs.get(key) || [];
		timestamps.push(now);
		recentLogs.set(key, timestamps);

		return false;
	};

	const getThrottleStats = () => {
		const stats = new Map();
		for (const [key, timestamps] of recentLogs.entries()) {
			if (timestamps.length >= LOGGER_CONFIG.MAX_SIMILAR_LOGS) {
				stats.set(key, {
					count: timestamps.length,
					firstOccurrence: new Date(Math.min(...timestamps)).toLocaleTimeString(),
					lastOccurrence: new Date(Math.max(...timestamps)).toLocaleTimeString()
				});
			}
		}
		return stats;
	};

	return { shouldThrottle, getThrottleStats };
};

function createLoggerStore() {
	// Estado base do logger
	const baseState = writable({
		logs: [],
		isEnabled: dev,
		throttledCount: 0, // Contador de logs throttled
		filters: {
			categories: new Set(Object.values(LOGGER_CONFIG.CATEGORIES)),
			minLevel: LOGGER_CONFIG.LEVELS.DEBUG,
			searchTerm: ''
		},
		stats: {
			totalLogs: 0,
			logsByCategory: new Map(),
			logsByLevel: new Map()
		}
	});

	// Sistema de throttling
	const throttleSystem = createThrottleSystem();

	// Stores derivados granulares
	const isEnabled = derived(baseState, ($state) => $state.isEnabled);
	const currentFilters = derived(baseState, ($state) => $state.filters);
	const logStats = derived(baseState, ($state) => $state.stats);

	// Logs filtrados de forma reativa
	const filteredLogs = derived([baseState, currentFilters], ([$state, $filters]) => {
		return $state.logs.filter((log) => {
			// Filtro por categoria
			if (!$filters.categories.has(log.category)) return false;

			// Filtro por nível
			if (log.level < $filters.minLevel) return false;

			// Filtro por busca
			if (
				$filters.searchTerm &&
				!log.formatted.toLowerCase().includes($filters.searchTerm.toLowerCase())
			) {
				return false;
			}

			return true;
		});
	});

	// Estatísticas reativas
	const categoryStats = derived(baseState, ($state) => {
		const stats = new Map();
		$state.logs.forEach((log) => {
			stats.set(log.category, (stats.get(log.category) || 0) + 1);
		});
		return stats;
	});

	const levelStats = derived(baseState, ($state) => {
		const stats = new Map();
		$state.logs.forEach((log) => {
			const levelName = Object.keys(LOGGER_CONFIG.LEVELS)[log.level];
			stats.set(levelName, (stats.get(levelName) || 0) + 1);
		});
		return stats;
	});

	// Sistema de adição de logs otimizado
	const addLog = (category, action, data = {}, level = LOGGER_CONFIG.LEVELS.INFO) => {
		if (!get(isEnabled)) return;

		const logEntry = createLogEntry(category, action, data, level);

		// Verifica throttling
		if (throttleSystem.shouldThrottle(logEntry)) {
			baseState.update((state) => {
				const newThrottledCount = state.throttledCount + 1;

				// Log throttling apenas no console, não adiciona ao store para evitar spam
				if (dev && newThrottledCount % 10 === 1) { // Log a cada 10 throttles
					console.warn(`🚀 [ED] ⚠️ Throttling ativo: ${newThrottledCount} logs similares suprimidos`);
				}

				return {
					...state,
					throttledCount: newThrottledCount
				};
			});
			return;
		}

		baseState.update((state) => {
			const newLogs = [...state.logs, logEntry].slice(-LOGGER_CONFIG.MAX_LOGS);

			return {
				...state,
				logs: newLogs,
				stats: {
					...state.stats,
					totalLogs: state.stats.totalLogs + 1
				}
			};
		});

		// Log no console se em desenvolvimento
		if (dev) {
			const logMethod =
				level >= LOGGER_CONFIG.LEVELS.ERROR
					? 'error'
					: level >= LOGGER_CONFIG.LEVELS.WARN
						? 'warn'
						: 'log';
			console[logMethod](`🚀 [ED] ${logEntry.formatted}`);
		}
	};

	return {
		// Store principal - apenas leitura
		subscribe: readonly(baseState).subscribe,

		// Stores derivados granulares
		isEnabled: readonly(isEnabled),
		filteredLogs: readonly(filteredLogs),
		currentFilters: readonly(currentFilters),
		logStats: readonly(logStats),
		categoryStats: readonly(categoryStats),
		levelStats: readonly(levelStats),

		// API funcional otimizada
		actions: {
			// Métodos específicos por categoria
			theme: (action, data = {}) => addLog(LOGGER_CONFIG.CATEGORIES.THEME, action, data),
			animation: (action, data = {}) => addLog(LOGGER_CONFIG.CATEGORIES.ANIMATION, action, data),
			component: (name, action, data = {}) =>
				addLog(LOGGER_CONFIG.CATEGORIES.COMPONENT, `${name}: ${action}`, data),
			store: (action, data = {}) => addLog(LOGGER_CONFIG.CATEGORIES.STORE, action, data),

			transition: (action, data = {}) => {
				if (action === 'START') {
					const change = data.from && data.to ? ` ${data.from} → ${data.to}` : '';
					addLog(LOGGER_CONFIG.CATEGORIES.TRANSITION, `Transição iniciada${change}`, data);
				} else if (action === 'END') {
					const duration = data.duration || 300;
					const isSlowly = duration > 300;
					const icon = isSlowly ? '🐌' : '⚡';
					addLog(
						LOGGER_CONFIG.CATEGORIES.TRANSITION,
						`${icon} Transição finalizada em ${duration}ms${isSlowly ? ' (lenta!)' : ''}`,
						data
					);
				}
			},

			// Métodos por nível
			debug: (action, data = {}) =>
				addLog(LOGGER_CONFIG.CATEGORIES.DEBUG, action, data, LOGGER_CONFIG.LEVELS.DEBUG),
			info: (action, data = {}) =>
				addLog(LOGGER_CONFIG.CATEGORIES.INFO, action, data, LOGGER_CONFIG.LEVELS.INFO),
			warn: (action, data = {}) =>
				addLog(LOGGER_CONFIG.CATEGORIES.ERROR, action, data, LOGGER_CONFIG.LEVELS.WARN),
			error: (action, data = {}) =>
				addLog(LOGGER_CONFIG.CATEGORIES.ERROR, action, data, LOGGER_CONFIG.LEVELS.ERROR),

			// Controles do logger
			enable: () => baseState.update((state) => ({ ...state, isEnabled: true })),
			disable: () => baseState.update((state) => ({ ...state, isEnabled: false })),
			toggle: () => baseState.update((state) => ({ ...state, isEnabled: !state.isEnabled })),

			// Filtros
			setFilters: (filters) => {
				baseState.update((state) => ({
					...state,
					filters: { ...state.filters, ...filters }
				}));
			},

			filterByCategory: (categories) => {
				const categorySet = Array.isArray(categories) ? new Set(categories) : new Set([categories]);
				baseState.update((state) => ({
					...state,
					filters: { ...state.filters, categories: categorySet }
				}));
			},

			setMinLevel: (level) => {
				baseState.update((state) => ({
					...state,
					filters: { ...state.filters, minLevel: level }
				}));
			},

			search: (term) => {
				baseState.update((state) => ({
					...state,
					filters: { ...state.filters, searchTerm: term }
				}));
			},

			clearFilters: () => {
				baseState.update((state) => ({
					...state,
					filters: {
						categories: new Set(Object.values(LOGGER_CONFIG.CATEGORIES)),
						minLevel: LOGGER_CONFIG.LEVELS.DEBUG,
						searchTerm: ''
					}
				}));
			},

			// Utilitários
			clear: () => {
				baseState.update((state) => ({
					...state,
					logs: [],
					stats: {
						totalLogs: 0,
						logsByCategory: new Map(),
						logsByLevel: new Map()
					}
				}));
			},

			export: () => {
				const logs = get(filteredLogs);
				return JSON.stringify(logs, null, 2);
			},

			// Estatísticas de throttling
			getThrottleStats: () => ({
				throttledCount: get(baseState).throttledCount,
				activeThrottles: throttleSystem.getThrottleStats(),
				throttleConfig: {
					window: LOGGER_CONFIG.THROTTLE_WINDOW,
					maxSimilar: LOGGER_CONFIG.MAX_SIMILAR_LOGS
				}
			}),

			resetThrottleStats: () => {
				baseState.update((state) => ({
					...state,
					throttledCount: 0
				}));
			}
		},

		// Utilities funcionais
		utils: {
			getState: () => get(baseState),
			getLogs: () => get(filteredLogs),
			getLogById: (id) => get(baseState).logs.find((log) => log.id === id),
			getLogsByCategory: (category) =>
				get(baseState).logs.filter((log) => log.category === category),
			getLogsByLevel: (level) => get(baseState).logs.filter((log) => log.level === level)
		},

		// Constantes expostas
		CATEGORIES: LOGGER_CONFIG.CATEGORIES,
		LEVELS: LOGGER_CONFIG.LEVELS
	};
}

export const logger = createLoggerStore();
