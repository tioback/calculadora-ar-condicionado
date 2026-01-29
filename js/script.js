/**
 * ============================================
 * CALCULADORA DE ECONOMIA EM AR-CONDICIONADO
 * ============================================
 * 
 * Calcula a economia financeira e payback ao trocar
 * um ar-condicionado antigo por um modelo mais eficiente.
 * 
 * Considera fatores como:
 * - Tipo de tecnologia (on-off vs inverter)
 * - Classe de eficiência energética (A-F)
 * - Degradação por idade do aparelho
 * - Estado de limpeza e manutenção
 * - Diferença de temperatura (delta T)
 * - Padrão de uso (horas/dia, meses/ano)
 */

// ============================================
// CONSTANTES E CONFIGURAÇÕES
// ============================================

/**
 * Consumo padrão anual (kWh/ano) por tipo, capacidade e classe
 * Baseado em dados do Inmetro para condições padrão de teste
 * (35°C externa, 27°C interna, 2080 horas/ano)
 */
const CONSUMO_PADRAO_ANUAL = {
  inverter: {
    '9000': { A: 350, B: 500, C: 650, D: 800, E: 950, F: 1100 },
    '12000': { A: 450, B: 600, C: 800, D: 1000, E: 1200, F: 1400 },
    '18000': { A: 700, B: 900, C: 1200, D: 1500, E: 1800, F: 2200 },
  },
  onoff: {} // Calculado como inverter * 1.45
};

/**
 * Fatores de ajuste de consumo
 */
const FATORES_AJUSTE = {
  // Degradação anual por tipo de tecnologia
  DEGRADACAO_TAXA: {
    onoff: 0.04,    // 4% ao ano após 2 anos
    inverter: 0.02  // 2% ao ano após 2 anos
  },
  
  // Impacto de manutenção inadequada
  LIMPEZA_PENDENTE: 1.15,      // +15% de consumo
  MANUTENCAO_PENDENTE: 1.10,   // +10% de consumo
  
  // Fator multiplicador on-off vs inverter
  ONOFF_MULTIPLICADOR: 1.45,
  
  // Condições padrão do teste Inmetro
  TESTE_INMETRO: {
    TEMP_EXTERNA: 35,
    TEMP_INTERNA: 27,
    HORAS_ANO: 2080,
    DELTA_T: 8  // 35 - 27
  }
};

/**
 * Limiares para recomendações
 */
const LIMIARES_PAYBACK = {
  CURTO_PRAZO: 5,   // < 5 anos: recomendado
  LONGO_PRAZO: 8    // > 8 anos: avaliar esperar
};

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Obtém o consumo padrão anual baseado em BTU, tipo e classe
 * @param {number} btu - Capacidade em BTU/h
 * @param {string} tipo - 'inverter' ou 'onoff'
 * @param {string} classe - Classe energética A-F
 * @returns {number} Consumo anual em kWh
 */
function obterConsumoPadraoAnual(btu, tipo, classe) {
  // Arredonda BTU para valor padrão mais próximo (9000, 12000, 18000)
  const btuPadrao = String(Math.round(btu / 1000) * 1000);
  
  // Busca consumo base para inverter
  let consumoBase = CONSUMO_PADRAO_ANUAL.inverter[btuPadrao]?.[classe] 
    || CONSUMO_PADRAO_ANUAL.inverter[btuPadrao]?.C 
    || 1000; // Fallback
  
  // Ajusta se for on-off
  if (tipo === 'onoff') {
    consumoBase *= FATORES_AJUSTE.ONOFF_MULTIPLICADOR;
  }
  
  return consumoBase;
}

/**
 * Padroniza consumo informado para kWh/ano
 * @param {number|null} consumo - Valor informado
 * @param {string} unidade - 'ano' ou 'mes'
 * @returns {number|null} Consumo anual ou null
 */
function padronizarConsumoAnual(consumo, unidade) {
  if (!consumo || consumo <= 0) return null;
  return unidade === 'ano' ? consumo : consumo * 12;
}

/**
 * Formata número com separadores de milhar
 * @param {number} valor
 * @returns {string}
 */
function formatarNumero(valor) {
  return new Intl.NumberFormat('pt-BR').format(Math.round(valor));
}

