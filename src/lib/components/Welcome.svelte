<script>
	import { m } from '$lib/paraglide/messages.js';
	import Button from '@smui/button';

	let { ...props } = $props();
</script>

<section id="welcome">
	<h1>{`${m.welcome()}!`}</h1>
	<p>{m.initial_disclaimer()}</p>
	<Button variant="unelevated" color="secondary">{m.start_game()}</Button>
</section>

<style lang="scss">
	@import '../../app.scss';

	#welcome {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		width: 100%;
		padding: 2rem;
		text-align: center;
		position: absolute;
		background-color: theme-color(primary);
	}
</style>
