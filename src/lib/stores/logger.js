import { dev } from '$app/environment';

/**
 * Store de Logger para Desenvolvimento
 * Só executa logs em ambiente de desenvolvimento
 * Mensagens humanizadas em português brasileiro
 *
 * Modos:
 * - default: Logs essenciais e legíveis para humanos
 * - verbose: Logs detalhados para máquinas/IA e debugging avançado
 */
class DevLogger {
	constructor() {
		this.isDev = dev;
		this.prefix = '⇄ [ED]';
		this.verboseMode = false; // Modo verbose desabilitado por padrão
		this.transitionTimers = new Map();
		this.thresholds = {
			transition: 300,
			animation: 500
		};

		// Sistema de throttling para reduzir spam de logs
		this.throttleDelay = 10000; // 10 segundos entre mensagens similares
		this.lastLogTimes = new Map(); // Mapeia chaves de log para timestamps
		this.pendingLogs = new Map(); // Logs agendados para execução

		// Configurar modo verbose via localStorage ou query param
		this.initVerboseMode();
	}

	/**
	 * Inicializa o modo verbose baseado em preferências
	 */
	initVerboseMode() {
		if (!this.isDev) return;

		try {
			// Verificar query parameter
			const urlParams = new URLSearchParams(window.location.search);
			if (urlParams.get('verbose') === 'true') {
				this.verboseMode = true;
				localStorage.setItem('ed-logger-verbose', 'true');
				return;
			}

			// Verificar localStorage
			const stored = localStorage.getItem('ed-logger-verbose');
			this.verboseMode = stored === 'true';
		} catch {
			// Fallback silencioso se localStorage não estiver disponível
			this.verboseMode = false;
		}
	}

	/**
	 * Habilita/desabilita o modo verbose
	 */
	setVerbose(enabled = true) {
		if (!this.isDev) return;

		this.verboseMode = enabled;
		try {
			localStorage.setItem('ed-logger-verbose', enabled.toString());
		} catch {
			// Ignorar erro se localStorage não estiver disponível
		}

		this.info(`Modo verbose ${enabled ? 'ativado' : 'desativado'} 🔧`);
	}

	/**
	 * Verifica se o modo verbose está ativo
	 */
	isVerbose() {
		return this.isDev && this.verboseMode;
	}

	/**
	 * Cria uma chave única para throttling baseada no tipo e conteúdo do log
	 */
	createLogKey(method, action) {
		// Para logs de animação, agrupar por tipo de ação
		if (method === 'animation') {
			return `animation-${action}`;
		}

		// Para logs de tema, agrupar por ação principal
		if (method === 'theme') {
			return `theme-${action}`;
		}

		// Para outros métodos, usar método + ação
		return `${method}-${action}`;
	}

	/**
	 * Verifica se um log deve ser throttled (limitado)
	 */
	shouldThrottleLog(key) {
		const now = Date.now();
		const lastTime = this.lastLogTimes.get(key);

		if (!lastTime) {
			// Primeiro log desta chave, permite
			return false;
		}

		// Verifica se ainda está dentro do período de throttle
		return (now - lastTime) < this.throttleDelay;
	}

	/**
	 * Registra o timestamp de um log executado
	 */
	markLogExecuted(key) {
		this.lastLogTimes.set(key, Date.now());
	}

	/**
	 * Agenda um log para execução após o período de throttle
	 */
	scheduleDelayedLog(key, logFunction) {
		// Cancela log agendado anterior se existir
		const existing = this.pendingLogs.get(key);
		if (existing) {
			clearTimeout(existing.timeoutId);
		}

		// Calcula quando pode executar o próximo log
		const lastTime = this.lastLogTimes.get(key) || 0;
		const nextTime = lastTime + this.throttleDelay;
		const delay = Math.max(0, nextTime - Date.now());

		// Agenda execução
		const timeoutId = setTimeout(() => {
			logFunction();
			this.markLogExecuted(key);
			this.pendingLogs.delete(key);
		}, delay);

		this.pendingLogs.set(key, { timeoutId, scheduledFor: nextTime });
	}

