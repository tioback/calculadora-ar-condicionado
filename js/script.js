const defaultsConsumo = {
  inverter: {
    '9000': { A: 350, B: 500, C: 650, D: 800, E: 950, F: 1100 },
    '12000': { A: 450, B: 600, C: 800, D: 1000, E: 1200, F: 1400 },
    '18000': { A: 700, B: 900, C: 1200, D: 1500, E: 1800, F: 2200 },
  },
  onoff: {} // Será calculado como inverter * 1.45
};

function getDefaultAnual(btu, tipo, classe) {
  const key = Math.round(btu / 1000) * 1000 + ''; // arredonda para 9000,12000,18000
  let base = defaultsConsumo[tipo]?.[key]?.[classe] || defaultsConsumo[tipo]?.[key]?.C || 1000;
  if (tipo === 'onoff') base *= 1.45; // ajuste para antigo
  return base;
}

function padronizarAnual(consumo, unidade, etiqueta) {
  if (!consumo) return null;
  if (unidade === 'ano') return consumo;
  return consumo * 12; // mensal -> anual (aproximação conservadora)
}

function calcular() {
  const output = document.getElementById('output');
  output.innerHTML = '';

  // Uso
  const horasDia = parseFloat(document.getElementById('horasDia').value) || 8;
  const mesesAno = parseFloat(document.getElementById('mesesAno').value) || 6;
  const horasAno = horasDia * 30 * mesesAno; // aprox 30 dias/mês
  const fatorHoras = horasAno / 2080;
  const tempMedia = (parseFloat(document.getElementById('tempMin').value) + parseFloat(document.getElementById('tempMax').value)) / 2 || 32;
  const fatorTemp = 1 - 0.015 * (35 - tempMedia); // ~1.5% por °C abaixo de 35

  const precoKwh = parseFloat(document.getElementById('precoKwh').value) || 0.90;
  const custoNovo = parseFloat(document.getElementById('custoNovo').value) || 5000;

  // Função para aparelho
  function getConsumoReal(idPrefix) {
    const tipo = document.getElementById(`tipo${idPrefix}`).value;
    const etiqueta = document.getElementById(`etiqueta${idPrefix}`).value;
    const btu = parseInt(document.getElementById(`btu${idPrefix}`).value) || 12000;
    const classe = document.getElementById(`classe${idPrefix}`).value;
    let consumoInput = parseFloat(document.getElementById(`consumo${idPrefix}`).value);
    const unidade = document.getElementById(`unidade${idPrefix}`).value;

    let anualEtiqueta = padronizarAnual(consumoInput, unidade, etiqueta);
    if (!anualEtiqueta) anualEtiqueta = getDefaultAnual(btu, tipo, classe);

    return anualEtiqueta * fatorHoras * fatorTemp;
  }

  const consumoAntigoReal = getConsumoReal('Antigo');
  const consumoNovoReal = getConsumoReal('Novo');

  const economiaAnoKwh = consumoAntigoReal - consumoNovoReal;
  const economiaAnoReais = economiaAnoKwh * precoKwh;
  const payback = economiaAnoReais > 0 ? custoNovo / economiaAnoReais : Infinity;

  // Output
  let msg = `Fator uso (horas): ${fatorHoras.toFixed(2)}\n`;
  msg += `Fator temp externa: ${fatorTemp.toFixed(2)}\n`;
  msg += `Consumo anual estimado antigo: ${consumoAntigoReal.toFixed(0)} kWh\n`;
  msg += `Consumo anual estimado novo: ${consumoNovoReal.toFixed(0)} kWh\n`;
  msg += `Economia anual: ${economiaAnoKwh.toFixed(0)} kWh (${economiaAnoReais.toFixed(2)} R$)\n`;
  msg += `Payback: ${payback === Infinity ? '>50' : payback.toFixed(1)} anos\n`;
  if (payback < 5) msg += 'Troca recomendada em curto prazo.\n';
  else if (payback > 8) msg += 'Pode valer esperar promoção.\n';

  output.textContent = msg;

  // Gráfico simples: payback vs horas/dia (4 a 12)
  const ctx = document.getElementById('graficoPayback').getContext('2d');
  const labels = Array.from({length: 9}, (_, i) => 4 + i);
  const data = labels.map(h => {
    const hAno = h * 30 * mesesAno / 2080 * fatorTemp;
    const eco = (consumoAntigoReal / fatorHoras / fatorTemp - consumoNovoReal / fatorHoras / fatorTemp) * hAno * precoKwh;
    return eco > 0 ? custoNovo / eco : 50;
  });
  new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: 'Payback (anos)', data, borderColor: 'blue' }] },
    options: { scales: { y: { beginAtZero: true } } }
  });

  // Salvar local
  localStorage.setItem('calcData', JSON.stringify({
    horasDia, mesesAno, tempMin: document.getElementById('tempMin').value, tempMax: document.getElementById('tempMax').value,
    // ... adicione outros se quiser
  }));
}

// Load saved
window.onload = () => {
  const saved = JSON.parse(localStorage.getItem('calcData'));
  if (saved) {
    document.getElementById('horasDia').value = saved.horasDia;
    // etc.
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
  doc.text('Relatório Calculadora Ar-Condicionado', 10, 10);
  doc.text(document.getElementById('output').textContent, 10, 20);
  doc.save('relatorio-ar.pdf');
});