/**
 * Formata valor monetário
 * @param {number} valor
 * @returns {string}
 */
function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

// ============================================
// ELEMENTOS DO DOM
// ============================================

const elementos = {
  // Botões
  btnCalcular: document.getElementById('calcular'),
  btnExportarPdf: document.getElementById('exportPdf'),
  btnToggleTema: document.getElementById('toggleTheme'),
  btnResetData: document.getElementById('resetData'),
  textoTema: document.getElementById('themeText'),
  iconSun: document.getElementById('iconSun'),
  iconMoon: document.getElementById('iconMoon'),
  
  // Saída
  output: document.getElementById('output'),
  canvasGrafico: document.getElementById('graficoPayback'),
};

// ============================================
// GERENCIAMENTO DE TEMA
// ============================================

/**
 * Alterna entre tema claro e escuro
 */
function alternarTema() {
  const isDark = document.body.classList.toggle('dark');
  elementos.textoTema.textContent = isDark ? 'Tema Claro' : 'Tema Escuro';
  
  // Alterna ícones
  if (isDark) {
    elementos.iconSun.classList.add('hidden');
    elementos.iconMoon.classList.remove('hidden');
  } else {
    elementos.iconSun.classList.remove('hidden');
    elementos.iconMoon.classList.add('hidden');
  }
  
  localStorage.setItem('darkMode', isDark);
}

/**
 * Carrega preferência de tema salva
 */
function carregarTema() {
  const isDark = localStorage.getItem('darkMode') === 'true';
  if (isDark) {
    document.body.classList.add('dark');
    elementos.textoTema.textContent = 'Tema Claro';
    elementos.iconSun.classList.add('hidden');
    elementos.iconMoon.classList.remove('hidden');
  }
}

// ============================================
// PERSISTÊNCIA DE DADOS
// ============================================

/**
 * Valores padrão do formulário
 */
const VALORES_PADRAO = {
  horasDia: '8',
  mesesAno: '6',
  area: '15',
  tempMin: '25',
  tempMax: '35',
  setpoint: '24',
  precoKwh: '0.90',
  tipoAntigo: 'onoff',
  etiquetaAntigo: 'nova',
  btuAntigo: '12000',
  classeAntigo: '',
  consumoAntigo: '',
  unidadeAntigo: 'ano',
  idadeAntigo: '10',
  limpezaAntigo: 'emdia',
  manutencaoAntigo: 'emdia',
  tipoNovo: 'inverter',
  etiquetaNovo: 'nova',
  btuNovo: '12000',
  classeNovo: 'A',
  consumoNovo: '',
  unidadeNovo: 'ano',
  custoNovo: '5000'
};

/**
 * Lista de IDs dos campos do formulário
 */
const CAMPOS_FORMULARIO = [
  'horasDia', 'mesesAno', 'area', 'tempMin', 'tempMax', 'setpoint', 'precoKwh',
  'tipoAntigo', 'etiquetaAntigo', 'btuAntigo', 'classeAntigo', 'consumoAntigo', 
  'unidadeAntigo', 'idadeAntigo', 'limpezaAntigo', 'manutencaoAntigo',
  'tipoNovo', 'etiquetaNovo', 'btuNovo', 'classeNovo', 'consumoNovo', 
  'unidadeNovo', 'custoNovo'
];

/**
 * Salva dados do formulário no localStorage
 */
function salvarDadosFormulario() {
  const dados = {};
  CAMPOS_FORMULARIO.forEach(campo => {
    const elemento = document.getElementById(campo);
    if (elemento) {
      dados[campo] = elemento.value;
    }
  });
  localStorage.setItem('calcData', JSON.stringify(dados));
}

/**
 * Carrega dados salvos no formulário
 */
function carregarDadosFormulario() {
  const dadosSalvos = localStorage.getItem('calcData');
  if (!dadosSalvos) return;
  
  try {
    const dados = JSON.parse(dadosSalvos);
    CAMPOS_FORMULARIO.forEach(campo => {
      const elemento = document.getElementById(campo);
      if (elemento && dados[campo] !== undefined) {
        elemento.value = dados[campo];
      }
    });
  } catch (erro) {
    console.error('Erro ao carregar dados salvos:', erro);
  }
}

