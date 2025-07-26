<script>
	import { m } from '$lib/paraglide/messages.js';
	import Button, { Label } from '@smui/button';
	import { onMount } from 'svelte';

	let mouseGlimmer = $state({ x: 50, y: 50 });
	let mousePosition = $state({ x: 0, y: 0 }); // Posição absoluta do mouse para cálculos vetoriais
	let welcomeSection;
	let glimmerElement;

	// Função derivada para cálculos vetoriais eficientes (Svelte 5 runes)
	const calculateGradientAngle = $derived((centerX, centerY) => {
		const deltaX = mousePosition.x - centerX;
		const deltaY = mousePosition.y - centerY;
		const angleRad = Math.atan2(deltaY, deltaX);
		return (angleRad * 180 / Math.PI + 360) % 360; // Normalizar para 0-360°
	});

	onMount(() => {
		const handleMouseMove = (event) => {
			// Atualizar posição global do mouse (rune para reatividade)
			mousePosition = { x: event.clientX, y: event.clientY };
			
			if (welcomeSection && glimmerElement) {
				// Usar viewport completo em vez de apenas o elemento welcome
				const x = (event.clientX / window.innerWidth) * 100;
				const y = (event.clientY / window.innerHeight) * 100;
				
				// Detectar tema atual para aplicar cores adequadas
				const isDarkTheme = document.documentElement.classList.contains('theme-dark');
				const isLightTheme = document.documentElement.classList.contains('theme-light');
				
				// Detectar se é mobile para ajustar tamanho e intensidade
				const isMobile = window.innerWidth <= 768; // 48rem = 768px
				const circleSize = isMobile ? '200px' : '300px';
				
				let glimmerColors;
				if (isDarkTheme) {
					glimmerColors = {
						center: isMobile ? 'rgba(255, 223, 186, 0.06)' : 'rgba(255, 223, 186, 0.08)',
						mid: isMobile ? 'rgba(255, 223, 186, 0.03)' : 'rgba(255, 223, 186, 0.04)',
						outer: isMobile ? 'transparent' : 'rgba(255, 223, 186, 0.02)'
					};
				} else if (isLightTheme) {
					glimmerColors = {
						center: isMobile ? 'rgba(100, 149, 237, 0.04)' : 'rgba(100, 149, 237, 0.06)',
						mid: isMobile ? 'rgba(100, 149, 237, 0.02)' : 'rgba(100, 149, 237, 0.03)',
						outer: isMobile ? 'transparent' : 'rgba(100, 149, 237, 0.01)'
					};
				} else {
					// Tema padrão/sistema
					glimmerColors = {
						center: isMobile ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.06)',
						mid: isMobile ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.03)',
						outer: isMobile ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
					};
				}
				
				// Aplicar animação suave usando Web Animation API
				const gradientStops = isMobile 
					? `${glimmerColors.center} 0%, ${glimmerColors.mid} 40%, transparent 70%`
					: `${glimmerColors.center} 0%, ${glimmerColors.mid} 40%, ${glimmerColors.outer} 70%, transparent 100%`;
				
				glimmerElement.animate([
					{
						background: `radial-gradient(
							${circleSize} circle at ${x}% ${y}%,
							${gradientStops}
						)`
					}
				], {
					duration: 333, // ~1/3s para suavidade ideal
					easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
					fill: 'forwards'
				});
				
				// Manter os valores para responsividade/temas
				mouseGlimmer = { x, y };
			}

			// Animar glow dos botões - SISTEMA HÍBRIDO ACCENT-BASED
			const buttonContainers = document.querySelectorAll('.button-border-container');
			buttonContainers.forEach(container => {
				const buttonBlob = container.querySelector('.button-blob');
				if (buttonBlob) {
					const rect = container.getBoundingClientRect();
					const centerX = rect.left + rect.width / 2;
					const centerY = rect.top + rect.height / 2;
					
					// Calcular posição relativa ao mouse dentro do container
					const relativeX = event.clientX - rect.left - 60; // -60 para centralizar blob (120px/2)
					const relativeY = event.clientY - rect.top - 60;
					
					// Calcular proximidade para intensidade dinâmica
					const distance = Math.sqrt(
						Math.pow(event.clientX - centerX, 2) + 
						Math.pow(event.clientY - centerY, 2)
					);
					// Raio de influência igual ao glimmer: 200px mobile / 300px desktop
					const isMobile = window.innerWidth <= 768;
					const maxDistance = isMobile ? 200 : 300;
					const proximity = Math.max(0, 1 - distance / maxDistance);
					
					// Detectar tema para cores accent adequadas
					const isDarkTheme = document.documentElement.classList.contains('theme-dark');
					const isLightTheme = document.documentElement.classList.contains('theme-light');
					
					let accentColor;
					if (isDarkTheme) {
						// Dark theme: accent-400 com intensidade aumentada para maior visibilidade
						accentColor = `hsla(273, 65%, 45%, ${proximity * 1.0})`;
					} else if (isLightTheme) {
						// Light theme: accent-600 com intensidade aumentada para maior visibilidade
						accentColor = `hsla(273, 70%, 35%, ${proximity * 0.9})`;
					} else {
						// System theme: fallback com intensidade aumentada
						accentColor = `rgba(255, 255, 255, ${proximity * 0.8})`;
					}
					
					// Animar com transform (performance) + cores accent
					buttonBlob.animate([
						{
							transform: `translate(${relativeX}px, ${relativeY}px)`,
							background: accentColor,
							opacity: proximity > 0.05 ? 1 : 0 // Limiar reduzido para maior sensibilidade
						}
					], {
						duration: 150, // Resposta rápida
						easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
						fill: 'forwards'
					});
					
					// Calcular ângulo vetorial do gradiente usando rune derivada
					const angleDeg = calculateGradientAngle(centerX, centerY);
					
					// Atualizar borda do container baseado na proximidade (intensidade aumentada)
					const borderIntensity = proximity * 0.77; // Intensidade aumentada
					container.animate([
						{
							background: `linear-gradient(${angleDeg}deg, 
								${accentColor}, 
								hsla(273, 65%, 55%, ${borderIntensity * 0.66}),
								hsla(273, 65%, 55%, ${borderIntensity * 0.33})
							)`
						}
					], {
						duration: 150,
						easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
						fill: 'forwards'
					});
				}
			});
		};

		const handleMouseLeave = () => {
			if (glimmerElement) {
				// Detectar tema atual e responsividade para cores consistentes
				const isDarkTheme = document.documentElement.classList.contains('theme-dark');
				const isLightTheme = document.documentElement.classList.contains('theme-light');
				const isMobile = window.innerWidth <= 768;
				const circleSize = isMobile ? '200px' : '300px';
				
				let glimmerColors;
				if (isDarkTheme) {
					glimmerColors = {
						center: isMobile ? 'rgba(255, 223, 186, 0.06)' : 'rgba(255, 223, 186, 0.08)',
						mid: isMobile ? 'rgba(255, 223, 186, 0.03)' : 'rgba(255, 223, 186, 0.04)',
						outer: isMobile ? 'transparent' : 'rgba(255, 223, 186, 0.02)'
					};
				} else if (isLightTheme) {
					glimmerColors = {
						center: isMobile ? 'rgba(100, 149, 237, 0.04)' : 'rgba(100, 149, 237, 0.06)',
						mid: isMobile ? 'rgba(100, 149, 237, 0.02)' : 'rgba(100, 149, 237, 0.03)',
						outer: isMobile ? 'transparent' : 'rgba(100, 149, 237, 0.01)'
					};
				} else {
					glimmerColors = {
						center: isMobile ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.06)',
						mid: isMobile ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.03)',
						outer: isMobile ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
					};
				}
				
				const gradientStops = isMobile 
					? `${glimmerColors.center} 0%, ${glimmerColors.mid} 40%, transparent 70%`
					: `${glimmerColors.center} 0%, ${glimmerColors.mid} 40%, ${glimmerColors.outer} 70%, transparent 100%`;
				
				// Suave retorno ao centro quando o mouse sai da janela
				glimmerElement.animate([
					{
						background: `radial-gradient(
							${circleSize} circle at 50% 50%,
							${gradientStops}
						)`
					}
				], {
					duration: 300,
					easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
					fill: 'forwards'
				});
			}
			
			// Reset dos botões quando mouse sai da janela
			const buttonContainers = document.querySelectorAll('.button-border-container');
			buttonContainers.forEach(container => {
				const buttonBlob = container.querySelector('.button-blob');
				if (buttonBlob) {
					buttonBlob.animate([
						{
							opacity: 0,
							transform: 'translate(0, 0)'
						}
					], {
						duration: 200,
						easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
						fill: 'forwards'
					});
					
					// Reset da borda com ângulo neutro
					container.animate([
						{
							background: `linear-gradient(45deg, 
								rgba(255, 255, 255, 0.15), 
								rgba(255, 255, 255, 0.05),
								rgba(255, 255, 255, 0.15)
							)`
						}
					], {
						duration: 300,
						easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
						fill: 'forwards'
					});
				}
			});
			
			mouseGlimmer = { x: 50, y: 50 };
			mousePosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 }; // Reset para centro da tela
		};

		// Escutar eventos no documento inteiro para capturar movimento global
		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseleave', handleMouseLeave);

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseleave', handleMouseLeave);
		};
	});
