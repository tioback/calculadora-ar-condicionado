/**
 * ============================================
 * CONFIGURAÇÕES DE PDF
 * ============================================
 * Centraliza todas as configurações de layout e estilo do PDF
 */

export const PDF_CONFIG = {
  // Cores padrão
  COLORS: {
    primary: [0, 86, 179],
    success: [40, 167, 69],
    warning: [255, 193, 7],
    danger: [220, 53, 69],
    text: [33, 37, 41],
    textLight: [108, 117, 125],
    background: [240, 248, 255],
    line: [200, 200, 200]
  },

  // Margens e espaçamentos
  LAYOUT: {
    marginLeft: 20,
    marginRight: 190,
    get marginWidth() { return this.marginRight - 20; },
    headerHeight: 35,
    sectionSpacing: 8,
    lineSpacing: 6,
    subSectionSpacing: 5,
    columnGap: 4,
    boxPadding: 3,
    footerY: 280,
    footerTextY: 285
  },

  // Tamanhos de fonte
  FONTS: {
    title: 20,
    subtitle: 16,
    heading: 14,
    subheading: 11,
    body: 10,
    small: 9,
    tiny: 8
  },

  // Espaçamentos específicos
  SPACING: {
    afterHeader: 45,
    afterHeading: 5,
    afterLine: 8,
    betweenItems: 6,
    betweenSubItems: 4,
    columnItemHeight: 4.5,
    resultBoxHeight: 100
  },

  // Página 2 (landscape)
  PAGE2: {
    headerHeight: 25,
    graphMargin: 20,
    graphWidth: 257,
    graphHeight: 150,
    graphY: 35,
    footerY: 195,
    footerTextY: 200
  }
};

/**
 * Helper para criar configuração de texto
 */
export class TextConfig {
  constructor(text, fontSize, fontStyle = 'normal', color = PDF_CONFIG.COLORS.text) {
    this.text = text;
    this.fontSize = fontSize;
    this.fontStyle = fontStyle;
    this.color = color;
  }
}

/**
 * Helper para gerenciar posição Y no PDF
 */
export class YPositionManager {
  constructor(initialY) {
    this.y = initialY;
  }

  advance(amount) {
    this.y += amount;
    return this.y;
  }

  set(newY) {
    this.y = newY;
    return this.y;
  }

  get current() {
    return this.y;
  }
}
