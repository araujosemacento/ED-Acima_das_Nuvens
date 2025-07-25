# Instruções GitHub Copilot - ED | Acima das Nuvens

## Visão Geral

**"ED | Acima das Nuvens"** é uma plataforma educacional interativa que combina jogo narrativo RPG com ensino de estruturas de dados usando Python no browser.

## Stack Tecnológica

- **Frontend**: SvelteKit 5 + Svelte 5 (runes)
- **UI**: Svelte Material UI (SMUI) v8.0.0-beta.3
- **Animações**: Svelte Motion + SCSS
- **i18n**: Paraglide JS (pt-br/en)
- **Python**: Pyodide (runtime no browser)
- **Ícones**: Ionicons 7.1.0
- **Build**: Vite 7+ + Bun

## Estrutura Principal

```
src/lib/
├── components/
│   ├── Welcome.svelte      # Tela principal com animações
│   └── ThemeToggle.svelte  # Alternador de temas
├── stores/
│   ├── cloudMotion.js      # Animações de nuvens (Svelte Motion)
│   ├── theme.js           # Sistema de temas com transições JS
│   ├── pyodide.js         # Gerenciamento Python
│   └── logger.js          # Logger desenvolvimento
└── utils/
    └── ionicons.ts        # Helper ícones
```

## Stores Principais

### 1. cloudMotion.js

- **Sistema refatorado** usando Svelte Motion (tweened/spring)
- **Estilos**: gentle, dynamic, elastic
- **Configuração**: duração, easing, raio personalizáveis
- **Action**: `registerCloudMotion` para componentes

### 2. theme.js

- **Temas**: light, dark, system (auto-detecção)
- **Transições**: JavaScript puro (300ms, 60fps)
- **Persistência**: localStorage + sync sistema
- **Anti-padrão**: Nunca usar CSS transitions para cores

### 3. pyodide.js

- **API**: `load()`, `run()`, `runScript()`, `install()`
- **Estados**: `isReady`, `isLoading`, `hasError`
- **Scripts**: Carregamento em `/static/scripts/`

### 4. logger.js

- **Humanizado**: Português BR
- **Categorias**: theme, animation, component, store
- **Performance**: Medição automática (dev only)

## Padrões Obrigatórios

### Svelte 5 Runes

```javascript
let count = $state(0);
let doubled = $derived(count * 2);
$effect(() => console.log(count));
```

### Eventos Svelte 5

- **Declarações obsoletas**: `on:click`, `on:SMUI:action`
- **Usar**: `onclick`, `onSMUIaction`
- **Padrão**: Event handlers como propriedades diretas

### Sistema de Temas

- **NUNCA** usar CSS transitions para cores
- **JavaScript puro** para interpolação HSL
- **Classes**: `.theme-light`, `.theme-dark`

### CSS Responsivo

- **Preferir** unidades responsivas: `em`, `rem`
- **Evitar** pixels fixos (`px`) quando possível
- **Mobile-first** responsive design

### Processo de Mudanças

- **NUNCA aplicar** alterações sem confirmação
- **Apresentar propostas** detalhadas primeiro
- **Aguardar aprovação** explícita

## Comandos

```bash
bun run dev        # Desenvolvimento
bun run build      # Build produção
bun run clean      # Limpeza cache
bun run lint       # Linting
bun run format     # Formatação
```

## Estado Atual

- ✅ SvelteKit 5 + Svelte 5 (runes)
- ✅ Sistema de temas Material Design 3
- ✅ Animações cloudMotion (Svelte Motion)
- ✅ Internacionalização Paraglide JS
- ✅ Pyodide integrado
- ✅ Logger desenvolvimento
- ✅ Ionicons 7.1.0
- 🚧 Jogo narrativo
- 🚧 Conteúdo educacional

## Deploy

- **URL**: https://araujosemacento.github.io/ED-Acima_das_Nuvens/
- **Automático**: Push main → GitHub Pages
