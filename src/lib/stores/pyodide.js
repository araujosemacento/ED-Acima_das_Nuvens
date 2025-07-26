// Store do Pyodide - Versão dinâmica e responsiva baseada nas melhores práticas do Svelte
import { writable, derived, readonly, get } from 'svelte/store';

/**
 * Store robusta e dinâmica para gerenciar o Pyodide
 * API funcional inspirada nas melhores práticas do Svelte stores
 */

// Configurações otimizadas
const PYODIDE_CONFIG = Object.freeze({
	CDN_BASE: 'https://araujosemacento.github.io/pyodide-files-serve/files/',
	MODULE_URL: 'https://araujosemacento.github.io/pyodide-files-serve/files/pyodide.mjs',
	EXECUTION_TIMEOUT: 30000,
	CACHE_TTL: 5 * 60 * 1000, // 5 minutos
	RETRY_ATTEMPTS: 3
});

// Estados possíveis do Pyodide
const PYODIDE_STATES = Object.freeze({
	IDLE: 'idle',
	LOADING: 'loading',
	READY: 'ready',
	ERROR: 'error',
	EXECUTING: 'executing'
});

// Sistema de cache reativo para scripts
const createScriptCache = () => {
	const cache = new Map();
	const cacheTimestamps = new Map();

	return {
		get: (key) => {
			const timestamp = cacheTimestamps.get(key);
			if (timestamp && Date.now() - timestamp > PYODIDE_CONFIG.CACHE_TTL) {
				cache.delete(key);
				cacheTimestamps.delete(key);
				return null;
			}
			return cache.get(key);
		},
		set: (key, value) => {
			cache.set(key, value);
			cacheTimestamps.set(key, Date.now());
		},
		clear: () => {
			cache.clear();
			cacheTimestamps.clear();
		},
		size: () => cache.size
	};
};

