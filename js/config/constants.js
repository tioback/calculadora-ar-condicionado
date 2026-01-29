/**
 * ============================================
 * CONSTANTES DE CONFIGURAÇÃO
 * ============================================
 * Centraliza todas as constantes e valores de configuração
 */

export const CONSUMO_PADRAO_ANUAL = {
  inverter: {
    '9000': { A: 350, B: 500, C: 650, D: 800, E: 950, F: 1100 },
    '12000': { A: 450, B: 600, C: 800, D: 1000, E: 1200, F: 1400 },
    '18000': { A: 700, B: 900, C: 1200, D: 1500, E: 1800, F: 2200 },
  },
  onoff: {}
};

export const FATORES_AJUSTE = {
  DEGRADACAO_TAXA: {
    onoff: 0.04,
    inverter: 0.02
  },
  LIMPEZA_PENDENTE: 1.15,
  MANUTENCAO_PENDENTE: 1.10,
  ONOFF_MULTIPLICADOR: 1.45,
  TESTE_INMETRO: {
    TEMP_EXTERNA: 35,
    TEMP_INTERNA: 27,
    HORAS_ANO: 2080,
    DELTA_T: 8
  }
};

export const LIMIARES_PAYBACK = {
  CURTO_PRAZO: 5,
  LONGO_PRAZO: 8
};

export const VALORES_PADRAO = {
  horasDia: 8,
  mesesAno: 6,
  area: 15,
  tempMin: 25,
  tempMax: 35,
  setpoint: 24,
  precoKwh: 0.90,
  btuAntigo: 12000,
  tipoAntigo: 'onoff',
  classeAntigo: '',
  idadeAntigo: 10,
  limpezaAntigo: 'emdia',
  manutencaoAntigo: 'emdia',
  btuNovo: 12000,
  tipoNovo: 'inverter',
  classeNovo: 'A',
  custoNovo: 5000
};

export const CAMPOS_FORMULARIO = [
  'horasDia', 'mesesAno', 'area', 'tempMin', 'tempMax', 'setpoint', 'precoKwh',
  'btuAntigo', 'tipoAntigo', 'classeAntigo', 'idadeAntigo', 'limpezaAntigo', 'manutencaoAntigo',
  'btuNovo', 'tipoNovo', 'classeNovo', 'custoNovo'
];

export const TEMAS = {
  LIGHT: 'light',
  DARK: 'dark',
  STORAGE_KEY: 'tema-preferido',
  DADOS_KEY: 'calculadora-dados'
};
