const defaultsConsumo = {
  inverter: {
    '9000': { A: 350, B: 500, C: 650, D: 800, E: 950, F: 1100 },
    '12000': { A: 450, B: 600, C: 800, D: 1000, E: 1200, F: 1400 },
    '18000': { A: 700, B: 900, C: 1200, D: 1500, E: 1800, F: 2200 },
  },
  onoff: {} // Calculado como inverter * 1.45
};

function getDefaultAnual(btu, tipo, classe) {
  const key = Math.round(btu / 1000) * 1000 + '';
  let base = defaultsConsumo[tipo]?.[key]?.[classe] || defaultsConsumo[tipo]?.[key]?.C || 1000;
  if (tipo === 'onoff') base *= 1.45;
  return base;
}

function padronizarAnual(consumo, unidade) {
  if (!consumo) return null;
  return unidade === 'ano' ? consumo : consumo * 12;
}

function calcular() {
  const output = document.getElementById('output');
  output.innerHTML = '';

  const horasDia = parseFloat(document.getElementById('horasDia').value) || 8;
  const mesesAno = parseFloat(document.getElementById('mesesAno').value) || 6;
  const horasAno = horasDia * 30 * mesesAno;
  const fatorHoras = horasAno / 2080;
  const tempMedia = (parseFloat(document.getElementById('tempMin').value) + parseFloat(document.getElementById('tempMax').value)) / 2 || 32;
  const fatorTemp = Math.max(0.5, 1 - 0.015 * (35 - tempMedia)); // Limite mínimo para evitar negativo

  const precoKwh = parseFloat(document.getElementById('precoKwh').value) || 0.90;
  const custoNovo = parseFloat(document.getElementById('custoNovo').value) || 5000;

  function getConsumoReal(prefix) {
    const tipo = document.getElementById(`tipo${prefix}`).value;
    const btu = parseInt(document.getElementById(`btu${prefix}`).value) || 12000;
    const classe = document.getElementById(`classe${prefix}`).value;
    const consumoInput = parseFloat(document.getElementById(`consumo${prefix}`).value);
    const unidade = document.getElementById(`unidade${prefix}`).value;
    let anual = padronizarAnual(consumoInput, unidade);
    if (!anual) anual = getDefaultAnual(btu, tipo, classe);

    let fatorDegradacao = 1;
    if (prefix === 'Antigo') {
        const idade = parseFloat(document.getElementById('idadeAntigo').value) || 10;
        const taxa = tipo === 'onoff' ? 0.04 : 0.02; // 4% on-off, 2% inverter por ano após 2 anos
        fatorDegradacao = idade > 2 ? 1 + (idade - 2) * taxa : 1;

        const limpeza = document.getElementById('limpezaAntigo').value;
        const manutencao = document.getElementById('manutencaoAntigo').value;
        const fatorLimpeza = limpeza === 'pendente' ? 1.15 : 1.0;
        const fatorManutencao = manutencao === 'pendente' ? 1.10 : 1.0;
        const fatorExtra = fatorLimpeza * fatorManutencao;
    }

    return anual * fatorHoras * fatorTemp * fatorDegradacao * fatorExtra;
}

  const consumoAntigo = getConsumoReal('Antigo');
  const consumoNovo = getConsumoReal('Novo');
  const fatorDegradacaoAntigo = consumoAntigo / (consumoAntigo / fatorDegradacao); // não precisa recalcular, mas para exibir

  const economiaKwh = consumoAntigo - consumoNovo;
  const economiaReais = economiaKwh * precoKwh;
  const payback = economiaReais > 0 ? custoNovo / economiaReais : Infinity;

  let msg = `Fator horas: ${fatorHoras.toFixed(2)} (uso ${fatorHoras > 1 ? 'mais intenso' : 'menos intenso'} que padrão Inmetro)\n`;
  msg += `Fator temperatura: ${fatorTemp.toFixed(2)}\n\n`;
  msg += `Fator degradação aplicado ao antigo: ${fatorDegradacao.toFixed(2)} (idade ${idadeAntigo} anos, tipo ${tipoAntigo})\n`;
  msg += `Fator extra (limpeza/manutenção): ${fatorExtra.toFixed(2)}\n`;
  if (fatorExtra > 1.0) {
    msg += `  Nota: Limpeza/manutenção pendente inflacionando o consumo em ${(fatorExtra - 1) * 100}%\n`;
  }
  msg += `<strong>Consumo anual estimado antigo: ${consumoAntigo.toFixed(0)} kWh</strong>\n`;
  msg += `<strong>Consumo anual estimado novo: ${consumoNovo.toFixed(0)} kWh</strong>\n\n`;
  msg += `<strong class="success">Economia anual: ${economiaKwh.toFixed(0)} kWh (${economiaReais.toFixed(2)} R$)</strong>\n`;
  msg += `<strong class="${payback < 5 ? 'success' : payback > 8 ? 'high' : ''}">Payback: ${payback === Infinity ? '>50' : payback.toFixed(1)} anos</strong>\n`;

  if (payback < 5) msg += '\nTroca recomendada em curto prazo.';
  else if (payback > 8) msg += '\nPode valer esperar promoção ou tarifa mais alta.';

  output.innerHTML = msg;

  // Gráfico aprimorado
  const ctx = document.getElementById('graficoPayback').getContext('2d');
  const labels = Array.from({length: 9}, (_, i) => 4 + i);
  const data = labels.map(h => {
    const hAno = h * 30 * mesesAno / 2080 * fatorTemp;
    const eco = (consumoAntigo / fatorHoras / fatorTemp - consumoNovo / fatorHoras / fatorTemp) * hAno * precoKwh;
    return eco > 0 ? custoNovo / eco : 50;
  });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{ label: 'Payback (anos)', data, borderColor: '#0056b3', backgroundColor: 'rgba(0,86,179,0.2)', fill: true }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, position: 'top' },
        title: { display: true, text: 'Sensibilidade: Payback vs Horas de Uso Diário' }
      },
      scales: {
        x: { title: { display: true, text: 'Horas/dia' } },
        y: { title: { display: true, text: 'Anos para retorno' }, beginAtZero: true }
      }
    }
  });

  // Salvar
  localStorage.setItem('calcData', JSON.stringify({ 
    horasDia, 
    mesesAno, 
    area: document.getElementById('area').value, 
    tempMin: document.getElementById('tempMin').value, 
    tempMax: document.getElementById('tempMax').value, 
    precoKwh, 
    custoNovo,
    idadeAntigo: document.getElementById('idadeAntigo').value,
    limpezaAntigo: document.getElementById('limpezaAntigo').value,
    manutencaoAntigo: document.getElementById('manutencaoAntigo').value
  }));
}

