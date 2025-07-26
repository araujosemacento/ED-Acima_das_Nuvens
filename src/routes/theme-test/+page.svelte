<script>
	import { onMount } from 'svelte';
	import { themeStore, THEME_TYPES, logger } from '$lib/stores/index.js';
	import { ThemeTestLogger } from '$lib/utils/themeTestLogger.js';

	// Estados reativos
	let currentTheme = $state('');
	let userTheme = $state('');
	let logsCount = $state(0);
	let throttledCount = $state(0);
	let recentLogs = $state([]);
	let testResults = $state(null);
	let isRealTimeLogging = $state(false);
	let performanceStats = $state(null);

	// Instância do testador
	let themeTestLogger = null;

	onMount(() => {
		themeTestLogger = new ThemeTestLogger();
		
		// Subscriptions para dados reativos
		const unsubscribeTheme = themeStore.subscribe((theme) => {
			currentTheme = theme;
		});

		const unsubscribeUserTheme = themeStore.userTheme.subscribe((theme) => {
			userTheme = theme;
		});

		// Monitoring de logs
		const updateStats = () => {
			const logs = logger.utils.getLogs();
			logsCount = logs.length;
			recentLogs = logs.slice(-10);
			
			const throttleStats = logger.actions.getThrottleStats();
			throttledCount = throttleStats.throttledCount;
		};

		// Atualizar stats a cada segundo
		const statsInterval = setInterval(updateStats, 1000);
		updateStats(); // Inicial

		logger.actions.info('Página de teste de temas carregada');

		return () => {
			unsubscribeTheme();
			unsubscribeUserTheme();
			clearInterval(statsInterval);
		};
	});

	// Funções de teste
	const testThemeChange = (theme) => {
		logger.actions.info(`Teste manual: mudança para ${theme}`);
		themeStore.actions.setTheme(theme);
	};

	const toggleTheme = () => {
		logger.actions.info('Teste manual: toggle de tema');
		themeStore.actions.toggleTheme();
	};

	const runStressTest = async () => {
		logger.actions.info('Iniciando teste de stress');
		
		const themes = [THEME_TYPES.LIGHT, THEME_TYPES.DARK, THEME_TYPES.SYSTEM];
		const startTime = performance.now();
		
		for (let i = 0; i < 30; i++) {
			const theme = themes[i % themes.length];
			themeStore.actions.setTheme(theme);
			await new Promise(resolve => setTimeout(resolve, 50));
		}
		
		const endTime = performance.now();
		const duration = Math.round(endTime - startTime);
		
		logger.actions.info('Teste de stress concluído', {
			duration: `${duration}ms`,
			totalChanges: 30,
			avgPerChange: `${Math.round(duration / 30)}ms`
		});

		updatePerformanceStats();
	};

	const runFullTest = async () => {
		if (!themeTestLogger) return;
		
		logger.actions.info('Iniciando teste completo automatizado');
		testResults = await themeTestLogger.runFullThemeTest();
		updatePerformanceStats();
	};

	const clearLogs = () => {
		logger.actions.clear();
		logger.actions.resetThrottleStats();
		testResults = null;
		performanceStats = null;
		logger.actions.info('Logs limpos - reiniciando monitoramento');
	};

	const exportLogs = () => {
		const logsJson = logger.actions.export();
		const blob = new Blob([logsJson], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `theme-logs-${new Date().toISOString().slice(0, 19)}.json`;
		a.click();
		URL.revokeObjectURL(url);
		
		logger.actions.info('Logs exportados');
	};

	const toggleRealTimeLogging = () => {
		isRealTimeLogging = !isRealTimeLogging;
		if (isRealTimeLogging) {
			logger.actions.info('Monitoramento em tempo real ativado');
		} else {
			logger.actions.info('Monitoramento em tempo real desativado');
		}
	};

	const updatePerformanceStats = () => {
		const logs = logger.utils.getLogs();
		const themeLogs = logs.filter(l => l.category === 'theme');
		const transitionLogs = logs.filter(l => l.category === 'transition');
		
		const transitionTimes = transitionLogs
			.filter(l => l.action.includes('finalizada'))
			.map(l => parseInt(l.data.duration) || 0)
			.filter(t => t > 0);

		const avgTransitionTime = transitionTimes.length > 0
			? Math.round(transitionTimes.reduce((a, b) => a + b, 0) / transitionTimes.length)
			: 0;

		performanceStats = {
			totalLogs: logs.length,
			themeLogs: themeLogs.length,
			transitionLogs: transitionLogs.length,
			avgTransitionTime,
			minTransitionTime: Math.min(...transitionTimes, 0),
			maxTransitionTime: Math.max(...transitionTimes, 0),
			throttledCount,
			performance: avgTransitionTime < 50 ? 'excelente' : avgTransitionTime < 200 ? 'boa' : 'lenta'
		};
	};

	// Função auxiliar para formatar timestamp
	const formatTime = (timestamp) => {
		return new Date(timestamp).toLocaleTimeString('pt-BR');
	};
</script>

<div class="test-container">
	<h1>🎨 Teste Avançado do Sistema de Temas</h1>
	
	<!-- Status Atual -->
	<section class="status-panel">
		<h2>📊 Status Atual</h2>
		<div class="status-grid">
			<div class="status-item">
				<span class="label">Tema Ativo:</span>
				<span class="value theme-badge theme-{currentTheme}">{currentTheme}</span>
			</div>
			<div class="status-item">
				<span class="label">Preferência:</span>
				<span class="value">{userTheme}</span>
			</div>
			<div class="status-item">
				<span class="label">Logs Capturados:</span>
				<span class="value">{logsCount}</span>
			</div>
			<div class="status-item">
				<span class="label">Logs Throttled:</span>
				<span class="value throttled">{throttledCount}</span>
			</div>
		</div>
	</section>

	<!-- Controles de Teste -->
	<section class="controls-panel">
		<h2>🎛️ Controles de Teste</h2>
		<div class="controls-grid">
			<button onclick={() => testThemeChange(THEME_TYPES.LIGHT)} class="btn btn-light">
				🌞 Tema Claro
			</button>
			<button onclick={() => testThemeChange(THEME_TYPES.DARK)} class="btn btn-dark">
				🌙 Tema Escuro
			</button>
			<button onclick={() => testThemeChange(THEME_TYPES.SYSTEM)} class="btn btn-system">
				🖥️ Sistema
			</button>
			<button onclick={toggleTheme} class="btn btn-toggle">
				🔄 Toggle
			</button>
			<button onclick={runStressTest} class="btn btn-stress">
				⚡ Stress Test
			</button>
			<button onclick={runFullTest} class="btn btn-full">
				🔬 Teste Completo
			</button>
			<button onclick={clearLogs} class="btn btn-clear">
				🗑️ Limpar
			</button>
			<button onclick={exportLogs} class="btn btn-export">
				📤 Exportar
			</button>
		</div>
	</section>

	<!-- Performance Stats -->
	{#if performanceStats}
	<section class="performance-panel">
		<h2>⚡ Estatísticas de Performance</h2>
		<div class="stats-grid">
			<div class="stat-card">
				<div class="stat-value">{performanceStats.avgTransitionTime}ms</div>
				<div class="stat-label">Tempo Médio de Transição</div>
			</div>
			<div class="stat-card">
				<div class="stat-value">{performanceStats.themeLogs}</div>
				<div class="stat-label">Logs de Tema</div>
			</div>
			<div class="stat-card">
				<div class="stat-value">{performanceStats.transitionLogs}</div>
				<div class="stat-label">Logs de Transição</div>
			</div>
			<div class="stat-card performance-{performanceStats.performance}">
				<div class="stat-value">{performanceStats.performance}</div>
				<div class="stat-label">Performance Geral</div>
			</div>
		</div>
	</section>
	{/if}

	<!-- Logs em Tempo Real -->
	<section class="logs-panel">
		<div class="logs-header">
			<h2>📝 Logs em Tempo Real</h2>
			<button onclick={toggleRealTimeLogging} class="btn btn-{isRealTimeLogging ? 'stop' : 'start'}">
				{isRealTimeLogging ? '⏹️ Parar' : '▶️ Iniciar'}
			</button>
		</div>
		
		{#if isRealTimeLogging}
		<div class="logs-output">
			{#each recentLogs as log (log.id)}
				<div class="log-entry log-{log.category}">
					<span class="log-time">[{formatTime(log.timestamp)}]</span>
					<span class="log-content">{log.formatted}</span>
				</div>
			{/each}
		</div>
		{/if}
	</section>

	<!-- Resultados do Teste Completo -->
	{#if testResults}
	<section class="results-panel">
		<h2>🔬 Resultados do Teste Completo</h2>
		<div class="results-summary">
			<p><strong>Tempo Total:</strong> {testResults.results[0]?.data?.totalTestTime || 'N/A'}</p>
			<p><strong>Testes Executados:</strong> {testResults.results?.length || 0}</p>
			<p><strong>Taxa de Sucesso:</strong> {testResults.results ? Math.round((testResults.results.filter(r => r.status === 'success').length / testResults.results.length) * 100) : 0}%</p>
		</div>
		
		<details class="test-details">
			<summary>Ver Detalhes dos Testes</summary>
			<div class="test-results-list">
				{#each testResults.results || [] as result}
					<div class="test-result test-{result.status}">
						<span class="test-name">{result.testName}</span>
						<span class="test-status">{result.status}</span>
						<span class="test-time">{formatTime(result.timestamp)}</span>
					</div>
				{/each}
			</div>
		</details>
	</section>
	{/if}
</div>

<style>
	.test-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 20px;
		font-family: var(--font-body);
		color: var(--theme-text);
	}

	h1 {
		text-align: center;
		color: var(--theme-primary);
		margin-bottom: 2rem;
	}

	h2 {
		color: var(--theme-primary);
		margin-bottom: 1rem;
		font-size: 1.2rem;
	}

	section {
		background: var(--theme-surface);
		border-radius: 12px;
		padding: 24px;
		margin: 24px 0;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
	}

	.status-grid, .controls-grid, .stats-grid {
		display: grid;
		gap: 16px;
	}

	.status-grid {
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	}

	.controls-grid {
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
	}

	.stats-grid {
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	}

	.status-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px;
		background: var(--theme-background);
		border-radius: 8px;
	}

	.label {
		font-weight: 600;
		opacity: 0.8;
	}

	.value {
		font-weight: 700;
	}

	.theme-badge {
		padding: 4px 12px;
		border-radius: 16px;
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	.theme-light {
		background: #fbbf24;
		color: #000;
	}

	.theme-dark {
		background: #6366f1;
		color: #fff;
	}

	.theme-system {
		background: #8b5cf6;
		color: #fff;
	}

	.throttled {
		color: var(--theme-accent);
	}

	.btn {
		padding: 12px 16px;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		font-size: 0.9rem;
	}

	.btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(0,0,0,0.2);
	}

	.btn-light { background: #fbbf24; color: #000; }
	.btn-dark { background: #374151; color: #fff; }
	.btn-system { background: #8b5cf6; color: #fff; }
	.btn-toggle { background: var(--theme-primary); color: var(--theme-background); }
	.btn-stress { background: #ef4444; color: #fff; }
	.btn-full { background: #06b6d4; color: #fff; }
	.btn-clear { background: #6b7280; color: #fff; }
	.btn-export { background: #10b981; color: #fff; }
	.btn-start { background: #22c55e; color: #fff; }
	.btn-stop { background: #ef4444; color: #fff; }

	.stat-card {
		text-align: center;
		padding: 20px;
		background: var(--theme-background);
		border-radius: 8px;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--theme-primary);
		display: block;
	}

	.stat-label {
		font-size: 0.85rem;
		opacity: 0.7;
		margin-top: 8px;
	}

	.performance-excelente .stat-value { color: #22c55e; }
	.performance-boa .stat-value { color: #fbbf24; }
	.performance-lenta .stat-value { color: #ef4444; }

	.logs-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.logs-output {
		background: #000;
		color: #00ff00;
		padding: 16px;
		border-radius: 8px;
		font-family: 'Courier New', monospace;
		font-size: 12px;
		max-height: 300px;
		overflow-y: auto;
	}

	.log-entry {
		margin: 4px 0;
		display: flex;
		gap: 12px;
	}

	.log-time {
		color: #888;
		min-width: 100px;
	}

	.log-content {
		flex: 1;
	}

	.log-theme { color: #ff6b9d; }
	.log-transition { color: #4ecdc4; }
	.log-component { color: #45b7d1; }
	.log-store { color: #96ceb4; }
	.log-error { color: #ff6b6b; }
	.log-info { color: #4ecdc4; }

	.results-summary {
		background: var(--theme-background);
		padding: 16px;
		border-radius: 8px;
		margin-bottom: 16px;
	}

	.test-details summary {
		cursor: pointer;
		font-weight: 600;
		padding: 12px;
		background: var(--theme-background);
		border-radius: 8px;
		margin-bottom: 12px;
	}

	.test-results-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.test-result {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 12px;
		padding: 12px;
		border-radius: 6px;
		font-size: 0.9rem;
	}

	.test-success {
		background: rgba(34, 197, 94, 0.1);
		border-left: 4px solid #22c55e;
	}

	.test-failure {
		background: rgba(239, 68, 68, 0.1);
		border-left: 4px solid #ef4444;
	}

	.test-status {
		font-weight: 700;
		text-transform: uppercase;
	}

	.test-time {
		opacity: 0.7;
		font-size: 0.8rem;
	}

	@media (max-width: 768px) {
		.test-container {
			padding: 12px;
		}

		.controls-grid {
			grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		}

		.stats-grid {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		}

		.status-grid {
			grid-template-columns: 1fr;
		}

		.status-item {
			flex-direction: column;
			text-align: center;
			gap: 8px;
		}
	}
</style>
