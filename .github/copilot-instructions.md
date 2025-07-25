# Instruções para GitHub Copilot - ED | Acima das Nuvens

## Visão Geral do Projeto

**"ED | Acima das Nuvens"** é um projeto educacional interativo que combina:

- **Jogo narrativo RPG** baseado em texto inspirado em João e o Pé de Feijão
- **Plataforma educacional** para ensino de estruturas de dados e algoritmos usando Python
- **Interface web moderna** com animações de nuvens e sistema de temas

## Arquitetura Técnica

### Stack Principal

- **Frontend**: SvelteKit 5 com Svelte 5 (runes)
- **Linguagem**: JavaScript + Python (via Pyodide)
- **UI Framework**: Svelte Material UI (SMUI) v8.0.0-beta.3
- **Styling**: SCSS + CSS Custom Properties
- **Internacionalização**: Paraglide JS (pt-br/en)
- **Python Runtime**: Pyodide (execução no browser)
- **Ícones**: Ionicons 7.1.0 (1338+ SVGs disponíveis)
- **Build**: Vite 6.2.6
- **Deployment**: Static adapter

### Estrutura de Diretórios

```
src/
├── lib/
│   ├── components/          # Componentes Svelte
│   │   ├── ColorExamples.svelte    # Demonstração do sistema de cores
│   │   ├── Counter.svelte          # Contador animado
│   │   ├── PyodideInteractive.svelte # Interface Python interativa
│   │   ├── ThemeToggle.svelte      # Alternador de temas
│   │   └── Welcome.svelte          # Tela principal com animações
│   ├── stores/             # Stores Svelte
│   │   ├── cloudAnimations.js      # Animações de nuvens
│   │   ├── logger.js               # Logger de desenvolvimento
│   │   ├── pyodide.js             # Gerenciamento Pyodide
│   │   └── theme.js               # Sistema de temas
│   ├── utils/              # Utilitários
│   │   └── ionicons.ts           # Helper para ícones
│   └── paraglide/          # Sistema de i18n
├── routes/                 # Rotas SvelteKit
├── theme/                  # Temas Material Design + testes
└── app.scss               # Estilos globais + transições

static/
├── assets/
│   ├── ionicons/          # 1338 ícones SVG + JS
│   └── nuvens/           # Assets de nuvens (light/dark)
├── scripts/              # Scripts Python educacionais
└── fonts/               # Fontes Noto customizadas
```

## Funcionalidades Principais

### 1. Sistema de Temas Avançado (theme.js)

- **Store principal**: `themeStore` com detecção automática do sistema
- **Tipos**: light, dark, system (detecção automática)
- **Transições**: JavaScript puro com interpolação HSL suave (300ms, 60fps)
- **Persistência**: localStorage + sincronização com preferências do sistema
- **API**: `setTheme()`, `resetToSystem()`, `getCurrentTheme()`

### 2. Animações de Nuvens (cloudAnimations.js)

- **Store**: `cloudAnimationsStore` com registro automático de elementos
- **Padrão**: Movimento "choppy" com 8 direções + parada
- **Configuração**: 15-25 passos, 8-20s duração, raio de 60px
- **Action**: `registerCloudElement` para uso em componentes
- **Controles**: `setActive()`, `initializeAllAnimations()`, `cleanup()`

### 3. PyodideInteractive (pyodide.js)

- **API simplificada**: `load()`, `run()`, `runScript()`, `install()`
- **Estados derivados**: `isReady`, `isLoading`, `hasError`, `statusMessage`
- **Cache**: Scripts carregados ficam em memória
- **Exemplos**: Scripts em `/static/scripts/` para demonstrações

### 4. Logger de Desenvolvimento (logger.js)

- **Humanizado**: Logs em português brasileiro com emojis
- **Categorias**: `theme()`, `animation()`, `component()`, `store()`, `transition()`
- **Performance**: Medição automática de transições com thresholds
- **Produção**: Desabilitado automaticamente (`dev` check)

### 5. Componente Welcome

- **Animações**: 17 assets de nuvens com movimento orgânico
- **Responsivo**: Layout adaptativo com texto outline
- **Integração**: Sistema de temas + animações + i18n

## Padrões de Desenvolvimento

### Svelte 5 (Runes)

```javascript
// Estados reativos
let count = $state(0);
let doubled = $derived(count * 2);

// Props
let { title, ...props } = $props();

// Efeitos
$effect(() => {
	console.log('Count changed:', count);
});
```

### Sistema de Temas CSS

- **Transições desabilitadas**: CSS transitions removidas para cores
- **JavaScript puro**: Interpolação HSL com easing ease-in-out
- **Variáveis CSS**: `--mdc-theme-*` para cores principais
- **Classes condicionais**: `.theme-light`, `.theme-dark`