/**
 * Reseta todos os campos para os valores padrão
 */
function resetarDados() {
  // Confirmação do usuário
  const confirmacao = confirm(
    'Tem certeza que deseja limpar todos os dados e voltar aos valores padrão?\n\n' +
    'Esta ação não pode ser desfeita.'
  );
  
  if (!confirmacao) return;
  
  // Reseta todos os campos
  CAMPOS_FORMULARIO.forEach(campo => {
    const elemento = document.getElementById(campo);
    if (elemento && VALORES_PADRAO[campo] !== undefined) {
      elemento.value = VALORES_PADRAO[campo];
    }
  });
  
  // Limpa resultados
  elementos.output.innerHTML = '<p class="placeholder-text">Preencha os dados acima e clique em "Calcular Economia" para ver os resultados.</p>';
  elementos.btnExportarPdf.disabled = true;
  
  // Destrói gráfico se existir
  if (graficoAtual) {
    graficoAtual.destroy();
    graficoAtual = null;
  }
  
  // Remove dados salvos
  localStorage.removeItem('calcData');
  
  // Feedback visual
  const btnTexto = elementos.btnResetData.querySelector('.btn-text');
  const textoOriginal = btnTexto.textContent;
  btnTexto.textContent = 'Limpo!';
  
  setTimeout(() => {
    btnTexto.textContent = textoOriginal;
  }, 2000);
  
  console.info('✅ Dados resetados para valores padrão');
}

// ============================================
// CÁLCULO DE CONSUMO
// ============================================

/**
 * Calcula o consumo real ajustado de um aparelho
 * @param {string} prefixo - 'Antigo' ou 'Novo'
 * @param {Object} parametrosUso - Parâmetros de uso e ambiente
 * @returns {number} Consumo anual em kWh
 */
function calcularConsumoReal(prefixo, parametrosUso) {
  // Obtém dados do aparelho
  const tipo = document.getElementById(`tipo${prefixo}`).value;
  const btu = parseInt(document.getElementById(`btu${prefixo}`).value) || 12000;
  const classe = document.getElementById(`classe${prefixo}`).value;
  const consumoInformado = parseFloat(document.getElementById(`consumo${prefixo}`).value);
  const unidade = document.getElementById(`unidade${prefixo}`).value;
  
  // Define consumo base anual
  let consumoAnual = padronizarConsumoAnual(consumoInformado, unidade);
  if (!consumoAnual) {
    consumoAnual = obterConsumoPadraoAnual(btu, tipo, classe);
  }
  
  // Aplica fatores de ajuste
  let fatorDegradacao = 1;
  let fatorManutencao = 1;
  
  // Apenas para aparelho antigo: considerar idade e manutenção
  if (prefixo === 'Antigo') {
    const idade = parseFloat(document.getElementById('idadeAntigo').value) || 0;
    const limpeza = document.getElementById('limpezaAntigo').value;
    const manutencao = document.getElementById('manutencaoAntigo').value;
    
    // Fator de degradação por idade (após 2 anos)
    if (idade > 2) {
      const taxaDegradacao = FATORES_AJUSTE.DEGRADACAO_TAXA[tipo];
      fatorDegradacao = 1 + (idade - 2) * taxaDegradacao;
    }
    
    // Fator de manutenção inadequada
    const fatorLimpeza = limpeza === 'pendente' ? FATORES_AJUSTE.LIMPEZA_PENDENTE : 1.0;
    const fatorManut = manutencao === 'pendente' ? FATORES_AJUSTE.MANUTENCAO_PENDENTE : 1.0;
    fatorManutencao = fatorLimpeza * fatorManut;
  }
  
  // Aplica todos os fatores
  const { fatorHoras, fatorTemperatura, fatorDeltaT } = parametrosUso;
  const consumoAjustado = consumoAnual 
    * fatorHoras 
    * fatorTemperatura 
    * fatorDeltaT
    * fatorDegradacao 
    * fatorManutencao;
  
  return consumoAjustado;
}

/**
 * Calcula fatores de ajuste baseados nos parâmetros de uso
 * @returns {Object} Objeto com fatores calculados
 */