window.onload = () => {
  const saved = JSON.parse(localStorage.getItem('calcData'));
  if (saved) {
    document.getElementById('horasDia').value = saved.horasDia;
    document.getElementById('mesesAno').value = saved.mesesAno;
    document.getElementById('area').value = saved.area;
    document.getElementById('tempMin').value = saved.tempMin;
    document.getElementById('tempMax').value = saved.tempMax;
    document.getElementById('precoKwh').value = saved.precoKwh;
    document.getElementById('custoNovo').value = saved.custoNovo;
    document.getElementById('idadeAntigo').value = saved.idadeAntigo || 10;
    document.getElementById('limpezaAntigo').value = saved.limpezaAntigo || 'emdia';
    document.getElementById('manutencaoAntigo').value = saved.manutencaoAntigo || 'emdia';
  }
  if (localStorage.getItem('darkMode') === 'true') document.body.classList.add('dark');
};

document.getElementById('calcular').addEventListener('click', calcular);
document.getElementById('toggleTheme').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
});

document.getElementById('exportPdf').addEventListener('click', () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Relatório: Economia em Ar-Condicionado', 20, 20);
  doc.setFontSize(12);
  doc.text(document.getElementById('output').textContent, 20, 40);
  doc.save('economia-ar-condicionado.pdf');
});