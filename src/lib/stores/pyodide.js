import { writable, derived } from 'svelte/store';

/**
 * Store robusta e simplificada para gerenciar o Pyodide
 * API inspirada em classe/objeto para uso plug-and-play
 */
function createPyodideStore() {
	// Estado base interno
	const baseStore = writable({
		instance: null,
		ready: false,
		loading: false,
		error: null,
		loadedScripts: new Set(),
		lastExecution: null
	});

	// Estados derivados já prontos para uso
	const derived_isReady = derived(baseStore, ($store) => $store.ready);
	const derived_isLoading = derived(baseStore, ($store) => $store.loading);
	const derived_hasError = derived(baseStore, ($store) => !!$store.error);
	const derived_statusMessage = derived(baseStore, ($store) => {
		if ($store.error) return `❌ Erro: ${$store.error}`;
		if ($store.loading) return '⏳ Carregando Pyodide...';
		if ($store.ready) return '✅ Pyodide carregado com sucesso!';
		return '🔄 Inicializando...';
	});

	// Cache para scripts carregados
	const scriptCache = new Map();

	const api = {
		// Subscrição ao estado base
		subscribe: baseStore.subscribe,

		// Estados derivados prontos para uso
		isReady: derived_isReady,
		isLoading: derived_isLoading,
		hasError: derived_hasError,
		statusMessage: derived_statusMessage,

		/**
		 * Carrega o Pyodide de forma assíncrona
		 * Retorna Promise que resolve quando estiver pronto
		 * @returns {Promise<boolean>} true se carregou com sucesso
		 */
		async load() {
			// Só executa no cliente
			if (typeof window === 'undefined') return false;

			return new Promise((resolve) => {
				// Evita carregar múltiplas vezes
				let currentState;
				const unsubscribe = baseStore.subscribe((state) => (currentState = state));
				unsubscribe();

				if (currentState.loading || currentState.ready) {
					if (currentState.ready) resolve(true);
					else {
						// Espera terminar de carregar
						const waitUnsubscribe = baseStore.subscribe((state) => {
							if (state.ready) {
								waitUnsubscribe();
								resolve(true);
							} else if (state.error) {
								waitUnsubscribe();
								resolve(false);
							}
						});
					}
					return;
				}

				baseStore.update((state) => ({ ...state, loading: true, error: null }));

				(async () => {
					try {
						console.log('🚀 Iniciando carregamento do Pyodide...');

						// Importa o módulo ES do Pyodide
						const { loadPyodide: loadPyodideModule } = await import(
							'https://araujosemacento.github.io/pyodide-files-serve/files/pyodide.mjs'
						);

						// Carrega a instância do Pyodide
						const pyodide = await loadPyodideModule({
							indexURL: 'https://araujosemacento.github.io/pyodide-files-serve/files/'
						});

						console.log('✅ Pyodide carregado com sucesso!');

						baseStore.set({
							instance: pyodide,
							ready: true,
							loading: false,
							error: null,
							loadedScripts: new Set(),
							lastExecution: null
						});

						resolve(true);
					} catch (error) {
						console.error('❌ Erro ao carregar Pyodide:', error);

						baseStore.set({
							instance: null,
							ready: false,
							loading: false,
							error: error.message,
							loadedScripts: new Set(),
							lastExecution: null
						});

						resolve(false);
					}
				})();
			});
		},

		/**
		 * Executa código Python de forma síncrona (aguarda se necessário)
		 * @param {string} code - Código Python para executar
		 * @returns {Promise<any>} Resultado da execução
		 */
		async run(code) {
			// Garante que está carregado
			const isLoaded = await this.load();
			if (!isLoaded) {
				throw new Error('Falha ao carregar Pyodide');
			}

			let currentState;
			const unsubscribe = baseStore.subscribe((state) => (currentState = state));
			unsubscribe();

			try {
				const rawResult = await currentState.instance.runPythonAsync(code);

				// Converte resultado Python para JavaScript de forma segura
				let result;
				try {
					// Tenta converter objeto Python para JavaScript
					if (rawResult && typeof rawResult.toJs === 'function') {
						result = rawResult.toJs();
					} else {
						result = rawResult;
					}
				} catch {
					// Se falhar, usa string representation
					result = String(rawResult);
				}

				baseStore.update((state) => ({
					...state,
					lastExecution: { code, result, timestamp: new Date() }
				}));

				console.log(`🐍 Python executou: ${code} = ${result}`);
				return result;
			} catch (error) {
				console.error('❌ Erro ao executar Python:', error);

				baseStore.update((state) => ({
					...state,
					lastExecution: { code, error: error.message, timestamp: new Date() }
				}));

				throw error;
			}
		},

		/**
		 * Carrega e executa um script Python de arquivo
		 * @param {string} scriptPath - Caminho relativo ao script (ex: 'scripts/exemplo.py')
		 * @returns {Promise<any>} Resultado da execução
		 */
		async runScript(scriptPath) {
			try {
				// Verifica cache primeiro
				if (scriptCache.has(scriptPath)) {
					console.log(`📁 Script encontrado no cache: ${scriptPath}`);
					return await this.run(scriptCache.get(scriptPath));
				}

				console.log(`📁 Carregando script: ${scriptPath}`);

				// Carrega o arquivo Python (agora em /static)
				const response = await fetch(`/${scriptPath}`);
				if (!response.ok) {
					throw new Error(`Falha ao carregar script: ${scriptPath} (${response.status})`);
				}

				const pythonCode = await response.text();

				// Armazena no cache
				scriptCache.set(scriptPath, pythonCode);

				// Marca como carregado
				baseStore.update((state) => ({
					...state,
					loadedScripts: new Set([...state.loadedScripts, scriptPath])
				}));

				console.log(`✅ Script carregado: ${scriptPath}`);

				// Executa o script
				return await this.run(pythonCode);
			} catch (error) {
				console.error(`❌ Erro ao executar script ${scriptPath}:`, error);
				throw error;
			}
		},

		/**
		 * Instala pacotes Python de forma simplificada
		 * @param {string|string[]} packages - Pacote(s) para instalar
		 * @returns {Promise<void>}
		 */
		async install(packages) {
			const packageList = Array.isArray(packages) ? packages : [packages];

			// Garante que está carregado
			const isLoaded = await this.load();
			if (!isLoaded) {
				throw new Error('Falha ao carregar Pyodide');
			}

			let currentState;
			const unsubscribe = baseStore.subscribe((state) => (currentState = state));
			unsubscribe();

			try {
				await currentState.instance.loadPackage(packageList);
				console.log(`📦 Pacotes instalados: ${packageList.join(', ')}`);
			} catch (error) {
				console.error('❌ Erro ao instalar pacotes:', error);
				throw error;
			}
		},

		/**
		 * Executa código Python e retorna resultado + captura print()
		 * @param {string} code - Código Python para executar
		 * @returns {Promise<{result: any, output: string}>}
		 */
		async runWithOutput(code) {
			const captureCode = `
import sys
from io import StringIO

# Captura output
old_stdout = sys.stdout
sys.stdout = mystdout = StringIO()

try:
	${code
		.split('\n')
		.map((line) => `    ${line}`)
		.join('\n')}
except Exception as e:
	print(f"Erro: {e}")

# Restaura stdout
sys.stdout = old_stdout
captured_output = mystdout.getvalue()
`;

			await this.run(captureCode);
			const output = await this.run('captured_output');
			const result = await this.run(`
try:
	result = ${code}
	result
except:
	None
`);

			return { result, output };
		},

		/**
		 * Reseta completamente o estado
		 */
		reset() {
			scriptCache.clear();
			baseStore.set({
				instance: null,
				ready: false,
				loading: false,
				error: null,
				loadedScripts: new Set(),
				lastExecution: null
			});
			console.log('🔄 Pyodide resetado');
		},

		/**
		 * Obtém informações do estado atual
		 * @returns {object} Estado atual
		 */
		getState() {
			let currentState;
			const unsubscribe = baseStore.subscribe((state) => (currentState = state));
			unsubscribe();
			return {
				ready: currentState.ready,
				loading: currentState.loading,
				error: currentState.error,
				loadedScripts: Array.from(currentState.loadedScripts),
				lastExecution: currentState.lastExecution
			};
		}
	};

	return api;
}

export const pyodideStore = createPyodideStore();
