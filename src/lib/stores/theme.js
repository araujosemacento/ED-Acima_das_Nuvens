// Store do tema - Versão simplificada
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Tipos de tema disponíveis
export const THEME_TYPES = {
	LIGHT: 'light',
	DARK: 'dark',
	SYSTEM: 'system'
};

function createThemeStore() {
	// Store para o tema escolhido pelo usuário
	const userTheme = writable(THEME_TYPES.SYSTEM);

	// Store para o tema detectado do sistema
	const systemTheme = writable(THEME_TYPES.LIGHT);

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
		}
	};
}

export const themeStore = createThemeStore();
