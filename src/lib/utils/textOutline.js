/**
 * Utilitário para geração matemática de text-shadow para outlines pixel-perfect
 * Sistema híbrido: CSS transitions para outline + interpolação para texto
 * Integrado com sistema de temas ED | Acima das Nuvens
 *
 * @see https://stackoverflow.com/questions/26634201/add-stroke-around-text-on-the-outside-with-css/76432928#76432928
 */

/**
 * Gera string de text-shadow matematicamente distribuída para outline responsivo
 * ATENÇÃO: Usa CSS custom properties para permitir transitions automáticas
 *
 * @param {number} radiusEm - Espessura do outline em unidades em (responsivo)
 * @param {string} colorVar - Nome da variável CSS (ex: '--outline-color')
 * @param {number} blurEm - Blur opcional em unidades em (padrão: 0)
 * @returns {string} String CSS para text-shadow usando CSS variables
 */
export function generateMathematicalOutline(radiusEm, colorVar = '--outline-color', blurEm = 0) {
	if (radiusEm <= 0) return '';

	// Converter em para px baseado no font-size do root (16px padrão)
	const baseFontSize = 16;
	const radiusPx = radiusEm * baseFontSize;

	// Calcular número de shadows: 2⋅radius⋅π (arredondado para cima)
	const shadowCount = Math.ceil(2 * Math.PI * radiusPx);
	const shadows = [];

	for (let i = 0; i < shadowCount; i++) {
		// Ângulo para esta shadow (distribuição uniforme em círculo)
		const theta = (2 * Math.PI * i) / shadowCount;

		// Coordenadas cartesianas em em (responsivo)
		const x = Math.round(radiusEm * Math.cos(theta) * 1000) / 1000;
		const y = Math.round(radiusEm * Math.sin(theta) * 1000) / 1000;

		// Formato: offsetX offsetY blur var(--css-variable)
		shadows.push(`${x}em ${y}em ${blurEm}em var(${colorVar})`);
	}

	return shadows.join(', ');
}

/**
 * Presets otimizados usando CSS variables para transitions automáticas
 * Performance máxima: outline via CSS transitions, texto via interpolação
 */
export const OUTLINE_PRESETS = {
	// Desktop - outline sutil responsivo
	desktop: {
		normal: () => generateMathematicalOutline(0.15, '--outline-color'), // 0.1em usando CSS var
		title: () => generateMathematicalOutline(0.075, '--outline-color'), // 0.15em usando CSS var
		titleBlur: () => generateMathematicalOutline(0.075, '--outline-color', 0.05) // Com blur sutil
	},

	// Mobile - outline ainda mais sutil
	mobile: {
		normal: () => generateMathematicalOutline(0.33, '--outline-color'), // 0.08em usando CSS var
		title: () => generateMathematicalOutline(0.2, '--outline-color'), // 0.12em usando CSS var
		titleBlur: () => generateMathematicalOutline(0.2, '--outline-color', 0.03) // Com blur reduzido
	}
};

/**
 * Aplica outline responsivo usando CSS variables (performance otimizada)
 *
 * @param {HTMLElement} element - Elemento DOM
 * @param {string} preset - Preset do OUTLINE_PRESETS
 * @param {boolean} isMobile - Se é contexto mobile
 */
export function applyDynamicOutline(element, preset, isMobile = false) {
	if (!element) return;

	const context = isMobile ? OUTLINE_PRESETS.mobile : OUTLINE_PRESETS.desktop;
	const shadowString = context[preset]?.();

	if (shadowString) {
		element.style.textShadow = shadowString;
	}
}

/**
 * Detecta se o dispositivo é mobile baseado na largura da viewport
 */
export function isMobileDevice() {
	return window.innerWidth <= 768; // 48rem
}

/**
 * Sistema híbrido otimizado para performance máxima:
 * - Outline: CSS transitions via CSS variables (muito mais rápido)
 * - Texto: Mantém interpolação suave para cores sólidas
 *
 * @param {Array<{element: HTMLElement, preset: string}>} elements - Elementos para atualizar
 */
