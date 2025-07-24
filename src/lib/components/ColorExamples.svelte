<!-- Exemplo prático do novo sistema de cores -->
<script>
	import Button from '@smui/button';
	import Card from '@smui/card';
</script>

<div class="examples-container">
	<h1>🎨 Exemplos do Sistema de Cores</h1>

	<div class="examples-grid">
		<!-- Exemplo 1: Card com surface -->
		<Card class="example-card">
			<h2>Card com Surface</h2>
			<p>Este card usa as cores de surface do sistema.</p>
			<Button variant="raised" class="example-button">Botão Primário</Button>
		</Card>

		<!-- Exemplo 2: Card com background -->
		<Card class="example-card background-card">
			<h2>Card com Background</h2>
			<p>Este card usa as cores de background do sistema.</p>
			<Button variant="outlined" class="secondary-button">Botão Secundário</Button>
		</Card>

		<!-- Exemplo 3: Card com accent -->
		<Card class="example-card accent-card">
			<h2>Card com Accent</h2>
			<p>Este card usa as cores de accent do sistema.</p>
			<Button variant="unelevated" class="accent-button">Botão Accent</Button>
		</Card>

		<!-- Exemplo 4: Texto com diferentes shades -->
		<Card class="example-card text-shades">
			<h2>Diferentes Shades de Texto</h2>
			<p class="text-900">Texto muito escuro (900)</p>
			<p class="text-700">Texto escuro (700)</p>
			<p class="text-500">Texto médio (500)</p>
			<p class="text-300">Texto claro (300)</p>
			<p class="text-100">Texto muito claro (100)</p>
		</Card>
	</div>
</div>

<style>
	.examples-container {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		background-color: var(--theme-background);
		color: var(--theme-text);
		min-height: 100vh;
	}

	h1 {
		text-align: center;
		color: var(--theme-text-900);
		margin-bottom: 2rem;
	}

	.examples-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	/* Card padrão com surface */
	:global(.example-card) {
		background-color: var(--theme-surface) !important;
		color: var(--theme-text) !important;
		border: 1px solid var(--theme-surface-200) !important;
		padding: 1.5rem !important;
		border-radius: 8px !important;
	}

	/* Card com background */
	:global(.background-card) {
		background-color: var(--theme-background-100) !important;
		border: 1px solid var(--theme-background-300) !important;
	}

	/* Card com accent */
	:global(.accent-card) {
		background-color: var(--theme-accent-50) !important;
		border: 1px solid var(--theme-accent-200) !important;
	}

	/* Estilos para títulos dos cards */
	:global(.example-card h2) {
		color: var(--theme-text-900) !important;
		margin-bottom: 1rem !important;
		font-size: 1.25rem !important;
	}

	/* Estilos para parágrafos dos cards */
	:global(.example-card p) {
		color: var(--theme-text-700) !important;
		margin-bottom: 1rem !important;
		line-height: 1.5 !important;
	}

	/* Botão primário */
	:global(.example-button) {
		background-color: var(--theme-primary) !important;
		color: var(--theme-background) !important;
	}

	:global(.example-button:hover) {
		background-color: var(--theme-primary-600) !important;
	}

	/* Botão secundário */
	:global(.secondary-button) {
		border-color: var(--theme-secondary) !important;
		color: var(--theme-secondary) !important;
	}

	:global(.secondary-button:hover) {
		background-color: var(--theme-secondary-50) !important;
	}

	/* Botão accent */
	:global(.accent-button) {
		background-color: var(--theme-accent) !important;
		color: var(--theme-background) !important;
	}

	:global(.accent-button:hover) {
		background-color: var(--theme-accent-600) !important;
	}

	/* Diferentes shades de texto */
	.text-900 {
		color: var(--theme-text-900);
	}
	.text-700 {
		color: var(--theme-text-700);
	}
	.text-500 {
		color: var(--theme-text-500);
	}
	.text-300 {
		color: var(--theme-text-300);
	}
	.text-100 {
		color: var(--theme-text-100);
	}

	/* Responsividade */
	@media (max-width: 768px) {
		.examples-container {
			padding: 1rem;
		}

		.examples-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
