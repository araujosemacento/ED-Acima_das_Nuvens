/**
 * Configuração de migração do sistema de animações de nuvens
 * ED | Acima das Nuvens - Cloud Motion Refactor
 */

export const MIGRATION_CONFIG = {
    // Status da migração
    status: 'ready', // ready, testing, complete

    // Arquivos do sistema antigo (para remoção futura)
    oldSystemFiles: [
        'src/lib/stores/cloudAnimations.js',
        // Manter logger.js (usado por outros sistemas)
    ],

    // Arquivos do novo sistema
    newSystemFiles: [
        'src/lib/stores/cloudMotion.js',
        'src/lib/styles/cloudMotion.scss',
        'src/lib/components/WelcomeMotion.svelte',
        'static/demo/cloud-motion-demo.html'
    ],

    // Configurações recomendadas por ambiente
    environments: {
        development: {
            debugMode: true,
            enableControls: true,
            logLevel: 'verbose',
            animationStyle: 'gentle'
        },
        production: {
            debugMode: false,
            enableControls: false,
            logLevel: 'error',
            animationStyle: 'gentle'
        }
    },

    // Breakpoints responsivos (sincronizado com SCSS)
    breakpoints: {
        mobile: '576px',
        tablet: '768px',
        desktop: '1200px'
    },

    // Configurações de performance
    performance: {
        maxClouds: 20,
        animationFPS: 60,
        interpolationSteps: 100,
        memoryOptimization: true
    },

    // Estilos de animação disponíveis
    animationStyles: {
        gentle: {
            description: 'Movimento suave e orgânico',
            duration: 12000,
            radius: 40,
            recommended: 'Uso geral, melhor UX'
        },
        dynamic: {
            description: 'Movimento mais rápido e energético',
            duration: 8000,
            radius: 80,
            recommended: 'Páginas de ação, jogos'
        },
        elastic: {
            description: 'Movimento com efeito elástico',
            duration: 15000,
            radius: 60,
            recommended: 'Landing pages, demonstrações'
        }
    },

    // Instruções de migração
    migrationSteps: [
        {
            step: 1,
            description: 'Backup do sistema atual',
            command: 'git checkout -b backup-cloud-system',
            required: true
        },
        {
            step: 2,
            description: 'Atualizar imports em Welcome.svelte',
            changes: [
                '- import { cloudAnimationsStore } from "$lib/stores/cloudAnimations.js"',
                '+ import { cloudMotionStore } from "$lib/stores/cloudMotion.js"'
            ],
            required: true
        },
        {
            step: 3,
            description: 'Testar funcionamento',
            command: 'bun run dev',
            validation: 'Verificar animações das nuvens funcionando'
        },
        {
            step: 4,
            description: 'Validar responsividade',
            validation: 'Testar em mobile, tablet e desktop'
        },
        {
            step: 5,
            description: 'Remover sistema antigo (opcional)',
            command: 'rm src/lib/stores/cloudAnimations.js',
            required: false,
            warning: 'Só após validação completa'
        }
    ],

    // Troubleshooting comum
    troubleshooting: {
        'Animações não funcionam': [
            'Verificar se SCSS está sendo importado no app.scss',
            'Confirmar que cloudMotionStore.setActive(true) foi chamado',
            'Verificar console para erros de importação'
        ],
        'Performance ruim': [
            'Reduzir número de nuvens (max 17)',
            'Usar estilo "gentle" em dispositivos móveis',
            'Verificar se GPU acceleration está ativa'
        ],
        'Responsividade quebrada': [
            'Verificar mixins SCSS estão sendo aplicados',
            'Testar breakpoints no DevTools',
            'Confirmar que viewport meta tag está presente'
        ]
    },

    // Métricas de sucesso
    successMetrics: {
        'Redução de código': '50%+ menos linhas',
        'Melhoria de performance': '30%+ mais fluido',
        'Facilidade de manutenção': '90%+ mais simples',
        'Compatibilidade': '100% mantida',
        'Funcionalidades': '100% das originais + novas'
    }
};

// Helper para verificar ambiente
export function isDevelopment() {
    return typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
            window.location.hostname.includes('dev'));
}

// Helper para obter configuração do ambiente atual
export function getCurrentConfig() {
    return MIGRATION_CONFIG.environments[isDevelopment() ? 'development' : 'production'];
}

// Verificação de compatibilidade
export function checkCompatibility() {
    const checks = {
        svelteMotion: typeof window?.SvelteKit !== 'undefined',
        scss: document.querySelector('style[lang="scss"]') !== null,
        cssCustomProperties: CSS.supports('color', 'var(--test)'),
        transform3d: CSS.supports('transform', 'translate3d(0,0,0)'),
        backdropFilter: CSS.supports('backdrop-filter', 'blur(10px)')
    };

    return {
        ...checks,
        allSupported: Object.values(checks).every(Boolean),
        warnings: Object.entries(checks)
            .filter(([, supported]) => !supported)
            .map(([feature]) => `${feature} não suportado`)
    };
}
