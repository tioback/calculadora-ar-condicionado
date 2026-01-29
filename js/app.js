/**
 * ============================================
 * APLICAÇÃO PRINCIPAL - REFATORADA
 * ============================================
 * Orquestra todos os módulos e gerencia o ciclo de vida da aplicação
 */

import { LIMIARES_PAYBACK, CAMPOS_FORMULARIO, TEMAS } from './config/constants.js';
import { formatarNumero, formatarMoeda } from './utils/formatters.js';
import { 
  salvarDadosFormulario, 
  carregarDadosFormulario, 
  resetarDadosFormulario,
  carregarTema,
  salvarTema
} from './services/storage.js';
import {
  calcularFatoresAjuste,
  calcularConsumoReal,
  calcularEconomiaEPayback,
  obterDadosAparelhoAntigo
} from './services/calculations.js';
import { exportarParaPDF } from './services/pdf-generator.js';
import { gerarGraficoSensibilidade } from './services/chart-generator.js';

// Referências de elementos DOM
const elementos = {
  btnCalcular: document.getElementById('calcular'),
  btnExportarPdf: document.getElementById('exportarPdf'),
  btnToggleTema: document.getElementById('toggleTema'),
  btnResetData: document.getElementById('resetData'),
  output: document.getElementById('output'),
  canvasGrafico: document.getElementById('graficoSensibilidade')
};

// Referência ao gráfico Chart.js
let graficoAtual = null;

/**
 * Gera mensagem HTML com os resultados da análise
 */
function gerarMensagemResultados(resultados) {
  const { 
    consumoAntigo, 
    consumoNovo, 
    economiaKwh, 
    economiaReais, 
    payback, 
    fatores, 
    dadosAntigo 
  } = resultados;
  
  let html = '<div class="resultado-detalhado">\n';
  
  // Fatores de Ajuste
  html += '<h3>📊 Fatores de Ajuste Aplicados</h3>\n';
  html += `<p><strong>Fator de horas de uso:</strong> ${fatores.fatorHoras.toFixed(2)}x `;
  html += `(${fatores.fatorHoras > 1 ? 'uso mais intenso' : 'uso menos intenso'} que padrão Inmetro)</p>\n`;
  html += `<p><strong>Delta T real:</strong> ${fatores.deltaTReal.toFixed(1)}°C `;
  html += `(temp. externa média ${fatores.tempMediaExterna.toFixed(1)}°C - setpoint ${fatores.setpoint}°C)</p>\n`;
  html += `<p><strong>Fator delta T:</strong> ${fatores.fatorDeltaT.toFixed(2)}x `;
  html += `(vs padrão Inmetro 8°C)</p>\n`;
  html += `<p><strong>Fator temperatura externa:</strong> ${fatores.fatorTemperatura.toFixed(2)}x</p>\n`;
  
  if (dadosAntigo.fatorDegradacao > 1) {
    html += `<p><strong>Fator degradação (idade):</strong> ${dadosAntigo.fatorDegradacao.toFixed(2)}x `;
    html += `(${dadosAntigo.idade} anos, tipo ${dadosAntigo.tipo})</p>\n`;
  }
  
  if (dadosAntigo.fatorManutencao > 1) {
    html += `<p><strong>Fator manutenção:</strong> ${dadosAntigo.fatorManutencao.toFixed(2)}x `;
    const percentual = ((dadosAntigo.fatorManutencao - 1) * 100).toFixed(0);
    html += `<small class="warning">(+${percentual}% por limpeza/manutenção pendente)</small></p>\n`;
  }
  
  // Consumo
  html += '\n<h3>⚡ Consumo Energético Anual</h3>\n';
  html += `<p><strong>Aparelho atual (antigo):</strong> ${formatarNumero(consumoAntigo)} kWh/ano</p>\n`;
  html += `<p><strong>Aparelho novo:</strong> ${formatarNumero(consumoNovo)} kWh/ano</p>\n`;
  
  // Economia
  html += '\n<h3>💰 Economia Estimada</h3>\n';
  html += `<p class="destaque success"><strong>Economia anual:</strong> ${formatarNumero(economiaKwh)} kWh `;
  html += `(${formatarMoeda(economiaReais)})</p>\n`;
  
  const classePayback = payback < LIMIARES_PAYBACK.CURTO_PRAZO 
    ? 'success' 
    : payback > LIMIARES_PAYBACK.LONGO_PRAZO ? 'high' : '';
  
  const paybackTexto = payback === Infinity || payback > 50 
    ? '>50 anos (não compensa)' 
    : `${payback.toFixed(1)} anos`;
  
  html += `<p class="destaque ${classePayback}"><strong>Payback:</strong> ${paybackTexto}</p>\n`;
  
  // Recomendação
  html += '\n<h3>💡 Recomendação</h3>\n';
  if (payback < LIMIARES_PAYBACK.CURTO_PRAZO) {
    html += '<p class="recomendacao success">✅ <strong>Troca recomendada em curto prazo.</strong> O investimento se paga rapidamente.</p>';
  } else if (payback > LIMIARES_PAYBACK.LONGO_PRAZO) {
    html += '<p class="recomendacao warning">⚠️ <strong>Considere aguardar.</strong> Pode valer esperar uma promoção ou aumento na tarifa de energia.</p>';
  } else {
    html += '<p class="recomendacao">✔️ <strong>Investimento razoável.</strong> Payback moderado, avalie seu orçamento.</p>';
  }
  
  // Dicas
  if (dadosAntigo.fatorManutencao > 1) {
    html += '\n<div class="dica warning">';
    html += '<p><strong>💡 Dica:</strong> Antes de comprar, considere fazer manutenção completa no aparelho atual. ';
    html += `Isso pode reduzir o consumo em até ${((dadosAntigo.fatorManutencao - 1) * 100).toFixed(0)}% temporariamente.</p>`;
    html += '</div>';
  }
  
  // Disclaimer
  html += '\n<div class="disclaimer">';
  html += '<p><em>⚠️ Nota: As estimativas de consumo estão sujeitas a variação de ±15 a 30% em relação ao consumo real, devido a aproximações de cálculo e condições específicas de uso.</em></p>';
  html += '</div>';
  
  html += '</div>';
  return html;
}

