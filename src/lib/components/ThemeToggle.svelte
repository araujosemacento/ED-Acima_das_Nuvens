<script>
	import { m } from '$lib/paraglide/messages.js';
	import { themeStore, THEME_TYPES } from '$lib/stores/theme.js';
	import { logger } from '$lib/stores/logger.js';
	import Button, { Label } from '@smui/button';
	import Menu from '@smui/menu';
	import { Anchor } from '@smui/menu-surface';
	import List, { Item, Graphic, Text } from '@smui/list';
	import { onMount } from 'svelte';

	// Estados reativos usando Svelte 5 runes
	let menu = $state();
	let anchor = $state();
	let anchorClasses = $state({});
	
	// Stores reativos da nova API
	let currentTheme = $state(THEME_TYPES.SYSTEM);
	let userTheme = $state(THEME_TYPES.SYSTEM);
	let hasUserInteraction = $state(false);

	// Função para obter o ícone baseado no tema atual
	const getThemeIcon = (theme) => {
		switch (theme) {
			case THEME_TYPES.LIGHT:
				return '/assets/ionicons/svg/sunny.svg';
			case THEME_TYPES.DARK:
				return '/assets/ionicons/svg/moon.svg';
			case THEME_TYPES.SYSTEM:
			default:
				return '/assets/ionicons/svg/desktop.svg';
		}
	};

	// Função para obter ícones dos itens do menu
	const getMenuItemIcon = (theme) => {
		switch (theme) {
			case THEME_TYPES.LIGHT:
				return '/assets/ionicons/svg/sunny.svg';
			case THEME_TYPES.DARK:
				return '/assets/ionicons/svg/moon.svg';
			case THEME_TYPES.SYSTEM:
				return '/assets/ionicons/svg/desktop.svg';
		}
	};

	// Função para obter o ícone que deve ser exibido no botão
	const getDisplayIcon = () => {
		// Para debug: mostra valores atuais
		logger.component('ThemeToggle', 'GET_DISPLAY_ICON_DEBUG', {
			'Has user interaction': hasUserInteraction,
			'User theme': userTheme,
			'Current theme (from store)': currentTheme,
			'Store type': typeof currentTheme
		});

		// Se o usuário escolheu explicitamente light ou dark, mostra o ícone da escolha
		if (hasUserInteraction && (userTheme === THEME_TYPES.LIGHT || userTheme === THEME_TYPES.DARK)) {
			const icon = getThemeIcon(userTheme);
			logger.component('ThemeToggle', 'GET_DISPLAY_ICON', {
				'Has user interaction': hasUserInteraction,
				'User theme': userTheme,
				'Icon chosen': icon,
				'Path': 'User explicit choice (light/dark)'
			});
			return icon;
		}
		
		// Em qualquer outro caso (system ou sem interação), mostra o ícone do tema efetivo
		// currentTheme sempre será 'light' ou 'dark', nunca 'system'
		const icon = getThemeIcon(currentTheme);
		logger.component('ThemeToggle', 'GET_DISPLAY_ICON', {
			'Has user interaction': hasUserInteraction,
			'User theme': userTheme,
			'Current theme (effective)': currentTheme,
			'Icon chosen': icon,
			'Path': 'Effective theme (resolved from system or default)'
		});
		return icon;
	};

	// Subscreve aos stores do tema usando a nova API
	$effect(() => {
		// Store principal para o tema atual efetivo (light/dark, nunca 'system')
		const unsubscribeMain = themeStore.subscribe(theme => {
			logger.component('ThemeToggle', 'MAIN_THEME_UPDATE', {
				'Old current theme': currentTheme,
				'New current theme (effective)': theme,
				'This should be light or dark': theme
			});
			currentTheme = theme;
		});
		
		// Store para a escolha do usuário (pode ser 'system', 'light', 'dark')
		const unsubscribeUser = themeStore.userTheme.subscribe(theme => {
			logger.component('ThemeToggle', 'USER_THEME_UPDATE', {
				'Old user theme': userTheme,
				'New user theme (choice)': theme
			});
			userTheme = theme;
		});
		
		// Store para saber se o usuário já interagiu
		const unsubscribeInteraction = themeStore.hasUserInteraction.subscribe(interacted => {
			logger.component('ThemeToggle', 'INTERACTION_UPDATE', {
				'Old has interaction': hasUserInteraction,
				'New has interaction': interacted
			});
			hasUserInteraction = interacted;
		});
		
		return () => {
			logger.component('ThemeToggle', 'UNSUBSCRIBE_ALL', {
				'Cleaning up subscriptions': true
			});
			unsubscribeMain();
			unsubscribeUser();
			unsubscribeInteraction();
		};
	});

	// Função para selecionar um tema
	const selectTheme = (theme) => {
		logger.component('ThemeToggle', 'SELECT_THEME', {
			'Theme requested': theme,
			'Current user theme': userTheme,
			'Current effective theme': currentTheme,
			'Has interaction': hasUserInteraction
		});
		
		themeStore.setTheme(theme);
		
		logger.component('ThemeToggle', 'THEME_SET_CALLED', {
			'Theme set to': theme
		});
	};

	// A inicialização do tema agora é automática no store
	onMount(() => {
		logger.component('ThemeToggle', 'MOUNT', {
			'Theme store auto-initialized': true
		});
	});