export function createOutlineThemeObserver(elements) {
	let isMobile = isMobileDevice();

	// Função para atualizar CSS variables do tema (instantâneo, muito performático)
	const updateThemeVariables = () => {
		const root = document.documentElement;
		const isDark = root.classList.contains('theme-dark');
		const isLight = root.classList.contains('theme-light');

		// Usar cores da paleta ED definidas em _palette.scss
		if (isDark) {
			root.style.setProperty('--outline-color', 'hsl(145, 25%, 8%)');
		} else if (isLight) {
			root.style.setProperty('--outline-color', 'hsl(145, 35%, 98%)');
		} else {
			// System theme detection
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			root.style.setProperty(
				'--outline-color',
				prefersDark ? 'hsl(145, 25%, 8%)' : 'hsl(145, 35%, 98%)'
			);
		}
	};

	// Função para atualizar apenas responsividade (quando necessário)
	const updateResponsiveOutlines = () => {
		const currentIsMobile = isMobileDevice();
		if (currentIsMobile !== isMobile) {
			elements.forEach(({ element, preset }) => {
				applyDynamicOutline(element, preset, currentIsMobile);
			});
			isMobile = currentIsMobile;
		}
	};

	// Observer para mudanças de tema (apenas atualiza CSS variables - super rápido)
	const themeObserver = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
				updateThemeVariables(); // Instantâneo via CSS variables
			}
		});
	});

	// Observer para mudanças de viewport (responsividade)
	const resizeObserver = new ResizeObserver(() => {
		updateResponsiveOutlines(); // Só quando necessário
	});

	// Inicializar sistema
	updateThemeVariables(); // CSS variables iniciais

	// Aplicar outlines iniciais aos elementos
	elements.forEach(({ element, preset }) => {
		applyDynamicOutline(element, preset, isMobile);
	});

	// Iniciar observação
	themeObserver.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['class']
	});

	resizeObserver.observe(document.documentElement);

	// Retornar função de cleanup
	return () => {
		themeObserver.disconnect();
		resizeObserver.disconnect();
	};
}

/**
 * Utilitário para gerar CSS estático (para desenvolvimento)
 * Útil para visualizar os valores gerados com as cores da paleta
 */
export function generateStaticCSS() {
	// Só gera CSS e logs em desenvolvimento
	if (typeof window === 'undefined' || !import.meta.env?.DEV) {
		return;
	}

	// Demonstrar uso com CSS variables (mais performático)
	console.group('🎨 CSS Text-Shadow Híbrido (Outline + CSS Variables)');

	console.group('📱 Desktop Presets');
	console.log('Normal (0.1em):', OUTLINE_PRESETS.desktop.normal());
	console.log('Title (0.15em):', OUTLINE_PRESETS.desktop.title());
	console.log('Title Blur:', OUTLINE_PRESETS.desktop.titleBlur());
	console.groupEnd();

	console.group('📱 Mobile Presets');
	console.log('Normal (0.08em):', OUTLINE_PRESETS.mobile.normal());
	console.log('Title (0.12em):', OUTLINE_PRESETS.mobile.title());
	console.log('Title Blur:', OUTLINE_PRESETS.mobile.titleBlur());
	console.groupEnd();

	console.group('🎯 CSS Variables (Performance)');
	console.log('Outline Color:', '--outline-color (tema automático)');
	console.log('Transição:', 'CSS transition na variável = animação automática');
	console.log('Performance:', 'CSS variables >> interpolação de múltiplas sombras');
	console.groupEnd();

	console.groupEnd();
}

// Executar geração de CSS estático em desenvolvimento
if (import.meta.env?.DEV) {
	// Aguardar um pouco para não poluir o console inicial
	setTimeout(() => {
		console.log('💡 Execute generateStaticCSS() no console para ver o sistema híbrido');
	}, 2000);
}