function calcularFatoresAjuste() {
  const horasDia = parseFloat(document.getElementById('horasDia').value) || 8;
  const mesesAno = parseFloat(document.getElementById('mesesAno').value) || 6;
  const tempMin = parseFloat(document.getElementById('tempMin').value) || 25;
  const tempMax = parseFloat(document.getElementById('tempMax').value) || 35;
  const setpoint = parseFloat(document.getElementById('setpoint').value) || 24;
  
  // Fator de horas: compara uso real vs padrão Inmetro (2080h/ano)
  const horasAno = horasDia * 30 * mesesAno;
  const fatorHoras = horasAno / FATORES_AJUSTE.TESTE_INMETRO.HORAS_ANO;
  
  // Temperatura externa média
  const tempMediaExterna = (tempMin + tempMax) / 2;
  
  // Fator delta T: diferença real vs padrão Inmetro
  const deltaTReal = tempMediaExterna - setpoint;
  const deltaTAtual = Math.max(deltaTReal, 0); // Não pode ser negativo
  const fatorDeltaT = deltaTAtual > 0 
    ? deltaTAtual / FATORES_AJUSTE.TESTE_INMETRO.DELTA_T 
    : 0.5; // Mínimo 50% se externa mais fria que setpoint
  
  // Fator temperatura externa
  const fatorTemperatura = Math.max(
    0.5, 
    1 - 0.015 * (FATORES_AJUSTE.TESTE_INMETRO.TEMP_EXTERNA - tempMediaExterna)
  );
  
  return {
    horasDia,
    mesesAno,
    horasAno,
    fatorHoras,
    tempMediaExterna,
    deltaTReal,
    fatorDeltaT,
    fatorTemperatura,
    setpoint
  };
}

// ============================================
// GERAÇÃO DE RESULTADOS
// ============================================

/**
 * Gera mensagem formatada com os resultados do cálculo
 * @param {Object} resultados - Objeto com todos os resultados
 * @returns {string} HTML formatado
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
  
  // Seção: Fatores de Ajuste
  html += '<h3>📊 Fatores de Ajuste Aplicados</h3>\n';
  html += `<p><strong>Fator de horas de uso:</strong> ${fatores.fatorHoras.toFixed(2)}x `;
  html += `(${fatores.fatorHoras > 1 ? 'uso mais intenso' : 'uso menos intenso'} que padrão Inmetro)</p>\n`;
  
  html += `<p><strong>Delta T real:</strong> ${fatores.deltaTReal.toFixed(1)}°C `;
  html += `(temp. externa média ${fatores.tempMediaExterna.toFixed(1)}°C - setpoint ${fatores.setpoint}°C)</p>\n`;
  
  html += `<p><strong>Fator delta T:</strong> ${fatores.fatorDeltaT.toFixed(2)}x `;
  html += `(vs padrão Inmetro ${FATORES_AJUSTE.TESTE_INMETRO.DELTA_T}°C)</p>\n`;
  
  html += `<p><strong>Fator temperatura externa:</strong> ${fatores.fatorTemperatura.toFixed(2)}x</p>\n`;
  
  // Fatores específicos do aparelho antigo
  if (dadosAntigo.fatorDegradacao > 1) {
    html += `<p><strong>Fator degradação (idade):</strong> ${dadosAntigo.fatorDegradacao.toFixed(2)}x `;
    html += `(${dadosAntigo.idade} anos, tipo ${dadosAntigo.tipo})</p>\n`;
  }
  
  if (dadosAntigo.fatorManutencao > 1) {
    html += `<p><strong>Fator manutenção:</strong> ${dadosAntigo.fatorManutencao.toFixed(2)}x `;
    const percentualExtra = ((dadosAntigo.fatorManutencao - 1) * 100).toFixed(0);
    html += `<small class="warning">(+${percentualExtra}% por limpeza/manutenção pendente)</small></p>\n`;
  }
  
  html += '\n';
  
  // Seção: Consumo
  html += '<h3>⚡ Consumo Energético Anual</h3>\n';
  html += `<p><strong>Aparelho atual (antigo):</strong> ${formatarNumero(consumoAntigo)} kWh/ano</p>\n`;
  html += `<p><strong>Aparelho novo:</strong> ${formatarNumero(consumoNovo)} kWh/ano</p>\n`;
  html += '\n';
  
  // Seção: Economia
  html += '<h3>💰 Economia Estimada</h3>\n';
  html += `<p class="destaque success"><strong>Economia anual:</strong> ${formatarNumero(economiaKwh)} kWh `;
  html += `(${formatarMoeda(economiaReais)})</p>\n`;
  
  // Payback com classe dinâmica
  const classePayback = payback < LIMIARES_PAYBACK.CURTO_PRAZO 
    ? 'success' 
    : payback > LIMIARES_PAYBACK.LONGO_PRAZO 
      ? 'high' 
      : '';
  
  const paybackTexto = payback === Infinity || payback > 50 
    ? '>50 anos (não compensa)' 
    : `${payback.toFixed(1)} anos`;
  
  html += `<p class="destaque ${classePayback}"><strong>Payback:</strong> ${paybackTexto}</p>\n`;
  
  // Seção: Recomendação
  html += '\n<h3>💡 Recomendação</h3>\n';
  if (payback < LIMIARES_PAYBACK.CURTO_PRAZO) {
    html += '<p class="recomendacao success">✅ <strong>Troca recomendada em curto prazo.</strong> ';
    html += 'O investimento se paga rapidamente.</p>';
  } else if (payback > LIMIARES_PAYBACK.LONGO_PRAZO) {
    html += '<p class="recomendacao warning">⚠️ <strong>Considere aguardar.</strong> ';
    html += 'Pode valer esperar uma promoção ou aumento na tarifa de energia.</p>';
  } else {
    html += '<p class="recomendacao">✔️ <strong>Investimento razoável.</strong> ';
    html += 'Payback moderado, avalie seu orçamento.</p>';
  }
  
  // Dicas adicionais para aparelho antigo
  if (dadosAntigo.fatorManutencao > 1) {
    html += '\n<div class="dica warning">';
    html += '<p><strong>💡 Dica:</strong> Antes de comprar um aparelho novo, considere fazer manutenção ';
    html += 'completa no aparelho atual (limpeza de filtros e serpentinas). Isso pode reduzir o consumo ';
    html += `em até ${((dadosAntigo.fatorManutencao - 1) * 100).toFixed(0)}% temporariamente.</p>`;
    html += '</div>';
  }
  
  html += '</div>';
  
  return html;
}

/**
 * Função principal de cálculo e exibição de resultados
 */
