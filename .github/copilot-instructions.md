# Instruções para GitHub Copilot - ED | Acima das Nuvens

## Visão Geral do Projeto

Este é um projeto educacional interativo chamado **"ED | Acima das Nuvens"** que combina:

- **Jogo narrativo RPG** baseado em texto inspirado em João e o Pé de Feijão
- **Plataforma educacional** para ensino de estruturas de dados e algoritmos usando Python
- **Interface web moderna** construída com SvelteKit 5 e Material Design

## Arquitetura Técnica

### Stack Principal

- **Frontend**: SvelteKit 5 com Svelte 5 (nova sintaxe de runes)
- **Linguagem**: JavaScript/TypeScript + Python (via Pyodide)
- **UI Framework**: Svelte Material UI (SMUI) v8.0.0-beta.3
- **Styling**: SCSS + Material Design theming
- **Internacionalização**: Paraglide JS (suporte pt-br/en)
- **Python Runtime**: Pyodide (execução de Python no browser)
- **Build**: Vite 6.2.6
- **Deployment**: Static adapter

### Estrutura de Diretórios

```
src/
├── lib/
│   ├── components/          # Componentes Svelte reutilizáveis
│   │   ├── Counter.svelte      # Contador animado (exemplo)
│   │   ├── PyodideInteractive.svelte  # Interface Python interativa
│   │   └── Welcome.svelte      # Tela de boas-vindas do jogo
│   ├── stores/             # Stores Svelte
│   │   └── pyodide.js         # Store para gerenciar Pyodide
│   └── paraglide/          # Sistema de i18n
├── routes/                 # Rotas da aplicação
├── theme/                  # Temas Material Design
└── app.scss               # Estilos globais

static/
├── scripts/               # Scripts Python
│   └── exemplo.py           # Exemplo educacional Python
└── fonts/                 # Fontes customizadas (Noto)
```

## Funcionalidades Principais

### 1. Componente PyodideInteractive

- **Arquivo**: `src/lib/components/PyodideInteractive.svelte`
- **Propósito**: Interface para execução de código Python no browser
- **Recursos**:
  - Editor de código inline
  - Execução assíncrona via Pyodide
  - Exemplos pré-programados (matemática, listas, dicionários)
  - Carregamento automático de scripts externos

### 2. Store Pyodide

- **Arquivo**: `src/lib/stores/pyodide.js`
- **Propósito**: Gerenciamento robusto do runtime Pyodide
- **API**:

  ```javascript
  // Carregamento
  await pyodideStore.load();

  // Execução de código
  const result = await pyodideStore.run('2 ** 10');

  // Execução de scripts
  await pyodideStore.runScript('scripts/exemplo.py');

  // Instalação de pacotes
  await pyodideStore.install(['numpy', 'matplotlib']);
  ```

### 3. Sistema de Internacionalização

- **Paraglide JS** para i18n
- **Idiomas**: Português (pt-br) e Inglês (en)
- **Detecção automática** de idioma do browser
- **Mensagens**: `messages/pt-br.json` e `messages/en.json`

### 4. Jogo Narrativo (Em Desenvolvimento)

- **Base**: "João e o Pé de Feijão" adaptado
- **Mecânica**: Escolhas que afetam o desfecho
- **Personagens**: 5 protagonistas (João, Maria, Pib, Kit, Ed)
- **Finais**: 3 tipos (Neutros, Desastrosos, Verdadeiros)

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

### Material Design

- Uso consistente de **CSS Custom Properties** para temas
- **Variáveis**: `--mdc-theme-primary`, `--mdc-theme-background`, etc.
- **Componentes SMUI**: Button, Cards, etc.

### Gerenciamento de Estado

- **Svelte Stores** para estado global
- **Derived stores** para estados computados
- **API baseada em classes** para stores complexas

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

- ✅ Base SvelteKit funcional
- ✅ Integração Pyodide completa
- ✅ Sistema de temas Material Design
- ✅ Internacionalização configurada
- 🚧 Jogo narrativo em desenvolvimento
- 🚧 Conteúdo educacional em expansão
