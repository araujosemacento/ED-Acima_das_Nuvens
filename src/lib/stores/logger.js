import { dev } from '$app/environment';

/**
 * Store de Logger para Desenvolvimento
 * Só executa logs em ambiente de desenvolvimento
 * Mensagens humanizadas em português brasileiro
 */
class DevLogger {
    constructor() {
        this.isDev = !dev;
        this.prefix = '🐛 [DESENVOLVIMENTO]';
        this.transitionTimers = new Map(); // Para medição de performance das transições
        this.thresholds = {
            transition: 300, // Tempo esperado máximo para transições CSS (ms)
            animation: 500   // Tempo esperado máximo para animações (ms)
        };
    }

    /**
     * Log genérico com timestamp humanizado
     */
    log(message, ...args) {
        if (!this.isDev) return;
        const time = new Date().toLocaleTimeString('pt-BR');
        console.log(`${this.prefix} ${time} - ${message}`, ...args);
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
     * Log específico para tema com mensagens humanizadas
     */
    theme(action, data) {
        if (!this.isDev) return;

        const actionMessages = {
            'DETECT_SYSTEM': '🔍 Detectando tema do sistema',
            'AUTO_RESTORE_USER_PREFERENCE': '🔄 Restaurando preferência do usuário',
            'APPLY_THEME': '🎨 Aplicando tema',
            'THEME_APPLIED': '✅ Tema aplicado com sucesso',
            'SET_THEME_CALLED': '👆 Usuário selecionou tema',
            'AUTO_APPLY_THEME': '🔄 Aplicação automática do tema',
            'AUTO_INIT_COMPLETE': '🚀 Inicialização do sistema de temas completa',
            'SYSTEM_THEME_AUTO_CHANGED': '🌓 Sistema mudou automaticamente o tema',
            'TRANSITION_START': '🎬 Iniciando transição de tema',
            'TRANSITION_END': '🎭 Transição de tema finalizada',
            'TRANSITION_TIMEOUT': '⏰ Transição demorou mais que o esperado'
        };

        const message = actionMessages[action] || `🎨 TEMA: ${action}`;

        console.group(`${this.prefix} ${message}`);
        console.log('🕒 Horário:', new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        }));

