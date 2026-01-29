/**
 * ============================================
 * GERADOR DE PDF - HELPERS
 * ============================================
 * Funções auxiliares para desenhar seções do PDF
 */

import { PDF_CONFIG } from '../config/pdf-config.js';
import { formatarNumero } from '../utils/formatters.js';

/**
 * Desenha cabeçalho do PDF
 */
export function desenharCabecalho(doc, titulo, subtitulo, dataHora) {
  const { COLORS, FONTS, LAYOUT } = PDF_CONFIG;
  
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, LAYOUT.headerHeight, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(FONTS.title);
  doc.setFont('helvetica', 'bold');
  doc.text(titulo, LAYOUT.marginLeft, 15);
  
  doc.setFontSize(FONTS.subtitle);
  doc.text(subtitulo, LAYOUT.marginLeft, 23);
  
  doc.setFontSize(FONTS.small);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${dataHora}`, LAYOUT.marginLeft, 30);
}

/**
 * Desenha título de seção com linha
 */
export function desenharTituloSecao(doc, titulo, yPos) {
  const { COLORS, FONTS, LAYOUT, SPACING } = PDF_CONFIG;
  
  doc.setFontSize(FONTS.heading);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text(titulo, LAYOUT.marginLeft, yPos);
  
  const novoY = yPos + SPACING.afterHeading;
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(LAYOUT.marginLeft, novoY, LAYOUT.marginRight, novoY);
  
  return novoY + SPACING.afterLine;
}

/**
 * Desenha lista de items chave-valor
 */
export function desenharListaItems(doc, items, yPos) {
  const { COLORS, FONTS, LAYOUT, SPACING } = PDF_CONFIG;
  
  doc.setFontSize(FONTS.body);
  doc.setTextColor(...COLORS.text);
  
  items.forEach(([label, valor]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, LAYOUT.marginLeft, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(valor, LAYOUT.marginLeft + 70, yPos);
    yPos += SPACING.betweenItems;
  });
  
  return yPos;
}

/**
 * Desenha seção de aparelhos em duas colunas
 */
export function desenharAparelhosEmColunas(doc, dadosAntigo, dadosNovo, yPosInicial) {
  const { COLORS, FONTS, LAYOUT, SPACING } = PDF_CONFIG;
  const larguraColuna = (LAYOUT.marginWidth - LAYOUT.columnGap) / 2;
  const coluna1X = LAYOUT.marginLeft;
  const coluna2X = LAYOUT.marginLeft + larguraColuna + LAYOUT.columnGap;
  
  // Coluna 1: Aparelho Antigo
  let yPos = yPosInicial + 5;
  doc.setFontSize(FONTS.subheading);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.text);
  doc.text('Aparelho Atual (Antigo)', coluna1X, yPos);
  
  yPos += SPACING.betweenItems;
  doc.setFontSize(FONTS.small);
  doc.setFont('helvetica', 'normal');
  
  dadosAntigo.forEach(([label, valor]) => {
    const linha = `${label} ${valor}`;
    const linhasQuebradas = doc.splitTextToSize(linha, larguraColuna - 4);
    doc.text(linhasQuebradas, coluna1X + 2, yPos);
    yPos += SPACING.columnItemHeight;
  });
  
  // Coluna 2: Aparelho Novo
  yPos = yPosInicial + 5;
  doc.setFontSize(FONTS.subheading);
  doc.setFont('helvetica', 'bold');
  doc.text('Aparelho Novo (a comprar)', coluna2X, yPos);
  
  yPos += SPACING.betweenItems;
  doc.setFontSize(FONTS.small);
  doc.setFont('helvetica', 'normal');
  
  dadosNovo.forEach(([label, valor]) => {
    const linha = `${label} ${valor}`;
    const linhasQuebradas = doc.splitTextToSize(linha, larguraColuna - 4);
    doc.text(linhasQuebradas, coluna2X + 2, yPos);
    yPos += SPACING.columnItemHeight;
  });
  
  return yPosInicial + 42;
}

/**
 * Desenha box de resultados
 */
export function desenharBoxResultados(doc, yPos) {
  const { COLORS, LAYOUT, SPACING } = PDF_CONFIG;
  
  doc.setFillColor(...COLORS.background);
  doc.roundedRect(
    LAYOUT.marginLeft - LAYOUT.boxPadding,
    yPos - LAYOUT.boxPadding,
    LAYOUT.marginWidth + (LAYOUT.boxPadding * 2),
    SPACING.resultBoxHeight,
    2, 2, 'F'
  );
  
  return yPos;
}

/**
 * Desenha fatores de ajuste em duas colunas
 */
export function desenharFatoresAjuste(doc, fatores, yPos) {
  const { COLORS, FONTS, LAYOUT, SPACING } = PDF_CONFIG;
  const larguraColuna = (LAYOUT.marginWidth - LAYOUT.columnGap) / 2;
  const coluna1X = LAYOUT.marginLeft + 2;
  const coluna2X = LAYOUT.marginLeft + larguraColuna + LAYOUT.columnGap;
  const metade = Math.ceil(fatores.length / 2);
  
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);
  
  const yPosInicial = yPos;
  
  // Coluna 1
  for (let i = 0; i < metade; i++) {
    doc.text(fatores[i], coluna1X, yPos);
    yPos += SPACING.columnItemHeight;
  }
  
  // Coluna 2
  yPos = yPosInicial;
  for (let i = metade; i < fatores.length; i++) {
    doc.text(fatores[i], coluna2X, yPos);
    yPos += SPACING.columnItemHeight;
  }
  
  return yPosInicial + (metade * SPACING.columnItemHeight) + 3;
}

/**
 * Desenha rodapé
 */
export function desenharRodape(doc, numeroPagina, totalPaginas) {
  const { COLORS, FONTS, LAYOUT } = PDF_CONFIG;
  
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.3);
  doc.line(LAYOUT.marginLeft, LAYOUT.footerY, LAYOUT.marginRight, LAYOUT.footerY);
  
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textLight);
  doc.text('Calculadora de Economia em Ar-Condicionado', 105, LAYOUT.footerTextY, { align: 'center' });
  doc.text(`Página ${numeroPagina} de ${totalPaginas}`, LAYOUT.marginRight, LAYOUT.footerTextY, { align: 'right' });
}

/**
 * Extrai valores do output HTML usando regex
 */
export function extrairValoresOutput(outputText) {
  return {
    fatorHoras: outputText.match(/Fator de horas de uso:\s*([\d,\.]+)x\s*\(([^)]+)\)/),
    deltaTReal: outputText.match(/Delta T real:\s*([\d,\.]+)°C\s*\(([^)]+)\)/),
    fatorDeltaT: outputText.match(/Fator delta T:\s*([\d,\.]+)x\s*\(([^)]+)\)/),
    fatorTemp: outputText.match(/Fator temperatura externa:\s*([\d,\.]+)x/)?.[1],
    fatorDegradacao: outputText.match(/Fator degradação \(idade\):\s*([\d,\.]+)x\s*\(([^)]+)\)/),
    fatorManutencao: outputText.match(/Fator manutenção:\s*([\d,\.]+)x\s*\(([^)]+)\)/),
    consumoAntigo: outputText.match(/Aparelho atual \(antigo\):\s*([\d\.]+) kWh\/ano/)?.[1],
    consumoNovo: outputText.match(/Aparelho novo:\s*([\d\.]+) kWh\/ano/)?.[1],
    economia: outputText.match(/Economia anual:\s*([\d\.,]+)\s*kWh\s*\(R\$\s*([\d\.,]+)\)/),
    payback: outputText.match(/Payback:\s*([\d,\.]+|>50 anos \(não compensa\)|>50)\s*anos/)?.[1]
  };
}
