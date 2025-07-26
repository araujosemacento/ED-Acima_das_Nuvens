// Store de Logger - Versão dinâmica e responsiva baseada nas melhores práticas do Svelte
import { writable, derived, readonly, get } from 'svelte/store';
import { dev } from '$app/environment';

/**
 * Logger reativo e dinâmico para desenvolvimento
 * Sistema de logs em tempo real com filtragem e histórico
 */

// Configurações do logger
const LOGGER_CONFIG = Object.freeze({
	MAX_LOGS: 100,
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
	formatted: formatLogMessage(category, action, data)
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
	const summary = Object.values(data)
		.filter((v) => v)
		.join(' → ');
	return `${icon} [${category.toUpperCase()}] ${action}${summary ? ` - ${summary}` : ''}`;
};

function createLoggerStore() {
	// Estado base do logger
	const baseState = writable({
		logs: [],
		isEnabled: dev,
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
