/**
 * ============================================
 * GERADOR DE GRÁFICOS
 * ============================================
 */

import { FATORES_AJUSTE, LIMIARES_PAYBACK } from '../config/constants.js';
import { formatarMoeda } from '../utils/formatters.js';

/**
 * Gera gráfico de análise de sensibilidade
 */
export function gerarGraficoSensibilidade(resultados, graficoAtual, canvas) {
  const { consumoAntigo, consumoNovo, fatores, precoKwh, custoNovo } = resultados;
  
  if (graficoAtual) {
    graficoAtual.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  const horasUsuario = fatores.horasDia;
  
  // Range dinâmico
  const horasMin = Math.max(1, Math.floor(horasUsuario * 0.5));
  const horasMax = Math.min(20, Math.ceil(horasUsuario * 1.8));
  const numPontos = 10;
  const step = (horasMax - horasMin) / (numPontos - 1);
  
  const horasPorDia = [];
  for (let i = 0; i < numPontos; i++) {
    horasPorDia.push(Number((horasMin + step * i).toFixed(1)));
  }
  
  // Calcula dados
  const dadosPayback = [];
  const dadosEconomia = [];
  
  horasPorDia.forEach(horas => {
    const horasAno = horas * 30 * fatores.mesesAno;
    const fatorHorasAjustado = horasAno / FATORES_AJUSTE.TESTE_INMETRO.HORAS_ANO;
    
    const consumoAntigoBase = consumoAntigo / fatores.fatorHoras;
    const consumoNovoBase = consumoNovo / fatores.fatorHoras;
    
    const consumoAntigoAjustado = consumoAntigoBase * fatorHorasAjustado;
    const consumoNovoAjustado = consumoNovoBase * fatorHorasAjustado;
    
    const economiaKwh = consumoAntigoAjustado - consumoNovoAjustado;
    const economiaReais = economiaKwh * precoKwh;
    
    let payback = economiaReais > 0 ? custoNovo / economiaReais : null;
    if (payback !== null && payback > 25) {
      payback = null;
    }
    
    dadosPayback.push(payback);
    dadosEconomia.push(economiaReais > 0 ? economiaReais : 0);
  });
  
  // Cores do tema
  const corPrimaria = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary').trim() || '#0056b3';
  const corSucesso = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-success').trim() || '#28a745';
  const corAviso = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-warning').trim() || '#ffc107';
  const corPerigo = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-danger').trim() || '#dc3545';
  
  // Plugin para zonas coloridas
  const pluginZonasColoridas = {
    id: 'zonasColoridas',
    beforeDraw: (chart) => {
      const { ctx, chartArea, scales } = chart;
      if (!chartArea) return;
      
      const yScale = scales.y;
      const xLeft = chartArea.left;
      const xRight = chartArea.right;
      
      const y5 = yScale.getPixelForValue(5);
      const yBottom = chartArea.bottom;
      ctx.fillStyle = 'rgba(40, 167, 69, 0.08)';
      ctx.fillRect(xLeft, y5, xRight - xLeft, yBottom - y5);
      
      const y8 = yScale.getPixelForValue(8);
      ctx.fillStyle = 'rgba(255, 193, 7, 0.08)';
      ctx.fillRect(xLeft, y8, xRight - xLeft, y5 - y8);
      
      const yTop = chartArea.top;
      ctx.fillStyle = 'rgba(220, 53, 69, 0.08)';
      ctx.fillRect(xLeft, yTop, xRight - xLeft, y8 - yTop);
    }
  };
  
  // Detectar se é mobile
  const isMobile = window.innerWidth <= 768;
  const isSmallMobile = window.innerWidth <= 480;
  
  // Configuração do gráfico
  const novoGrafico = new Chart(ctx, {
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
          pointRadius: isMobile ? 3 : 5,
          pointHoverRadius: isMobile ? 6 : 8,
          borderWidth: isMobile ? 2 : 3,
          yAxisID: 'y',
          spanGaps: false
        },
        {
          label: 'Economia anual (R$)',
          data: dadosEconomia,
          borderColor: corSucesso,
          backgroundColor: corSucesso.replace('rgb', 'rgba').replace(')', ', 0.1)'),
          fill: false,
          tension: 0.3,
          pointRadius: isMobile ? 2 : 4,
          pointHoverRadius: isMobile ? 5 : 7,
          borderWidth: isMobile ? 1.5 : 2,
          borderDash: [5, 5],
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        zonasColoridas: pluginZonasColoridas,
        legend: {
          display: true,
          position: isMobile ? 'bottom' : 'top',
          labels: {
            padding: isMobile ? 8 : 15,
            usePointStyle: true,
            font: { size: isSmallMobile ? 10 : (isMobile ? 11 : 12) },
            boxWidth: isSmallMobile ? 30 : 40
          }
        },
        title: {
          display: !isSmallMobile,
          text: 'Análise de Sensibilidade: Impacto das Horas de Uso',
          font: {
            size: isMobile ? 13 : 15,
            weight: '600'
          },
          padding: {
            top: isMobile ? 5 : 10,
            bottom: isMobile ? 8 : 15
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: isMobile ? 10 : 12,
          titleFont: { size: isSmallMobile ? 11 : (isMobile ? 12 : 13), weight: 'bold' },
          bodyFont: { size: isSmallMobile ? 10 : (isMobile ? 11 : 12) },
          bodySpacing: isMobile ? 4 : 6,
          callbacks: {
            title: (context) => `${context[0].label}h de uso por dia`,
            label: (context) => {
              const datasetLabel = context.dataset.label;
              const valor = context.parsed.y;
              
              if (datasetLabel.includes('Payback')) {
                if (valor === null) return 'Payback: Não compensa (>25 anos)';
                
                let emoji = '';
                let recomendacao = '';
                if (valor < LIMIARES_PAYBACK.CURTO_PRAZO) {
                  emoji = '✅';
                  recomendacao = ' - Excelente!';
                } else if (valor > LIMIARES_PAYBACK.LONGO_PRAZO) {
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
              const horas = parseFloat(context[0].label);
              if (Math.abs(horas - horasUsuario) < 0.5) {
                return ['', '👉 Este é o seu cenário atual'];
              }
              return [];
            }
          }
        },
        annotation: {
          annotations: {
            linhaAtual: {
              type: 'line',
              xMin: horasUsuario,
              xMax: horasUsuario,
              borderColor: corPerigo,
              borderWidth: isMobile ? 2 : 3,
              borderDash: [6, 3],
              label: {
                display: !isSmallMobile,
                content: '⬇ Você está aqui',
                position: 'start',
                backgroundColor: corPerigo,
                color: 'white',
                font: { size: isMobile ? 9 : 11, weight: 'bold' },
                padding: isMobile ? 4 : 6,
                borderRadius: 4
              }
            },
            linha5anos: {
              type: 'line',
              yMin: LIMIARES_PAYBACK.CURTO_PRAZO,
              yMax: LIMIARES_PAYBACK.CURTO_PRAZO,
              borderColor: corSucesso,
              borderWidth: 1,
              borderDash: [3, 3],
              label: {
                display: !isMobile,
                content: '5 anos',
                position: 'end',
                backgroundColor: 'transparent',
                color: corSucesso,
                font: { size: 10 }
              }
            },
            linha8anos: {
              type: 'line',
              yMin: LIMIARES_PAYBACK.LONGO_PRAZO,
              yMax: LIMIARES_PAYBACK.LONGO_PRAZO,
              borderColor: corAviso,
              borderWidth: 1,
              borderDash: [3, 3],
              label: {
                display: !isMobile,
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
            display: !isSmallMobile,
            text: 'Horas de uso por dia',
            font: { size: isMobile ? 10 : 12, weight: '600' }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.06)',
            drawBorder: false
          },
          ticks: { 
            font: { size: isSmallMobile ? 9 : (isMobile ? 10 : 11) },
            maxRotation: isMobile ? 45 : 0,
            minRotation: isMobile ? 45 : 0
          }
        },
        y: {
          position: 'left',
          title: {
            display: !isSmallMobile,
            text: isMobile ? 'Payback (anos)' : 'Tempo de retorno (anos)',
            font: { size: isMobile ? 10 : 12, weight: '600' }
          },
          beginAtZero: true,
          max: 20,
          grid: {
            color: 'rgba(0, 0, 0, 0.06)',
            drawBorder: false
          },
          ticks: {
            font: { size: isSmallMobile ? 9 : (isMobile ? 10 : 11) },
            callback: (value) => value + (isMobile ? 'a' : ' anos')
          }
        },
        y1: {
          position: 'right',
          title: {
            display: false
          },
          beginAtZero: true,
          grid: {
            drawOnChartArea: false,
            drawBorder: false
          },
          ticks: {
            font: { size: isSmallMobile ? 9 : (isMobile ? 10 : 11) },
            callback: (value) => isMobile ? 'R$' + (value/1000).toFixed(0) + 'k' : 'R$ ' + value.toFixed(0)
          }
        }
      }
    },
    plugins: [pluginZonasColoridas]
  });
  
  return novoGrafico;
}
