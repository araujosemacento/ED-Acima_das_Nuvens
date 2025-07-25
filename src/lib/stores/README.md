# Stores - ED | Acima das Nuvens

Este diretório contém todas as stores Svelte utilizadas no projeto **ED | Acima das Nuvens**. As stores são responsáveis por gerenciar o estado global da aplicação, incluindo temas, animações, logging e integração Python.

## Visão Geral

| Store                    | Arquivo              | Função Principal                           | Tipo               |
| ------------------------ | -------------------- | ------------------------------------------ | ------------------ |
| **themeStore**           | `theme.js`           | Gerenciamento de temas (light/dark/system) | Writable + Derived |
| **cloudAnimationsStore** | `cloudAnimations.js` | Animações choppy das nuvens                | Class-based Store  |
| **pyodideStore**         | `pyodide.js`         | Integração Python no browser               | Factory Store      |
| **logger**               | `logger.js`          | Sistema de logs de desenvolvimento         | Singleton Class    |

---

## 🎨 themeStore

**Arquivo**: `theme.js`  
**Tipo**: Writable Store com estados derivados  
**Responsabilidade**: Gerenciar temas da aplicação com transições JavaScript puras

### Funcionalidades do themeStore

- ✅ **3 tipos de tema**: `light`, `dark`, `system` (auto-detecção)
- ✅ **Transições JavaScript**: Interpolação HSL suave (300ms, 60fps)
- ✅ **Persistência**: localStorage + sincronização com preferências do sistema
- ✅ **Media Query**: Detecção automática de mudanças no tema do sistema
- ✅ **API reativa**: Estados derivados para uso em componentes

### Estados do themeStore

```javascript
import { themeStore } from '$lib/stores/theme.js';

// Estados derivados prontos para uso
$themeStore.currentTheme; // 'light' | 'dark' | 'system'
$themeStore.resolvedTheme; // 'light' | 'dark' (sempre resolvido)
$themeStore.isDark; // boolean
$themeStore.isLight; // boolean
$themeStore.isSystem; // boolean
$themeStore.systemTheme; // tema detectado do sistema
$themeStore.hasUserChoice; // se usuário fez escolha manual
```

### API do themeStore

```javascript
// Definir tema
themeStore.setTheme('dark'); // Define tema específico
themeStore.setTheme('system'); // Volta para detecção automática
themeStore.resetToSystem(); // Reset para sistema

// Obter estado atual
themeStore.getCurrentTheme(); // Retorna tema atual
```

### Características Técnicas

- **CSS Transitions**: Desabilitadas para cores (JavaScript puro)
- **Interpolação**: HSL com easing ease-in-out personalizado
- **Performance**: 60fps com requestAnimationFrame
- **Logger**: Logs detalhados de transições e mudanças

---

## ☁️ cloudAnimationsStore

**Arquivo**: `cloudAnimations.js`  
**Tipo**: Class-based Store com Map interno  
**Responsabilidade**: Animações "choppy" orgânicas das nuvens

### Funcionalidades do cloudAnimationsStore

- ✅ **Movimento orgânico**: 8 direções + parada com movimento aleatório
- ✅ **Efeito choppy**: steps(1, end) para movimento não-fluido natural
- ✅ **Configuração flexível**: Duração, raio, margem, steps customizáveis
- ✅ **Web Animations API**: Performance nativa do browser
- ✅ **Auto-registro**: Action `registerCloudElement` para uso em componentes

### Configuração Padrão

```javascript
config: {
    stepDuration: 200,        // ms por step (efeito choppy)
    minSteps: 15,            // mínimo de steps por sequência
    maxSteps: 25,            // máximo de steps por sequência
    minTotalDuration: 8000,   // duração mínima total (ms)
    maxTotalDuration: 20000,  // duração máxima total (ms)
    movementRadius: 60,       // pixels de movimento máximo por step
    boundaryMargin: 10        // % de margem das bordas da tela
}
```

### API do cloudAnimationsStore

```javascript
import { cloudAnimationsStore, registerCloudElement } from '$lib/stores/cloudAnimations.js';

// Controle global
cloudAnimationsStore.setActive(true / false); // Liga/desliga animações
cloudAnimationsStore.updateConfig(newConfig); // Atualiza configuração
cloudAnimationsStore.initializeAllAnimations(); // Força reinicialização
cloudAnimationsStore.cleanup(); // Limpa tudo

// Registro manual de elementos
await cloudAnimationsStore.registerElement(element, 'asset-id');
cloudAnimationsStore.unregisterElement('asset-id');
```

