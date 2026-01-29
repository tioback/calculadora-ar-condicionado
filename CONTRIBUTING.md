# 🛠️ Guia do Desenvolvedor

## Visão Geral da Arquitetura

### Estrutura de Arquivos

```
calculadora-ar-condicionado/
│
├── index.html              # Entry point - HTML semântico
├── css/
│   └── style.css          # Estilos organizados com Design System
├── js/
│   └── script.js          # Lógica modular bem documentada
├── assets/                # Assets estáticos (vazio por enquanto)
├── README.md              # Documentação do usuário
├── CHANGELOG.md           # Histórico de melhorias
├── CONTRIBUTING.md        # Este arquivo
├── LICENSE                # MIT License
└── .gitignore            # Ignora arquivos do sistema
```

## 🎨 Sistema de Design (CSS)

### CSS Variables - Design Tokens

Todas as cores, espaçamentos e tamanhos estão centralizados em CSS Variables:

```css
:root {
  /* Cores */
  --color-primary: #0056b3;
  --color-success: #28a745;
  
  /* Espaçamentos */
  --spacing-sm: 0.75rem;
  --spacing-md: 1rem;
  
  /* Tipografia */
  --font-size-base: 1rem;
}
```

**Como usar:**
```css
.meu-componente {
  color: var(--color-primary);
  padding: var(--spacing-md);
  font-size: var(--font-size-base);
}
```

### Convenções de Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Cores | `--color-{tipo}-{variação}` | `--color-text-primary` |
| Espaçamentos | `--spacing-{tamanho}` | `--spacing-lg` |
| Tipografia | `--font-size-{tamanho}` | `--font-size-xl` |
| Sombras | `--shadow-{tamanho}` | `--shadow-md` |
| Raios | `--radius-{tamanho}` | `--radius-sm` |

### Tema Escuro

O tema escuro usa as mesmas variáveis, redefinidas no seletor `body.dark`:

```css
body.dark {
  --color-bg-primary: #1e1e1e;
  --color-text-primary: #e0e0e0;
  /* ... */
}
```

**Ativar tema:**
```javascript
document.body.classList.toggle('dark');
```

## 💻 Arquitetura JavaScript

### Organização do Código

O arquivo `script.js` está organizado em seções:

1. **Constantes e Configurações** - Valores fixos e configuráveis
2. **Utilitários** - Funções auxiliares reutilizáveis
3. **Elementos DOM** - Cache de referências
4. **Gerenciamento de Tema** - Lógica de alternância de tema
5. **Persistência** - LocalStorage
6. **Cálculos** - Lógica de negócio principal
7. **UI** - Geração de interface e feedback
8. **Gráficos** - Chart.js
9. **Inicialização** - Setup inicial

### Padrões de Código

#### Nomenclatura

```javascript
// Constantes - UPPER_SNAKE_CASE
const CONSUMO_PADRAO_ANUAL = { /* ... */ };

// Funções - camelCase com verbo
function calcularConsumoReal() { }
function obterDadosFormulario() { }
function gerarMensagemResultados() { }

// Variáveis - camelCase descritivo
const economiaAnual = 1500;
const temperaturaMedia = 28.5;
```

#### Documentação JSDoc

```javascript
/**
 * Descrição breve da função
 * @param {tipo} nomeParametro - Descrição do parâmetro
 * @returns {tipo} Descrição do retorno
 */
function minhaFuncao(nomeParametro) {
  // implementação
  return resultado;
}
```

#### Tratamento de Erros

```javascript
try {
  // código que pode falhar
  const resultado = operacaoArriscada();
} catch (erro) {
  console.error('Descrição do erro:', erro);
  // fallback ou feedback ao usuário
  mostrarMensagemErro('Algo deu errado');
}
```

### Constantes Configuráveis

Para ajustar valores padrão, edite as constantes no início do `script.js`:

```javascript
const CONSUMO_PADRAO_ANUAL = {
  inverter: {
    '9000': { A: 350, B: 500, C: 650, /* ... */ },
    // Adicione novas capacidades aqui
  }
};

const FATORES_AJUSTE = {
  DEGRADACAO_TAXA: {
    onoff: 0.04,    // 4% ao ano
    inverter: 0.02  // 2% ao ano
  },
  // Ajuste fatores aqui
};
```

## 🧪 Testando Mudanças

### Testes Manuais

Checklist antes de commit:

- [ ] Testar em Chrome, Firefox e Safari
- [ ] Testar em mobile (Chrome DevTools)
- [ ] Verificar tema claro e escuro
- [ ] Testar todos os campos do formulário
- [ ] Verificar persistência (recarregar página)
- [ ] Testar cálculo com valores extremos
- [ ] Verificar exportação de PDF
- [ ] Validar acessibilidade (navegação por teclado)
- [ ] Verificar responsividade em diferentes resoluções

### Ferramentas Úteis

- **Lighthouse** (Chrome DevTools) - Performance, acessibilidade, SEO
- **axe DevTools** - Testes de acessibilidade
- **Wave** - Validação WCAG
- **Responsive Viewer** - Testar múltiplas resoluções

