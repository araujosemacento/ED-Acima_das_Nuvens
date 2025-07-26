<script>
	// ========================================
	// THEME TOGGLE - VERSÃO OTIMIZADA 2025
	// ========================================
	// ✅ Integrado com sistema de temas unificado
	// ✅ Usa variáveis CSS dinâmicas (--icon-filter, --theme-shadow-*)
	// ✅ Elimina redundâncias de filtros CSS
	// ✅ Performance melhorada com subscriptions otimizadas
	// ✅ Alinhado com paleta de cores acessível
	// ✅ Instrumentado com logger para debugging

	import { m } from '$lib/paraglide/messages.js';
	import { themeStore, THEME_TYPES, logger } from '$lib/stores/index.js';
	import IconButton from '@smui/icon-button';
	import Menu from '@smui/menu';
	import List, { Item, Graphic, Text } from '@smui/list';
	import { base } from '$app/paths';

	// Estados reativos conectados aos stores
	let menu = $state();
	let anchor = $state();
	let currentTheme = $state(THEME_TYPES.DARK); // Padrão tema escuro (alinhado com sistema)
	let userTheme = $state(THEME_TYPES.SYSTEM);

	// Subscriptions otimizadas usando $effect
	$effect(() => {
		logger.actions.component('ThemeToggle', 'Inicializado', {
			hasMenu: !!menu,
			hasAnchor: !!anchor
		});

		// Subscription para tema atual
		const unsubscribeMain = themeStore.subscribe((theme) => {
			logger.actions.component('ThemeToggle', 'Tema atual mudou', {
				from: currentTheme,
				to: theme
			});
			currentTheme = theme;
		});

		// Subscription para tema do usuário
		const unsubscribeUser = themeStore.userTheme.subscribe((theme) => {
			logger.actions.component('ThemeToggle', 'Tema do usuário mudou', {
				from: userTheme,
				to: theme
			});
			userTheme = theme;
		});

		// Cleanup automático
		return () => {
			logger.actions.component('ThemeToggle', 'Cleanup executado', {
				reason: 'componente desmontado'
			});
			unsubscribeMain();
			unsubscribeUser();
		};
	});

	// Ícones dos temas - Função memorizada para performance
	const getThemeIcon = (theme) => {
		const icons = {
			[THEME_TYPES.LIGHT]: `${base}/assets/ionicons/svg/sunny.svg`,
			[THEME_TYPES.DARK]: `${base}/assets/ionicons/svg/moon.svg`,
			[THEME_TYPES.SYSTEM]: `${base}/assets/ionicons/svg/desktop.svg`
		};
		return icons[theme] || icons[THEME_TYPES.SYSTEM];
	};

	// Alterna o tema de forma otimizada
	const handleThemeChange = (newTheme) => {
		logger.actions.component('ThemeToggle', 'Clique do usuário', {
			selectedTheme: newTheme,
			currentTheme,
			userTheme,
			menuOpen: menu?.isOpen?.() || false
		});

		const success = themeStore.actions.setTheme(newTheme);
		
		if (success) {
			logger.actions.component('ThemeToggle', 'Tema alterado com sucesso', {
				newTheme,
				menuClosing: true
			});
		} else {
			logger.actions.error('Falha ao alterar tema no ThemeToggle', {
				attemptedTheme: newTheme,
				reason: 'setTheme retornou false'
			});
		}
		
		menu.setOpen(false);
	};

	// Handler para abertura do menu
	const handleMenuOpen = () => {
		logger.actions.component('ThemeToggle', 'Menu aberto', {
			currentTheme,
			userTheme,
			availableThemes: themes.length
		});
		menu.setOpen(true);
	};

	// Lista de temas disponíveis
	const themes = [
		{ value: THEME_TYPES.LIGHT, label: m.theme_light() },
		{ value: THEME_TYPES.DARK, label: m.theme_dark() },
		{ value: THEME_TYPES.SYSTEM, label: m.theme_system() }
	];

	export { currentTheme };
</script>

