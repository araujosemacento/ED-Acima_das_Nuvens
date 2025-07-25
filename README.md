# 🌥️ ED | Acima das Nuvens

> Plataforma educacional interativa para ensino de estruturas de dados e algoritmos através de narrativa gamificada inspirada em João e o Pé de Feijão.

## 🎯 Visão Geral

**ED | Acima das Nuvens** combina:

- **Jogo narrativo RPG** baseado em texto
- **Plataforma educacional** para Python e estruturas de dados
- **Interface moderna** com animações de nuvens e sistema de temas
- **Execução Python no browser** via Pyodide
- **Sistema de temas avançado** com transições JavaScript puras

## 🚀 Acesso Rápido

**🌐 Demo:** [araujosemacento.github.io/ED-Acima_das_Nuvens](https://araujosemacento.github.io/ED-Acima_das_Nuvens/)

## 🛠️ Stack Técnica

- **Frontend:** SvelteKit 5 + Svelte 5 (runes)
- **UI:** Svelte Material UI (SMUI) v8.0.0-beta.3
- **Python:** Pyodide (execução no browser)
- **Styling:** SCSS + CSS Custom Properties (prioridade em/rem)
- **I18n:** Paraglide JS (pt-br/en)
- **Ícones:** Ionicons 7.1.0 (1338+ SVGs)
- **Build:** Vite 7.0.6
- **Deploy:** GitHub Pages (automático)

## 📦 Desenvolvimento

```bash
# Instalar dependências
bun install

# Preparar temas Material Design
bun run prepare-themes

# Desenvolvimento
bun run dev

# Build para produção
bun run build

# Limpeza de cache
bun run clean

# Linting
bun run lint

# Formatação
bun run format
```

## 🎨 Funcionalidades

### Sistema de Temas Avançado

- **Detecção automática** do tema do sistema
- **Transições suaves** em JavaScript puro (300ms, 60fps)
- **Material Design 3** completo
- **Fix para hydration warnings** do Svelte

### Animações de Nuvens

- **17 assets SVG** com movimento orgânico via Svelte Motion
- **3 estilos configuráveis**: gentle, dynamic, elastic
- **Responsivo** com tamanhos adaptativos por breakpoint
- **Transições suaves** com tweened/spring
- **SCSS avançado** com mixins para diferentes dispositivos

### Python Interativo

- **Pyodide** para execução segura no browser
- **Scripts educacionais** em `/static/scripts/`
- **API simplificada** com cache automático
- **Instalação de pacotes** via pip no browser

### Internacionalização

- **Português BR** e **Inglês**
- **Paraglide JS** para performance otimizada
- **Fallbacks** automáticos

### Logger de Desenvolvimento

- **Logs humanizados** em português brasileiro
- **Modo verbose** configurável
- **Medição de performance** automática
- **Categorização** por tipo de evento

## 📚 Conteúdo Educacional

Scripts Python em `/static/scripts/`:

- Estruturas de dados básicas
- Algoritmos de ordenação
- Conceitos de programação
- Exercícios interativos

## 🏗️ Estrutura

```text
src/
├── lib/
│   ├── components/          # Componentes Svelte
│   │   ├── ThemeToggle.svelte # FAB circular para alternador de temas
│   │   └── Welcome.svelte   # Tela principal com animações de nuvens
│   ├── stores/             # Gerenciamento de estado
│   │   ├── theme.js        # Sistema de temas avançado
│   │   ├── cloudMotion.js  # Animações de nuvens (Svelte Motion)
│   │   ├── pyodide.js      # Integração Python
│   │   └── logger.js       # Logger de desenvolvimento
│   ├── styles/             # Estilos SCSS avançados
│   │   └── cloudMotion.scss # Mixins responsivos para nuvens
│   └── utils/              # Utilitários
│       └── ionicons.ts     # Helper para ícones
├── routes/                 # Rotas SvelteKit
└── theme/                  # Sistema de temas Material Design

static/
├── assets/
│   ├── nuvens/            # 17 assets SVG de nuvens (light/dark)
│   └── ionicons/          # 1338+ ícones SVG
├── scripts/               # Scripts Python educacionais
└── fonts/                 # Fontes Noto customizadas
```

## � Características Técnicas

### Design Responsivo Prioritário

- **Unidades em/rem**: Sistema baseado em unidades escaláveis
- **Breakpoints consistentes**: 48rem mobile, 64rem tablet, 80rem desktop
- **Material Design 3**: FAB circular para ThemeToggle com elevações animadas
- **SCSS avançado**: Mixins responsivos para diferentes dispositivos

### Sistema de Performance

- **Logger integrado** para medição de transições
- **Thresholds configuráveis** (300ms transições, 500ms animações)
- **Cache inteligente** de scripts Python e elementos DOM
- **Lazy loading** do Pyodide

### Qualidade de Código

- **ESLint + Prettier** configurados
- **TypeScript** para utilitários
- **Svelte Check** para validação
- **Scripts automatizados** para linting e formatação

## 🚨 Correções Importantes

### Hydration Warning Fix

Implementação de correção para o aviso `hydration_attribute_changed` do Svelte:

```javascript
// Fix implementado no Welcome.svelte
let showImages = $state(false);
let currentTheme = $state('light');

if (typeof window !== 'undefined') {
    $effect(() => {
        if (!showImages) {
            currentTheme = $themeStore;
            showImages = true;
        } else {
            currentTheme = $themeStore;
        }
    });
}
```

## �📝 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

**Status do Projeto**: ✅ Produção
**Última Atualização**: Julho 2025
Desenvolvido com ❤️ para educação
