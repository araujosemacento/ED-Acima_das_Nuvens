<script>
	import Counter from '$lib/components/Counter.svelte';
	import welcome from '$lib/images/svelte-welcome.webp';
	import welcomeFallback from '$lib/images/svelte-welcome.png';
	import { pyodideStore } from '$lib/stores/pyodide.js';
	import { onMount } from 'svelte';

	// Estados mínimos para UI - Store já gerencia tudo internamente
	let result = $state(null);
	let isExecuting = $state(false);
	let pythonCode = $state("2 ** 10");

	// Uso direto dos estados derivados da store
	let statusMessage = $state($pyodideStore.statusMessage);

	// Função simplificada - Store já gerencia carregamento
	async function executePython() {
		if (isExecuting) return;
		
		isExecuting = true;
		try {
			result = await pyodideStore.run(pythonCode);
			// Converte resultado para string se for objeto complexo
			if (typeof result === 'object' && result !== null) {
				result = JSON.stringify(result, null, 2);
			}
		} catch (error) {
			console.error('❌ Erro ao executar:', error);
			result = `Erro: ${error.message}`;
		} finally {
			isExecuting = false;
		}
	}

	// Executa script de exemplo automaticamente
	async function runExampleScript() {
		try {
			console.log('📜 Executando script de exemplo...');
			const scriptResult = await pyodideStore.runScript('scripts/exemplo.py');
			console.log('✅ Script executado:', scriptResult);
		} catch (error) {
			console.error('❌ Erro no script de exemplo:', error);
		}
	}

	// Auto-execução ao carregar
	$effect(() => {
		pyodideStore.statusMessage.subscribe(msg => {
			statusMessage = msg;
		});
	});

	onMount(async () => {
		// API super simples: load + execute
		const loaded = await pyodideStore.load();
		if (loaded) {
			// Executa exemplo automático
			await executePython();
			// Executa script de arquivo
			await runExampleScript();
		}
	});
</script>

<svelte:head>
	<title>ED | Acima das Nuvens</title>
	<meta name="description" content="A SvelteKit application" />
</svelte:head>

<section>
	<div class="pyodide-section">
		<h3>🐍 Pyodide Interactive</h3>
		
		<div class="status">
			<p>{statusMessage}</p>
		</div>

		<div class="python-executor">
			<div class="input-group">
				<label for="python-code">Código Python:</label>
				<input 
					id="python-code"
					type="text" 
					bind:value={pythonCode}
					placeholder="Digite código Python..."
					disabled={isExecuting}
					onkeydown={e => e.key === 'Enter' && executePython()}
				/>
			</div>
			
			<button 
				onclick={executePython} 
				disabled={isExecuting}
				class="execute-btn"
			>
				{isExecuting ? '⏳ Executando...' : '▶️ Executar'}
			</button>
			
			{#if result !== null}
				<div class="result">
					<strong>Resultado:</strong> 
					<code>{result}</code>
				</div>
			{/if}

			<div class="examples">
				<h4>💡 Exemplos para testar:</h4>
				<div class="example-buttons">
					<button onclick={() => pythonCode = "import math; math.sqrt(64)"} class="example-btn">
						🔢 Matemática
					</button>
					<button onclick={() => pythonCode = "list(range(1, 11))"} class="example-btn">
						📋 Lista
					</button>
					<button onclick={() => pythonCode = "str({'nome': 'Pyodide', 'versao': '0.28.0'})"} class="example-btn">
						📚 Dicionário
					</button>
					<button onclick={() => pythonCode = "[x**2 for x in range(5)]"} class="example-btn">
						🔥 List Comprehension
					</button>
				</div>
			</div>
		</div>
	</div>

	<Counter />
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}
	
	.pyodide-section {
		margin: 2rem 0;
		padding: 1.5rem;
		border: 1px solid #ddd;
		border-radius: 12px;
		background-color: #f9f9f9;
		text-align: center;
		max-width: 600px;
		width: 100%;
	}

	.pyodide-section h3 {
		margin-top: 0;
		color: #333;
		font-size: 1.2rem;
	}

	.pyodide-section p {
		margin: 0.5rem 0;
	}

	.status p {
		font-weight: 500;
		font-size: 1rem;
	}

	.python-executor {
		margin-top: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		text-align: left;
	}

	.input-group label {
		font-weight: 500;
		color: #555;
	}

	.input-group input {
		padding: 0.75rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 1rem;
		font-family: 'Courier New', monospace;
	}

	.input-group input:focus {
		outline: none;
		border-color: #007acc;
		box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
	}

	.input-group input:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
	}

	.execute-btn {
		padding: 0.75rem 1.5rem;
		background-color: #007acc;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.execute-btn:hover:not(:disabled) {
		background-color: #005a9e;
	}

	.execute-btn:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	.result {
		padding: 1rem;
		background-color: #e8f5e8;
		border: 1px solid #4caf50;
		border-radius: 6px;
		text-align: left;
	}

	.result code {
		background-color: #f0f0f0;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
		font-weight: 600;
		color: #d63384;
	}

	.examples {
		margin-top: 1.5rem;
		padding: 1rem;
		background-color: #f0f8ff;
		border: 1px solid #b3d9ff;
		border-radius: 6px;
	}

	.examples h4 {
		margin: 0 0 0.75rem 0;
		color: #333;
		font-size: 0.9rem;
	}

	.example-buttons {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.example-btn {
		padding: 0.5rem 0.75rem;
		background-color: #e8f4fd;
		color: #0066cc;
		border: 1px solid #b3d9ff;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.85rem;
		transition: all 0.2s;
		white-space: nowrap;
	}

	.example-btn:hover {
		background-color: #d4edda;
		border-color: #007acc;
		transform: translateY(-1px);
	}
</style>
