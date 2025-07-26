# Scrollbar Customizada

Sistema de scrollbar integrado com Material Design e paleta de cores do projeto.

## 🎨 Características

- **Thumb**: `--theme-primary-400`
- **Track**: `--theme-surface-100`
- **Largura**: 8px
- **Transições**: Hover e active suaves

## 🌐 Compatibilidade

- **Firefox**: `scrollbar-width` e `scrollbar-color`
- **Webkit**: `::-webkit-scrollbar` pseudo-elementos
- **Auto-adapta**: Temas claro/escuro
- **Suporte responsivo**: Tema claro/escuro automático

### 3. Temas Alternativos

#### Scrollbar Secundária

```html
<div class="scrollbar-secondary">
	<!-- Conteúdo com scrollbar roxa -->
</div>
```

#### Scrollbar Accent

```html
<div class="scrollbar-accent">
	<!-- Conteúdo com scrollbar lilás -->
</div>
```

## Estrutura das Cores

### Tema Claro

- **Primary**: `hsl(164, 61%, 50%)` - Verde-azulado
- **Secondary**: `hsl(290, 46%, 50%)` - Roxo
- **Accent**: `hsl(273, 92%, 50%)` - Lilás vibrante
- **Surface**: `hsl(171, 28%, 90%)` - Cinza-verde claro

### Tema Escuro

- **Primary**: `hsl(164, 61%, 50%)` - Verde-azulado (mantém)
- **Secondary**: `hsl(290, 46%, 50%)` - Roxo (mantém)
- **Accent**: `hsl(273, 92%, 50%)` - Lilás (mantém)
- **Surface**: `hsl(171, 28%, 10%)` - Cinza-verde escuro

## Estados Interativos

### Hover

- **Primary**: `--theme-primary-500`
- **Secondary**: `--theme-secondary-500`
- **Accent**: `--theme-accent-500`

### Active

- **Primary**: `--theme-primary-600`
- **Secondary**: `--theme-secondary-600`
- **Accent**: `--theme-accent-600`

## Implementação Técnica

### CSS Custom Properties

```scss
::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

::-webkit-scrollbar-track {
	background: var(--theme-surface-100);
	border-radius: 4px;
}

::-webkit-scrollbar-thumb {
	background: var(--theme-primary-400);
	border-radius: 4px;
	border: 1px solid var(--theme-surface-200);
	transition: background-color 0.2s ease-in-out;
}
```

### Firefox Support

```scss
* {
	scrollbar-width: thin;
	scrollbar-color: var(--theme-primary-400) var(--theme-surface-100);
}
```

## Uso nos Componentes

### Componente PyodideInteractive

- Usar scrollbar padrão para código Python
- Considerar `scrollbar-accent` para output/resultados

### Componente Welcome (Jogo)

- Usar scrollbar padrão para texto narrativo
- Considerar `scrollbar-secondary` para menus de escolha

### Componente Counter

- Scrollbar padrão para elementos de UI simples

## Boas Práticas

1. **Consistência**: Use a scrollbar padrão na maioria dos casos
2. **Contextualização**: Use temas alternativos apenas quando fizer sentido semântico
3. **Acessibilidade**: Mantenha contraste adequado entre thumb e track
4. **Performance**: Evite muitas animações simultâneas de scrollbar

## Exemplo de Uso Completo

```svelte
<script>
	import { onMount } from 'svelte';

	let codeOutput = '';
	let gameNarrative = '';
</script>

<div class="container">
	<!-- Código Python - scrollbar padrão -->
	<pre class="code-editor">
    {codeOutput}
  </pre>

	<!-- Narrativa do jogo - scrollbar secundária -->
	<div class="game-text scrollbar-secondary">
		{gameNarrative}
	</div>

	<!-- Resultado especial - scrollbar accent -->
	<div class="special-output scrollbar-accent">
		<!-- Resultado importante -->
	</div>
</div>

<style>
	.container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		height: 400px;
	}

	.code-editor,
	.game-text,
	.special-output {
		overflow-y: auto;
		padding: 1rem;
		border-radius: 4px;
	}

	.code-editor {
		background: var(--theme-surface-100);
		font-family: var(--font-mono);
	}

	.game-text {
		background: var(--theme-background);
		border: 1px solid var(--theme-secondary-200);
	}

	.special-output {
		background: var(--theme-accent-50);
		border: 1px solid var(--theme-accent-200);
	}
</style>
```

## Considerações de Manutenção

- As cores da scrollbar seguem automaticamente os temas claro/escuro
- Atualizações na paleta em `_palette.scss` são refletidas automaticamente
- Suporte para navegadores legados através de fallbacks
- Comentários `stylelint-disable` para propriedades experimentais

---

_Esta documentação é parte do sistema de design do projeto ED | Acima das Nuvens_
