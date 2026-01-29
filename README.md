# 🌡️ Calculadora de Economia em Ar-Condicionado

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

Aplicação web para calcular a economia financeira e o tempo de retorno (payback) ao trocar um ar-condicionado antigo por um modelo mais eficiente. Inclui análise detalhada considerando múltiplos fatores reais de uso.

## 🎯 Sobre o Projeto

Esta ferramenta foi desenvolvida para ajudar consumidores e profissionais a tomar decisões informadas sobre a troca de aparelhos de ar-condicionado, calculando com precisão:

- **Consumo energético real** de ambos os aparelhos
- **Economia anual** em kWh e em reais (R$)
- **Tempo de retorno do investimento** (payback)
- **Análise de sensibilidade** mostrando o impacto de diferentes padrões de uso

### 🧮 Metodologia de Cálculo

O cálculo considera diversos fatores que afetam o consumo real, indo além dos valores da etiqueta:

#### Fatores de Ajuste Aplicados

1. **Padrão de Uso**
   - Horas de uso por dia
   - Meses de uso por ano
   - Comparação com padrão Inmetro (2080h/ano)

2. **Condições Ambientais**
   - Temperatura externa (mínima e máxima)
   - Temperatura desejada (setpoint)
   - Delta T real vs. padrão Inmetro (8°C)

3. **Degradação por Idade** (aparelho antigo)
   - On-off: 4% ao ano após 2 anos
   - Inverter: 2% ao ano após 2 anos

4. **Estado de Manutenção** (aparelho antigo)
   - Limpeza pendente: +15% de consumo
   - Manutenção pendente: +10% de consumo

5. **Tecnologia**
   - Aparelhos on-off consomem ~45% mais que inverter equivalente

### 📊 Valores Padrão

A calculadora usa valores de consumo baseados no padrão Inmetro para diferentes capacidades e classes:

| Capacidade | Classe A | Classe C | Classe F |
|------------|----------|----------|----------|
| 9.000 BTU  | 350 kWh/ano | 650 kWh/ano | 1.100 kWh/ano |
| 12.000 BTU | 450 kWh/ano | 800 kWh/ano | 1.400 kWh/ano |
| 18.000 BTU | 700 kWh/ano | 1.200 kWh/ano | 2.200 kWh/ano |

*Valores para tecnologia inverter em condições padrão (35°C externa, 27°C interna, 2080h/ano)*

## ✨ Funcionalidades

- ✅ Cálculo detalhado de economia energética e financeira
- ✅ Análise de payback (tempo de retorno do investimento)
- ✅ Gráfico interativo de sensibilidade
- ✅ Suporte a diferentes tipos de etiqueta (nova/antiga)
- ✅ Consideração de degradação por idade do aparelho
- ✅ Impacto de limpeza e manutenção inadequadas
- ✅ Tema claro/escuro com persistência
- ✅ Salvamento automático dos dados
- ✅ Exportação de relatórios em PDF
- ✅ Interface responsiva para mobile e desktop
- ✅ Totalmente acessível (WCAG 2.1)

## 🚀 Tecnologias e Padrões

### Stack Técnico

- **HTML5**: Estrutura semântica e acessível
- **CSS3**: Design responsivo com CSS Variables e Grid/Flexbox
- **JavaScript (Vanilla ES6+)**: Lógica modular e bem documentada
- **Chart.js**: Visualização de dados interativa
- **jsPDF**: Geração de relatórios PDF

### Boas Práticas Implementadas

#### Frontend & UI/UX
- ✨ Design System com CSS Variables (design tokens)
- 🎨 Tema claro/escuro com transições suaves
- 📱 Mobile-first responsive design
- ♿ Acessibilidade (ARIA labels, roles, navegação por teclado)
- 🎯 Feedback visual claro (estados de loading, sucesso, erro)
- 💾 Persistência de dados com localStorage

#### Código & Arquitetura
- 📦 Código modular e bem organizado
- 📝 Comentários JSDoc e inline objetivos
- 🏷️ Nomenclatura clara e consistente (camelCase)
- 🔄 Separação de responsabilidades (SoC)
- 🛡️ Tratamento de erros robusto
- ⚡ Performance otimizada (lazy loading, event delegation)

#### Manutenibilidade
- 🎯 Constantes centralizadas e configuráveis
- 🧪 Funções puras e reutilizáveis
- 📚 Documentação inline completa
- 🔧 Fácil extensão e customização

## 📦 Estrutura do Projeto

```
calculadora-ar-condicionado/
├── index.html              # Página principal (HTML semântico)
├── css/
│   └── style.css          # Estilos (CSS Variables, responsive)
├── js/
│   └── script.js          # Lógica da aplicação (ES6+ modular)
├── assets/                # Recursos (imagens, ícones)
├── README.md              # Documentação completa
├── LICENSE                # Licença MIT
└── .gitignore            # Arquivos ignorados pelo Git
```

