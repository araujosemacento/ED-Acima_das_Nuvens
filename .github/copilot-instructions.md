# Instruções GitHub Copilot - ED Acima das Nuvens

## Comunicação

Responda direto, sem enrolação. Críticas devem ser incisivas com alternativas viáveis.

## Stack Principal

- **Brython 3.13.1**: Python client-side
- **Vite 7.0.0**: Build tool com root em `src/`
- **SASS 1.89.2**: CSS preprocessor
- **NPM**: Package manager

## Scripts

```bash
npm run dev      # Desenvolvimento (porta 3000)
npm run build    # Produção (output: dist/)
npm run preview  # Preview
```

## Estrutura

```
src/                    # Root do Vite
├── index.html         # Entry point
├── main.py            # Sistema de componentes Brython
├── _index.scss        # Estilos SASS principais
└── app/               # Componentes da aplicação
    ├── app.html       # Componente principal
    ├── app.py         # Script do componente (opcional)
    └── ...            # Outros componentes (HTML + PY)
public/                # Assets estáticos
├── lib/
│   ├── brython/       # Runtime Brython
│   └── materialize/   # CSS framework
└── favicons/
dist/                  # Build output
vite.config.js         # Configuração Vite
```

## Configuração Vite

- **Root**: `./src/`
- **PublicDir**: `./public/`
- **Build Output**: `./dist/`
- **Assets**: Inclui arquivos `.py`
- **SASS**: API moderna

## Importações

- **HTML**: Scripts via `/lib/` (public)
- **SASS**: `@use "/lib/materialize/sass/materialize"`
- **Python**: Tipo `text/python` para Brython

## Sistema de Componentes

Implementa um sistema recursivo similar ao React usando Brython:

- **Sintaxe**: `<app></app>` no HTML principal
- **Estrutura**: Cada componente tem `.html` e opcionalmente `.py`
- **Recursão**: Componentes podem importar outros componentes (boneca russa)
- **Scripts**: Arquivos `.py` executam automaticamente no contexto do componente
- **Variáveis**: `element` (DOM do componente), `component_name` (nome), `dom` (document)

## NOTE - Caso alguma informação aqui contida seja pouco relevante, culpe a si mesmo modesta e silenciosamente, pois você foi responsável por criar e manter este arquivo.
