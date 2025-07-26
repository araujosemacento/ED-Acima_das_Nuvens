# Guia de Melhores Práticas para Svelte Stores

## Visão Geral das Melhorias Implementadas

Este documento descreve as melhores práticas implementadas nas stores do projeto, baseadas na documentação oficial do Svelte e padrões modernos de desenvolvimento.

## 1. Arquitetura Reativa Moderna

### Uso de `readonly()` para Exposição Controlada

```javascript
// ✅ CORRETO - Expõe stores derivados como readonly
isReady: readonly(isReady),
statusMessage: readonly(statusMessage),

// ❌ EVITAR - Exposição direta que permite mutação
isReady: isReady,
statusMessage: statusMessage,
```

### `StartStopNotifier` para Gerenciamento Automático de Recursos

```javascript
// ✅ CORRETO - Sistema de detecção com cleanup automático
const createSystemThemeDetector = () => {
	return readable(THEME_TYPES.DARK, (set) => {
		if (!browser) return;

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const updateTheme = (event) => {
			const newTheme =
				(event?.matches ?? mediaQuery.matches) ? THEME_TYPES.DARK : THEME_TYPES.LIGHT;
			set(newTheme);
		};

		updateTheme();
		mediaQuery.addEventListener('change', updateTheme);

		// Cleanup function (StartStopNotifier)
		return () => {
			mediaQuery.removeEventListener('change', updateTheme);
		};
	});
};
```

## 2. Stores Derivados Granulares

### Múltiplas Stores Derivados para Aspectos Específicos

```javascript
// ✅ CORRETO - Stores derivados granulares
const isReady = derived(baseState, ($state) => $state.state === PYODIDE_STATES.READY);
const isLoading = derived(baseState, ($state) => $state.state === PYODIDE_STATES.LOADING);
const hasError = derived(baseState, ($state) => $state.state === PYODIDE_STATES.ERROR);
const statusMessage = derived(baseState, ($state) => {
	switch ($state.state) {
		case PYODIDE_STATES.IDLE:
			return 'Inicializando...';
		case PYODIDE_STATES.LOADING:
			return 'Carregando...';
		// ...
	}
});

// ❌ EVITAR - Uma única store derivado monolítico
const derivedState = derived(baseState, ($state) => ({
	isReady: $state.state === PYODIDE_STATES.READY,
	isLoading: $state.state === PYODIDE_STATES.LOADING
	// ... tudo em uma store só
}));
```

## 3. API Funcional e Composável

### Organização em Namespaces

```javascript
// ✅ CORRETO - API organizada em namespaces
return {
	// Stores somente leitura
	subscribe: readonly(baseState).subscribe,
	isReady: readonly(isReady),

	// Ações agrupadas
	actions: {
		load: async () => {
			/* ... */
		},
		run: async (code) => {
			/* ... */
		},
		reset: () => {
			/* ... */
		}
	},

	// Utilitários agrupados
	utils: {
		getState: () => get(baseState),
		getCacheStats: () => ({ size: scriptCache.size() })
	}
};
```

### Uso de `get()` para Leitura Única

```javascript
// ✅ CORRETO - Uso de get() para leitura única
getCurrentTheme: () => get(currentTheme),
getState: () => get(baseState),

// ❌ EVITAR - Subscribe/unsubscribe manual
getCurrentTheme: () => {
	let current;
	const unsubscribe = currentTheme.subscribe(value => current = value);
	unsubscribe();
	return current;
}
```

## 4. Otimizações de Performance

### Cache Reativo com TTL

```javascript
// ✅ CORRETO - Cache com expiração automática
const createScriptCache = () => {
	const cache = new Map();
	const cacheTimestamps = new Map();

	return {
		get: (key) => {
			const timestamp = cacheTimestamps.get(key);
			if (timestamp && Date.now() - timestamp > CACHE_TTL) {
				cache.delete(key);
				cacheTimestamps.delete(key);
				return null;
			}
			return cache.get(key);
		},
		set: (key, value) => {
			cache.set(key, value);
			cacheTimestamps.set(key, Date.now());
		}
	};
};
```

### RequestAnimationFrame para Reidratação

```javascript
// ✅ CORRETO - Uso de requestAnimationFrame
const scheduleRehydration = (callback) => {
	if (rehydrationFrame) {
		cancelAnimationFrame(rehydrationFrame);
	}
	rehydrationFrame = requestAnimationFrame(callback);
};

// ❌ EVITAR - setTimeout ou execução síncrona
const forceRehydration = () => {
	// Operações síncronas pesadas
	document.querySelectorAll('.element').forEach(/* ... */);
};
```

## 5. Tratamento de Erros e Estados

### Estados Bem Definidos

```javascript
// ✅ CORRETO - Estados claros e bem definidos
const PYODIDE_STATES = Object.freeze({
	IDLE: 'idle',
	LOADING: 'loading',
	READY: 'ready',
	ERROR: 'error',
	EXECUTING: 'executing'
});
```

### Sistema de Retry com Backoff

