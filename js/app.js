/**
 * ============================================
 * APLICAÇÃO PRINCIPAL - REFATORADA
 * ============================================
 * Orquestra todos os módulos e gerencia o ciclo de vida da aplicação
 */

import { LIMIARES_PAYBACK, CAMPOS_FORMULARIO, TEMAS, FATORES_AJUSTE } from './config/constants.js';
import { formatarNumero, formatarMoeda, obterConsumoPadraoAnual } from './utils/formatters.js';
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
  memoriaToggle: document.getElementById('toggleMemoria'),
  memoriaConteudo: document.getElementById('memoriaConteudo'),
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
 * Gera memória de cálculo detalhada
 */
function gerarMemoriaCalculo(resultados) {
  const {
    consumoAntigo,
    consumoNovo,
    economiaKwh,
    economiaReais,
    payback,
    fatores,
    dadosAntigo,
    precoKwh,
    custoNovo
  } = resultados;

  const tempMin = parseFloat(document.getElementById('tempMin').value) || 25;
  const tempMax = parseFloat(document.getElementById('tempMax').value) || 35;
  const setpoint = parseFloat(document.getElementById('setpoint').value) || 24;
  const horasAno = fatores.horasDia * 30 * fatores.mesesAno;

  const btuAntigo = parseFloat(document.getElementById('btuAntigo').value) || 12000;
  const tipoAntigo = document.getElementById('tipoAntigo').value;
  const classeAntigo = document.getElementById('classeAntigo').value || 'C';

  const btuNovo = parseFloat(document.getElementById('btuNovo').value) || 12000;
  const tipoNovo = document.getElementById('tipoNovo').value;
  const classeNovo = document.getElementById('classeNovo').value || 'C';

  const consumoBaseAntigo = obterConsumoPadraoAnual(btuAntigo, tipoAntigo, classeAntigo);
  const consumoBaseNovo = obterConsumoPadraoAnual(btuNovo, tipoNovo, classeNovo);

  const limpeza = document.getElementById('limpezaAntigo').value;
  const manutencao = document.getElementById('manutencaoAntigo').value;
  const fatorLimpeza = limpeza === 'pendente' ? FATORES_AJUSTE.LIMPEZA_PENDENTE : 1.0;
  const fatorManut = manutencao === 'pendente' ? FATORES_AJUSTE.MANUTENCAO_PENDENTE : 1.0;

  const consumoAjustadoAntigo = consumoBaseAntigo
    * fatores.fatorHoras
    * fatores.fatorDeltaT
    * fatores.fatorTemperatura
    * dadosAntigo.fatorDegradacao
    * dadosAntigo.fatorManutencao;

  const consumoAjustadoNovo = consumoBaseNovo
    * fatores.fatorHoras
    * fatores.fatorDeltaT
    * fatores.fatorTemperatura;

  const paybackTexto = payback === Infinity || payback > 50
    ? '>50 anos (não compensa)'
    : `${payback.toFixed(1)} anos`;

  let html = '<div class="memoria-detalhada">';

  html += '<h3>1. Entradas e conversões</h3>';
  html += '<ul>';
  html += `<li>Horas por ano = ${fatores.horasDia} h/dia × ${fatores.mesesAno} meses × 30 = ${formatarNumero(horasAno)} h/ano</li>`;
  html += `<li>Temperatura média externa = (${tempMin} + ${tempMax}) ÷ 2 = ${fatores.tempMediaExterna.toFixed(1)} °C</li>`;
  html += `<li>Delta T real = ${fatores.tempMediaExterna.toFixed(1)} - ${setpoint} = ${fatores.deltaTReal.toFixed(1)} °C</li>`;
  html += '</ul>';

  html += '<h3>2. Fatores aplicados</h3>';
  html += '<ul>';
  html += `<li>Fator de horas = ${formatarNumero(horasAno)} ÷ ${FATORES_AJUSTE.TESTE_INMETRO.HORAS_ANO} = ${fatores.fatorHoras.toFixed(2)}x</li>`;
  html += `<li>Fator delta T = ${fatores.deltaTReal.toFixed(1)} ÷ ${FATORES_AJUSTE.TESTE_INMETRO.DELTA_T} = ${fatores.fatorDeltaT.toFixed(2)}x</li>`;
  html += `<li>Fator temperatura = clamp(0,5–1,5, 1 + (${fatores.tempMediaExterna.toFixed(1)} - ${FATORES_AJUSTE.TESTE_INMETRO.TEMP_EXTERNA}) × 0,015) = ${fatores.fatorTemperatura.toFixed(2)}x</li>`;
  if (dadosAntigo.idade > 2) {
    const taxa = FATORES_AJUSTE.DEGRADACAO_TAXA[dadosAntigo.tipo] || 0;
    html += `<li>Fator degradação = 1 + (${dadosAntigo.idade} - 2) × ${taxa.toFixed(2)} = ${dadosAntigo.fatorDegradacao.toFixed(2)}x</li>`;
  } else {
    html += `<li>Fator degradação = ${dadosAntigo.fatorDegradacao.toFixed(2)}x</li>`;
  }
  html += `<li>Fator manutenção = ${fatorLimpeza.toFixed(2)} × ${fatorManut.toFixed(2)} = ${dadosAntigo.fatorManutencao.toFixed(2)}x</li>`;
  html += '</ul>';

  html += '<h3>3. Consumo anual</h3>';
  html += '<ul>';
  html += `<li>Consumo base (antigo) = ${formatarNumero(consumoBaseAntigo)} kWh/ano</li>`;
  html += `<li>Consumo ajustado (antigo) = ${formatarNumero(consumoAjustadoAntigo)} kWh/ano</li>`;
  html += `<li>Consumo base (novo) = ${formatarNumero(consumoBaseNovo)} kWh/ano</li>`;
  html += `<li>Consumo ajustado (novo) = ${formatarNumero(consumoAjustadoNovo)} kWh/ano</li>`;
  html += '</ul>';

  html += '<h3>4. Economia e payback</h3>';
  html += '<ul>';
  html += `<li>Economia anual = ${formatarNumero(consumoAntigo)} - ${formatarNumero(consumoNovo)} = ${formatarNumero(economiaKwh)} kWh</li>`;
  html += `<li>Economia em R$ = ${formatarNumero(economiaKwh)} × ${precoKwh.toFixed(2)} = ${formatarMoeda(economiaReais)}</li>`;
  html += `<li>Payback = ${formatarMoeda(custoNovo)} ÷ ${formatarMoeda(economiaReais)} = ${paybackTexto}</li>`;
  html += '</ul>';

  html += '</div>';
  return html;
}

