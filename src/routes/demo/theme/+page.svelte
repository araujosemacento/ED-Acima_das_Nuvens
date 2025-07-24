<script>
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import Welcome from '$lib/components/Welcome.svelte';
</script>

<svelte:head>
	<title>Theme Toggle Demo - ED | Acima das Nuvens</title>
	<meta name="description" content="Demonstração do componente ThemeToggle" />
</svelte:head>

<section class="demo-page">
	<div class="demo-header">
		<h1>Demonstração do Theme Toggle</h1>
		<p>Use o botão de tema no canto superior direito para alternar entre os temas.</p>
	</div>

	<div class="demo-content">
		<div class="card">
			<h2>Recursos do ThemeToggle</h2>
			<ul>
				<li>✅ Botão circular com ícone do tema atual</li>
				<li>✅ Menu dropdown com bordas arredondadas</li>
				<li>✅ Opções: Claro, Escuro e Sistema</li>
				<li>✅ Ícones ionicons para cada opção</li>
				<li>✅ Persistência no localStorage</li>
				<li>✅ Detecção automática do tema do sistema</li>
				<li>✅ Suporte completo à internacionalização</li>
				<li>✅ Design responsivo e acessível</li>
			</ul>
		</div>

		<div class="card">
			<h2>Componente Welcome para referência</h2>
			<div class="welcome-demo">
				<Welcome />
			</div>
		</div>
	</div>
</section>

<style lang="scss">
	.demo-page {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.demo-header {
		text-align: center;
		margin-bottom: 3rem;

		h1 {
			color: var(--mdc-theme-primary);
			margin-bottom: 1rem;
		}

		p {
			color: var(--theme-text);
			font-size: 1.1rem;
		}
	}

	.demo-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		align-items: start;

		@media (max-width: 768px) {
			grid-template-columns: 1fr;
		}
	}

	.card {
		background-color: var(--theme-surface);
		border: 1px solid var(--theme-outline);
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;

		&:hover {
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
		}

		h2 {
			color: var(--mdc-theme-primary);
			margin-bottom: 1.5rem;
			font-size: 1.4rem;
		}

		ul {
			list-style: none;
			padding: 0;

			li {
				color: var(--theme-text);
				margin-bottom: 0.75rem;
				font-size: 1rem;
				line-height: 1.5;
			}
		}
	}

	.welcome-demo {
		border: 2px dashed var(--theme-outline);
		border-radius: 8px;
		padding: 1rem;
		background-color: var(--theme-background);
		position: relative;
		height: 300px;
		overflow: hidden;

		:global(#welcome) {
			position: relative !important;
			height: 100% !important;
			max-width: 100% !important;
			font-size: 0.8rem !important;

			h1 {
				font-size: 1.2rem !important;
			}

			p {
				font-size: 0.9rem !important;
			}
		}
	}
</style>