### Uso em Componentes

```svelte
<script>
	import { registerCloudElement } from '$lib/stores/cloudAnimations.js';
</script>

<!-- Action automática - recomendado -->
<img src="nuvem.png" use:registerCloudElement={'nuvem-1'} alt="Nuvem" />
```

### Estados do cloudAnimationsStore

```javascript
// Via subscription ou $store
$cloudAnimationsStore.isActive; // boolean - animações ativas
$cloudAnimationsStore.elements; // Map<id, element> - elementos registrados
$cloudAnimationsStore.animations; // Map<id, animationData> - animações ativas
$cloudAnimationsStore.config; // objeto de configuração atual
```

---

## 🐍 pyodideStore

**Arquivo**: `pyodide.js`  
**Tipo**: Factory Store com API simplificada  
**Responsabilidade**: Integração Python no browser via Pyodide

### Funcionalidades do pyodideStore

- ✅ **Carregamento assíncrono**: Pyodide carregado sob demanda
- ✅ **Cache de scripts**: Scripts carregados ficam em memória
- ✅ **API simplificada**: Métodos diretos para execução Python
- ✅ **Estados derivados**: Status de carregamento e erros reativos
- ✅ **Instalação de pacotes**: pip install no browser

### Estados Derivados

```javascript
import { pyodideStore } from '$lib/stores/pyodide.js';

// Estados reativos prontos para uso
$pyodideStore.isReady; // boolean - Pyodide carregado
$pyodideStore.isLoading; // boolean - carregando
$pyodideStore.hasError; // boolean - erro presente
$pyodideStore.statusMessage; // string - status humanizado
```

### API do pyodideStore

```javascript
// Inicialização
await pyodideStore.load(); // Carrega Pyodide

// Execução de código
const result = await pyodideStore.run('print("Hello!")');
const result = await pyodideStore.runScript('/scripts/exemplo.py');

// Instalação de pacotes
await pyodideStore.install(['numpy', 'pandas']);

// Estado atual
const state = pyodideStore.getState(); // Snapshot do estado
```

### Exemplo de Uso

```svelte
<script>
	import { pyodideStore } from '$lib/stores/pyodide.js';

	let code = 'print("Hello, Python!")';
	let result = '';

	async function runCode() {
		await pyodideStore.load(); // Garante que está carregado
		result = await pyodideStore.run(code);
	}
</script>

{#if $pyodideStore.isLoading}
	<p>⏳ Carregando Python...</p>
{:else if $pyodideStore.hasError}
	<p>❌ Erro: {$pyodideStore.statusMessage}</p>
{:else if $pyodideStore.isReady}
	<button on:click={runCode}>Executar Python</button>
	<pre>{result}</pre>
{/if}
```

---

## 🔧 logger

**Arquivo**: `logger.js`  
**Tipo**: Singleton Class (não é store Svelte)  
**Responsabilidade**: Sistema de logs de desenvolvimento humanizado

### Funcionalidades

- ✅ **Desenvolvimento apenas**: Auto-desabilitado em produção
- ✅ **Logs humanizados**: Mensagens em português brasileiro com emojis
- ✅ **Categorização**: theme, animation, component, store, transition
- ✅ **Modo verbose**: Detalhamento extra para debugging avançado
- ✅ **Medição de performance**: Thresholds automáticos para transições

### Categorias Disponíveis

```javascript
import { logger } from '$lib/stores/logger.js';

// Logs por categoria (todos com emoji automático)
logger.theme('THEME_CHANGE', { from: 'light', to: 'dark' });
logger.animation('CLOUD_MOVE', { element: 'nuvem-1', direction: 'right' });
logger.component('MOUNT', { component: 'Welcome.svelte' });
logger.store('UPDATE', { store: 'themeStore', value: 'dark' });
logger.transition('COMPLETE', { duration: 280, threshold: 300 });

// Logs genéricos
logger.log('Mensagem simples');
logger.info('Informação importante');
logger.warn('Aviso');
logger.error('Erro crítico');
```

### Configuração de Modo Verbose