	/**
	 * Wrapper para throttled logging
	 */
	throttledLog(method, action, logFunction) {
		if (!this.isDev) return;

		const key = this.createLogKey(method, action);

		if (!this.shouldThrottleLog(key)) {
			// Pode executar imediatamente
			logFunction();
			this.markLogExecuted(key);
		} else {
			// Agenda para execução futura
			this.scheduleDelayedLog(key, logFunction);
		}
	}

	/**
	 * Configura o delay de throttling (em ms)
	 */
	setThrottleDelay(delayMs) {
		if (!this.isDev) return;

		this.throttleDelay = delayMs;
		this.info(`Delay de throttling configurado para ${delayMs}ms (${(delayMs / 1000).toFixed(1)}s) 🕐`);
	}

	/**
	 * Limpa todos os logs agendados
	 */
	clearPendingLogs() {
		if (!this.isDev) return;

		this.pendingLogs.forEach(({ timeoutId }) => {
			clearTimeout(timeoutId);
		});

		this.pendingLogs.clear();
		this.info('Logs pendentes limpos 🧹');
	}

	/**
	 * Log genérico com timestamp humanizado (simplificado)
	 */
	log(message, ...args) {
		if (!this.isDev) return;

		if (this.verboseMode) {
			const time = new Date().toLocaleTimeString('pt-BR');
			console.log(`${this.prefix} ${time} - ${message}`, ...args);
		} else {
			console.log(`${this.prefix} ${message}`, ...args);
		}
	}

	/**
	 * Log de informação
	 */
	info(message, ...args) {
		if (!this.isDev) return;
		console.info(`${this.prefix} ℹ️ ${message}`, ...args);
	}

	/**
	 * Log de aviso
	 */
	warn(message, ...args) {
		if (!this.isDev) return;
		console.warn(`${this.prefix} ⚠️ ${message}`, ...args);
	}

	/**
	 * Log de erro
	 */
	error(message, ...args) {
		if (!this.isDev) return;
		console.error(`${this.prefix} ❌ ${message}`, ...args);
	}

	/**
	 * Log específico para tema com mensagens humanizadas (com throttling)
	 */
	theme(action, data) {
		if (!this.isDev) return;

		const actionMessages = {
			DETECT_SYSTEM: '🔍 Detectando tema do sistema',
			AUTO_RESTORE_USER_PREFERENCE: '🔄 Restaurando preferência do usuário',
			APPLY_THEME: '🎨 Aplicando tema',
			THEME_APPLIED: '✅ Tema aplicado',
			SET_THEME_CALLED: '👆 Tema selecionado pelo usuário',
			AUTO_APPLY_THEME: '🔄 Aplicação automática',
			AUTO_INIT_COMPLETE: '🚀 Sistema de temas inicializado',
			SYSTEM_THEME_AUTO_CHANGED: '🌓 Sistema mudou o tema automaticamente',
			TRANSITION_START: '🎬 Transição iniciada',
			TRANSITION_END: '🎭 Transição finalizada',
			TRANSITION_TIMEOUT: '⏰ Transição demorou mais que o esperado'
		};

		const message = actionMessages[action] || `🎨 TEMA: ${action}`;

		// Ações que devem sempre aparecer (importantes para usuário)
		const alwaysShowActions = [
			'SET_THEME_CALLED',
			'AUTO_INIT_COMPLETE',
			'THEME_APPLIED'
		];

		// Ações que podem ser throttled (frequentes/automáticas)
		const throttledActions = [
			'DETECT_SYSTEM',
			'AUTO_RESTORE_USER_PREFERENCE',
			'APPLY_THEME',
			'AUTO_APPLY_THEME',
			'SYSTEM_THEME_AUTO_CHANGED',
			'TRANSITION_START',
			'TRANSITION_END'
		];

		const executeLog = () => {
			if (this.verboseMode) {
				// Modo verbose: logs detalhados com grupos
				console.group(`${this.prefix} ${message}`);
				console.log(
					'🕒 Horário:',
					new Date().toLocaleTimeString('pt-BR', {
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit',
						fractionalSecondDigits: 3
					})
				);

				if (data) {
					this.formatDataOutput(data);
				}
				console.groupEnd();
			} else {
				// Modo padrão: log simples
				if (data && Object.keys(data).length > 0) {
					const summary = this.getDataSummary(data);
					console.log(`${this.prefix} ${message}${summary ? ` - ${summary}` : ''}`);
				} else {
					console.log(`${this.prefix} ${message}`);
				}
			}
		};

		if (alwaysShowActions.includes(action)) {
			// Executar imediatamente
			executeLog();
		} else if (throttledActions.includes(action)) {
			// Usar throttling
			this.throttledLog('theme', action, executeLog);
		} else {
			// Ações desconhecidas: usar throttling por segurança
			this.throttledLog('theme', action, executeLog);
		}
	}

