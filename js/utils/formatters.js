/**
 * ============================================
 * UTILITÁRIOS GERAIS
 * ============================================
 */

import { CONSUMO_PADRAO_ANUAL, FATORES_AJUSTE } from '../config/constants.js';

/**
 * Formata número com separador de milhares
 */
export function formatarNumero(valor) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
}

/**
 * Formata valor monetário
 */
export function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

/**
 * Obtém o consumo padrão anual baseado em BTU, tipo e classe
 */
export function obterConsumoPadraoAnual(btu, tipo, classe) {
  const btuPadrao = String(Math.round(btu / 1000) * 1000);
  let consumoBase = CONSUMO_PADRAO_ANUAL.inverter[btuPadrao]?.[classe] 
    || CONSUMO_PADRAO_ANUAL.inverter[btuPadrao]?.C 
    || 1000;
  
  if (tipo === 'onoff') {
    consumoBase *= FATORES_AJUSTE.ONOFF_MULTIPLICADOR;
  }
  
  return consumoBase;
}

/**
 * Padroniza consumo informado para kWh/ano
 */
export function padronizarConsumo(consumo, unidade) {
  if (!consumo) return null;
  
  const fatorConversao = {
    'kwh-ano': 1,
    'kwh-mes': 12,
    'w-mes': 12 / 1000
  };
  
  return consumo * (fatorConversao[unidade] || 1);
}

/**
 * Gera timestamp formatado para nomes de arquivo
 */
export function gerarTimestamp() {
  return new Date().toISOString().slice(0, 19).replace(/:/g, '-');
}