function calcularEconomia() {
  // Limpa resultados anteriores
  elementos.output.innerHTML = '<p class="loading">Calculando...</p>';
  elementos.btnExportarPdf.disabled = true;
  
  try {
    // Calcula fatores de ajuste
    const fatores = calcularFatoresAjuste();
    
    // Obtém valores financeiros
    const precoKwh = parseFloat(document.getElementById('precoKwh').value) || 0.90;
    const custoNovo = parseFloat(document.getElementById('custoNovo').value) || 5000;
    
    // Calcula consumo de ambos aparelhos
    const consumoAntigo = calcularConsumoReal('Antigo', fatores);
    const consumoNovo = calcularConsumoReal('Novo', fatores);
    
    // Calcula economia e payback
    const economiaKwh = consumoAntigo - consumoNovo;
    const economiaReais = economiaKwh * precoKwh;
    const payback = economiaReais > 0 ? custoNovo / economiaReais : Infinity;
    
    // Obtém dados específicos do aparelho antigo para detalhamento
    const idadeAntigo = parseFloat(document.getElementById('idadeAntigo').value) || 0;
    const tipoAntigo = document.getElementById('tipoAntigo').value;
    const limpeza = document.getElementById('limpezaAntigo').value;
    const manutencao = document.getElementById('manutencaoAntigo').value;
    
    const fatorDegradacao = idadeAntigo > 2 
      ? 1 + (idadeAntigo - 2) * FATORES_AJUSTE.DEGRADACAO_TAXA[tipoAntigo]
      : 1;
    
    const fatorLimpeza = limpeza === 'pendente' ? FATORES_AJUSTE.LIMPEZA_PENDENTE : 1.0;
    const fatorManut = manutencao === 'pendente' ? FATORES_AJUSTE.MANUTENCAO_PENDENTE : 1.0;
    const fatorManutencao = fatorLimpeza * fatorManut;
    
    // Monta objeto de resultados
    const resultados = {
      consumoAntigo,
      consumoNovo,
      economiaKwh,
      economiaReais,
      payback,
      fatores,
      dadosAntigo: {
        idade: idadeAntigo,
        tipo: tipoAntigo,
        fatorDegradacao,
        fatorManutencao
      },
      precoKwh,
      custoNovo
    };
    
    // Exibe resultados
    elementos.output.innerHTML = gerarMensagemResultados(resultados);
    elementos.btnExportarPdf.disabled = false;
    
    // Gera gráfico de sensibilidade
    gerarGraficoSensibilidade(resultados);
    
    // Salva dados do formulário
    salvarDadosFormulario();
    
  } catch (erro) {
    console.error('Erro no cálculo:', erro);
    elementos.output.innerHTML = '<p class="error">❌ Erro ao calcular. Verifique os dados informados.</p>';
  }
}