	/**
	 * Log para performance de transições (simplificado)
	 */
	transition(action, data = {}) {
		if (!this.isDev) return;

		switch (action) {
			case 'START': {
				const transitionId = data.id || 'default';
				this.transitionTimers.set(transitionId, performance.now());

				if (this.verboseMode) {
					console.group(`${this.prefix} 🎬 Transição iniciada: ${data.type || 'tema'}`);
					console.log(
						'🕒 Iniciado em:',
						new Date().toLocaleTimeString('pt-BR', {
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit',
							fractionalSecondDigits: 3
						})
					);
					console.log('🆔 ID:', transitionId);
					if (data.from && data.to) console.log(`🔄 Mudança: ${data.from} → ${data.to}`);
					if (data.duration) console.log(`⏱️ Duração esperada: ${data.duration}ms`);
					console.groupEnd();
				} else {
					const change = data.from && data.to ? ` ${data.from} → ${data.to}` : '';
					console.log(`${this.prefix} 🎬 Transição iniciada${change}`);
				}
				break;
			}

			case 'END': {
				const endId = data.id || 'default';
				const startTime = this.transitionTimers.get(endId);

				if (startTime) {
					const duration = performance.now() - startTime;
					const expected = data.expectedDuration || this.thresholds.transition;
					const isSlowly = duration > expected;

					if (this.verboseMode || isSlowly) {
						const icon = isSlowly ? '🐌' : '⚡';
						console.log(
							`${this.prefix} ${icon} Transição finalizada em ${duration.toFixed(0)}ms${isSlowly ? ' (lenta!)' : ''}`
						);

						if (this.verboseMode) {
							console.group(`${this.prefix} ${icon} Detalhes da transição`);
							console.log(`⏱️ Duração: ${duration.toFixed(2)}ms`);
							console.log(`🎯 Esperado: ${expected}ms`);
							if (isSlowly) {
								console.log(`⚠️ Atraso: ${(duration - expected).toFixed(2)}ms`);
							}
							console.groupEnd();
						}
					} else {
						console.log(`${this.prefix} ⚡ Transição finalizada em ${duration.toFixed(0)}ms`);
					}

					this.transitionTimers.delete(endId);
					return isSlowly;
				}
				break;
			}

			case 'TIMEOUT': {
				const timeoutId = data.id || 'default';
				const timeoutStart = this.transitionTimers.get(timeoutId);

				if (timeoutStart) {
					const elapsed = performance.now() - timeoutStart;
					console.log(`${this.prefix} ⏰ Timeout da transição após ${elapsed.toFixed(0)}ms`);
					this.transitionTimers.delete(timeoutId);
					return true;
				}
				break;
			}
		}

		return false;
	}

	/**
	 * Formatar saída de dados de forma mais legível
	 */
	formatDataOutput(data) {
		Object.entries(data).forEach(([key, value]) => {
			const formattedKey = this.formatKey(key);
			console.log(`📋 ${formattedKey}:`, value);
		});
	}

	/**
	 * Formatar chaves para português mais legível
	 */
	formatKey(key) {
		const keyMap = {
			'Has user interaction': 'Usuário já interagiu',
			'User theme': 'Tema escolhido pelo usuário',
			'Current theme (from store)': 'Tema atual (da store)',
			'Current theme (effective)': 'Tema efetivo atual',
			'Old current theme': 'Tema atual anterior',
			'New current theme (effective)': 'Novo tema efetivo',
			'Old user theme': 'Tema do usuário anterior',
			'New user theme (choice)': 'Nova escolha do usuário',
			'Old has interaction': 'Tinha interação anterior',
			'New has interaction': 'Nova interação',
			'Theme requested': 'Tema solicitado',
			'Theme set to': 'Tema definido para',
			'Media query matches': 'Media query corresponde',
			'Sistema detectado': 'Sistema detectado',
			'Restored theme': 'Tema restaurado',
			'Tema solicitado': 'Tema solicitado',
			'Browser disponível': 'Navegador disponível',
			'Document ready': 'Documento pronto',
			'Classes removidas': 'Classes removidas',
			'Nova classe': 'Nova classe',
			'Classes atuais': 'Classes atuais',
			'Era válido': 'Era válido',
			from: 'de',
			to: 'para',
			duration: 'duração',
			type: 'tipo'
		};

		return keyMap[key] || key;
	}

