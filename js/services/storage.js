/**
 * ============================================
 * GERENCIAMENTO DE ARMAZENAMENTO LOCAL
 * ============================================
 */

import { TEMAS, CAMPOS_FORMULARIO, VALORES_PADRAO } from '../config/constants.js';

/**
 * Salva dados do formulário no localStorage
 */
export function salvarDadosFormulario() {
  const dados = {};
  CAMPOS_FORMULARIO.forEach(campo => {
    const elemento = document.getElementById(campo);
    if (elemento) {
      dados[campo] = elemento.value;
    }
  });
  localStorage.setItem(TEMAS.DADOS_KEY, JSON.stringify(dados));
}

/**
 * Carrega dados do formulário do localStorage
 */
export function carregarDadosFormulario() {
  try {
    const dadosSalvos = localStorage.getItem(TEMAS.DADOS_KEY);
    if (dadosSalvos) {
      const dados = JSON.parse(dadosSalvos);
      CAMPOS_FORMULARIO.forEach(campo => {
        const elemento = document.getElementById(campo);
        if (elemento && dados[campo] !== undefined) {
          elemento.value = dados[campo];
        }
      });
    }
  } catch (erro) {
    console.warn('Erro ao carregar dados salvos:', erro);
  }
}

/**
 * Reseta dados do formulário para valores padrão
 */
export function resetarDadosFormulario() {
  if (confirm('Deseja realmente limpar todos os dados e restaurar os valores padrão?')) {
    Object.entries(VALORES_PADRAO).forEach(([campo, valor]) => {
      const elemento = document.getElementById(campo);
      if (elemento) {
        elemento.value = valor;
      }
    });
    
    localStorage.removeItem(TEMAS.DADOS_KEY);
    
    const output = document.getElementById('output');
    if (output) {
      output.innerHTML = '<p class="info">✨ Dados resetados! Clique em "Calcular Economia" para ver os resultados.</p>';
    }
    
    const btnExportarPdf = document.getElementById('exportarPdf');
    if (btnExportarPdf) {
      btnExportarPdf.disabled = true;
    }
  }
}

/**
 * Salva tema preferido
 */
export function salvarTema(tema) {
  localStorage.setItem(TEMAS.STORAGE_KEY, tema);
}

/**
 * Carrega tema preferido
 */
export function carregarTema() {
  const temaSalvo = localStorage.getItem(TEMAS.STORAGE_KEY);
  if (temaSalvo === TEMAS.DARK) {
    document.documentElement.setAttribute('data-theme', TEMAS.DARK);
  }
  return temaSalvo || TEMAS.LIGHT;
}
