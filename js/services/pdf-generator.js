/**
 * ============================================
 * GERADOR DE PDF PRINCIPAL
 * ============================================
 */

import { PDF_CONFIG, YPositionManager } from '../config/pdf-config.js';
import { formatarNumero, gerarTimestamp } from '../utils/formatters.js';
import {
  desenharCabecalho,
  desenharTituloSecao,
  desenharListaItems,
  desenharAparelhosEmColunas,
  desenharBoxResultados,
  desenharFatoresAjuste,
  desenharRodape,
  extrairValoresOutput
} from './pdf-helpers.js';

/**
 * Exporta os resultados para PDF profissional
 */
export function exportarParaPDF(graficoAtual) {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const { COLORS, FONTS, LAYOUT, SPACING } = PDF_CONFIG;
    
    // Gerenciador de posição Y
    const yManager = new YPositionManager(SPACING.afterHeader);
    
    // ===== CABEÇALHO =====
    const dataAtual = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    desenharCabecalho(doc, 'Relatório de Análise', 'Economia na Troca de Ar-Condicionado', dataAtual);
    
    doc.setTextColor(...COLORS.text);
    
    // ===== PARÂMETROS DE USO =====
    yManager.set(desenharTituloSecao(doc, 'Parâmetros de Uso', yManager.current));
    
    const parametros = [
      ['Horas de uso por dia:', document.getElementById('horasDia').value + ' h'],
      ['Meses de uso por ano:', document.getElementById('mesesAno').value + ' meses'],
      ['Área do ambiente:', document.getElementById('area').value + ' m²'],
      ['Temperatura externa média:', 
        `${((parseFloat(document.getElementById('tempMin').value) + parseFloat(document.getElementById('tempMax').value)) / 2).toFixed(1)} °C`],
      ['Temperatura desejada:', document.getElementById('setpoint').value + ' °C'],
      ['Preço da energia:', 'R$ ' + parseFloat(document.getElementById('precoKwh').value).toFixed(2) + '/kWh']
    ];
    
    yManager.set(desenharListaItems(doc, parametros, yManager.current));
    yManager.advance(4);
    
    // ===== APARELHOS COMPARADOS =====
    yManager.set(desenharTituloSecao(doc, 'Aparelhos Comparados', yManager.current));
    
    const dadosAntigo = [
      ['Tipo:', document.getElementById('tipoAntigo').value === 'onoff' ? 'On-Off' : 'Inverter'],
      ['Capacidade:', document.getElementById('btuAntigo').value + ' BTU/h'],
      ['Classe energética:', document.getElementById('classeAntigo').value || 'Não informado'],
      ['Idade:', document.getElementById('idadeAntigo').value + ' anos'],
      ['Limpeza:', document.getElementById('limpezaAntigo').value === 'emdia' ? 'Em dia' : 'Pendente'],
      ['Manutenção:', document.getElementById('manutencaoAntigo').value === 'emdia' ? 'Em dia' : 'Pendente']
    ];
    
    const dadosNovo = [
      ['Tipo:', document.getElementById('tipoNovo').value === 'onoff' ? 'On-Off' : 'Inverter'],
      ['Capacidade:', document.getElementById('btuNovo').value + ' BTU/h'],
      ['Classe energética:', document.getElementById('classeNovo').value || 'Não informado'],
      ['Custo:', 'R$ ' + parseFloat(document.getElementById('custoNovo').value).toFixed(2)]
    ];
    
    yManager.set(desenharAparelhosEmColunas(doc, dadosAntigo, dadosNovo, yManager.current));
    
    // ===== RESULTADOS DA ANÁLISE =====
    const outputText = document.getElementById('output').textContent;
    const valores = extrairValoresOutput(outputText);
    
    yManager.set(desenharBoxResultados(doc, yManager.current));
    
    doc.setFontSize(FONTS.heading);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.primary);
    doc.text('Resultados da Análise', LAYOUT.marginLeft, yManager.advance(3));
    yManager.advance(10);
    
    // === Fatores de Ajuste ===
    doc.setFontSize(FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text('Fatores de Ajuste Aplicados', LAYOUT.marginLeft, yManager.current);
    yManager.advance(6);
    
    const fatores = [];
    if (valores.fatorHoras) {
      const info = valores.fatorHoras[2] || '';
      fatores.push(`Fator de horas: ${valores.fatorHoras[1]}x (${info})`);
    }
    if (valores.deltaTReal) {
      const info = valores.deltaTReal[2] || '';
      fatores.push(`Delta T real: ${valores.deltaTReal[1]} °C (${info})`);
    }
    if (valores.fatorDeltaT) {
      const info = valores.fatorDeltaT[2] || '';
      fatores.push(`Fator delta T: ${valores.fatorDeltaT[1]}x (${info})`);
    }
    if (valores.fatorTemp) fatores.push(`Fator temperatura: ${valores.fatorTemp}x`);
    if (valores.fatorDegradacao) {
      const info = valores.fatorDegradacao[2] || '';
      fatores.push(`Fator degradacao: ${valores.fatorDegradacao[1]}x (${info})`);
    }
    if (valores.fatorManutencao) {
      const info = valores.fatorManutencao[2] || '';
      fatores.push(`Fator manutencao: ${valores.fatorManutencao[1]}x (${info})`);
    }
    
    yManager.set(desenharFatoresAjuste(doc, fatores, yManager.current));
    
    // === Consumo Energético ===
    doc.setFontSize(FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.text('Consumo Energético Anual', LAYOUT.marginLeft, yManager.current);
    yManager.advance(5);
    
    doc.setFontSize(FONTS.small);
    doc.setFont('helvetica', 'normal');
    if (valores.consumoAntigo) {
      doc.text(`Aparelho atual: ${formatarNumero(parseFloat(valores.consumoAntigo))} kWh/ano`, LAYOUT.marginLeft + 2, yManager.current);
      yManager.advance(4);
    }
    if (valores.consumoNovo) {
      doc.text(`Aparelho novo: ${formatarNumero(parseFloat(valores.consumoNovo))} kWh/ano`, LAYOUT.marginLeft + 2, yManager.current);
      yManager.advance(4);
    }
    yManager.advance(3);
    
    // === Economia Estimada ===
    doc.setFontSize(FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text('Economia Estimada', LAYOUT.marginLeft, yManager.current);
    yManager.advance(5);
    
    if (valores.economia) {
      doc.setFontSize(FONTS.small);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.success);
      const economiaKwh = valores.economia[1].replace(',', '');
      const economiaReais = valores.economia[2];
      doc.text(`Economia anual: ${economiaKwh} kWh (R$ ${economiaReais})`, LAYOUT.marginLeft + 2, yManager.current);
      yManager.advance(5);
    }
    
    if (valores.payback) {
      let payback = valores.payback;
      let cor = COLORS.text;
      let simbolo = '';
      
      if (payback.includes('não compensa') || payback === '>50') {
        cor = COLORS.danger;
        simbolo = '- ';
        payback = '>50';
      } else {
        const paybackNum = parseFloat(payback.replace(',', '.'));
        if (paybackNum > 8) {
          cor = COLORS.danger;
          simbolo = '- ';
        } else if (paybackNum < 5) {
          cor = COLORS.success;
          simbolo = '+ ';
        }
      }
      
      doc.setTextColor(...cor);
      doc.text(`${simbolo}Payback: ${payback} anos`, LAYOUT.marginLeft + 2, yManager.current);
      yManager.advance(7);
    }
    
    // === Recomendação ===
    doc.setFontSize(FONTS.subheading);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.text);
    doc.text('Recomendação', LAYOUT.marginLeft, yManager.current);
    yManager.advance(6);
    
    doc.setFontSize(FONTS.small);
    doc.setFont('helvetica', 'bold');
    
    let recomendacao = '';
    let corRec = COLORS.text;
    
    if (valores.payback) {
      const pb = valores.payback;
      if (pb === '>50' || pb.includes('não compensa') || parseFloat(pb.replace(',', '.')) > 8) {
        recomendacao = 'Considere aguardar. Pode valer esperar uma promoção ou aumento na tarifa de energia.';
        corRec = COLORS.warning;
      } else if (parseFloat(pb.replace(',', '.')) < 5) {
        recomendacao = 'Troca recomendada em curto prazo. O investimento se paga rapidamente.';
        corRec = COLORS.success;
      } else {
        recomendacao = 'Investimento razoável. Payback moderado, avalie seu orçamento.';
      }
    }
    
    doc.setTextColor(...corRec);
    const linhasRec = doc.splitTextToSize(recomendacao, LAYOUT.marginWidth - 4);
    doc.text(linhasRec, LAYOUT.marginLeft + 2, yManager.current);
    yManager.advance(linhasRec.length * 3 + 4);
    
    // === Disclaimer ===
    doc.setFontSize(FONTS.tiny);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...COLORS.textLight);
    const disclaimer = 'Nota: Estimativas sujeitas a variação de +/-15 a 30% devido a aproximações e condições reais de uso.';
    const linhasDisclaimer = doc.splitTextToSize(disclaimer, LAYOUT.marginWidth - 4);
    doc.text(linhasDisclaimer, LAYOUT.marginLeft + 2, yManager.current);
    
    // ===== RODAPÉ PÁGINA 1 =====
    desenharRodape(doc, 1, 2);
    
    // ===== PÁGINA 2: GRÁFICO =====
    gerarPagina2Grafico(doc, graficoAtual);
    
    // Salva o PDF
    doc.save(`relatorio-ar-condicionado-${gerarTimestamp()}.pdf`);
    console.info('PDF gerado com sucesso!');
    
  } catch (erro) {
    console.error('Erro ao exportar PDF:', erro);
    alert('Erro ao gerar PDF. Verifique se as bibliotecas necessárias foram carregadas.');
  }
}