	/**
	 * Cria um resumo dos dados para o modo padrão
	 */
	getDataSummary(data) {
		if (!data || typeof data !== 'object') return '';

		const keys = Object.keys(data);
		if (keys.length === 0) return '';

		// Identifica valores importantes
		const importantValues = [];

		keys.forEach((key) => {
			const value = data[key];
			const lowerKey = key.toLowerCase();

			// Valores que são interessantes para resumo
			if (lowerKey.includes('tema') || lowerKey.includes('theme')) {
				importantValues.push(value);
			} else if (lowerKey.includes('componente') || lowerKey.includes('component')) {
				importantValues.push(value);
			} else if (lowerKey.includes('de') && lowerKey.includes('para')) {
				importantValues.push(`${data[key]}`);
			}
		});

		if (importantValues.length > 0) {
			return importantValues.join(' → ');
		}

		// Fallback: primeiro valor se não encontrou nada específico
		return keys.length === 1 ? String(data[keys[0]]) : `${keys.length} propriedades`;
	}

	/**
	 * Log para interações de componentes (simplificado)
	 */
	component(componentName, action, data = {}) {
		if (!this.isDev) return;

		const actionMessages = {
			GET_DISPLAY_ICON_DEBUG: '🔍 Verificando ícone',
			GET_DISPLAY_ICON: '🎯 Ícone selecionado',
			MAIN_THEME_UPDATE: '🔄 Tema atualizado',
			USER_THEME_UPDATE: '👤 Preferência atualizada',
			INTERACTION_UPDATE: '👆 Interação registrada',
			UNSUBSCRIBE_ALL: '🧹 Limpeza realizada',
			SELECT_THEME: '🎨 Tema selecionado',
			THEME_SET_CALLED: '✅ Função chamada',
			MOUNT: '🚀 Componente montado'
		};

		const message = actionMessages[action] || action;

		if (this.verboseMode) {
			// Modo verbose: logs detalhados
			console.group(`${this.prefix} 🧩 ${componentName.toUpperCase()}: ${message}`);
			console.log(
				'🕒 Horário:',
				new Date().toLocaleTimeString('pt-BR', {
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					fractionalSecondDigits: 3
				})
			);
			this.formatDataOutput(data);
			console.groupEnd();
		} else {
			// Modo padrão: log simples
			const summary = this.getDataSummary(data);
			console.log(
				`${this.prefix} 🧩 ${componentName}: ${message}${summary ? ` - ${summary}` : ''}`
			);
		}
	}

	/**
	 * Log para stores (simplificado)
	 */
	store(storeName, action, oldValue, newValue) {
		if (!this.isDev) return;

		const actionMessages = {
			DERIVED_UPDATE: '🔄 Valor derivado atualizado',
			SET: '📝 Valor definido',
			UPDATE: '🔄 Valor atualizado',
			SUBSCRIBE: '👂 Nova inscrição',
			UNSUBSCRIBE: '👋 Inscrição removida'
		};

		const message = actionMessages[action] || action;

		if (this.verboseMode) {
			console.group(`${this.prefix} 📦 STORE ${storeName.toUpperCase()}: ${message}`);
			console.log(
				'🕒 Horário:',
				new Date().toLocaleTimeString('pt-BR', {
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					fractionalSecondDigits: 3
				})
			);
			if (oldValue !== undefined) console.log('📋 Valor anterior:', oldValue);
			if (newValue !== undefined) console.log('📋 Novo valor:', newValue);
			console.groupEnd();
		} else {
			// Modo padrão: apenas mudanças de valor importantes
			if (action === 'SET' || action === 'UPDATE') {
				const change =
					oldValue !== undefined && newValue !== undefined
						? ` ${oldValue} → ${newValue}`
						: newValue !== undefined
							? ` → ${newValue}`
							: '';
				console.log(`${this.prefix} 📦 ${storeName}: ${message}${change}`);
			}
		}
	}

