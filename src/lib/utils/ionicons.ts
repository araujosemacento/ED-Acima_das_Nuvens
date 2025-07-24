/**
 * Utilitários para usar os ícones Ionicons no projeto SvelteKit
 * Gerado automaticamente em 2025-07-24T03:24:26.966Z
 */

/**
 * Caminho base para os ícones SVG
 */
export const IONICONS_SVG_PATH = '%sveltekit.assets%/assets/ionicons/svg';

/**
 * Caminho base para os arquivos JS do Ionicons
 */
export const IONICONS_JS_PATH = '%sveltekit.assets%/assets/ionicons';

/**
 * Lista de todos os arquivos JavaScript disponíveis
 */
export const JS_FILES = [
	'index.esm.js',
	'ionicons.esm.js',
	'ionicons.js',
	'p-1c0b2c47.entry.js',
	'p-2b141077.system.entry.js',
	'p-40ae2aa7.js',
	'p-60d56620.system.js',
	'p-cff0a9de.system.js',
	'p-d15ec307.js',
	'p-ea7bbed1.system.js',
	'p-eb3ff5ea.system.js'
];

/**
 * Lista de variantes de ícones disponíveis
 */
export const ICON_VARIANTS = ['outline', 'sharp', 'filled'] as const;

/**
 * Tipo para as variantes de ícones
 */
export type IconVariant = (typeof ICON_VARIANTS)[number];

/**
 * Gera o caminho completo para um ícone SVG
 * @param name - Nome do ícone (sem extensão)
 * @param variant - Variante do ícone (outline, sharp, filled)
 * @returns Caminho completo para o arquivo SVG
 *
 * @example
 * ```typescript
 * const iconPath = getIconPath('home', 'outline'); // '/assets/ionicons/svg/home-outline.svg'
 * const iconPath = getIconPath('add', 'sharp'); // '/assets/ionicons/svg/add-sharp.svg'
 * const iconPath = getIconPath('heart'); // '/assets/ionicons/svg/heart.svg' (filled é o padrão)
 * ```
 */
export function getIconPath(name: string, variant: IconVariant = 'filled'): string {
	const suffix = variant === 'filled' ? '' : `-${variant}`;
	return `${IONICONS_SVG_PATH}/${name}${suffix}.svg`;
}

/**
 * Verifica se um ícone existe (baseado no nome e variante)
 * @param name - Nome do ícone
 * @param variant - Variante do ícone
 * @returns Promise<boolean> indicando se o ícone existe
 *
 * @example
 * ```typescript
 * const exists = await iconExists('home', 'outline'); // true
 * const exists = await iconExists('nonexistent', 'outline'); // false
 * ```
 */
export async function iconExists(name: string, variant: IconVariant = 'filled'): Promise<boolean> {
	try {
		const response = await fetch(getIconPath(name, variant), { method: 'HEAD' });
		return response.ok;
	} catch {
		return false;
	}
}

/**
 * Carrega o conteúdo SVG de um ícone
 * @param name - Nome do ícone
 * @param variant - Variante do ícone
 * @returns Promise<string> com o conteúdo SVG
 *
 * @example
 * ```typescript
 * const svgContent = await loadIconSvg('home', 'outline');
 * ```
 */
export async function loadIconSvg(name: string, variant: IconVariant = 'filled'): Promise<string> {
	const response = await fetch(getIconPath(name, variant));
	if (!response.ok) {
		throw new Error(`Ícone não encontrado: ${name}-${variant}`);
	}
	return response.text();
}

/**
 * Lista de ícones mais comuns para uso rápido
 * Útil para autocomplete e referência
 */
export const COMMON_ICONS = [
	// Navegação
	'home',
	'menu',
	'arrow-back',
	'arrow-forward',
	'chevron-back',
	'chevron-forward',
	'chevron-up',
	'chevron-down',
	'close',
	'add',
	'remove',

	// Ações
	'search',
	'settings',
	'create',
	'save',
	'copy',
	'share',
	'download',
	'upload',
	'refresh',
	'sync',
	'trash',
	'edit',
	'delete',

	// Interface
	'eye',
	'eye-off',
	'heart',
	'star',
	'bookmark',
	'flag',
	'filter',
	'list',
	'grid',
	'apps',
	'layers',

	// Comunicação
	'mail',
	'call',
	'chatbubble',
	'notifications',
	'send',
	'person',
	'people',

	// Media
	'play',
	'pause',
	'stop',
	'volume-high',
	'volume-low',
	'volume-mute',
	'camera',
	'image',
	'videocam',
	'mic',
	'musical-notes',

	// Sistema
	'information',
	'warning',
	'alert',
	'checkmark',
	'close-circle',
	'help',
	'lock-closed',
	'lock-open',
	'key',
	'shield',

	// Documentos
	'document',
	'folder',
	'archive',
	'print',
	'clipboard',
	'library',

	// Dispositivos
	'desktop',
	'laptop',
	'tablet-portrait',
	'phone-portrait',
	'watch',

	// Redes Sociais/Logos
	'logo-github',
	'logo-google',
	'logo-facebook',
	'logo-twitter',
	'logo-instagram',
	'logo-youtube',
	'logo-linkedin',
	'logo-discord',
	'logo-whatsapp',

	// Desenvolvimento
	'code',
	'terminal',
	'git-branch',
	'git-commit',
	'build',
	'bug',
	'extension-puzzle',
	'server',
	'cloud',
	'database'
] as const;

/**
 * Tipo para ícones comuns
 */
export type CommonIcon = (typeof COMMON_ICONS)[number];

/**
 * Função utilitária para carregar os scripts do Ionicons
 * Útil para usar os web components <ion-icon>
 *
 * @example
 * ```typescript
 * // No seu +layout.svelte ou onde precisar dos web components
 * import { loadIoniconsScript } from '$lib/utils/ionicons';
 *
 * onMount(() => {
 *   loadIoniconsScript();
 * });
 * ```
 */
export function loadIoniconsScript(): void {
	if (typeof window === 'undefined') return; // SSR guard

	// Verifica se já foi carregado
	if (document.querySelector('script[src*="ionicons"]')) return;

	const script = document.createElement('script');
	script.type = 'module';
	script.src = `${IONICONS_JS_PATH}/ionicons.esm.js`;
	document.head.appendChild(script);
}

/**
 * Componente wrapper para ícones SVG (para uso em Svelte)
 * Retorna as props necessárias para um elemento img
 *
 * @example
 * ```svelte
 * <script>
 *   import { getIconProps } from '$lib/utils/ionicons';
 *
 *   export let icon = 'home';
 *   export let variant = 'outline';
 *   export let size = 24;
 *
 *   $: iconProps = getIconProps(icon, variant, size);
 * </script>
 *
 * <img {...iconProps} alt={icon} />
 * ```
 */
export function getIconProps(name: string, variant: IconVariant = 'filled', size: number = 24) {
	return {
		src: getIconPath(name, variant),
		width: size,
		height: size,
		style: `width: ${size}px; height: ${size}px;`
	};
}

/**
 * Utilitário para buscar ícones por categoria ou nome
 * @param query - Termo de busca
 * @returns Array de nomes de ícones que correspondem à busca
 *
 * @example
 * ```typescript
 * const homeIcons = searchIcons('home'); // ['home', 'home-outline', 'home-sharp']
 * const arrowIcons = searchIcons('arrow'); // ['arrow-back', 'arrow-forward', ...]
 * ```
 */
export function searchIcons(query: string): string[] {
	return COMMON_ICONS.filter((icon) => icon.toLowerCase().includes(query.toLowerCase()));
}