```javascript
// Programaticamente
logger.setVerbose(true); // Ativa logs detalhados
logger.setVerbose(false); // Volta ao modo normal

// Via URL (persiste no localStorage)
// http://localhost:5173?verbose=true

// Via localStorage direto
localStorage.setItem('ed-logger-verbose', 'true');
```

### Performance Monitoring

```javascript
// Thresholds configuráveis
logger.thresholds = {
	transition: 300, // ms - transições de tema/UI
	animation: 500 // ms - animações de nuvens
};

// Medição automática em transições
logger.transition('DURATION_CHECK', {
	actual: 280,
	threshold: 300,
	status: 'OK' // ou 'SLOW' se > threshold
});
```

---

## 🔄 Padrões de Integração

### 1. Uso em Componentes Svelte

```svelte
<script>
	import { themeStore } from '$lib/stores/theme.js';
	import { cloudAnimationsStore } from '$lib/stores/cloudAnimations.js';
	import { pyodideStore } from '$lib/stores/pyodide.js';
	import { logger } from '$lib/stores/logger.js';

	logger.component('MOUNT', { component: 'MyComponent.svelte' });
</script>

<!-- Estados reativos diretos -->
<div class="theme-{$themeStore.resolvedTheme}">
	{#if $pyodideStore.isReady}
		<button>Python está pronto!</button>
	{/if}

	<p>Animações: {$cloudAnimationsStore.isActive ? 'Ativas' : 'Pausadas'}</p>
</div>
```

### 2. Inicialização em App

```javascript
// app.js ou +layout.svelte
import { themeStore } from '$lib/stores/theme.js';
import { cloudAnimationsStore } from '$lib/stores/cloudAnimations.js';

// Inicialização automática do tema
themeStore.initializeTheme();

// Ativação das animações
cloudAnimationsStore.setActive(true);
```

### 3. Integração com Transições

```javascript
// As stores já integram com o sistema de transições JavaScript
// Nunca use CSS transitions para cores de tema
// O logger monitora automaticamente performance de transições
```

---

## 📁 Estrutura de Arquivos

```text
src/lib/stores/
├── README.md                 # 📖 Esta documentação
├── theme.js                  # 🎨 Sistema de temas
├── cloudAnimations.js        # ☁️ Animações de nuvens
├── pyodide.js               # 🐍 Integração Python
└── logger.js                # 🔧 Sistema de logs
```

---

## 🚀 Performance

### Otimizações Implementadas

- **Lazy Loading**: Pyodide carregado apenas quando necessário
- **Cache**: Scripts Python e elementos DOM mantidos em memória
- **Web Animations API**: Performance nativa para animações de nuvens
- **RequestAnimationFrame**: Transições de tema a 60fps
- **Logger condicional**: Zero overhead em produção

### Medições Automáticas

O logger monitora automaticamente:

- ⏱️ **Transições de tema**: Threshold 300ms
- 🎬 **Animações**: Threshold 500ms
- 📊 **Estado das stores**: Mudanças significativas
- 🔄 **Sincronização**: Media queries e localStorage

---

## 🎯 Boas Práticas

### ✅ Recomendado

```javascript
// Use estados derivados para reatividade
{#if $themeStore.isDark}

// Use actions para registro automático de elementos
<img use:registerCloudElement={'id'} />

// Use logger para debugging consistente
logger.component('EVENT', { data })

// Carregue Pyodide de forma assíncrona
await pyodideStore.load()
```

### ❌ Evitar

```css
/* NUNCA - CSS transitions para cores de tema */
.element {
	transition: color 0.3s;
}

/* Use JavaScript transitions apenas */
```

```javascript
// NUNCA - acesso direto ao estado interno das stores
cloudAnimationsStore.elements.set(); // ❌

// Use a API pública
cloudAnimationsStore.registerElement(); // ✅
```

---

## 🔧 Desenvolvimento

### Debug Modo

```javascript
// Ativar logs verbose para debugging avançado
logger.setVerbose(true);

// Verificar estado das animações
console.log($cloudAnimationsStore);

// Monitorar transições de tema
themeStore.setTheme('dark'); // Logs automáticos
```

### Testes

```javascript
// Todas as stores expõem métodos de teste
const state = pyodideStore.getState();
const config = cloudAnimationsStore.config;
const theme = themeStore.getCurrentTheme();
```

---

**Mantido por**: Equipe ED | Acima das Nuvens  
**Última atualização**: Julho 2025  
**Versão**: SvelteKit 5 + Svelte 5 (runes)