function alternarMemoriaCalculo() {
  if (!elementos.memoriaConteudo || !elementos.memoriaToggle) return;

  const oculto = elementos.memoriaConteudo.hasAttribute('hidden');
  const textoBotao = elementos.memoriaToggle.querySelector('.btn-text');

  if (oculto) {
    elementos.memoriaConteudo.removeAttribute('hidden');
    elementos.memoriaToggle.setAttribute('aria-expanded', 'true');
    if (textoBotao) textoBotao.textContent = 'Ocultar memória de cálculo';
  } else {
    elementos.memoriaConteudo.setAttribute('hidden', '');
    elementos.memoriaToggle.setAttribute('aria-expanded', 'false');
    if (textoBotao) textoBotao.textContent = 'Ver memória de cálculo';
  }
}

function resetarMemoriaCalculo() {
  if (!elementos.memoriaConteudo || !elementos.memoriaToggle) return;

  elementos.memoriaConteudo.innerHTML = '<p class="placeholder-text">Calcule a economia para gerar a memória de cálculo.</p>';
  elementos.memoriaConteudo.setAttribute('hidden', '');
  elementos.memoriaToggle.setAttribute('aria-expanded', 'false');
  elementos.memoriaToggle.disabled = true;

  const textoBotao = elementos.memoriaToggle.querySelector('.btn-text');
  if (textoBotao) textoBotao.textContent = 'Ver memória de cálculo';
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

    if (elementos.memoriaConteudo) {
      elementos.memoriaConteudo.innerHTML = gerarMemoriaCalculo(resultados);
      elementos.memoriaToggle.disabled = false;
    }
    
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

function handleResetarDados() {
  resetarDadosFormulario();
  resetarMemoriaCalculo();
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
  elementos.btnResetData.addEventListener('click', handleResetarDados);
  if (elementos.memoriaToggle) {
    elementos.memoriaToggle.addEventListener('click', alternarMemoriaCalculo);
  }
  
  // Auto-salvar
  CAMPOS_FORMULARIO.forEach(campo => {
    const elemento = document.getElementById(campo);
    if (elemento) {
      elemento.addEventListener('change', salvarDadosFormulario);
    }
  });

  resetarMemoriaCalculo();
  
  console.info('✅ Calculadora inicializada (módulos ES6)');
}

// Inicializa
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}
