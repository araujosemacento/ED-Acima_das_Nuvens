// Store do tema - Versão simplificada
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Tipos de tema disponíveis
export const THEME_TYPES = {
	LIGHT: 'light',
	DARK: 'dark',
	SYSTEM: 'system'
};

// Paleta de cores da aplicação (espelhando o _palette.scss)
const THEME_COLORS = {
	light: {
		// Cores principais
		text: 'hsl(162, 100%, 10%)',
		background: 'hsl(145, 100%, 95%)',
		primary: 'hsl(164, 61%, 50%)',
		secondary: 'hsl(290, 46%, 50%)',
		accent: 'hsl(273, 92%, 50%)',
		surface: 'hsl(171, 28%, 90%)',

		// Text shades
		'text-400': 'hsl(162, 100%, 60%)',
		'text-500': 'hsl(162, 100%, 50%)',
		'text-600': 'hsl(162, 100%, 40%)',
		'text-700': 'hsl(162, 100%, 30%)',

		// Surface variants
		'surface-100': 'hsl(171, 28%, 90%)',
		'surface-200': 'hsl(171, 28%, 80%)',
	},
	dark: {
		// Cores principais (invertidas para tema escuro)
		text: 'hsl(162, 100%, 90%)',
		background: 'hsl(145, 100%, 5%)',
		primary: 'hsl(164, 61%, 50%)',
		secondary: 'hsl(290, 46%, 50%)',
		accent: 'hsl(273, 92%, 50%)',
		surface: 'hsl(171, 28%, 10%)',

		// Text shades (invertidos)
		'text-400': 'hsl(162, 100%, 40%)',
		'text-500': 'hsl(162, 100%, 50%)',
		'text-600': 'hsl(162, 100%, 60%)',
		'text-700': 'hsl(162, 100%, 70%)',

		// Surface variants
		'surface-100': 'hsl(171, 28%, 10%)',
		'surface-200': 'hsl(171, 28%, 20%)',
	}
};

// Sistema de rehidratação forçada para garantir que as mudanças de tema sejam aplicadas
const forceElementsRehidration = () => {
	if (!browser) return;

	// Força repaint dos elementos críticos que podem não atualizar automaticamente
	const criticalSelectors = [
		'body',
		'[class*="mdc-"]',
		'[class*="theme-"]',
		'.text-outlined',
		'.game-start-button',
		'.theme-toggle',
		'.welcome-content'
	];

	criticalSelectors.forEach(selector => {
		const elements = document.querySelectorAll(selector);
		elements.forEach(element => {
			// Força recálculo do estilo usando uma propriedade temporária
			const originalDisplay = element.style.display;
			element.style.display = 'none';
			// Força reflow
			void element.offsetHeight;
			element.style.display = originalDisplay;
		});
	});

	// Dispara evento customizado para componentes que precisam reagir
	window.dispatchEvent(new CustomEvent('theme-changed', {
		detail: { timestamp: Date.now() }
	}));
};

