<script>
	import { m } from '$lib/paraglide/messages.js';
	import Button from '@smui/button';
</script>

<section id="welcome" class="theme-background theme-text-transition">
	<h1 class="theme-text-transition">{`${m.welcome()}!`}</h1>
	<p class="theme-text-transition">{@html m.initial_disclaimer()}</p>
	<Button color="secondary" class="theme-interactive-transition">{m.start_game()}</Button>
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
		p {
			text-align: justify;
			text-align-last: center;
			text-justify: inter-word;
		}
	}
	@media (max-width: 576px) {
		#welcome {
			max-width: 80%;
		}
	}
</style>