// ============================================
// GERAÇÃO DE GRÁFICO
// ============================================

let graficoAtual = null; // Referência ao gráfico Chart.js

/**
 * Gera gráfico de análise de sensibilidade com melhorias avançadas
 * - Range dinâmico baseado no cenário do usuário
 * - Marcador visual do cenário atual
 * - Zonas coloridas (verde/amarelo/vermelho)
 * - Gráfico dual (payback + economia)
 * - Tooltip melhorado com recomendações
 * @param {Object} resultados - Resultados do cálculo principal
 */
function gerarGraficoSensibilidade(resultados) {
  const { consumoAntigo, consumoNovo, fatores, precoKwh, custoNovo } = resultados;
  
  // Destrói gráfico anterior se existir
  if (graficoAtual) {
    graficoAtual.destroy();
  }
  
  const ctx = elementos.canvasGrafico.getContext('2d');
  const horasUsuario = fatores.horasDia;
  
  // MELHORIA 1: Range dinâmico baseado nas horas do usuário
  const horasMin = Math.max(1, Math.floor(horasUsuario * 0.5));
  const horasMax = Math.min(20, Math.ceil(horasUsuario * 1.8));
  const numPontos = 10;
  const step = (horasMax - horasMin) / (numPontos - 1);
  
  const horasPorDia = [];
  for (let i = 0; i < numPontos; i++) {
    horasPorDia.push(Number((horasMin + step * i).toFixed(1)));
  }
  
  // Calcula dados para ambas as métricas
  const dadosPayback = [];
  const dadosEconomia = [];
  
  horasPorDia.forEach(horas => {
    // Recalcula fator de horas para este cenário
    const horasAno = horas * 30 * fatores.mesesAno;
    const fatorHorasAjustado = horasAno / FATORES_AJUSTE.TESTE_INMETRO.HORAS_ANO;
    
    // Consumo base sem o fator de horas original
    const consumoAntigoBase = consumoAntigo / fatores.fatorHoras;
    const consumoNovoBase = consumoNovo / fatores.fatorHoras;
    
    // Aplica novo fator de horas
    const consumoAntigoAjustado = consumoAntigoBase * fatorHorasAjustado;
    const consumoNovoAjustado = consumoNovoBase * fatorHorasAjustado;
    
    // Calcula economia e payback para este cenário
    const economiaKwh = consumoAntigoAjustado - consumoNovoAjustado;
    const economiaReais = economiaKwh * precoKwh;
    
    // MELHORIA 3C: Limitar payback a 25 anos, depois null
    let payback = economiaReais > 0 ? custoNovo / economiaReais : null;
    if (payback !== null && payback > 25) {
      payback = null;
    }
    
    dadosPayback.push(payback);
    dadosEconomia.push(economiaReais > 0 ? economiaReais : 0);
  });
  
  // Obter cores do tema atual
  const corPrimaria = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary').trim() || '#0056b3';
  const corSucesso = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-success').trim() || '#28a745';
  const corAviso = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-warning').trim() || '#ffc107';
  const corPerigo = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-danger').trim() || '#dc3545';
  
  // MELHORIA 6: Plugin para zonas coloridas de fundo
  const pluginZonasColoridas = {
    id: 'zonasColoridas',
    beforeDraw: (chart) => {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea) return;
      
      const yScale = scales.y;
      const xLeft = chartArea.left;
      const xRight = chartArea.right;
      
      // Zona verde: 0-5 anos (ótimo)
      const y5 = yScale.getPixelForValue(5);
      const yBottom = chartArea.bottom;
      ctx.fillStyle = 'rgba(40, 167, 69, 0.08)';
      ctx.fillRect(xLeft, y5, xRight - xLeft, yBottom - y5);
      
      // Zona amarela: 5-8 anos (razoável)
      const y8 = yScale.getPixelForValue(8);
      ctx.fillStyle = 'rgba(255, 193, 7, 0.08)';
      ctx.fillRect(xLeft, y8, xRight - xLeft, y5 - y8);
      
      // Zona vermelha: 8+ anos (avaliar)
      const yTop = chartArea.top;
      ctx.fillStyle = 'rgba(220, 53, 69, 0.08)';
      ctx.fillRect(xLeft, yTop, xRight - xLeft, y8 - yTop);
    }
  };
  
  // Configuração do gráfico
  graficoAtual = new Chart(ctx, {
    type: 'line',
    data: {
      labels: horasPorDia,
      datasets: [
        {
          label: 'Payback (anos)',
          data: dadosPayback,
          borderColor: corPrimaria,
          backgroundColor: corPrimaria.replace('rgb', 'rgba').replace(')', ', 0.1)'),
          fill: false,
          tension: 0.3,
          pointRadius: 5,
          pointHoverRadius: 8,
          borderWidth: 3,
          yAxisID: 'y',
          spanGaps: false // Não conecta pontos null
        },
        // MELHORIA 5: Segundo dataset com economia anual
        {
          label: 'Economia anual (R$)',
          data: dadosEconomia,
          borderColor: corSucesso,
          backgroundColor: corSucesso.replace('rgb', 'rgba').replace(')', ', 0.1)'),
          fill: false,
          tension: 0.3,
          pointRadius: 4,
          pointHoverRadius: 7,
          borderWidth: 2,
          borderDash: [5, 5],
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        // Registra plugin de zonas
        zonasColoridas: pluginZonasColoridas,
        
        legend: {
          display: true,
          position: 'top',
          labels: {
            padding: 15,
            usePointStyle: true,
            font: {
              size: 12
            }
          }
        },
        title: {
          display: true,
          text: 'Análise de Sensibilidade: Impacto das Horas de Uso',
          font: {
            size: 15,
            weight: '600'
          },
          padding: {
            top: 10,
            bottom: 15
          }
        },
        // MELHORIA: Tooltip melhorado com recomendações
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: { size: 13, weight: 'bold' },
          bodyFont: { size: 12 },
          bodySpacing: 6,
          callbacks: {
            title: (context) => {
              return `${context[0].label}h de uso por dia`;
            },
            label: (context) => {
              const datasetLabel = context.dataset.label;
              const valor = context.parsed.y;
              
              if (datasetLabel.includes('Payback')) {
                if (valor === null) {
                  return 'Payback: Não compensa (>25 anos)';
                }
                let emoji = '';
                let recomendacao = '';
                if (valor < 5) {
                  emoji = '✅';
                  recomendacao = ' - Excelente!';
                } else if (valor > 8) {
                  emoji = '⚠️';
                  recomendacao = ' - Avaliar melhor';
                } else {
                  emoji = '✔️';
                  recomendacao = ' - Razoável';
                }
                return `${emoji} Payback: ${valor.toFixed(1)} anos${recomendacao}`;
              } else {
                return `💰 Economia: ${formatarMoeda(valor)}/ano`;
              }
            },
            afterBody: (context) => {
              // Adiciona dica extra no tooltip
              const horas = parseFloat(context[0].label);
              if (Math.abs(horas - horasUsuario) < 0.5) {
                return ['', '👉 Este é o seu cenário atual'];
              }
              return [];
            }
          }
        },
        // MELHORIA 4: Marcador visual do cenário atual
        annotation: {
          annotations: {
            linhaAtual: {
              type: 'line',
              xMin: horasUsuario,
              xMax: horasUsuario,
              borderColor: corPerigo,
              borderWidth: 3,
              borderDash: [6, 3],
              label: {
                display: true,
                content: '⬇ Você está aqui',
                position: 'start',
                backgroundColor: corPerigo,
                color: 'white',
                font: {
                  size: 11,
                  weight: 'bold'
                },
                padding: 6,
                borderRadius: 4
              }
            },
            // Linhas de referência para os limiares
            linha5anos: {
              type: 'line',
              yMin: 5,
              yMax: 5,
              borderColor: corSucesso,
              borderWidth: 1,
              borderDash: [3, 3],
              label: {
                display: true,
                content: '5 anos',
                position: 'end',
                backgroundColor: 'transparent',
                color: corSucesso,
                font: { size: 10 }
              }
            },
            linha8anos: {
              type: 'line',
              yMin: 8,
              yMax: 8,
              borderColor: corAviso,
              borderWidth: 1,
              borderDash: [3, 3],
              label: {
                display: true,
                content: '8 anos',
                position: 'end',
                backgroundColor: 'transparent',
                color: corAviso,
                font: { size: 10 }
              }
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Horas de uso por dia',
            font: {
              size: 12,
              weight: '600'
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.06)',
            drawBorder: false
          },
          ticks: {
            font: { size: 11 }
          }
        },
        y: {
          position: 'left',
          title: {
            display: true,
            text: 'Tempo de retorno (anos)',
            font: {
              size: 12,
              weight: '600'
            }
          },
          beginAtZero: true,
          max: 20, // Limitado a 20 anos para melhor visualização
          grid: {
            color: 'rgba(0, 0, 0, 0.06)',
            drawBorder: false
          },
          ticks: {
            font: { size: 11 },
            callback: function(value) {
              return value + ' anos';
            }
          }
        },
        // MELHORIA 5: Segundo eixo Y para economia
        y1: {
          position: 'right',
          title: {
            display: true,
            text: 'Economia anual (R$)',
            font: {
              size: 12,
              weight: '600'
            }
          },
          beginAtZero: true,
          grid: {
            drawOnChartArea: false, // Não desenha grid para evitar poluição
            drawBorder: false
          },
          ticks: {
            font: { size: 11 },
            callback: function(value) {
              return 'R$ ' + value.toFixed(0);
            }
          }
        }
      }
    },
    plugins: [pluginZonasColoridas] // Registra o plugin customizado
  });
}