function createThemeStore() {
	// Store para o tema escolhido pelo usuário
	const userTheme = writable(THEME_TYPES.SYSTEM);

	// Store para o tema detectado do sistema
	const systemTheme = writable(THEME_TYPES.DARK);

	// Store derivado que determina o tema efetivo
	const currentTheme = derived([userTheme, systemTheme], ([user, system]) => {
		return user === THEME_TYPES.SYSTEM ? system : user;
	});

	// Aplica o tema ao DOM
	const applyTheme = (theme) => {
		if (!browser) return;

		// Remove classes existentes e adiciona a nova
		document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-system');
		document.documentElement.classList.add(`theme-${theme}`);

		// Atualiza variável CSS
		document.documentElement.style.setProperty('--theme-current', theme);

		// Aplica cores dinâmicas baseadas na paleta
		const colors = THEME_COLORS[theme] || THEME_COLORS.dark; // Mudado para dark como padrão

		// Atualiza variáveis CSS customizadas do Material Design
		const root = document.documentElement;

		// Cores principais do Material Design
		root.style.setProperty('--mdc-theme-primary', colors.primary);
		root.style.setProperty('--mdc-theme-secondary', colors.secondary);
		root.style.setProperty('--mdc-theme-background', colors.background);
		root.style.setProperty('--mdc-theme-surface', colors.surface);

		// Cores on-surface (contraste)
		root.style.setProperty('--mdc-theme-on-primary', colors.background);
		root.style.setProperty('--mdc-theme-on-secondary', colors.background);
		root.style.setProperty('--mdc-theme-on-surface', colors.text);
		root.style.setProperty('--mdc-theme-on-background', colors.text);

		// Força rehidratação das variáveis customizadas da aplicação ANTES das cores do Material Design
		root.style.setProperty('--theme-background', colors.background);
		root.style.setProperty('--theme-surface', colors.surface);
		root.style.setProperty('--theme-text', colors.text);
		root.style.setProperty('--theme-primary', colors.primary);
		root.style.setProperty('--theme-secondary', colors.secondary);
		root.style.setProperty('--theme-accent', colors.accent);

		// Cores de texto com contraste adequado para Material Design
		// FORÇAR REHIDRATAÇÃO: aplicar cores dinâmicas baseadas no tema
		if (theme === 'dark') {
			// Para tema escuro - usar valores rgba otimizados
			root.style.setProperty('--mdc-theme-text-primary-on-background', 'rgba(255, 255, 255, 0.87)');
			root.style.setProperty('--mdc-theme-text-secondary-on-background', 'rgba(255, 255, 255, 0.60)');
			root.style.setProperty('--mdc-theme-text-hint-on-background', 'rgba(255, 255, 255, 0.38)');
			root.style.setProperty('--mdc-theme-text-disabled-on-background', 'rgba(255, 255, 255, 0.38)');
			root.style.setProperty('--mdc-theme-text-icon-on-background', 'rgba(255, 255, 255, 0.38)');

			// Cores específicas para superfícies escuras
			root.style.setProperty('--mdc-theme-text-primary-on-dark', 'rgba(255, 255, 255, 0.87)');
			root.style.setProperty('--mdc-theme-text-secondary-on-dark', 'rgba(255, 255, 255, 0.60)');
			root.style.setProperty('--mdc-theme-text-hint-on-dark', 'rgba(255, 255, 255, 0.38)');
			root.style.setProperty('--mdc-theme-text-disabled-on-dark', 'rgba(255, 255, 255, 0.38)');
			root.style.setProperty('--mdc-theme-text-icon-on-dark', 'rgba(255, 255, 255, 0.38)');
		} else {
			// Para tema claro - usar valores rgba otimizados  
			root.style.setProperty('--mdc-theme-text-primary-on-background', 'rgba(0, 0, 0, 0.87)');
			root.style.setProperty('--mdc-theme-text-secondary-on-background', 'rgba(0, 0, 0, 0.60)');
			root.style.setProperty('--mdc-theme-text-hint-on-background', 'rgba(0, 0, 0, 0.38)');
			root.style.setProperty('--mdc-theme-text-disabled-on-background', 'rgba(0, 0, 0, 0.38)');
			root.style.setProperty('--mdc-theme-text-icon-on-background', 'rgba(0, 0, 0, 0.38)');

			// Cores específicas para superfícies claras
			root.style.setProperty('--mdc-theme-text-primary-on-light', 'rgba(0, 0, 0, 0.87)');
			root.style.setProperty('--mdc-theme-text-secondary-on-light', 'rgba(0, 0, 0, 0.60)');
			root.style.setProperty('--mdc-theme-text-hint-on-light', 'rgba(0, 0, 0, 0.38)');
			root.style.setProperty('--mdc-theme-text-disabled-on-light', 'rgba(0, 0, 0, 0.38)');
			root.style.setProperty('--mdc-theme-text-icon-on-light', 'rgba(0, 0, 0, 0.38)');
		}

		// Atualiza filtros de ícones para tema escuro
		if (theme === 'dark') {
			root.style.setProperty('--icon-filter', 'invert(1)');
		} else {
			root.style.setProperty('--icon-filter', 'none');
		}

		// SISTEMA DE REHIDRATAÇÃO FORÇADA
		// Força repaint dos elementos afetados pelas mudanças de tema
		forceElementsRehidration();
	};

	// Inicialização no browser
	if (browser) {
		// Detecta tema do sistema
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const updateSystemTheme = () => {
			systemTheme.set(mediaQuery.matches ? THEME_TYPES.DARK : THEME_TYPES.LIGHT);
		};

		updateSystemTheme();
		mediaQuery.addEventListener('change', updateSystemTheme);

		// Carrega tema salvo
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme && Object.values(THEME_TYPES).includes(savedTheme)) {
			userTheme.set(savedTheme);
		}

		// Aplica tema automaticamente quando currentTheme muda
		currentTheme.subscribe(applyTheme);

		// Aplica tema inicial imediatamente
		const initialTheme = savedTheme && Object.values(THEME_TYPES).includes(savedTheme)
			? (savedTheme === THEME_TYPES.SYSTEM ? (mediaQuery.matches ? THEME_TYPES.DARK : THEME_TYPES.LIGHT) : savedTheme)
			: THEME_TYPES.DARK; // Mudado para DARK como padrão

		// Pequeno delay para garantir que o DOM esteja pronto
		setTimeout(() => applyTheme(initialTheme), 0);
	}

	return {
		// Stores públicos
		subscribe: currentTheme.subscribe,
		userTheme: { subscribe: userTheme.subscribe },
		systemTheme: { subscribe: systemTheme.subscribe },

		// Métodos públicos
		setTheme: (theme) => {
			if (!Object.values(THEME_TYPES).includes(theme)) {
				console.error('Invalid theme:', theme);
				return;
			}

			userTheme.set(theme);

			if (browser) {
				localStorage.setItem('theme', theme);
			}
		},

		resetToSystem: () => {
			userTheme.set(THEME_TYPES.SYSTEM);
			if (browser) {
				localStorage.removeItem('theme');
			}
		},

		getCurrentTheme: () => {
			let current;
			currentTheme.subscribe((value) => (current = value))();
			return current;
		},

		// Força reaplicação do tema atual
		reapplyTheme: () => {
			if (browser) {
				let current;
				currentTheme.subscribe((value) => (current = value))();
				applyTheme(current);
			}
		}
	};
}

export const themeStore = createThemeStore();