</script>

<div class="theme-toggle-container">
	<!-- Âncora manual para o menu -->
	<div
		class={Object.keys(anchorClasses).join(' ')}
		use:Anchor={{
			addClass: (className) => {
				if (!anchorClasses[className]) {
					anchorClasses[className] = true;
				}
			},
			removeClass: (className) => {
				if (anchorClasses[className]) {
					delete anchorClasses[className];
				}
			},
		}}
		bind:this={anchor}
	>
		<!-- Botão circular do tema -->
		<Button
			class="theme-toggle-button theme-interactive-transition"
			variant="unelevated"
			color="secondary"
			title={m.theme_toggle()}
			aria-label={m.theme_toggle()}
			onclick={() => menu.setOpen(true)}
		>
			<img 
				src={getDisplayIcon()} 
				alt={m.theme_toggle()}
				class="theme-icon theme-transition-medium"
			/>
		</Button>

		<!-- Menu dropdown -->
		<Menu
			bind:this={menu}
			anchor={false}
			anchorElement={anchor}
			anchorCorner="BOTTOM_LEFT"
			class="theme-menu theme-background-transition"
		>
			<List dense>
				<Item
					class="theme-menu-item theme-interactive-transition"
					selected={userTheme === THEME_TYPES.LIGHT}
					onSMUIAction={() => selectTheme(THEME_TYPES.LIGHT)}
				>
					<Graphic>
						<img 
							src={getMenuItemIcon(THEME_TYPES.LIGHT)} 
							alt={m.theme_light()}
							class="theme-menu-icon theme-transition-medium"
						/>
					</Graphic>
					<Text class="theme-text-transition">{m.theme_light()}</Text>
				</Item>
				
				<Item
					class="theme-menu-item theme-interactive-transition"
					selected={userTheme === THEME_TYPES.DARK}
					onSMUIAction={() => selectTheme(THEME_TYPES.DARK)}
				>
					<Graphic>
						<img 
							src={getMenuItemIcon(THEME_TYPES.DARK)} 
							alt={m.theme_dark()}
							class="theme-menu-icon theme-transition-medium"
						/>
					</Graphic>
					<Text class="theme-text-transition">{m.theme_dark()}</Text>
				</Item>
				
				<Item
					class="theme-menu-item theme-interactive-transition"
					selected={userTheme === THEME_TYPES.SYSTEM}
					onSMUIAction={() => selectTheme(THEME_TYPES.SYSTEM)}
				>
					<Graphic>
						<img 
							src={getMenuItemIcon(THEME_TYPES.SYSTEM)} 
							alt={m.theme_system()}
							class="theme-menu-icon theme-transition-medium"
						/>
					</Graphic>
					<Text class="theme-text-transition">{m.theme_system()}</Text>
				</Item>
			</List>
		</Menu>
	</div>
</div>

