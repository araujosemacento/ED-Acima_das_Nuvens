// Barrel export para todas as stores do projeto
// Facilita importação e mantém API consistente

export { themeStore, THEME_TYPES } from './theme.js';
export { pyodideStore } from './pyodide.js';
export { logger } from './logger.js';

// Re-exporta funções úteis do Svelte para conveniência
export { get, readonly } from 'svelte/store';