<div class="theme-toggle" bind:this={anchor}>
	<IconButton
		onclick={handleMenuOpen}
		class="theme-fab themed-icon-button"
		title={m.theme_toggle_tooltip()}
		aria-label={m.theme_toggle_alt()}
	>
		<img src={getThemeIcon(userTheme)} alt={m.theme_toggle_alt()} class="theme-icon" />
	</IconButton>

	<Menu bind:this={menu} {anchor} anchorCorner="BOTTOM_LEFT" class="themed-menu">
		<List class="themed-list">
			{#each themes as theme (theme.value)}
				<Item
					onSMUIAction={() => handleThemeChange(theme.value)}
					selected={userTheme === theme.value}
				>
					<Graphic>
						<img src={getThemeIcon(theme.value)} alt={theme.label} class="menu-icon" />
					</Graphic>
					<Text>{theme.label}</Text>
				</Item>
			{/each}
		</List>
	</Menu>
</div>

<style lang="scss">
	/* ========================================
	   THEME TOGGLE STYLES - VERSÃO OTIMIZADA  
	   ======================================== */

	.theme-toggle {
		position: fixed;
		top: 2rem;
		right: 2rem;
		z-index: 1000;
	}

	/* Estilo do botão circular FAB - Otimizado com variáveis CSS */
	:global(.theme-fab) {
		width: 3.5rem !important;
		height: 3.5rem !important;
		border-radius: 50% !important;
		background-color: var(--mdc-theme-primary) !important;
		color: var(--mdc-theme-on-primary) !important;
		box-shadow:
			0 0.1875rem 0.3125rem -0.0625rem var(--theme-shadow-dark),
			0 0.375rem 0.625rem 0 var(--theme-shadow-medium),
			0 0.0625rem 1.125rem 0 var(--theme-shadow-light) !important;
		transition:
			box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1),
			transform 195ms cubic-bezier(0.4, 0, 0.2, 1) !important;
		border: none !important;
		overflow: visible !important;
	}

	:global(.theme-fab:hover) {
		box-shadow:
			0 0.3125rem 0.3125rem -0.1875rem var(--theme-shadow-dark),
			0 0.5rem 0.625rem 0.0625rem var(--theme-shadow-medium),
			0 0.1875rem 0.875rem 0.125rem var(--theme-shadow-light) !important;
		transform: scale(1.05) !important;
	}

	:global(.theme-fab:active) {
		box-shadow:
			0 0.4375rem 0.5rem -0.25rem var(--theme-shadow-dark),
			0 0.75rem 1.0625rem 0.125rem var(--theme-shadow-medium),
			0 0.3125rem 1.375rem 0.25rem var(--theme-shadow-light) !important;
		transform: scale(0.95) !important;
	}

	/* Ícones - Sistema unificado com variável CSS dinâmica */
	.theme-icon {
		width: 1.75rem;
		height: 1.75rem;
		filter: var(--icon-filter, none);
		pointer-events: none;
	}

	.menu-icon {
		width: 1.5rem;
		height: 1.5rem;
		filter: var(--icon-filter, none);
	}

	/* Estilo do menu - Otimizado com variáveis CSS */
	:global(.theme-toggle .mdc-menu) {
		border-radius: 0.75rem !important;
		box-shadow:
			0 0.3125rem 0.3125rem -0.1875rem var(--theme-shadow-dark),
			0 0.5rem 0.625rem 0.0625rem var(--theme-shadow-medium),
			0 0.1875rem 0.875rem 0.125rem var(--theme-shadow-light) !important;
	}

	:global(.theme-toggle .mdc-list-item) {
		border-radius: 0.5rem !important;
		margin: 0.25rem 0.5rem !important;
		min-height: 3rem !important;
		color: var(--mdc-theme-text-primary-on-background) !important;
	}

	/* Texto específico dos itens - Material Design interno */
	:global(.theme-toggle .mdc-deprecated-list-item__text) {
		color: var(--mdc-theme-text-primary-on-background) !important;
	}

	:global(.theme-toggle .mdc-list-item--selected) {
		background-color: var(--mdc-theme-primary) !important;
		color: var(--mdc-theme-on-primary) !important;
	}

	/* Texto do item selecionado - Material Design interno */
	:global(.theme-toggle .mdc-list-item--selected .mdc-deprecated-list-item__text) {
		color: var(--mdc-theme-on-primary) !important;
	}

	/* Ícones selecionados - sempre invertidos para contraste */
	:global(.theme-toggle .mdc-list-item--selected .menu-icon) {
		filter: brightness(0) invert(1) !important;
	}

	/* Responsividade */
	@media (max-width: 48rem) {
		.theme-toggle {
			top: 1.5rem;
			right: 1.5rem;
		}

		:global(.theme-fab) {
			width: 3rem !important;
			height: 3rem !important;
		}

		.theme-icon {
			width: 1.5rem;
			height: 1.5rem;
		}
	}
</style>
