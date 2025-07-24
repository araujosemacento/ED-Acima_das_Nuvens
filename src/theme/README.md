# 🎨 Sistema de Cores Eficiente - ED | Acima das Nuvens

## Visão Geral

O sistema de cores foi completamente refatorado para integrar diretamente com a paleta definida em `_palette.scss`, eliminando duplicação e melhorando a manutenção.

## 🔧 Funções Principais

### 1. `theme-color($color-name, $theme: 'light')`

Acessa diretamente as cores da paleta SCSS.

```scss
.component {
	background-color: theme-color('primary');
	color: theme-color('text', 'dark');
	border: 1px solid theme-color('primary-200');
}
```

### 2. `theme-var($color-name, $prefix: 'theme')`

Gera variáveis CSS customizadas.

```scss
.component {
	background-color: theme-var('primary');
	color: theme-var('text-900');
}
```

### 3. `@mixin theme-color($property, $color-name, $theme: 'light')`

Aplica cores usando o mixin.

```scss
.component {
	@include theme-color('background-color', 'primary');
	@include theme-color('color', 'text', 'dark');
}
```

### 4. `@mixin theme-color-responsive($property, $color-name)`

Aplica cores que se adaptam automaticamente ao tema claro/escuro.

```scss
.component {
	@include theme-color-responsive('background-color', 'primary');
}
```

## 🎯 Variáveis CSS Disponíveis

### Cores Principais

```css
/* Texto */
--theme-text            /* Cor principal de texto */
--theme-text-50         /* Texto mais claro */
--theme-text-900        /* Texto mais escuro */

/* Fundo */
--theme-background      /* Fundo principal */
--theme-background-50   /* Fundo mais claro */
--theme-background-950  /* Fundo mais escuro */

/* Primária */
--theme-primary         /* Cor primária */
--theme-primary-50      /* Primária mais clara */
--theme-primary-950     /* Primária mais escura */

/* Secundária */
--theme-secondary       /* Cor secundária */
--theme-secondary-50    /* Secundária mais clara */
--theme-secondary-950   /* Secundária mais escura */

/* Accent */
--theme-accent          /* Cor de destaque */
--theme-accent-50       /* Accent mais claro */
--theme-accent-950      /* Accent mais escuro */

/* Surface */
--theme-surface         /* Cor de superfície */
--theme-surface-50      /* Surface mais claro */
--theme-surface-950     /* Surface mais escuro */
```

### Exemplo de Uso em Componentes Svelte

```svelte
<script>
	// Componente Svelte
</script>

<div class="card">
	<h2>Título</h2>
	<p>Conteúdo do card</p>
	<button>Ação</button>
</div>

<style>
	.card {
		background-color: var(--theme-surface);
		color: var(--theme-text);
		border: 1px solid var(--theme-surface-200);
		border-radius: 8px;
		padding: 1rem;
	}

	h2 {
		color: var(--theme-text-900);
		margin-bottom: 0.5rem;
	}

	p {
		color: var(--theme-text-700);
		line-height: 1.6;
	}

	button {
		background-color: var(--theme-primary);
		color: var(--theme-background);
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;

		&:hover {
			background-color: var(--theme-primary-600);
		}
	}
</style>
```

## 🔗 Compatibilidade

### Material Design

O sistema mantém compatibilidade total com Material Design UI:

```scss
// Ainda funciona
@include mdc-theme-color('background-color', 'primary');

// Variáveis MDC também funcionam
.component {
	background-color: var(--mdc-theme-primary);
}
```

### Migração de Código Antigo

```scss
// ❌ Antigo (não funciona mais)
background-color: theme-color(primary);

// ✅ Novo (recomendado)
background-color: var(--theme-primary);

// ✅ Alternativa SCSS
background-color: theme-color('primary');
```

## 📊 Melhorias de Performance

### Antes

- Duplicação de cores em múltiplos arquivos
- Dependência de runtime para Material Design
- Variáveis CSS estáticas

### Depois

- ✅ Fonte única de verdade (`_palette.scss`)
- ✅ Geração automática de variáveis CSS
- ✅ Suporte nativo a temas claro/escuro
- ✅ Compatibilidade com Material Design
- ✅ Melhor tree-shaking

## 🎨 Benefícios

1. **Consistência**: Todas as cores vêm da mesma paleta
2. **Eficiência**: Eliminação de duplicação
3. **Flexibilidade**: Fácil criação de novos temas
4. **Acessibilidade**: Integração com verificação automática
5. **Manutenibilidade**: Mudanças em um local apenas
6. **Performance**: Menos CSS gerado

## 🔧 Comandos Úteis

```bash
# Verificar acessibilidade
bun run accessibility-check

# Recompilar temas
bun run prepare-themes

# Teste visual
bun run accessibility-test
```

## 🚨 Notas Importantes

- Sempre use aspas simples para nomes de cores: `theme-color('primary')`
- Variáveis CSS se adaptam automaticamente ao tema escuro
- Para compatibilidade com Material Design, use prefixo `--mdc-theme-`
- Shades vão de 50 (mais claro) a 950 (mais escuro)
