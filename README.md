# 🌥️ ED | Acima das Nuvens

> Plataforma educacional interativa para ensino de estruturas de dados e algoritmos através de narrativa gamificada inspirada em João e o Pé de Feijão.

## 🎯 Visão Geral

**ED | Acima das Nuvens** combina:

- **Jogo narrativo RPG** baseado em texto
- **Plataforma educacional** para Python e estruturas de dados
- **Interface moderna** com animações de nuvens e sistema de temas

## 🚀 Acesso Rápido

**🌐 Demo:** [araujosemacento.github.io/ED-Acima_das_Nuvens](https://araujosemacento.github.io/ED-Acima_das_Nuvens/)

## 🛠️ Stack Técnica

- **Frontend:** SvelteKit 5 + Svelte 5 (runes)
- **UI:** Svelte Material UI (SMUI) v8.0.0-beta.3
- **Python:** Pyodide (execução no browser)
- **Styling:** SCSS + CSS Custom Properties
- **I18n:** Paraglide JS (pt-br/en)
- **Ícones:** Ionicons 7.1.0 (1338+ SVGs)

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
```

## 🎨 Funcionalidades

### Sistema de Temas

- **Detecção automática** do tema do sistema
- **Transições suaves** em JavaScript puro (300ms, 60fps)
- **Material Design 3** completo

### Animações de Nuvens

- **17 assets SVG** com movimento orgânico
- **8 direções + parada** em padrão "choppy"
- **Responsivo** com diferentes tamanhos

### Python Interativo

- **Pyodide** para execução segura no browser
- **Scripts educacionais** em `/static/scripts/`
- **API simplificada** com cache automático

### Internacionalização

- **Português BR** e **Inglês**
- **Paraglide JS** para performance otimizada
- **Fallbacks** automáticos

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
│   ├── components/     # Componentes Svelte
│   ├── stores/        # Gerenciamento de estado
│   └── utils/         # Utilitários
├── routes/            # Rotas SvelteKit
└── theme/             # Sistema de temas

static/
├── assets/nuvens/     # Assets de nuvens (light/dark)
├── scripts/           # Scripts Python educacionais
└── fonts/             # Fontes Noto customizadas
```

## 📝 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

Desenvolvido com ❤️ para educação