	/**
	 * Log para eventos do DOM (simplificado)
	 */
	dom(element, event, data = {}) {
		if (!this.isDev) return;

		const eventMessages = {
			REMOVE_CLASSES: '🧹 Classes removidas',
			ADD_CLASS: '➕ Classe adicionada',
			CSS_FIRST_STRATEGY: '🎨 Estratégia CSS primeiro',
			FALLBACK: '🔄 Fallback aplicado',
			CSS_VARIABLES: '🎨 Variáveis CSS atualizadas',
			TRANSITION_TRIGGER: '🎬 Transição disparada',
			LAYOUT_FLUSH: '📐 Layout recalculado'
		};

		const message = eventMessages[event] || event;

		if (this.verboseMode) {
			console.group(`${this.prefix} 🌐 DOM ${element}: ${message}`);
			console.log(
				'🕒 Horário:',
				new Date().toLocaleTimeString('pt-BR', {
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					fractionalSecondDigits: 3
				})
			);
			this.formatDataOutput(data);
			console.groupEnd();
		} else {
			// Modo padrão: apenas eventos importantes
			const importantEvents = ['CSS_VARIABLES', 'TRANSITION_TRIGGER', 'FALLBACK'];
			if (importantEvents.includes(event)) {
				console.log(`${this.prefix} 🌐 ${element}: ${message}`);
			}
		}
	}

