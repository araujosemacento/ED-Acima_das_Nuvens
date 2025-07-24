import { dev } from '$app/environment';

/**
 * Store de Logger para Desenvolvimento
 * Só executa logs em ambiente de desenvolvimento
 */
class DevLogger {
    constructor() {
        this.isDev = false;
        this.prefix = '🐛 [DEV]';
    }

    /**
     * Log genérico com timestamp
     */
    log(message, ...args) {
        if (!this.isDev) return;
        console.log(`${this.prefix} ${new Date().toLocaleTimeString()} - ${message}`, ...args);
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
     * Log específico para tema
     */
    theme(action, data) {
        if (!this.isDev) return;
        console.group(`${this.prefix} 🎨 THEME: ${action}`);
        console.log('Timestamp:', new Date().toLocaleTimeString());
        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                console.log(`${key}:`, value);
            });
        }
        console.groupEnd();
    }

    /**
     * Log para interações de componentes
     */
    component(componentName, action, data = {}) {
        if (!this.isDev) return;
        console.group(`${this.prefix} 🧩 ${componentName.toUpperCase()}: ${action}`);
        console.log('Timestamp:', new Date().toLocaleTimeString());
        Object.entries(data).forEach(([key, value]) => {
            console.log(`${key}:`, value);
        });
        console.groupEnd();
    }

    /**
     * Log para stores
     */
    store(storeName, action, oldValue, newValue) {
        if (!this.isDev) return;
        console.group(`${this.prefix} 📦 STORE ${storeName.toUpperCase()}: ${action}`);
        console.log('Timestamp:', new Date().toLocaleTimeString());
        if (oldValue !== undefined) console.log('Old Value:', oldValue);
        if (newValue !== undefined) console.log('New Value:', newValue);
        console.groupEnd();
    }

    /**
     * Log para eventos do DOM
     */
    dom(element, event, data = {}) {
        if (!this.isDev) return;
        console.group(`${this.prefix} 🌐 DOM: ${element} - ${event}`);
        console.log('Timestamp:', new Date().toLocaleTimeString());
        Object.entries(data).forEach(([key, value]) => {
            console.log(`${key}:`, value);
        });
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
    table(data, label = 'Data') {
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
        this.log('Console cleared');
    }
}

// Exporta instância única
export const logger = new DevLogger();
