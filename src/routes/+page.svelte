<script>
	import '../index.scss';
	import ripple from '../lib/ripple.svelte';
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
<button class="dark" use:ripple>Click me</button>