/**
 * Gera página 2 com o gráfico em landscape
 */
function gerarPagina2Grafico(doc, graficoAtual) {
  const { COLORS, FONTS, PAGE2 } = PDF_CONFIG;
  
  doc.addPage('a4', 'landscape');
  
  // Cabeçalho
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 297, PAGE2.headerHeight, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(FONTS.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.text('Análise de Sensibilidade', 20, 12);
  
  doc.setFontSize(FONTS.subheading);
  doc.setFont('helvetica', 'normal');
  doc.text('Impacto das horas de uso diário no tempo de retorno', 20, 19);
  
  // Gráfico
  if (graficoAtual) {
    try {
      const canvas = document.getElementById('graficoSensibilidade');
      const canvasImg = canvas.toDataURL('image/png', 1.0);
      doc.addImage(canvasImg, 'PNG', PAGE2.graphMargin, PAGE2.graphY, PAGE2.graphWidth, PAGE2.graphHeight);
    } catch (e) {
      console.warn('Não foi possível incluir gráfico no PDF:', e);
      doc.setTextColor(...COLORS.textLight);
      doc.setFontSize(FONTS.body);
      doc.text('Gráfico não disponível', 148.5, 105, { align: 'center' });
    }
  }
  
  // Rodapé
  doc.setDrawColor(...COLORS.line);
  doc.setLineWidth(0.3);
  doc.line(20, PAGE2.footerY, 277, PAGE2.footerY);
  
  doc.setFontSize(FONTS.tiny);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.textLight);
  doc.text('Calculadora de Economia em Ar-Condicionado', 148.5, PAGE2.footerTextY, { align: 'center' });
  doc.text('Página 2 de 2', 277, PAGE2.footerTextY, { align: 'right' });
}