        if (data) {
            this.formatDataOutput(data);
        }
        console.groupEnd();
    }

    /**
     * Log para performance de transições
     */
    transition(action, data = {}) {
        if (!this.isDev) return;

        const time = new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });

        switch (action) {
            case 'START': {
                const transitionId = data.id || 'default';
                this.transitionTimers.set(transitionId, performance.now());
                console.group(`${this.prefix} 🎬 Iniciando transição: ${data.type || 'tema'}`);
                console.log('🕒 Iniciado em:', time);
                console.log('🆔 ID da transição:', transitionId);
                if (data.from && data.to) {
                    console.log(`🔄 Mudança: ${data.from} → ${data.to}`);
                }
                if (data.duration) {
                    console.log(`⏱️ Duração esperada: ${data.duration}ms`);
                }
                console.groupEnd();
                break;
            }

            case 'END': {
                const endId = data.id || 'default';
                const startTime = this.transitionTimers.get(endId);

                if (startTime) {
                    const duration = performance.now() - startTime;
                    const expected = data.expectedDuration || this.thresholds.transition;
                    const isSlowly = duration > expected;

                    console.group(`${this.prefix} ${isSlowly ? '🐌' : '⚡'} Transição finalizada: ${data.type || 'tema'}`);
                    console.log('🕒 Finalizada em:', time);
                    console.log(`⏱️ Duração real: ${duration.toFixed(2)}ms`);
                    console.log(`🎯 Duração esperada: ${expected}ms`);

                    if (isSlowly) {
                        console.log(`⚠️ Transição demorou ${(duration - expected).toFixed(2)}ms a mais que o esperado`);
                        this.warn(`Transição lenta detectada! Duração: ${duration.toFixed(2)}ms (esperado: ${expected}ms)`);
                    } else {
                        console.log('✅ Transição dentro do tempo esperado');
                    }

                    this.transitionTimers.delete(endId);
                    console.groupEnd();

                    // Retorna se a transição foi lenta para que o caller possa tomar ação
                    return isSlowly;
                } else {
                    this.warn('Fim de transição detectado sem início correspondente', { id: endId });
                }
                break;
            }

            case 'TIMEOUT': {
                const timeoutId = data.id || 'default';
                const timeoutStart = this.transitionTimers.get(timeoutId);

                if (timeoutStart) {
                    const elapsed = performance.now() - timeoutStart;
                    console.group(`${this.prefix} ⏰ Timeout de transição`);
                    console.log('🕒 Timeout em:', time);
                    console.log(`⏱️ Tempo decorrido: ${elapsed.toFixed(2)}ms`);
                    console.log(`⚠️ A transição não finalizou no tempo esperado`);
                    console.groupEnd();

                    this.transitionTimers.delete(timeoutId);
                    return true; // Indica que houve timeout
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
            'from': 'de',
            'to': 'para',
            'duration': 'duração',
            'type': 'tipo'
        };

        return keyMap[key] || key;
    }

    /**
     * Log para interações de componentes com mensagens humanizadas
     */
    component(componentName, action, data = {}) {
        if (!this.isDev) return;

        const actionMessages = {
            'GET_DISPLAY_ICON_DEBUG': '🔍 Verificando qual ícone exibir',
            'GET_DISPLAY_ICON': '🎯 Ícone do tema selecionado',
            'MAIN_THEME_UPDATE': '🔄 Atualização do tema principal',
            'USER_THEME_UPDATE': '👤 Atualização da escolha do usuário',
            'INTERACTION_UPDATE': '👆 Atualização de interação',
            'UNSUBSCRIBE_ALL': '🧹 Limpando inscrições',
            'SELECT_THEME': '🎨 Selecionando novo tema',
            'THEME_SET_CALLED': '✅ Função de definir tema chamada',
            'MOUNT': '🚀 Componente montado'
        };

        const message = actionMessages[action] || action;

        console.group(`${this.prefix} 🧩 ${componentName.toUpperCase()}: ${message}`);
        console.log('🕒 Horário:', new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        }));
        this.formatDataOutput(data);
        console.groupEnd();
    }

    /**
     * Log para stores com mensagens humanizadas
     */
    store(storeName, action, oldValue, newValue) {
        if (!this.isDev) return;

        const actionMessages = {
            'DERIVED_UPDATE': '🔄 Atualização do valor derivado',
            'SET': '📝 Valor definido',
            'UPDATE': '🔄 Valor atualizado',
            'SUBSCRIBE': '👂 Nova inscrição',
            'UNSUBSCRIBE': '👋 Inscrição removida'
        };

        const message = actionMessages[action] || action;

        console.group(`${this.prefix} 📦 STORE ${storeName.toUpperCase()}: ${message}`);
        console.log('🕒 Horário:', new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        }));
        if (oldValue !== undefined) console.log('📋 Valor anterior:', oldValue);
        if (newValue !== undefined) console.log('📋 Novo valor:', newValue);
        console.groupEnd();
    }

    /**
     * Log para eventos do DOM com mensagens humanizadas
     */
    dom(element, event, data = {}) {
        if (!this.isDev) return;

        const eventMessages = {
            'REMOVE_CLASSES': '🧹 Removendo classes CSS',
            'ADD_CLASS': '➕ Adicionando classe CSS',
            'CSS_FIRST_STRATEGY': '🎨 Estratégia CSS primeiro',
            'FALLBACK': '🔄 Aplicando fallback',
            'CSS_VARIABLES': '🎨 Variáveis CSS atualizadas',
            'TRANSITION_TRIGGER': '🎬 Trigger de transição',
            'LAYOUT_FLUSH': '📐 Forçando recálculo de layout'
        };

        const message = eventMessages[event] || event;

        console.group(`${this.prefix} 🌐 DOM ${element}: ${message}`);
        console.log('🕒 Horário:', new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        }));
        this.formatDataOutput(data);
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

        const activeTransitions = Array.from(this.transitionTimers.entries()).map(([id, startTime]) => ({
            id,
            elapsed: performance.now() - startTime,
            status: 'em_andamento'
        }));

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
     * Log específico para animações JavaScript
     */
    animation(action, data = {}) {
        if (!this.isDev) return;

        const time = new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        });

        const actionMessages = {
            'START': '🎬 Iniciando animação JavaScript',
            'STEP': '📈 Passo da animação',
            'PROGRESS': '⏳ Progresso da animação',
            'COMPLETE': '✅ Animação concluída',
            'ERROR': '❌ Erro na animação',
            'INTERPOLATE': '🔄 Interpolação de cores',
            'EASING': '📊 Aplicando easing'
        };

        const message = actionMessages[action] || `🎭 ANIMAÇÃO: ${action}`;

        console.group(`${this.prefix} ${message}`);
        console.log('🕒 Horário:', time);
        this.formatDataOutput(data);
        console.groupEnd();
    }

    /**
     * Log específico para interpolação de cores
     */
    colorInterpolation(from, to, progress, result) {
        if (!this.isDev) return;

        console.group(`${this.prefix} 🌈 Interpolação de Cores`);
        console.log('🕒 Horário:', new Date().toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
        }));
        console.log('📋 Cor inicial:', from);
        console.log('📋 Cor final:', to);
        console.log('📋 Progresso:', `${(progress * 100).toFixed(1)}%`);
        console.log('📋 Resultado:', result);
        console.groupEnd();
    }

    /**
     * Exibe um resumo das capacidades do logger
     */
    showCapabilities() {
        if (!this.isDev) return;

        console.group(`${this.prefix} 📚 Capacidades do Logger`);
        console.log('🎨 Logs de tema com medição de performance');
        console.log('🧩 Logs de componentes humanizados em português');
        console.log('📦 Logs de stores com rastreamento de mudanças');
        console.log('🌐 Logs de DOM com detalhes de manipulação');
        console.log('⏱️ Medição automática de performance de transições');
        console.log('🚨 Alertas automáticos para transições lentas');
        console.log('🎭 Animações JavaScript puras com logs detalhados');
        console.log('🌈 Interpolação de cores com rastreamento');
        console.log('❌ CSS transitions desabilitadas - JavaScript assumiu controle');

        console.group('📊 Métodos disponíveis:');
        console.log('• logger.theme(action, data) - Logs de tema');
        console.log('• logger.transition(action, data) - Medição de transições');
        console.log('• logger.animation(action, data) - Logs de animações JavaScript');
        console.log('• logger.colorInterpolation(from, to, progress, result) - Interpolação');
        console.log('• logger.component(name, action, data) - Logs de componentes');
        console.log('• logger.store(name, action, oldVal, newVal) - Logs de stores');
        console.log('• logger.dom(element, event, data) - Logs de DOM');
        console.log('• logger.getTransitionStats() - Estatísticas de performance');
        console.log('• logger.setThresholds(transition, animation) - Configurar limites');
        console.groupEnd();

        console.group('🎯 Limites atuais de performance:');
        console.log(`Transições: ${this.thresholds.transition}ms`);
        console.log(`Animações: ${this.thresholds.animation}ms`);
        console.groupEnd();

        console.group('🔄 Estratégia atual:');
        console.log('✅ Transições CSS desabilitadas para cores de tema');
        console.log('✅ JavaScript puro para animações de tema');
        console.log('✅ Interpolação suave de cores HSL');
        console.log('✅ Easing customizado (ease-in-out)');
        console.log('✅ 60fps com 300ms de duração');
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
