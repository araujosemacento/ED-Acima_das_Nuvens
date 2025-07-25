<script>
	import { m } from '$lib/paraglide/messages.js';
	import { themeStore, THEME_TYPES } from '$lib/stores/theme.js';
	import IconButton from '@smui/icon-button';
	import Menu from '@smui/menu';
	import List, { Item, Graphic, Text } from '@smui/list';
	import { base } from '$app/paths';

	// Estados reativos
	let menu = $state();
	let anchor = $state();
	let currentTheme = $state(THEME_TYPES.LIGHT); // Tema padrão para SSR
	let userTheme = $state(THEME_TYPES.SYSTEM);

	// Ícones dos temas
	const getThemeIcon = (theme) => {
		const icons = {
			[THEME_TYPES.LIGHT]: `${base}/assets/ionicons/svg/sunny.svg`,
			[THEME_TYPES.DARK]: `${base}/assets/ionicons/svg/moon.svg`,
			[THEME_TYPES.SYSTEM]: `${base}/assets/ionicons/svg/desktop.svg`
		};
		return icons[theme] || icons[THEME_TYPES.SYSTEM];
	};

	// Subscreve aos stores do tema
	$effect(() => {
		const unsubscribeMain = themeStore.subscribe((theme) => {
			currentTheme = theme;
		});

		const unsubscribeUser = themeStore.userTheme.subscribe((theme) => {
			userTheme = theme;
		});

		return () => {
			unsubscribeMain();
			unsubscribeUser();
		};
	});

	// Alterna o tema
	const handleThemeChange = (newTheme) => {
		themeStore.setTheme(newTheme);
		menu.setOpen(false);
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
		onclick={() => menu.setOpen(true)}
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
	.theme-toggle {
		position: fixed;
		top: 2rem;
		right: 2rem;
		z-index: 1000;
	}

	/* Estilo do botão circular FAB */
	:global(.theme-fab) {
		width: 3.5rem !important;
		height: 3.5rem !important;
		border-radius: 50% !important;
		background-color: var(--mdc-theme-primary) !important;
		color: var(--mdc-theme-on-primary) !important;
		box-shadow:
			0 0.1875rem 0.3125rem -0.0625rem rgba(0, 0, 0, 0.2),
			0 0.375rem 0.625rem 0 rgba(0, 0, 0, 0.14),
			0 0.0625rem 1.125rem 0 rgba(0, 0, 0, 0.12) !important;
		transition:
			box-shadow 280ms cubic-bezier(0.4, 0, 0.2, 1),
			transform 195ms cubic-bezier(0.4, 0, 0.2, 1) !important;
		border: none !important;
		overflow: visible !important;
	}

	:global(.theme-fab:hover) {
		box-shadow:
			0 0.3125rem 0.3125rem -0.1875rem rgba(0, 0, 0, 0.2),
			0 0.5rem 0.625rem 0.0625rem rgba(0, 0, 0, 0.14),
			0 0.1875rem 0.875rem 0.125rem rgba(0, 0, 0, 0.12) !important;
		transform: scale(1.05) !important;
	}

	:global(.theme-fab:active) {
		box-shadow:
			0 0.4375rem 0.5rem -0.25rem rgba(0, 0, 0, 0.2),
			0 0.75rem 1.0625rem 0.125rem rgba(0, 0, 0, 0.14),
			0 0.3125rem 1.375rem 0.25rem rgba(0, 0, 0, 0.12) !important;
		transform: scale(0.95) !important;
	}

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

	/* Adaptação para tema escuro */
	:global(.theme-dark) .theme-icon,
	:global(.theme-dark) .menu-icon {
		filter: invert(1);
	}

	/* Estilo do menu */
	:global(.theme-toggle .mdc-menu) {
		border-radius: 0.75rem !important;
		box-shadow:
			0 0.3125rem 0.3125rem -0.1875rem rgba(0, 0, 0, 0.2),
			0 0.5rem 0.625rem 0.0625rem rgba(0, 0, 0, 0.14),
			0 0.1875rem 0.875rem 0.125rem rgba(0, 0, 0, 0.12) !important;
	}

	:global(.theme-toggle .mdc-list-item) {
		border-radius: 0.5rem !important;
		margin: 0.25rem 0.5rem !important;
		min-height: 3rem !important;
	}

	:global(.theme-toggle .mdc-list-item--selected) {
		background-color: var(--mdc-theme-primary) !important;
		color: var(--mdc-theme-on-primary) !important;
	}

	:global(.theme-toggle .mdc-list-item--selected .menu-icon) {
		filter: brightness(0) invert(1) !important;
	}

	/* Melhor contraste para itens não selecionados no tema escuro */
	:global(.theme-dark .theme-toggle .mdc-list-item:not(.mdc-list-item--selected)) {
		color: rgba(255, 255, 255, 0.87) !important;
	}

	:global(.theme-dark .theme-toggle .mdc-list-item:not(.mdc-list-item--selected) .menu-icon) {
		filter: invert(1) !important;
	}

	/* Melhor contraste para itens não selecionados no tema claro */
	:global(.theme-light .theme-toggle .mdc-list-item:not(.mdc-list-item--selected)) {
		color: rgba(0, 0, 0, 0.87) !important;
	}

	:global(.theme-light .theme-toggle .mdc-list-item:not(.mdc-list-item--selected) .menu-icon) {
		filter: none !important;
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