<style lang="scss">
	.theme-toggle-container {
		position: fixed;
        top: 2rem;
        right: 2rem;
	}

	:global(.theme-toggle-button) {
		width: 48px !important;
		height: 48px !important;
		border-radius: 50% !important;
		min-width: 48px !important;
		padding: 0 !important;
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
		overflow: hidden !important; /* Clipa o ripple effect */
		position: relative !important;
		
		/* Garante que todos os elementos internos respeitem o border-radius */
		:global(.mdc-button__ripple),
		:global(.mdc-ripple-surface),
		:global(.mdc-button__focus-ring) {
			border-radius: 50% !important;
			overflow: hidden !important;
		}
		
		&:hover {
			transform: scale(1.05);
			transition: all 0.2s ease-in-out;
		}

		&:focus {
			outline: 2px solid var(--mdc-theme-primary);
			outline-offset: 2px;
		}
	}

	.theme-icon {
		width: 24px;
		height: 24px;
		filter: brightness(0) saturate(100%) invert(100%);
		/* Remover transições locais para usar as globais */
	}

	:global(.theme-menu) {
		border-radius: 12px !important;
		overflow: hidden !important;
		min-width: 140px !important;
	}

	:global(.theme-menu-item) {
		/* Remover transições locais para usar as globais */

		&:hover {
			background-color: var(--mdc-theme-primary-variant, rgba(var(--mdc-theme-primary-rgb, 98, 0, 238), 0.08)) !important;
		}

		&:focus {
			background-color: var(--mdc-theme-primary-variant, rgba(var(--mdc-theme-primary-rgb, 98, 0, 238), 0.12)) !important;
		}

		&.mdc-list-item--selected {
			background-color: var(--mdc-theme-primary-variant, rgba(var(--mdc-theme-primary-rgb, 98, 0, 238), 0.16)) !important;
			color: var(--mdc-theme-primary) !important;
		}
	}

	/* Contraste correto para texto no menu baseado no tema */
	:global(.theme-dark) {
		:global(.theme-menu-item) {
			color: var(--mdc-theme-on-surface) !important;
			
			&.mdc-list-item--selected {
				background-color: rgba(164, 61, 150, 0.25) !important; /* Verde mais escuro para melhor contraste */
				color: hsl(162, 100%, 90%) !important; /* Texto claro */
			}
			
			&:hover {
				background-color: rgba(164, 61, 150, 0.1) !important;
				color: hsl(162, 100%, 90%) !important;
			}
		}
	}

	:global(.theme-light) {
		:global(.theme-menu-item) {
			color: var(--mdc-theme-on-surface) !important;
			
			&.mdc-list-item--selected {
				background-color: rgba(164, 61, 150, 0.15) !important; /* Verde mais escuro para melhor contraste */
				color: hsl(162, 100%, 10%) !important; /* Texto escuro */
			}
			
			&:hover {
				background-color: rgba(164, 61, 150, 0.08) !important;
				color: hsl(162, 100%, 10%) !important;
			}
		}
	}

	.theme-menu-icon {
		width: 20px;
		height: 20px;
		filter: var(--mdc-theme-text-icon-on-background, none);
		flex-shrink: 0;
	}

	/* Responsividade */
	@media (max-width: 576px) {
		:global(.theme-toggle-button) {
			width: 44px !important;
			height: 44px !important;
			min-width: 44px !important;
		}

		.theme-icon {
			width: 20px;
			height: 20px;
		}
	}

	/* Temas específicos - usar variáveis CSS dinâmicas ao invés de filtros fixos */
	:global(.theme-dark) {
		.theme-icon {
			filter: brightness(0) saturate(100%) invert(100%);
		}

		.theme-menu-icon {
			filter: brightness(0) saturate(100%) invert(100%);
		}
	}

	:global(.theme-light) {
		.theme-icon {
			filter: brightness(0) saturate(100%) invert(0%);
		}

		.theme-menu-icon {
			filter: brightness(0) saturate(100%) invert(20%);
		}
	}

	/* Animações e transições específicas do componente - usando classes globais */

	/* Acessibilidade */
	@media (prefers-reduced-motion: reduce) {
		:global(.theme-toggle-button),
		.theme-icon,
		.theme-menu-icon,
		:global(.theme-menu-item) {
			transition: none !important;
		}
		
		:global(.theme-toggle-button):hover {
			transform: none !important;
		}
	}

	/* Estados de foco para acessibilidade */
	:global(.theme-menu-item):focus-visible {
		outline: 2px solid var(--mdc-theme-primary) !important;
		outline-offset: -2px !important;
	}
</style>
