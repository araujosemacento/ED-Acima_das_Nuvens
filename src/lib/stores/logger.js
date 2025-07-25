import { dev } from '$app/environment';

/**
 * Logger simplificado para desenvolvimento
 * Apenas logs essenciais em ambiente de desenvolvimento
 */
class DevLogger {
	constructor() {
		this.isDev = dev;
		this.prefix = '🚀 [ED]';
	}

	/**
	 * Log para temas
	 */
	theme(action, data = {}) {
		if (!this.isDev) return;
		const summary = Object.values(data)
			.filter((v) => v)
			.join(' → ');
		console.log(`${this.prefix} 🎨 ${action}${summary ? ` - ${summary}` : ''}`);
	}

	/**
	 * Log para animações
	 */
	animation(action, data = {}) {
		if (!this.isDev) return;
		const summary = Object.values(data)
			.filter((v) => v)
			.join(' - ');
		console.log(`${this.prefix} 🎭 ${action}${summary ? ` - ${summary}` : ''}`);
	}

	/**
	 * Log para componentes
	 */
	component(name, action, data = {}) {
		if (!this.isDev) return;
		const summary = Object.values(data)
			.filter((v) => v)
			.join(' - ');
		console.log(`${this.prefix} 🧩 ${name}: ${action}${summary ? ` - ${summary}` : ''}`);
	}

	/**
	 * Log para stores
	 */
	store(action, data = {}) {
		if (!this.isDev) return;
		const summary = Object.values(data)
			.filter((v) => v)
			.join(' - ');
		console.log(`${this.prefix} 📦 ${action}${summary ? ` - ${summary}` : ''}`);
	}

	/**
	 * Log para transições
	 */
	transition(action, data = {}) {
		if (!this.isDev) return;
		if (action === 'START') {
			const change = data.from && data.to ? ` ${data.from} → ${data.to}` : '';
			console.log(`${this.prefix} 🎬 Transição iniciada${change}`);
		} else if (action === 'END') {
			const duration = data.duration || 300;
			const isSlowly = duration > 300;
			const icon = isSlowly ? '🐌' : '⚡';
			console.log(
				`${this.prefix} ${icon} Transição finalizada em ${duration}ms${isSlowly ? ' (lenta!)' : ''}`
			);
		}
	}
}

// Instância singleton
export const logger = new DevLogger();
