<script>
	import { m } from '$lib/paraglide/messages.js';
	import Button from '@smui/button';

	let nuvemEsquerda = `
-:-:              ....
    ::        :::     .::
      :     ::           ::..
      .:  .:          .-:    .-
      .:  =:                 -::..
            :.         ..        .:..
                  .:..   .:.         .:.  ...
                           :. ...      .=    :=-.
                                  :     ::     :::.
                                   :.:  :-:       ::
                                    ::.:           :
  ..                                  ::         ::
  .:.                                .::      ::  :.
     -::                             :.           :-:::
     :                             -.            :     :
     :                                                 -:::
    .:                                            ..  .:  ..::
     :                                             :..:     :.
      :-...               .:     :                 :     :-:
                 ::.....         .:.  .:=:    ...:=        :
                         :.      .. ..  .::::::-::       ::.
        :: .::     .::... ...:..::          ...     ..-..
      .:       :-::-               :===-=   -.        -
...::.                               ::.  ........:-:.
                                        ..:::.
	`;

	let nuvemDireita = `
                                                                  ::
                       .:---::        ......      ....   .:-=-:-==:.
           .:::....:::.       :::::.:.      :::::.     =:           
          :.   .-              .:              .:    ::   .:--:     
          :     .:                                      ..    :.    
          .:                                                     :. 
          :-:    ::. .::            .:.:::..                      :.
         :      :       ... .:.  .:.                              :.
         :     :               =.                                =- 
         :     :                                                : .:
          ::                                                      .:
          :..                                                     .:
         :                                                       .: 
   .::. :.                            ::     .::.               :.  
  :.    .:      ..               .: .:::-:.:.                       
.:      :.:.    .:                                  .-.             
.:      .:.-:     .--::-:.                     ..::.  .:..          
 .:        .::.        .:.        .:. .:.:::::.        .::.      :  
 .::   ::          :-::  ..:----::.   .-    ::    :=::=-    :=:::-. 
        :=:.:: :=      .-===-==+==::.   .:.                         
	`;
</script>

<section id="welcome">
	<!-- <h1>{`${m.welcome()}!`}</h1>
	<p>{m.initial_disclaimer()}</p>
	<Button variant="unelevated" color="secondary">{m.start_game()}</Button> -->
      <div class='nuvens'>
        <pre class="nuvem-esquerda">{nuvemEsquerda}</pre>
        <pre class="nuvem-direita">{nuvemDireita}</pre>
      </div>
</section>

<style lang="scss">
	#welcome {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		height: 100vh;
		width: 100%;
		padding: 2rem;
		text-align: center;
		position: absolute;
		background-color: var(--theme-background);
		color: var(--theme-text);
        overflow: hidden;
		

        .nuvens {
            display: flex;
            position: absolute;
            width: 100%;
            height: 100%;
            justify-content: space-between;
            align-items: center;
        }
        
        .nuvem-esquerda,
        .nuvem-direita {
            font-family: monospace;
            color: var(--theme-text);
            font-size: 0.8rem;
            margin: 0;
            white-space: pre;
        }
        
        .nuvem-esquerda {
            text-align: left;
        }
        
        .nuvem-direita {
            text-align: right;
        }
		/* h1 {
			color: var(--theme-background);
			margin-bottom: 1rem;
		}
		
		p {
			color: var(--theme-background-100);
			margin-bottom: 2rem;
			max-width: 600px;
			line-height: 1.6;
		} */
	}
</style>