## 🌐 Como Usar

### Acesso Online

Acesse diretamente via GitHub Pages:
```
https://[seu-usuario].github.io/calculadora-ar-condicionado
```

### Uso Local

1. **Clone o repositório:**
```bash
git clone https://github.com/[seu-usuario]/calculadora-ar-condicionado.git
cd calculadora-ar-condicionado
```

2. **Abra o arquivo `index.html` em seu navegador:**
```bash
# macOS
open index.html

# Linux
xdg-open index.html

# Windows
start index.html
```

Ou use um servidor local (recomendado para desenvolvimento):
```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server

# VS Code - Live Server extension
# Clique com botão direito em index.html > "Open with Live Server"
```

### Passo a Passo de Uso

1. **Dados de Uso**: Preencha quantas horas por dia e meses por ano o aparelho é usado
2. **Condições Ambientais**: Informe as temperaturas externas e a temperatura desejada
3. **Aparelho Atual**: Especifique tipo, capacidade, classe e condições do aparelho antigo
4. **Aparelho Novo**: Defina as características do aparelho que pretende comprar
5. **Calcular**: Clique em "Calcular Economia" para ver os resultados
6. **Análise**: Confira os resultados detalhados e o gráfico de sensibilidade
7. **Exportar**: Opcionalmente, exporte um relatório em PDF

## 🎓 Exemplos de Uso

### Caso 1: Troca Vantajosa
- **Antigo**: On-off 12.000 BTU, 15 anos, classe D
- **Novo**: Inverter 12.000 BTU, classe A
- **Uso**: 8h/dia, 6 meses/ano
- **Resultado**: Payback de ~3 anos ✅ Recomendado

### Caso 2: Avaliar Melhor
- **Antigo**: Inverter 12.000 BTU, 5 anos, classe B
- **Novo**: Inverter 12.000 BTU, classe A
- **Uso**: 4h/dia, 4 meses/ano
- **Resultado**: Payback de ~10 anos ⚠️ Considere aguardar

### Caso 3: Impacto da Manutenção
- **Antigo**: On-off com limpeza e manutenção pendentes
- **Impacto**: Consumo aumentado em ~27%
- **Recomendação**: Fazer manutenção antes de decidir trocar

## 🛠️ Configuração para Desenvolvimento

### Pré-requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge)
- Editor de código (VS Code recomendado)
- Git

### Configuração do VS Code (Recomendado)

Extensões úteis:
- Live Server
- Prettier - Code Formatter
- ESLint
- HTML CSS Support

### Customização

Para ajustar cores, espaçamentos ou valores padrão, edite as CSS Variables em `css/style.css`:

```css
:root {
  --color-primary: #0056b3;        /* Cor principal */
  --spacing-md: 1rem;               /* Espaçamento médio */
  --font-size-base: 1rem;           /* Tamanho base da fonte */
  /* ... outras variáveis ... */
}
```

Para ajustar valores de consumo ou fatores, edite as constantes em `js/script.js`:

```javascript
const CONSUMO_PADRAO_ANUAL = {
  // Valores de consumo por tipo e capacidade
};

const FATORES_AJUSTE = {
  // Fatores de degradação, manutenção, etc.
};
```

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Diretrizes

- Mantenha o código limpo e bem documentado
- Siga os padrões de nomenclatura existentes
- Teste em diferentes navegadores e dispositivos
- Atualize a documentação conforme necessário

## 📝 Roadmap

Funcionalidades planejadas:

- [ ] Suporte a múltiplos aparelhos simultaneamente
- [ ] Comparação com dados históricos de consumo real
- [ ] Calculadora de BTUs necessários por ambiente
- [ ] Gráficos adicionais (consumo mensal, economia acumulada)
- [ ] Testes automatizados (Jest)
- [ ] PWA (Progressive Web App) com uso offline

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

A licença MIT permite:
- ✅ Uso comercial e privado
- ✅ Modificação e distribuição
- ✅ Sublicenciamento

**Requisito**: Manter o aviso de copyright e licença em cópias do software.

## ✍️ Autor

Desenvolvido com ❤️ e ☕

## 🙏 Agradecimentos

- Dados baseados nas normas do **Inmetro**
- Bibliotecas: **Chart.js** e **jsPDF**
- Comunidade open-source

---

## 📞 Suporte

Encontrou um bug ou tem uma sugestão?
- 🐛 [Abra uma issue](../../issues)
- 💡 [Inicie uma discussão](../../discussions)

---

⭐ **Se este projeto foi útil para você, considere dar uma estrela no repositório!**
