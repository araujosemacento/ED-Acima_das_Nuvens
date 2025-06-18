# Documentação dos Testes

Este projeto possui duas suítes de teste: **Jest** para JavaScript e **Pytest** para Python.

## Estrutura dos Testes

```plaintext
tests/
├── main.test.js    # Testes Jest (JavaScript/DOM)
└── test_main.py    # Testes Pytest (Python/PyScript)
```

## Como Executar

### Testes JavaScript (Jest)

```bash
# Executar todos os testes JS
bun test
# ou
npm test
```

#### A partir de agora, considere que onde eu uso `bun` você pode usar `npm` ou `yarn` como preferir.

## Executar com watch mode

```bash
bun test:watch
```

## Executar com cover

```bash
bun run test:coverage
```

### Testes Python (Pytest)

```bash
# Executar todos os testes Python
python pytest tests/

-- ou --

bun pytest

# Executar com watch mode
python pytest-watch tests/

-- ou --

bun pytest:watch

# Executar com cover
python pytest tests/ --cov=. --cov-report=html # <= Gera relatório como HTML ao invés de retorno no terminal

-- ou --

bun pytest:coverage
```

## 🔧 O que os Testes Cobrem

### Jest (main.test.js)

- ✅ **Estrutura HTML**: Verifica elementos necessários
- ✅ **DOM Manipulation**: Simula interações do usuário
- ✅ **PyScript Simulation**: Emula funções Python no browser
- ✅ **LocalStorage**: Testa persistência de dados
- ✅ **Theme Loading**: Testa carregamento de temas
- ✅ **Integration Tests**: Fluxo completo da aplicação

### Pytest (test_main.py)

- ✅ **load_theme()**: Testa carregamento de temas
- ✅ **process_input()**: Testa processamento de input
- ✅ **main()**: Testa inicialização da aplicação
- ✅ **Integration**: Testa fluxo completo
- ✅ **Mock PyScript**: Simula ambiente PyScript com mocks

## 🛠️ Mocks Utilizados

### JavaScript (Jest)

- **JSDOM**: Simula ambiente DOM
- **localStorage**: Mock do armazenamento local
- **matchMedia**: Mock para preferências de tema

### Python (Pytest)

- **MockDocument**: Simula `document` do PyScript
- **MockLocalStorage**: Simula `localStorage`
- **MockWindow**: Simula `window` object
- **patch**: Substitui módulo `js` do PyScript

## 📊 Cobertura de Código

Os testes cobrem:

- Todas as funções principais (`load_theme`, `process_input`, `main`)
- Cenários de erro e edge cases
- Integração entre componentes
- Comportamento do DOM e PyScript

## 🔍 Debug de Testes

Para debugar testes com mais detalhes:

```bash
# Jest com verbose
bun test --verbose

# Pytest com debug
python -m pytest tests/test_main.py -v -s --tb=short
```

## 📝 Adicionando Novos Testes

### Para Jest:

1. Adicione novos casos de teste em `tests/main.test.js`
2. Use a estrutura existente de mocks
3. Siga o padrão de nomenclatura: `test('descrição do teste')`

### Para Pytest:

1. Adicione novos casos de teste em `tests/test_main.py`
2. Use as classes Mock existentes
3. Siga o padrão: `def test_nome_funcionalidade(self):`