```javascript
// ✅ CORRETO - Retry inteligente com backoff exponencial
const executeWithRetry = async (fn, attempts = 3) => {
	for (let i = 0; i < attempts; i++) {
		try {
			return await Promise.race([
				fn(),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), TIMEOUT))
			]);
		} catch (error) {
			if (i === attempts - 1) throw error;
			await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
		}
	}
};
```

## 6. Configurações Adaptativas

### Detecção de Capacidade Automática

```javascript
// ✅ CORRETO - Configurações que se adaptam ao ambiente
const adaptiveConfig = derived(
	[baseState, performanceMode, viewport],
	([$state, $performance, $viewport]) => {
		let speedMultiplier = 1.0;
		let maxAnimations = 10;

		switch ($performance) {
			case 'reduced':
				speedMultiplier = 0.1;
				maxAnimations = 0;
				break;
			case 'low':
				speedMultiplier = 0.5;
				maxAnimations = 3;
				break;
			case 'high':
				speedMultiplier = 1.5;
				maxAnimations = 20;
				break;
		}

		const isMobile = $viewport.width < 768;
		if (isMobile) {
			speedMultiplier *= 0.8;
			maxAnimations = Math.floor(maxAnimations * 0.6);
		}

		return { speedMultiplier, maxAnimations };
	}
);
```

## 7. Padrões de Segurança

### Validação de Entrada

```javascript
// ✅ CORRETO - Validação rigorosa
setTheme: (theme) => {
	if (!Object.values(THEME_TYPES).includes(theme)) {
		console.error('Tema inválido:', theme);
		return false;
	}
	userTheme.set(theme);
	return true;
},

setGlobalSpeed: (speed) => {
	const clampedSpeed = Math.max(0.1, Math.min(5.0, speed));
	baseState.update(state => ({ ...state, globalSpeed: clampedSpeed }));
}
```

### Imutabilidade com Object.freeze()

```javascript
// ✅ CORRETO - Configurações imutáveis
const THEME_TYPES = Object.freeze({
	LIGHT: 'light',
	DARK: 'dark',
	SYSTEM: 'system'
});

const THEME_CONFIG = Object.freeze({
	TRANSITION_DURATION: 300,
	REHYDRATION_DELAY: 16,
	STORAGE_KEY: 'theme'
});
```

## 8. Integração com CSS

### Aplicação Automática de Variáveis CSS

```javascript
// ✅ CORRETO - CSS variables reativas
const cssVariables = derived(adaptiveConfig, ($config) => ({
	'--cloud-motion-speed': $config.speed + 's',
	'--cloud-motion-intensity': $config.intensity,
	'--cloud-motion-direction': $config.direction
}));

// Aplicação automática
if (browser) {
	cssVariables.subscribe((variables) => {
		const root = document.documentElement;
		Object.entries(variables).forEach(([property, value]) => {
			root.style.setProperty(property, String(value));
		});
	});
}
```

## 9. Sistema de Logging Reativo

### Logger com Filtragem em Tempo Real

```javascript
// ✅ CORRETO - Logs filtrados reativamente
const filteredLogs = derived([baseState, currentFilters], ([$state, $filters]) => {
	return $state.logs.filter((log) => {
		if (!$filters.categories.has(log.category)) return false;
		if (log.level < $filters.minLevel) return false;
		if (
			$filters.searchTerm &&
			!log.formatted.toLowerCase().includes($filters.searchTerm.toLowerCase())
		)
			return false;
		return true;
	});
});
```

## 10. Benefícios das Melhorias

### Performance

- ✅ Menos re-renderizações desnecessárias
- ✅ Cache inteligente com TTL
- ✅ Operações assíncronas otimizadas
- ✅ RequestAnimationFrame para animações

### Manutenibilidade

- ✅ Código mais modular e testável
- ✅ API consistente entre stores
- ✅ Separação clara de responsabilidades
- ✅ Documentação integrada no código

### Experiência do Usuário

- ✅ Adaptação automática à capacidade do dispositivo
- ✅ Respeita preferências de acessibilidade
- ✅ Fallbacks inteligentes para conexões lentas
- ✅ Feedback visual em tempo real

### Desenvolvedor

- ✅ API funcional intuitiva
- ✅ TypeScript-friendly (sem TypeScript)
- ✅ Debugging facilitado com logs estruturados
- ✅ Hot-reload otimizado

---

## Migração de Código Existente

Para componentes que usam as stores antigas:

```javascript
// ANTES
import { themeStore } from '$lib/stores/theme.js';

$: currentTheme = themeStore.getCurrentTheme();
const setTheme = themeStore.setTheme;

// DEPOIS
import { themeStore } from '$lib/stores/theme.js';

$: currentTheme = $themeStore; // Reactivo automaticamente
$: isDark = $themeStore.isDarkMode; // Store derivado granular
const setTheme = themeStore.actions.setTheme; // API organizada
```

Este sistema de stores refatorado oferece uma base sólida e escalável para aplicações Svelte modernas, seguindo as melhores práticas da documentação oficial e padrões da comunidade.