	/**
	 * Log específico para interpolação de cores (simplificado)
	 */
	colorInterpolation(from, to, progress, result) {
		if (!this.isDev || !this.verboseMode) return; // Apenas no modo verbose

		console.group(`${this.prefix} 🌈 Interpolação de Cores`);
		console.log(
			'🕒 Horário:',
			new Date().toLocaleTimeString('pt-BR', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				fractionalSecondDigits: 3
			})
		);
		console.log('📋 Cor inicial:', from);
		console.log('📋 Cor final:', to);
		console.log('📋 Progresso:', `${(progress * 100).toFixed(1)}%`);
		console.log('📋 Resultado:', result);
		console.groupEnd();
	}

	/**
	 * Inicia um grupo de logs
	 */
	group(name) {
		if (!this.isDev) return;
		console.group(`${this.prefix} 📋 ${name}`);
	}

	/**
	 * Termina um grupo de logs
	 */
	groupEnd() {
		if (!this.isDev) return;
		console.groupEnd();
	}

	/**
	 * Log com tabela
	 */
	table(data, label = 'Dados') {
		if (!this.isDev) return;
		console.log(`${this.prefix} 📊 ${label}:`);
		console.table(data);
	}

	/**
	 * Limpa o console (só em dev)
	 */
	clear() {
		if (!this.isDev) return;
		console.clear();
		this.log('Console limpo');
	}

	/**
	 * Método para verificar se transições estão lentas
	 * Retorna estatísticas das transições
	 */
	getTransitionStats() {
		if (!this.isDev) return null;

		const activeTransitions = Array.from(this.transitionTimers.entries()).map(
			([id, startTime]) => ({
				id,
				elapsed: performance.now() - startTime,
				status: 'em_andamento'
			})
		);

		return {
			transições_ativas: activeTransitions.length,
			transições_em_andamento: activeTransitions,
			limite_transição: this.thresholds.transition,
			limite_animação: this.thresholds.animation
		};
	}

	/**
	 * Configura novos limites de performance
	 */
	setThresholds(transition = 300, animation = 500) {
		if (!this.isDev) return;

		this.thresholds.transition = transition;
		this.thresholds.animation = animation;

		this.info(`Novos limites configurados: Transição ${transition}ms, Animação ${animation}ms`);
	}

	/**
	 * Log específico para animações JavaScript (simplificado)
	 */
	animation(action, data = {}) {
		if (!this.isDev) return;

		const actionMessages = {
			START: '🎬 Animação iniciada',
			STEP: '📈 Passo da animação',
			PROGRESS: '⏳ Progresso',
			COMPLETE: '✅ Animação concluída',
			ERROR: '❌ Erro na animação',
			INTERPOLATE: '🔄 Interpolação',
			EASING: '📊 Easing aplicado',
			COMPONENT_MOUNT: '🚀 Componente montado',
			MOUNT_INIT_CALL: '� Inicializando animações',
			COMPONENT_UNMOUNT: '👋 Componente desmontado',
			COMPONENT_UNMOUNT_COMPLETE: '✅ Limpeza concluída',
			STORE_SET_ACTIVE: '⚡ Animações ativadas/desativadas',
			STORE_INIT_START: '🎯 Inicializando elementos',
			STORE_ANIMATION_CREATED: '✨ Animação criada',
			STORE_ANIMATION_READY: '� Animação pronta'
		};

		const message = actionMessages[action] || `🎭 ${action}`;

		if (this.verboseMode) {
			// Modo verbose: logs detalhados
			console.group(`${this.prefix} ${message}`);
			console.log(
				'🕒 Horário:',
				new Date().toLocaleTimeString('pt-BR', {
					hour: '2-digit',
					minute: '2-digit',
					second: '2-digit',
					fractionalSecondDigits: 3
				})
			);
			this.formatDataOutput(data);
			console.groupEnd();
		} else {
			// Modo padrão: log simples apenas para eventos importantes
			const importantActions = [
				'COMPONENT_MOUNT',
				'COMPONENT_UNMOUNT',
				'STORE_SET_ACTIVE',
				'STORE_INIT_START',
				'ERROR',
				'COMPLETE'
			];

			if (importantActions.includes(action)) {
				const summary = this.getDataSummary(data);
				console.log(`${this.prefix} ${message}${summary ? ` - ${summary}` : ''}`);
			}
		}
	}

	/**
	 * Exibe um resumo das capacidades do logger
	 */
	showCapabilities() {
		if (!this.isDev) return;

		console.group(`${this.prefix} 📚 Logger ED | Acima das Nuvens`);

		console.log(`🔧 Modo atual: ${this.verboseMode ? 'VERBOSE' : 'PADRÃO'}`);
		console.log('');

		if (this.verboseMode) {
			console.log('📊 MODO VERBOSE - Logs detalhados para debugging');
			console.log('• Timestamps precisos com milissegundos');
			console.log('• Grupos expandidos com dados completos');
			console.log('• Interpolação de cores rastreada');
			console.log('• Todos os eventos de animação');
			console.log('• Performance de transições detalhada');
		} else {
			console.log('�‍💻 MODO PADRÃO - Logs essenciais para humanos');
			console.log('• Mensagens simples e diretas');
			console.log('• Apenas eventos importantes');
			console.log('• Resumos automáticos de dados');
			console.log('• Alertas de performance preservados');
		}

		console.log('');
		console.group('�️ Controles disponíveis:');
		console.log('• logger.setVerbose(true) - Ativar modo verbose');
		console.log('• logger.setVerbose(false) - Ativar modo padrão');
		console.log('• logger.isVerbose() - Verificar modo atual');
		console.log('• logger.setThrottleDelay(ms) - Configurar delay entre logs');
		console.log('• logger.clearPendingLogs() - Limpar logs agendados');
		console.log('• ?verbose=true na URL - Ativar verbose temporariamente');
		console.groupEnd();

		console.group('📊 Métodos de log:');
		console.log('• logger.theme(action, data) - Eventos de tema');
		console.log('• logger.component(name, action, data) - Componentes');
		console.log('• logger.animation(action, data) - Animações');
		console.log('• logger.transition(action, data) - Transições');
		console.log('• logger.store(name, action, oldVal, newVal) - Stores');
		console.log('• logger.dom(element, event, data) - DOM');
		console.groupEnd();

		console.group('🎯 Características:');
		console.log('✅ Português brasileiro humanizado');
		console.log('✅ Redução de bloating de dados');
		console.log('✅ Modo padrão otimizado para leitura humana');
		console.log('✅ Modo verbose para análise técnica');
		console.log('✅ Alertas automáticos para performance');
		console.log('✅ Persistência de preferências');
		console.log('✅ Sistema de throttling (10s entre logs similares)');
		console.log('✅ Logs importantes sempre visíveis');
		console.groupEnd();

		console.groupEnd();
	}
}

// Exporta instância única
export const logger = new DevLogger();

// Mostra capacidades na primeira vez que o logger é importado (apenas em dev)
if (logger.isDev) {
	logger.showCapabilities();
}