/**
 * Função principal de cálculo
 */
function calcularEconomia() {
  elementos.output.innerHTML = '<p class="loading">Calculando...</p>';
  elementos.btnExportarPdf.disabled = true;
  
  try {
    const fatores = calcularFatoresAjuste();
    const consumoAntigo = calcularConsumoReal('Antigo', fatores);
    const consumoNovo = calcularConsumoReal('Novo', fatores);
    const { economiaKwh, economiaReais, payback, precoKwh, custoNovo } = calcularEconomiaEPayback(consumoAntigo, consumoNovo);
    const dadosAntigo = obterDadosAparelhoAntigo();
    
    const resultados = {
      consumoAntigo,
      consumoNovo,
      economiaKwh,
      economiaReais,
      payback,
      fatores,
      dadosAntigo,
      precoKwh,
      custoNovo
    };
    
    elementos.output.innerHTML = gerarMensagemResultados(resultados);
    elementos.btnExportarPdf.disabled = false;
    
    graficoAtual = gerarGraficoSensibilidade(resultados, graficoAtual, elementos.canvasGrafico);
    salvarDadosFormulario();
    
  } catch (erro) {
    console.error('Erro no cálculo:', erro);
    elementos.output.innerHTML = '<p class="error">❌ Erro ao calcular. Verifique os dados informados.</p>';
  }
}

/**
 * Alterna o tema da aplicação
 */
function alternarTema() {
  const html = document.documentElement;
  const temaAtual = html.getAttribute('data-theme');
  const novoTema = temaAtual === TEMAS.DARK ? TEMAS.LIGHT : TEMAS.DARK;
  
  html.setAttribute('data-theme', novoTema);
  salvarTema(novoTema);
  
  const iconeSol = document.getElementById('iconeSol');
  const iconeLua = document.getElementById('iconeLua');
  
  if (novoTema === TEMAS.DARK) {
    iconeSol.style.display = 'none';
    iconeLua.style.display = 'inline';
  } else {
    iconeSol.style.display = 'inline';
    iconeLua.style.display = 'none';
  }
}

/**
 * Wrapper para exportação de PDF
 */
function handleExportarPDF() {
  exportarParaPDF(graficoAtual);
}

/**
 * Inicializa a aplicação
 */
function inicializar() {
  carregarTema();
  carregarDadosFormulario();
  
  elementos.btnCalcular.addEventListener('click', calcularEconomia);
  elementos.btnExportarPdf.addEventListener('click', handleExportarPDF);
  elementos.btnToggleTema.addEventListener('click', alternarTema);
  elementos.btnResetData.addEventListener('click', resetarDadosFormulario);
  
  // Auto-salvar
  CAMPOS_FORMULARIO.forEach(campo => {
    const elemento = document.getElementById(campo);
    if (elemento) {
      elemento.addEventListener('change', salvarDadosFormulario);
    }
  });
  
  console.info('✅ Calculadora inicializada (módulos ES6)');
}

// Inicializa
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}