</script>

<section id="welcome" class="theme-background theme-text-transition" bind:this={welcomeSection}>
	<!-- Glimmer radial que segue o mouse -->
	<div 
		class="mouse-glimmer"
		bind:this={glimmerElement}
	></div>
	
	<!-- Conteúdo principal -->
	<div class="welcome-content">
		<div class="text-container">
			<h1 class="theme-text-transition text-outlined title-text" data-text="{m.welcome()}!">{m.welcome()}!</h1>
		</div>
		<div class="disclaimer-text">
			<div class="text-container">
				<p class="theme-text-transition text-outlined" data-text="{m.initial_disclaimer_paragraph1()}">{m.initial_disclaimer_paragraph1()}</p>
			</div>
			<div class="text-container">
				<p class="theme-text-transition text-outlined" data-text="{m.initial_disclaimer_paragraph2()}">{m.initial_disclaimer_paragraph2()}</p>
			</div>
		</div>
		<div class="button-border-container">
			<Button variant="unelevated" class="theme-interactive-transition game-start-button">
				<Label>{m.start_game()}</Label>
			</Button>
			<div class="button-blob"></div>
		</div>
	</div>
</section>

<style lang="scss">
	#welcome {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		max-width: 50%;
		padding: 2rem;
		text-align: center;
		position: fixed;
		background-color: var(--theme-background);
		color: var(--theme-text);
		overflow: hidden;
		line-height: 175%;

		p {
			text-align: justify;
			text-align-last: center;
			text-justify: inter-word;
		}
	}

	/* Glimmer radial que segue o mouse */
	.mouse-glimmer {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 2; /* Acima do pseudo-elemento do outline (z-index: -1), mas abaixo do conteúdo (z-index: 10) */
		pointer-events: none;
		/* Removemos a transition CSS - será controlada via Web Animation API */
		
		background: radial-gradient(
			300px circle at 50% 50%, /* Posição inicial centralizada */
			rgba(255, 255, 255, 0.06) 0%,
			rgba(255, 255, 255, 0.03) 40%,
			rgba(255, 255, 255, 0.01) 70%,
			transparent 100%
		);
	}

	.disclaimer-text {
		display: flex;
		flex-direction: column;
		gap: 1rem;

		p {
			margin: 0;
		}
	}

	.welcome-content {
		position: relative;
		z-index: 10;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
	}

	/* Container para texto com outline */
	.text-container {
		position: relative;
		display: inline-block;
	}

	.text-outlined {
		position: relative;
		z-index: 2;
		font-weight: 600;
		color: var(--mdc-theme-text-primary-on-background);

		/* MÉTODO PRINCIPAL: Pseudo-elemento para outline com blur independente */
		&::before {
			position: absolute;
			top: 0;
			left: 0;
			z-index: -1;
			font-family: inherit;
			font-size: inherit;
			font-weight: inherit;
			line-height: inherit;
			text-align: inherit;
			color: transparent;
			pointer-events: none;
			
			/* Outline com blur aplicado apenas ao pseudo-elemento */
			-webkit-text-stroke: 0.5rem var(--theme-background);
			filter: blur(0.04rem);
		}

		/* FALLBACK: text-shadow para browsers que não suportam -webkit-text-stroke */
		@supports not (-webkit-text-stroke: 1px) {
			&::before {
				display: none;
			}
			
			text-shadow:
				-0.5rem -0.5rem 0 var(--theme-background),
				0.5rem -0.5rem 0 var(--theme-background),
				-0.5rem 0.5rem 0 var(--theme-background),
				0.5rem 0.5rem 0 var(--theme-background);
		}

		/* Ajuste especial para títulos */
		&.title-text::before {
			-webkit-text-stroke: 0.7rem var(--theme-background);
			filter: blur(0.06rem);
		}
		
		&.title-text {
			@supports not (-webkit-text-stroke: 1px) {
				text-shadow:
					-0.7rem -0.7rem 0 var(--theme-background),
					0.7rem -0.7rem 0 var(--theme-background),
					-0.7rem 0.7rem 0 var(--theme-background),
					0.7rem 0.7rem 0 var(--theme-background);
			}
		}
	}

	/* Responsividade */
	@media (max-width: 48rem) {
		#welcome {
			max-width: 80%;
		}

		.text-outlined {
			/* Mobile: reduzir intensidade do outline e blur */
			&::before {
				-webkit-text-stroke: 0.3rem var(--theme-background);
				filter: blur(0.03rem);
			}

			&.title-text::before {
				-webkit-text-stroke: 0.4rem var(--theme-background);
				filter: blur(0.04rem);
			}

			/* Fallback mobile para text-shadow */
			@supports not (-webkit-text-stroke: 1px) {
				&::before {
					display: none;
				}
				
				text-shadow:
					-0.3rem -0.3rem 0 var(--theme-background),
					0.3rem -0.3rem 0 var(--theme-background),
					-0.3rem 0.3rem 0 var(--theme-background),
					0.3rem 0.3rem 0 var(--theme-background);

				&.title-text {
					text-shadow:
						-0.4rem -0.4rem 0 var(--theme-background),
						0.4rem -0.4rem 0 var(--theme-background),
						-0.4rem 0.4rem 0 var(--theme-background),
						0.4rem 0.4rem 0 var(--theme-background);
				}
			}
		}
	}

	/* Container da borda - estrutura similar à referência */
	.button-border-container {
		position: relative;
		border-radius: 2rem;
		padding: 3px; /* Largura da borda */
		overflow: hidden; /* Confina o blob à área da borda */
		background: linear-gradient(45deg, 
			rgba(255, 255, 255, 0.15), 
			rgba(255, 255, 255, 0.05),
			rgba(255, 255, 255, 0.15)
		);
		transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Estilo para o botão - agora filho do container */
	:global(.game-start-button) {
		position: relative !important;
		border-radius: 2rem !important;
		padding: 1rem 2rem !important;
		min-width: 12rem !important;
		height: 3rem !important;
		font-weight: 600 !important;
		font-size: 1rem !important;
		letter-spacing: 0.5px !important;
		border: none !important; /* Remove borda, será feita pelo container */
		margin: 0 !important;
		width: 100% !important;
		box-sizing: border-box !important;
		background: var(--mdc-theme-primary) !important;
		transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1) !important;
	}

	/* Blob que segue o mouse - baseado na referência */
	.button-blob {
		position: absolute;
		top: 0;
		left: 0;
		width: 120px;
		height: 120px;
		border-radius: 50%;
		pointer-events: none;
		z-index: -1;
		filter: blur(20px);
		opacity: 0;
		transition: opacity 200ms ease-out;
		/* Cor inicial - será atualizada dinamicamente */
		background: rgba(255, 255, 255, 0.6);
	}

	/* Hover states */
	.button-border-container:hover .button-blob {
		opacity: 1;
	}

	.button-border-container:hover {
		transform: translateY(-2px);
		box-shadow: 
			0 8px 25px rgba(0, 0, 0, 0.15),
			0 0 15px rgba(255, 255, 255, 0.2);
	}

	:global(.game-start-button:active) {
		transform: translateY(0) !important;
	}

	/* Customização do Label do Button */
	:global(.game-start-button .mdc-button__label) {
		position: relative;
		z-index: 2;
		font-weight: 600 !important;
		letter-spacing: 0.5px !important;
	}
</style>
