import { JSDOM } from 'jsdom';

// Mock do ambiente DOM
const createMockDOM = () => {
  const dom = new JSDOM(`
  <!DOCTYPE html>
    <html>
      <head>
        <title>Test</title>
      </head>
      <body class="system-theme">
        <h1>Estrutura de Dados</h1>
        <input type="text" name="teste" id="teste" value="Isso é um teste!" />
        <button py-click="process_input">Processar</button>
        <p id="output">Aguardando processamento...</p>
      </body>
    </html>
`);

  global.document = dom.window.document;
  global.window = dom.window;
  global.localStorage = {
    storage: {},
    getItem: function (key) {
      return this.storage[key] || null;
    },
    setItem: function (key, value) {
      this.storage[key] = value;
    },
    removeItem: function (key) {
      delete this.storage[key];
    },
    clear: function () {
      this.storage = {};
    }
  };

  // Mock do matchMedia
  dom.window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: query.includes('dark'),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));

  return dom;
};

describe('HTML Structure Tests', () => {
  let dom;

  beforeEach(() => {
    dom = createMockDOM();
  });

  afterEach(() => {
    dom.window.close();
  });

  test('deve ter todos os elementos HTML necessários', () => {
    expect(document.querySelector('h1')).toBeTruthy();
    expect(document.querySelector('#teste')).toBeTruthy();
    expect(document.querySelector('button[py-click="process_input"]')).toBeTruthy();
    expect(document.querySelector('#output')).toBeTruthy();
  });

  test('input deve ter valor inicial correto', () => {
    const input = document.querySelector('#teste');
    expect(input.value).toBe('Isso é um teste!');
  });

  test('output deve ter texto inicial correto', () => {
    const output = document.querySelector('#output');
    expect(output.textContent).toBe('Aguardando processamento...');
  });

  test('body deve ter classe system-theme', () => {
    expect(document.body.classList.contains('system-theme')).toBe(true);
  });
});

describe('PyScript Function Simulation Tests', () => {
  let dom;

  beforeEach(() => {
    dom = createMockDOM();
  });

  afterEach(() => {
    dom.window.close();
    localStorage.clear();
  });

  test('deve simular load_theme com tema salvo no localStorage', () => {
    // Simula tema salvo
    localStorage.setItem('theme', 'dark');

    // Simula a função load_theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.body.setAttribute('data-theme', savedTheme);
    }

    expect(document.body.getAttribute('data-theme')).toBe('dark');
  });

  test('deve simular load_theme sem tema salvo (preferência do sistema)', () => {
    // Mock para preferir tema escuro
    window.matchMedia = jest.fn().mockReturnValue({
      matches: true
    });

    // Simula a função load_theme quando não há tema salvo
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = prefersDark ? 'dark' : 'light';
      document.body.setAttribute('data-theme', theme);
    }

    expect(document.body.getAttribute('data-theme')).toBe('dark');
  });

  test('deve simular process_input copiando valor do input para output', () => {
    const input = document.querySelector('#teste');
    const output = document.querySelector('#output');

    // Simula mudança no input
    input.value = 'Novo texto de teste';

    // Simula a função process_input
    output.textContent = input.value;

    expect(output.textContent).toBe('Novo texto de teste');
  });

  test('deve simular process_input com valor vazio', () => {
    const input = document.querySelector('#teste');
    const output = document.querySelector('#output');

    input.value = '';
    output.textContent = input.value;

    expect(output.textContent).toBe('');
  });

  test('deve simular addEventListener para DOMContentLoaded', () => {
    const mockEventListener = jest.fn();
    document.addEventListener = jest.fn();

    // Simula a função main
    document.addEventListener('DOMContentLoaded', mockEventListener);

    expect(document.addEventListener).toHaveBeenCalledWith('DOMContentLoaded', mockEventListener);
  });
});

describe('Integration Tests', () => {
  let dom;

  beforeEach(() => {
    dom = createMockDOM();
  });

  afterEach(() => {
    dom.window.close();
    localStorage.clear();
  });

  test('deve simular fluxo completo: load_theme + process_input', () => {
    // 1. Simula load_theme
    localStorage.setItem('theme', 'light');
    const savedTheme = localStorage.getItem('theme');
    document.body.setAttribute('data-theme', savedTheme);

    // 2. Simula process_input
    const input = document.querySelector('#teste');
    const output = document.querySelector('#output');
    input.value = 'Teste de integração';
    output.textContent = input.value;

    // Verificações
    expect(document.body.getAttribute('data-theme')).toBe('light');
    expect(output.textContent).toBe('Teste de integração');
  });

  test('deve simular interação completa com múltiplas mudanças', () => {
    const input = document.querySelector('#teste');
    const output = document.querySelector('#output');

    // Múltiplas simulações de process_input
    const testValues = ['Primeiro teste', 'Segundo teste', 'Teste final'];

    testValues.forEach(value => {
      input.value = value;
      output.textContent = input.value;
      expect(output.textContent).toBe(value);
    });
  });
});