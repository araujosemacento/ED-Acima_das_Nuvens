<script>
	import { m } from '$lib/paraglide/messages.js';
	import { themeStore, THEME_TYPES } from '$lib/stores/theme.js';
	import Button from '@smui/button';
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
	<Button
		on:click={() => menu.setOpen(true)}
		variant="unelevated"
		class="theme-toggle-button"
		title={m.theme_toggle_tooltip()}
	>
		<img src={getThemeIcon(userTheme)} alt={m.theme_toggle_alt()} class="theme-icon" />
	</Button>

	<Menu bind:this={menu} {anchor}>
		<List>
			{#each themes as theme (theme.value)}
				<Item
					on:SMUI:action={() => handleThemeChange(theme.value)}
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
		position: relative;
		display: inline-block;
	}

	:global(.theme-toggle-button) {
		min-width: auto !important;
		padding: 8px !important;
	}

	.theme-icon {
		width: 24px;
		height: 24px;
		filter: var(--icon-filter, none);
	}

	.menu-icon {
		width: 20px;
		height: 20px;
		filter: var(--icon-filter, none);
	}

	/* Tema escuro */
	:global(.theme-dark) .theme-icon,
	:global(.theme-dark) .menu-icon {
		filter: invert(1);
	}
</style>