## 📝 Adicionando Novas Features

### Exemplo: Adicionar Nova Capacidade de BTU

1. **Atualize a constante:**
```javascript
const CONSUMO_PADRAO_ANUAL = {
  inverter: {
    '24000': { A: 900, B: 1200, C: 1500, D: 1800, E: 2100, F: 2500 },
  }
};
```

2. **Teste o cálculo:**
```javascript
const consumo = obterConsumoPadraoAnual(24000, 'inverter', 'A');
console.log(consumo); // Deve retornar 900
```

3. **Documente no README:**
```markdown
| 24.000 BTU | 900 kWh/ano | 1.500 kWh/ano | 2.500 kWh/ano |
```

### Exemplo: Adicionar Novo Fator de Ajuste

1. **Adicione à constante:**
```javascript
const FATORES_AJUSTE = {
  // ... fatores existentes
  ISOLAMENTO_TERMICO: {
    bom: 0.9,      // -10% consumo
    medio: 1.0,    // padrão
    ruim: 1.15     // +15% consumo
  }
};
```

2. **Adicione campo no HTML:**
```html
<label for="isolamento">
  Isolamento térmico
  <select id="isolamento" name="isolamento">
    <option value="bom">Bom</option>
    <option value="medio" selected>Médio</option>
    <option value="ruim">Ruim</option>
  </select>
</label>
```

3. **Aplique no cálculo:**
```javascript
function calcularConsumoReal(prefixo, parametrosUso) {
  // ... código existente
  const isolamento = document.getElementById('isolamento').value;
  const fatorIsolamento = FATORES_AJUSTE.ISOLAMENTO_TERMICO[isolamento];
  
  return consumoAnual * /* ... */ * fatorIsolamento;
}
```

4. **Adicione ao salvamento:**
```javascript
const CAMPOS_FORMULARIO = [
  // ... campos existentes
  'isolamento'
];
```

## 🎨 Customização Visual

### Mudando Cores

Edite as CSS Variables em `:root`:

```css
:root {
  --color-primary: #007bff;      /* Azul Bootstrap */
  --color-success: #28a745;      /* Verde */
  --color-danger: #dc3545;       /* Vermelho */
  --color-warning: #ffc107;      /* Amarelo */
}
```

### Mudando Espaçamentos

```css
:root {
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
}
```

### Mudando Fontes

```css
body {
  font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
}

#output {
  font-family: 'Fira Code', 'Courier New', monospace;
}
```

## 🔧 Boas Práticas

### HTML

✅ **Fazer:**
- Usar elementos semânticos (`<header>`, `<main>`, `<section>`)
- Adicionar ARIA labels quando necessário
- Incluir `for` e `id` em labels e inputs
- Usar `required`, `min`, `max` para validação

❌ **Evitar:**
- Divs excessivos sem propósito semântico
- IDs duplicados
- Inputs sem labels
- Texto importante em placeholders

### CSS

✅ **Fazer:**
- Usar CSS Variables para valores reutilizáveis
- Aplicar mobile-first (media queries com `min-width`)
- Usar `rem` para tamanhos (escalável)
- Agrupar propriedades logicamente

❌ **Evitar:**
- Valores mágicos (use variáveis)
- !important (exceto casos extremos)
- IDs em seletores CSS (use classes)
- Especificidade excessiva

### JavaScript

✅ **Fazer:**
- Documentar funções com JSDoc
- Usar `const` por padrão, `let` quando necessário
- Validar inputs antes de processar
- Tratar erros com try/catch
- Cache referências DOM
- Nomear funções e variáveis claramente

❌ **Evitar:**
- Variáveis globais desnecessárias
- Funções longas (>50 linhas)
- Comentários óbvios
- Duplicação de código
- `var` (use `const`/`let`)
- Modificar `innerHTML` com dados não sanitizados

## 🚀 Deploy

### GitHub Pages

1. Faça push do código para o repositório
2. Acesse: Settings > Pages
3. Selecione branch `main` e pasta `/ (root)`
4. Salve e aguarde deploy
5. Acesse: `https://[usuario].github.io/[repositorio]`

### Outros Hosts

- **Netlify**: Arraste a pasta ou conecte ao Git
- **Vercel**: Conecte ao repositório GitHub
- **Surge**: `npm install -g surge && surge`

## 📚 Recursos Úteis

### Documentação
- [MDN Web Docs](https://developer.mozilla.org/)
- [CSS-Tricks](https://css-tricks.com/)
- [JavaScript.info](https://javascript.info/)
- [Chart.js Docs](https://www.chartjs.org/docs/)

### Ferramentas
- [Can I Use](https://caniuse.com/) - Compatibilidade de browsers
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [CSS Grid Generator](https://cssgrid-generator.netlify.app/)
- [Flexbox Playground](https://flexbox.tech/)

### Acessibilidade
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [A11y Project](https://www.a11yproject.com/)
- [WebAIM](https://webaim.org/)

## 🤝 Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes de contribuição.

## 💡 Dúvidas?

Abra uma [issue](../../issues) ou inicie uma [discussão](../../discussions)!

---

**Happy Coding! 🚀**
