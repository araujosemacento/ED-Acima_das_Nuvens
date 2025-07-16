#!/usr/bin/env node
/**
 * Script para verificação automática de acessibilidade das cores
 * Baseado nas diretrizes WCAG 2.1
 */

// Paleta de cores do projeto
const palette = {
  light: {
    text: [162, 100, 10],
    background: [145, 100, 95],
    primary: [164, 61, 50],
    secondary: [290, 46, 50],
    accent: [273, 92, 50],
    surface: [171, 28, 90],
  },
  dark: {
    text: [162, 100, 90],
    background: [145, 100, 5],
    primary: [164, 61, 50],
    secondary: [290, 46, 50],
    accent: [273, 92, 50],
    surface: [171, 28, 10],
  }
};

// Função para converter HSL para RGB
function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);

  return [r, g, b];
}

// Função para calcular luminância relativa
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Função para calcular contraste
function getContrastRatio(hsl1, hsl2) {
  const [r1, g1, b1] = hslToRgb(...hsl1);
  const [r2, g2, b2] = hslToRgb(...hsl2);

  const lum1 = getLuminance(r1, g1, b1);
  const lum2 = getLuminance(r2, g2, b2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Função para determinar nível de acessibilidade
function getAccessibilityLevel(ratio) {
  if (ratio >= 7) return { level: 'AAA', status: '✅', description: 'Excelente contraste' };
  if (ratio >= 4.5) return { level: 'AA', status: '✅', description: 'Bom contraste' };
  if (ratio >= 3) return { level: 'AA Large', status: '⚠️', description: 'Apenas para texto grande' };
  return { level: 'Falha', status: '❌', description: 'Contraste insuficiente' };
}

// Função principal de teste
function runAccessibilityTests() {
  console.log('🎨 TESTE DE ACESSIBILIDADE - ED | Acima das Nuvens\n');
  console.log('Baseado nas diretrizes WCAG 2.1\n');

  const testCombinations = [
    ['background', 'text', 'Texto principal no fundo'],
    ['surface', 'text', 'Texto em superfícies'],
    ['primary', 'background', 'Botão primário'],
    ['secondary', 'background', 'Botão secundário'],
    ['accent', 'background', 'Elementos de destaque'],
  ];

  let totalTests = 0;
  let passedTests = 0;

  ['light', 'dark'].forEach(theme => {
    console.log(`\n🌟 TEMA ${theme.toUpperCase()}\n`);
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log('│ Combinação              │ Ratio  │ Nível │ Status │ Descrição    │');
    console.log('├─────────────────────────────────────────────────────────────────┤');

    testCombinations.forEach(([bg, text]) => {
      if (palette[theme][bg] && palette[theme][text]) {
        const ratio = getContrastRatio(palette[theme][bg], palette[theme][text]);
        const accessibility = getAccessibilityLevel(ratio);

        totalTests++;
        if (accessibility.level === 'AAA' || accessibility.level === 'AA') {
          passedTests++;
        }

        const combinationName = `${bg} + ${text}`.padEnd(22);
        const ratioStr = `${ratio.toFixed(2)}:1`.padEnd(6);
        const levelStr = accessibility.level.padEnd(5);
        const statusStr = accessibility.status.padEnd(6);
        const descStr = accessibility.description.padEnd(12);

        console.log(`│ ${combinationName} │ ${ratioStr} │ ${levelStr} │ ${statusStr} │ ${descStr} │`);
      }
    });

    console.log('└─────────────────────────────────────────────────────────────────┘');
  });

  // Resumo final
  const percentage = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(`\n📊 RESUMO DOS RESULTADOS`);
  console.log(`═══════════════════════════════════════════════════════════════════`);
  console.log(`Taxa de Aprovação: ${passedTests}/${totalTests} (${percentage}%)`);
  console.log(`\n🎯 RECOMENDAÇÕES:`);
  console.log(`• Use sempre os shades mais escuros para texto em fundos claros`);
  console.log(`• Para texto pequeno, prefira combinações com ratio ≥ 4.5:1`);
  console.log(`• Para texto grande (≥18pt), ratio ≥ 3:1 é aceitável`);
  console.log(`• Teste sempre as combinações específicas antes de implementar`);
  console.log(`\n🔗 FERRAMENTAS RECOMENDADAS:`);
  console.log(`• WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/`);
  console.log(`• Colour Contrast Analyser: https://www.tpgi.com/color-contrast-checker/`);
  console.log(`• Arquivo de teste visual: src/theme/accessibility-test.html`);

  return {
    totalTests,
    passedTests,
    percentage: parseFloat(percentage),
    passed: passedTests === totalTests
  };
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('accessibility-checker.js')) {
  const results = runAccessibilityTests();
  process.exit(results.passed ? 0 : 1);
}

export { runAccessibilityTests };
