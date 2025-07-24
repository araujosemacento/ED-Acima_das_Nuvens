<script>
	import { Spring } from 'svelte/motion';

	const count = new Spring(0);
	const offset = $derived(modulo(count.current, 1));

	function modulo(n, m) {
		// handle negative numbers
		return ((n % m) + m) % m;
	}
</script>

<div class="counter">
	<button onclick={() => (count.target -= 1)} aria-label="Decrease the counter by one">
		<svg aria-hidden="true" viewBox="0 0 1 1">
			<path d="M0,0.5 L1,0.5" />
		</svg>
	</button>

	<div class="counter-viewport">
		<div class="counter-digits" style="transform: translate(0, {100 * offset}%)">
			<strong class="hidden" aria-hidden="true">{Math.floor(count.current + 1)}</strong>
			<strong>{Math.floor(count.current)}</strong>
		</div>
	</div>

	<button onclick={() => (count.target += 1)} aria-label="Increase the counter by one">
		<svg aria-hidden="true" viewBox="0 0 1 1">
			<path d="M0,0.5 L1,0.5 M0.5,0 L0.5,1" />
		</svg>
	</button>
</div>

<style>
	.counter {
		display: flex;
		border-top: 1px solid var(--mdc-theme-text-hint-on-background);
		border-bottom: 1px solid var(--mdc-theme-text-hint-on-background);
		margin: 1rem 0;
		background-color: var(--mdc-theme-surface);
		border-radius: 8px;
		overflow: hidden;
	}

	.counter button {
		width: 2em;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 0;
		background-color: var(--mdc-theme-background);
		color: var(--mdc-theme-on-surface);
		touch-action: manipulation;
		font-size: 2rem;
		cursor: pointer;
	}

	.counter button:hover {
		background-color: var(--mdc-theme-primary);
		color: var(--mdc-theme-on-primary);
	}

	svg {
		width: 25%;
		height: 25%;
	}

	path {
		vector-effect: non-scaling-stroke;
		stroke-width: 2px;
		stroke: var(--mdc-theme-text-primary-on-background);
	}

	.counter button:hover path {
		stroke: var(--mdc-theme-on-primary);
	}

	.counter-viewport {
		width: 8em;
		height: 4em;
		overflow: hidden;
		text-align: center;
		position: relative;
		background-color: var(--mdc-theme-surface);
	}

	.counter-viewport strong {
		position: absolute;
		display: flex;
		width: 100%;
		height: 100%;
		font-weight: 400;
		color: var(--mdc-theme-primary);
		font-size: 4rem;
		font-family: var(--font-body);
		align-items: center;
		justify-content: center;
	}

	.counter-digits {
		position: absolute;
		width: 100%;
		height: 100%;
	}

	.hidden {
		top: -100%;
		user-select: none;
	}
</style>
