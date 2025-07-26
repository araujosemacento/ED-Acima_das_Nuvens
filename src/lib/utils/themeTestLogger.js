// Utilitário para testar e extrair logs do sistema de temas
import { logger } from '../stores/logger.js';
import { themeStore, THEME_TYPES } from '../stores/theme.js';

/**
 * Teste automatizado do sistema de temas com logs detalhados
 */
export class ThemeTestLogger {
    constructor() {
        this.testResults = [];
        this.startTime = performance.now();
    }

    /**
     * Executa teste completo do sistema de temas
     */
    async runFullThemeTest() {
        logger.actions.info('=== INICIANDO TESTE COMPLETO DO SISTEMA DE TEMAS ===');

        // Limpa logs anteriores para teste limpo
        logger.actions.clear();

        const tests = [
            () => this.testInitialState(),
            () => this.testThemeChange(THEME_TYPES.LIGHT),
            () => this.delay(500), // Aguarda aplicação
            () => this.testThemeChange(THEME_TYPES.DARK),
            () => this.delay(500),
            () => this.testThemeChange(THEME_TYPES.SYSTEM),
            () => this.delay(500),
            () => this.testToggleTheme(),
            () => this.delay(500),
            () => this.testReapplyTheme(),
            () => this.delay(300),
            () => this.testInvalidTheme(),
            () => this.generateReport()
        ];

        for (const test of tests) {
            await test();
        }

        return this.getTestResults();
    }

    /**
     * Testa estado inicial do sistema
     */
    testInitialState() {
        logger.actions.debug('Testando estado inicial', {
            currentTheme: themeStore.utils.getCurrentTheme(),
            isDarkMode: themeStore.isDarkMode,
            isLightMode: themeStore.isLightMode,
            isSystemMode: themeStore.isSystemMode
        });

        this.addTestResult('initial_state', 'success', 'Estado inicial verificado');
    }

    /**
     * Testa mudança de tema
     */
    testThemeChange(theme) {
        const beforeTheme = themeStore.utils.getCurrentTheme();
        logger.actions.debug(`Testando mudança para ${theme}`, { beforeTheme });

        const success = themeStore.actions.setTheme(theme);
        const afterTheme = themeStore.utils.getCurrentTheme();

        this.addTestResult(`change_to_${theme}`, success ? 'success' : 'failure', {
            beforeTheme,
            afterTheme,
            success
        });
    }

    /**
     * Testa toggle de tema
     */
    testToggleTheme() {
        const beforeTheme = themeStore.utils.getCurrentTheme();
        logger.actions.debug('Testando toggle de tema', { beforeTheme });

        const newTheme = themeStore.actions.toggleTheme();
        const afterTheme = themeStore.utils.getCurrentTheme();

        this.addTestResult('toggle_theme', 'success', {
            beforeTheme,
            newTheme,
            afterTheme
        });
    }

    /**
     * Testa reaplicação de tema
     */
    testReapplyTheme() {
        const currentTheme = themeStore.utils.getCurrentTheme();
        logger.actions.debug('Testando reaplicação de tema', { currentTheme });

        themeStore.actions.reapplyTheme();

        this.addTestResult('reapply_theme', 'success', {
            theme: currentTheme,
            action: 'forced_reapplication'
        });
    }

    /**
     * Testa tema inválido
     */
    testInvalidTheme() {
        const invalidTheme = 'invalid_theme_test';
        logger.actions.debug('Testando tema inválido', { invalidTheme });

        const success = themeStore.actions.setTheme(invalidTheme);

        this.addTestResult('invalid_theme', !success ? 'success' : 'failure', {
            attemptedTheme: invalidTheme,
            wasRejected: !success
        });
    }

    /**
     * Gera relatório final
     */
    generateReport() {
        const endTime = performance.now();
        const totalTime = Math.round(endTime - this.startTime);

        const allLogs = logger.utils.getLogs();
        const themeLogsCount = allLogs.filter(log => log.category === 'theme').length;
        const transitionLogsCount = allLogs.filter(log => log.category === 'transition').length;
        const componentLogsCount = allLogs.filter(log => log.category === 'component').length;

        const report = {
            totalTestTime: `${totalTime}ms`,
            totalTests: this.testResults.length,
            successfulTests: this.testResults.filter(t => t.status === 'success').length,
            failedTests: this.testResults.filter(t => t.status === 'failure').length,
            totalLogs: allLogs.length,
            logsByCategory: {
                theme: themeLogsCount,
                transition: transitionLogsCount,
                component: componentLogsCount
            },
            testResults: this.testResults
        };

        logger.actions.info('=== RELATÓRIO FINAL DO TESTE ===', report);

        return report;
    }

    /**
     * Extrai logs filtrados por categoria
     */
    extractLogsByCategory(category = null) {
        if (category) {
            return logger.utils.getLogsByCategory(category);
        }
        return logger.utils.getLogs();
    }

    /**
     * Extrai logs human-readable
     */
    extractHumanReadableLogs() {
        const logs = logger.utils.getLogs();
        return logs.map(log => ({
            timestamp: new Date(log.timestamp).toLocaleTimeString('pt-BR'),
            category: log.category,
            message: log.formatted,
            data: log.data
        }));
    }

    /**
     * Verifica se há throttling nos logs
     */
    checkThrottling() {
        const logs = logger.utils.getLogs();
        const transitionLogs = logs.filter(log => log.category === 'transition');

        // Verifica se há múltiplas transições muito próximas
        const throttlingIssues = [];
        for (let i = 1; i < transitionLogs.length; i++) {
            const timeDiff = transitionLogs[i].timestamp - transitionLogs[i - 1].timestamp;
            if (timeDiff < 100 && transitionLogs[i].action === transitionLogs[i - 1].action) {
                throttlingIssues.push({
                    timeDiff: `${timeDiff}ms`,
                    action: transitionLogs[i].action,
                    message: 'Possível necessidade de throttling'
                });
            }
        }

        return {
            hasIssues: throttlingIssues.length > 0,
            issues: throttlingIssues,
            recommendation: throttlingIssues.length > 0
                ? 'Considere implementar throttling para transições rápidas'
                : 'Throttling adequado'
        };
    }

    /**
     * Exporta logs completos em formato JSON
     */
    exportLogs() {
        return logger.actions.export();
    }

    // Métodos auxiliares
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    addTestResult(testName, status, data) {
        this.testResults.push({
            testName,
            status,
            timestamp: Date.now(),
            data
        });
    }

    getTestResults() {
        return {
            results: this.testResults,
            logs: this.extractHumanReadableLogs(),
            throttlingCheck: this.checkThrottling(),
            exportedLogs: this.exportLogs()
        };
    }
}

// Função de conveniência para teste rápido
export async function runQuickThemeTest() {
    const tester = new ThemeTestLogger();
    return await tester.runFullThemeTest();
}

// Função para verificar logs em tempo real
export function startThemeLogging() {
    logger.actions.clear();
    logger.actions.info('=== LOGGING DE TEMAS INICIADO ===');

    // Retorna função para parar logging
    return () => {
        logger.actions.info('=== LOGGING DE TEMAS FINALIZADO ===');
        return logger.utils.getLogs();
    };
}
