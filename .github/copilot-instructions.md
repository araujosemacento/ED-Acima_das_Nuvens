# Instruções GitHub Copilot - ED Acima das Nuvens

## Comunicação

Responda direto, sem enrolação. Críticas devem ser incisivas com alternativas viáveis.

## Stack Principal

- **Brython 3.13.1**: Python client-side
- **Vite 6.3.5**: Build tool
- **SASS 1.89.2**: CSS preprocessor
- **Bun**: Runtime

## Scripts

```bash
bun run dev      # Desenvolvimento
bun run build    # Produção
bun run preview  # Preview
```

## Estrutura

```
src/
├── index.html    # Entry point
├── main.py       # Lógica Brython
└── style.css     # Estilos
lib/
├── brython/      # Runtime
└── materialize/  # CSS framework
```
