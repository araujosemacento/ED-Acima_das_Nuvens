# 🔧 Configuração do GitHub - ED | Acima das Nuvens

Este diretório contém todas as configurações do GitHub Actions, templates de issues e pull requests, e configurações automatizadas para o projeto **ED | Acima das Nuvens**.

## 📋 Estrutura

```text
.github/
├── workflows/              # GitHub Actions workflows
│   ├── pages.yml              # Deploy para GitHub Pages
│   ├── lint.yml              # Qualidade de código (ESLint, Prettier)
│   ├── test.yml              # Testes automatizados
│   ├── maintenance.yml       # Manutenção e limpeza
│   ├── release-drafter.yml   # Geração automática de releases
│   └── stale.yml             # Gerenciamento de issues/PRs obsoletas
├── ISSUE_TEMPLATE/         # Templates de issues
│   ├── bug_report.yml        # Relatório de bugs
│   ├── feature_request.yml   # Solicitação de funcionalidades
│   └── educational_content.yml # Conteúdo educacional
├── dependabot.yml          # Configuração do Dependabot
├── repository.yml          # Configurações do repositório
├── pull_request_template.md # Template de pull request
├── release-drafter.yml     # Configuração do Release Drafter
├── labels.yml              # Labels automáticas
└── README.md              # Este arquivo
```

## 🚀 Workflows Disponíveis

### 1. **Deploy (pages.yml)**

- **Trigger**: Push para `main` ou manual
- **Função**: Build e deploy para GitHub Pages
- **Tecnologias**: Bun, SvelteKit, Material Design

### 2. **Qualidade de Código (lint.yml)**

- **Trigger**: Push em qualquer branch, PRs para `main`
- **Função**: ESLint, Prettier, verificação de tipos
- **Relatórios**: Comentários automáticos em PRs

### 3. **Testes (test.yml)**

- **Trigger**: Push, PRs, manual
- **Função**: Testes unitários, integração, build
- **Matriz**: Node.js 18.x, 20.x, 22.x

### 4. **Manutenção (maintenance.yml)**

- **Trigger**: Agendado (semanal)
- **Função**: Limpeza de cache, otimização

### 5. **Release Drafter (release-drafter.yml)**

- **Trigger**: Push para `main`, PRs
- **Função**: Geração automática de releases e changelogs
- **Categorização**: Automática por labels

### 6. **Stale Bot (stale.yml)**

- **Trigger**: Agendado (diário)
- **Função**: Gerenciamento de issues/PRs obsoletas
- **Configuração**: 30 dias para issues, 21 para PRs

## 🐛 Templates de Issues

### Bug Report

- Reprodução detalhada
- Informações do ambiente
- Screenshots/logs
- Prioridade automática

### Feature Request

- Descrição da funcionalidade
- Casos de uso
- Mockups/wireframes
- Impacto educacional

### Educational Content

- Novo conteúdo Python
- Estruturas de dados
- Algoritmos
- Exercícios interativos

## 📝 Pull Request Template

Template abrangente incluindo:

- Descrição das mudanças
- Tipo de mudança (bug fix, feature, etc.)
- Área afetada do projeto
- Checklist de testes
- Impacto educacional
- Screenshots (se aplicável)

## 🔄 Dependabot

Configuração automatizada para:

- **Bun** (semanal)
- **GitHub Actions** (semanal)
- **Pyodide** (mensal)
- **Dependências de desenvolvimento** (semanal)

## 🎯 Configurações Especiais

### Ambiente Educacional

- Foco em **Python + Pyodide**
- **Material Design** consistente
- **Internacionalização** (pt-br/en)
- **Acessibilidade** prioritária

### Performance

- **Cache inteligente** de dependências
- **Build otimizado** para produção
- **Lazy loading** do Pyodide
- **Compressão** de assets

### Segurança

- **Dependabot** ativo
- **Permissions** mínimas
- **Secrets** gerenciados
- **Vulnerability scanning**

## 🚨 Solução de Problemas

### Build Falha

1. Verificar logs do workflow
2. Testar localmente: `bun run build`
3. Verificar dependências: `bun install`
4. Validar temas: `bun run prepare-themes`

### Lint Falha

1. Executar localmente: `bun run lint`
2. Corrigir automaticamente: `bun run format`
3. Verificar configuração ESLint

### Deploy Falha

1. Verificar permissões do GitHub Pages
2. Validar configuração do SvelteKit
3. Testar build local
4. Verificar secrets/environment variables

## 🔧 Comandos Úteis

```bash
# Desenvolvimento local
bun run dev

# Build de produção
bun run build

# Qualidade de código
bun run lint
bun run format

# Temas Material Design
bun run prepare-themes

# Visualizar build
bun run preview
```

## 📊 Métricas e Monitoramento

- **Build time**: ~2-3 minutos
- **Deploy time**: ~1-2 minutos
- **Test coverage**: Target 80%+
- **Lighthouse Score**: 90+ (Performance, Accessibility, SEO)

## 🎯 Roadmap

- [ ] Testes E2E com Playwright
- [ ] Performance budgets
- [ ] Visual regression testing
- [ ] Automated releases ✅
- [ ] Security scanning
- [ ] Accessibility audits
- [ ] Label automation ✅
- [ ] Stale issue management ✅

## 🏷️ Sistema de Labels

O projeto utiliza um sistema abrangente de labels automáticas:

### Tipos de Issues/PRs

- 🐛 **bug** - Problemas e correções
- ✨ **enhancement** - Novas funcionalidades
- 📚 **educational** - Conteúdo educacional
- 🎮 **game** - Jogo narrativo
- 🎨 **ui/ux** - Interface e experiência
- 🐍 **python** - Código Python/Pyodide

### Prioridades

- 🔥 **priority: high** - Alta prioridade
- 📅 **priority: medium** - Prioridade média
- 🕒 **priority: low** - Baixa prioridade

### Estados

- 🚧 **in progress** - Em desenvolvimento
- 🔍 **needs review** - Precisa revisão
- ❓ **needs info** - Precisa informações
- ✅ **ready** - Pronto para implementação

## 🔄 Automações Ativas

### Release Drafter

- **Changelog automático** baseado em labels
- **Versionamento semântico** automático
- **Categorização** de mudanças
- **Templates personalizados** para releases

### Stale Bot

- **Gerenciamento automático** de issues/PRs antigas
- **Notificações** antes do fechamento
- **Exceções** para prioridades altas
- **Configuração específica** para projetos educacionais

---

Para mais informações sobre o projeto, consulte o [README principal](../README.md) e as [instruções do Copilot](copilot-instructions.md).
