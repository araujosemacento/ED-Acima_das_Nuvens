# GitHub Copilot - ED Acima das Nuvens

## Stack

- **Brython 3.13.1** + **Vite 7.0.0** + **SASS 1.89.2**
- Root: `src/`, Output: `dist/`, Public: `public/`

## Scripts

```bash
npm run dev    # :3000
npm run build  # produção
```

## Estrutura

```
src/
├── index.html     # entry
├── main.py        # sistema componentes
├── _index.scss    # estilos
└── app/           # componentes (.html + .py)
public/lib/        # brython + materialize
```

## Componentes

Sistema recursivo Brython:

- Sintaxe: `<app></app>`
- Variáveis: `element`, `component_name`, `dom`
- Scripts `.py` executam automaticamente

## Importações

- HTML: `/lib/` (public)
- SASS: `@use "/lib/materialize/sass/materialize"`
- Python: `text/python`