### Stores Pattern

- **Classes base**: Stores como classes para APIs complexas
- **Estados derivados**: Computed values com `derived()`
- **Subscription**: Método `subscribe()` para compatibilidade Svelte
- **Lifecycle**: Cleanup automático em componentes

### Performance

- **Logger integrado**: Medição automática de transições e animações
- **Thresholds**: 300ms transições, 500ms animações
- **Cache**: Scripts Python, elementos DOM, configurações
- **Lazy loading**: Pyodide carregado sob demanda

## Scripts Python Educacionais

### Exemplo Base (`static/scripts/exemplo.py`)

```python
def saudacao(nome="Desenvolvedor"):
    """Função de saudação personalizada"""
    return f"🐍 Olá, {nome}! Bem-vindo ao Pyodide!"

def calcular_fibonacci(n):
    """Calcula sequência de Fibonacci até n termos"""
    # Implementação educacional...

def operacoes_matematicas(a, b):
    """Realiza operações matemáticas básicas"""
    # Demonstração de estruturas de dados...
```

## Recursos do Sistema

### 1. Ionicons Integration

- **1338 ícones SVG** disponíveis em `/static/assets/ionicons/`
- **Helper TypeScript** em `src/lib/utils/ionicons.ts`
- **Categorias**: Navegação, UI, Comunicação, Sistema, etc.
- **Uso**: Importação direta ou via helper utilitário

### 2. Sistema de Logs Avançado

- **Categorização**: theme, animation, component, store, transition
- **Português BR**: Mensagens humanizadas com emojis
- **Performance**: Medição automática com thresholds configuráveis
- **Desenvolvimento**: Auto-desabilitado em produção

### 3. Transições Personalizadas

- **CSS desabilitado**: Transições de cores controladas por JavaScript
- **Interpolação HSL**: Suavização de cores entre temas
- **60fps**: Animações fluidas com requestAnimationFrame
- **Easing**: ease-in-out customizado para transições orgânicas

## Diretrizes para Contribuições

### 1. Componentes Svelte

- Use **Svelte 5 runes** (`$state`, `$derived`, `$effect`)
- Mantenha **Material Design** consistency
- Implemente **acessibilidade** (ARIA labels, semantic HTML)
- **Responsividade** mobile-first

### 2. Funcionalidades Python

- Scripts em `static/scripts/` para exemplos
- **Documentação clara** em funções
- **Tratamento de erros** robusto
- **Performance** considerando limitações do browser

### 3. Internacionalização

- Todas as **strings user-facing** em `messages/`
- **Contexto claro** nas chaves de tradução
- **Fallbacks** apropriados

### 4. Performance

- **Lazy loading** do Pyodide
- **Cache** de scripts carregados
- **Otimização** de bundles

### 5. Estilo de Código

- **ESLint + Prettier** configurados
- **Comentários** em português para contexto educacional
- **Nomes descritivos** de variáveis e funções

### 6. Sistema de Temas

- **Nunca use CSS transitions** para cores de tema
- **JavaScript puro** para animações de cor
- **Logger integrado** para debugging de transições
- **Classes `.theme-*-transition`** apenas para elementos não-tema

## Comandos Úteis

```bash
# Desenvolvimento
bun run dev

# Build
bun run build

# Linting
bun run lint

# Formatação
bun run format

# Temas Material Design
bun run prepare-themes
```

## Contexto Educacional

Este projeto visa ensinar estruturas de dados e algoritmos de forma interativa, combinando narrativa envolvente com exercícios práticos de programação. O uso do Pyodide permite execução segura de Python no browser, ideal para ambiente educacional.

## Estado Atual

- ✅ Base SvelteKit 5 funcional com Svelte 5 (runes)
- ✅ Integração Pyodide completa com API simplificada
- ✅ Sistema de temas Material Design 3 com transições JavaScript
- ✅ Internacionalização Paraglide JS (pt-br/en)
- ✅ Animações de nuvens implementadas (17 assets, movimento orgânico)
- ✅ Logger de desenvolvimento humanizado
- ✅ Sistema de transições JavaScript puro (300ms, 60fps)
- ✅ Ionicons 7.1.0 integrado (1338+ SVGs)
- ✅ Deploy automático GitHub Pages
- 🚧 Jogo narrativo em desenvolvimento
- 🚧 Conteúdo educacional em expansão

## Comandos Úteis

```bash
# Desenvolvimento
bun run dev

# Build
bun run build

# Linting
bun run lint

# Formatação
bun run format

# Temas Material Design
bun run prepare-themes
```

## Deploy

- **Automático**: Push na `main` → GitHub Pages
- **Manual**: `bun run build` → `/build`
- **URL**: https://araujosemacento.github.io/ED-Acima_das_Nuvens/
