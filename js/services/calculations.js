/**
 * ============================================
 * LÓGICA DE CÁLCULOS
 * ============================================
 */

import { FATORES_AJUSTE } from '../config/constants.js';
import { obterConsumoPadraoAnual, padronizarConsumo } from '../utils/formatters.js';

/**
 * Calcula fatores de ajuste baseados no uso real
 */
export function calcularFatoresAjuste() {
  const horasDia = parseFloat(document.getElementById('horasDia').value) || 8;
  const mesesAno = parseFloat(document.getElementById('mesesAno').value) || 6;
  const tempMin = parseFloat(document.getElementById('tempMin').value) || 25;
  const tempMax = parseFloat(document.getElementById('tempMax').value) || 35;
  const setpoint = parseFloat(document.getElementById('setpoint').value) || 24;
  
  const tempMediaExterna = (tempMin + tempMax) / 2;
  const deltaTReal = tempMediaExterna - setpoint;
  const horasAno = horasDia * 30 * mesesAno;
  
  const fatorHoras = horasAno / FATORES_AJUSTE.TESTE_INMETRO.HORAS_ANO;
  const fatorDeltaT = deltaTReal / FATORES_AJUSTE.TESTE_INMETRO.DELTA_T;
  const fatorTemperatura = Math.max(0.5, Math.min(1.5, 
    1 + (tempMediaExterna - FATORES_AJUSTE.TESTE_INMETRO.TEMP_EXTERNA) * 0.015
  ));
  
  return {
    horasDia,
    mesesAno,
    tempMediaExterna,
    setpoint,
    deltaTReal,
    fatorHoras,
    fatorDeltaT,
    fatorTemperatura
  };
}

/**
 * Calcula consumo real ajustado
 */
export function calcularConsumoReal(prefixo, fatores) {
  const btu = parseFloat(document.getElementById(`btu${prefixo}`).value) || 12000;
  const tipo = document.getElementById(`tipo${prefixo}`).value;
  const classe = document.getElementById(`classe${prefixo}`).value || 'C';
  
  let consumoBase = obterConsumoPadraoAnual(btu, tipo, classe);
  
  let consumoAjustado = consumoBase * 
    fatores.fatorHoras * 
    fatores.fatorDeltaT * 
    fatores.fatorTemperatura;
  
  if (prefixo === 'Antigo') {
    const idade = parseFloat(document.getElementById('idadeAntigo').value) || 0;
    const limpeza = document.getElementById('limpezaAntigo').value;
    const manutencao = document.getElementById('manutencaoAntigo').value;
    
    if (idade > 2) {
      const taxaDegradacao = FATORES_AJUSTE.DEGRADACAO_TAXA[tipo] || 0.04;
      const fatorDegradacao = 1 + (idade - 2) * taxaDegradacao;
      consumoAjustado *= fatorDegradacao;
    }
    
    if (limpeza === 'pendente') {
      consumoAjustado *= FATORES_AJUSTE.LIMPEZA_PENDENTE;
    }
    
    if (manutencao === 'pendente') {
      consumoAjustado *= FATORES_AJUSTE.MANUTENCAO_PENDENTE;
    }
  }
  
  return consumoAjustado;
}

/**
 * Calcula economia e payback
 */
export function calcularEconomiaEPayback(consumoAntigo, consumoNovo) {
  const precoKwh = parseFloat(document.getElementById('precoKwh').value) || 0.90;
  const custoNovo = parseFloat(document.getElementById('custoNovo').value) || 5000;
  
  const economiaKwh = consumoAntigo - consumoNovo;
  const economiaReais = economiaKwh * precoKwh;
  const payback = economiaReais > 0 ? custoNovo / economiaReais : Infinity;
  
  return { economiaKwh, economiaReais, payback, precoKwh, custoNovo };
}

/**
 * Obtém dados detalhados do aparelho antigo
 */
export function obterDadosAparelhoAntigo() {
  const idade = parseFloat(document.getElementById('idadeAntigo').value) || 0;
  const tipo = document.getElementById('tipoAntigo').value;
  const limpeza = document.getElementById('limpezaAntigo').value;
  const manutencao = document.getElementById('manutencaoAntigo').value;
  
  const fatorDegradacao = idade > 2 
    ? 1 + (idade - 2) * FATORES_AJUSTE.DEGRADACAO_TAXA[tipo]
    : 1;
  
  const fatorLimpeza = limpeza === 'pendente' ? FATORES_AJUSTE.LIMPEZA_PENDENTE : 1.0;
  const fatorManut = manutencao === 'pendente' ? FATORES_AJUSTE.MANUTENCAO_PENDENTE : 1.0;
  const fatorManutencao = fatorLimpeza * fatorManut;
  
  return { idade, tipo, fatorDegradacao, fatorManutencao };
}