function createPyodideStore() {
	// Estado base usando estrutura mais granular
	const baseState = writable({
		instance: null,
		state: PYODIDE_STATES.IDLE,
		error: null,
		loadedPackages: new Set(),
		loadedScripts: new Set(),
		executionHistory: [],
		lastExecution: null,
		stats: {
			totalExecutions: 0,
			successfulExecutions: 0,
			averageExecutionTime: 0
		}
	});

	// Cache reativo para scripts
	const scriptCache = createScriptCache();

	// Stores derivados granulares para diferentes aspectos
	const isReady = derived(baseState, ($state) => $state.state === PYODIDE_STATES.READY);
	const isLoading = derived(baseState, ($state) => $state.state === PYODIDE_STATES.LOADING);
	const hasError = derived(baseState, ($state) => $state.state === PYODIDE_STATES.ERROR);
	const isExecuting = derived(baseState, ($state) => $state.state === PYODIDE_STATES.EXECUTING);

	const statusMessage = derived(baseState, ($state) => {
		switch ($state.state) {
			case PYODIDE_STATES.IDLE:
				return 'Inicializando...';
			case PYODIDE_STATES.LOADING:
				return 'Carregando Pyodide...';
			case PYODIDE_STATES.READY:
				return 'Pyodide pronto!';
			case PYODIDE_STATES.EXECUTING:
				return 'Executando código Python...';
			case PYODIDE_STATES.ERROR:
				return 'Erro: ' + $state.error;
			default:
				return 'Estado desconhecido';
		}
	});

	const executionStats = derived(baseState, ($state) => $state.stats);

	// Sistema otimizado de execução com retry e timeout
	const createExecutionSystem = () => {
		const executeWithRetry = async (fn, attempts = PYODIDE_CONFIG.RETRY_ATTEMPTS) => {
			for (let i = 0; i < attempts; i++) {
				try {
					return await Promise.race([
						fn(),
						new Promise((_, reject) =>
							setTimeout(
								() => reject(new Error('Timeout de execução')),
								PYODIDE_CONFIG.EXECUTION_TIMEOUT
							)
						)
					]);
				} catch (error) {
					if (i === attempts - 1) throw error;
					await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Backoff
				}
			}
		};

		const updateStats = (startTime, success = true) => {
			baseState.update((state) => {
				const executionTime = Date.now() - startTime;
				const newStats = {
					totalExecutions: state.stats.totalExecutions + 1,
					successfulExecutions: state.stats.successfulExecutions + (success ? 1 : 0),
					averageExecutionTime:
						(state.stats.averageExecutionTime * state.stats.totalExecutions + executionTime) /
						(state.stats.totalExecutions + 1)
				};
				return { ...state, stats: newStats };
			});
		};

		return { executeWithRetry, updateStats };
	};

	const executionSystem = createExecutionSystem();

	// Sistema de carregamento otimizado
	const loadPyodide = async () => {
		const currentState = get(baseState);
		if (currentState.instance) return currentState.instance;
		if (currentState.state === PYODIDE_STATES.LOADING) {
			// Espera terminar o carregamento atual
			return new Promise((resolve, reject) => {
				const unsubscribe = baseState.subscribe((state) => {
					if (state.state === PYODIDE_STATES.READY) {
						unsubscribe();
						resolve(state.instance);
					} else if (state.state === PYODIDE_STATES.ERROR) {
						unsubscribe();
						reject(new Error(state.error));
					}
				});
			});
		}

		baseState.update((state) => ({ ...state, state: PYODIDE_STATES.LOADING, error: null }));

		try {
			const { loadPyodide: loadPyodideModule } = await import(PYODIDE_CONFIG.MODULE_URL);
			const instance = await loadPyodideModule({
				indexURL: PYODIDE_CONFIG.CDN_BASE,
				fullStdLib: false
			});

			baseState.update((state) => ({
				...state,
				instance,
				state: PYODIDE_STATES.READY,
				error: null
			}));

			return instance;
		} catch (error) {
			baseState.update((state) => ({
				...state,
				instance: null,
				state: PYODIDE_STATES.ERROR,
				error: error.message
			}));
			throw error;
		}
	};

	return {
		// Store principal - apenas leitura
		subscribe: readonly(baseState).subscribe,

		// Stores derivados granulares
		isReady: readonly(isReady),
		isLoading: readonly(isLoading),
		hasError: readonly(hasError),
		isExecuting: readonly(isExecuting),
		statusMessage: readonly(statusMessage),
		executionStats: readonly(executionStats),

		// API funcional otimizada
		actions: {
			async load() {
				try {
					await loadPyodide();
					return true;
				} catch {
					return false;
				}
			},

			async run(code) {
				const startTime = Date.now();

				try {
					const instance = await loadPyodide();

					baseState.update((state) => ({ ...state, state: PYODIDE_STATES.EXECUTING }));

					const result = await executionSystem.executeWithRetry(async () => {
						const rawResult = await instance.runPythonAsync(code);
						return rawResult?.toJs?.() ?? rawResult;
					});

					const execution = {
						code,
						result,
						timestamp: new Date(),
						duration: Date.now() - startTime
					};

					baseState.update((state) => ({
						...state,
						state: PYODIDE_STATES.READY,
						lastExecution: execution,
						executionHistory: [...state.executionHistory.slice(-9), execution] // Mantém últimas 10
					}));

					executionSystem.updateStats(startTime, true);
					return result;
				} catch (error) {
					const execution = {
						code,
						error: error.message,
						timestamp: new Date(),
						duration: Date.now() - startTime
					};

					baseState.update((state) => ({
						...state,
						state: PYODIDE_STATES.READY,
						lastExecution: execution,
						executionHistory: [...state.executionHistory.slice(-9), execution]
					}));

					executionSystem.updateStats(startTime, false);
					throw error;
				}
			},

			async runScript(scriptPath) {
				const cached = scriptCache.get(scriptPath);
				if (cached) {
					return this.run(cached);
				}

				const response = await fetch('/' + scriptPath);
				if (!response.ok) {
					throw new Error('Falha ao carregar script: ' + scriptPath);
				}

				const code = await response.text();
				scriptCache.set(scriptPath, code);

				baseState.update((state) => ({
					...state,
					loadedScripts: new Set([...state.loadedScripts, scriptPath])
				}));

				return this.run(code);
			},

			async install(packages) {
				const packageList = Array.isArray(packages) ? packages : [packages];
				const instance = await loadPyodide();

				await instance.loadPackage(packageList);

				baseState.update((state) => ({
					...state,
					loadedPackages: new Set([...state.loadedPackages, ...packageList])
				}));
			},

			async runWithOutput(code) {
				const captureCode = [
					'import sys',
					'from io import StringIO',
					'old_stdout = sys.stdout',
					'sys.stdout = mystdout = StringIO()',
					'',
					'try:',
					...code.split('\n').map((line) => '    ' + line),
					'except Exception as e:',
					'    print(f"Erro: {e}")',
					'',
					'sys.stdout = old_stdout',
					'captured_output = mystdout.getvalue()'
				].join('\n');

				await this.run(captureCode);
				const output = await this.run('captured_output');

				try {
					const result = await this.run(code);
					return { result, output };
				} catch {
					return { result: null, output };
				}
			},

			reset() {
				scriptCache.clear();
				baseState.set({
					instance: null,
					state: PYODIDE_STATES.IDLE,
					error: null,
					loadedPackages: new Set(),
					loadedScripts: new Set(),
					executionHistory: [],
					lastExecution: null,
					stats: {
						totalExecutions: 0,
						successfulExecutions: 0,
						averageExecutionTime: 0
					}
				});
			}
		},

		// Utilities funcionais
		utils: {
			getState: () => get(baseState),
			getCacheStats: () => ({ size: scriptCache.size() }),
			getExecutionHistory: () => get(baseState).executionHistory,
			clearHistory: () => baseState.update((state) => ({ ...state, executionHistory: [] }))
		}
	};
}

export const pyodideStore = createPyodideStore();