// ============================================
// EXPORTAÇÃO PARA PDF
// ============================================

/**
 * Exporta os resultados para PDF
 */
function exportarParaPDF() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Relatório: Economia na Troca de Ar-Condicionado', 20, 20);
    
    // Data do relatório
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Gerado em: ${dataAtual}`, 20, 28);
    
    // Conteúdo
    doc.setFontSize(11);
    const textoResultados = elementos.output.textContent;
    
    // Quebra o texto em linhas para caber na página
    const linhas = doc.splitTextToSize(textoResultados, 170);
    doc.text(linhas, 20, 40);
    
    // Rodapé
    const totalPaginas = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(
        'Calculadora de Economia em Ar-Condicionado',
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Salva o PDF
    doc.save(`relatorio-ar-condicionado-${Date.now()}.pdf`);
    
  } catch (erro) {
    console.error('Erro ao exportar PDF:', erro);
    alert('Erro ao gerar PDF. Verifique se as bibliotecas necessárias foram carregadas.');
  }
}

// ============================================
// INICIALIZAÇÃO
// ============================================

/**
 * Inicializa a aplicação quando o DOM estiver pronto
 */
function inicializar() {
  // Carrega preferências e dados salvos
  carregarTema();
  carregarDadosFormulario();
  
  // Registra event listeners
  elementos.btnCalcular.addEventListener('click', calcularEconomia);
  elementos.btnExportarPdf.addEventListener('click', exportarParaPDF);
  elementos.btnToggleTema.addEventListener('click', alternarTema);
  elementos.btnResetData.addEventListener('click', resetarDados);
  
  // Auto-salvar dados ao alterar campos
  CAMPOS_FORMULARIO.forEach(campo => {
    const elemento = document.getElementById(campo);
    if (elemento) {
      elemento.addEventListener('change', salvarDadosFormulario);
    }
  });
  
  console.info('✅ Calculadora de Ar-Condicionado inicializada com sucesso!');
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}