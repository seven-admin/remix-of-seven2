
# Plano de Correção: PDF em Branco na Exportação de Contratos

## Problema Identificado

Ao exportar o contrato CONT-00027_TESTE_MICHEL para PDF, o arquivo é gerado mas vem **completamente em branco**.

### Causa Raiz

O código em `ExportarPdfDialog.tsx` cria um container HTML e o posiciona **fora da tela** (`left: -9999px`) antes de passar para o `html2pdf.js`. Isso causa um problema conhecido com a biblioteca `html2canvas` (usada internamente pelo html2pdf) que **não consegue renderizar corretamente elementos invisíveis ou fora da área visível** em alguns navegadores.

Comparando com o `GerarPdfButton.tsx` do simulador (que funciona corretamente):
- **Simulador**: Cria o elemento e passa diretamente para `html2pdf()` sem adicionar ao DOM
- **Contratos**: Adiciona ao DOM com `position: absolute; left: -9999px` ← **CAUSA DO PROBLEMA**

### Código Problemático (linhas 178-184):

```typescript
container.style.position = 'absolute';
container.style.left = '-9999px';  // ← PROBLEMA: Fora da área visível
container.style.top = '0';
container.style.width = tamanho === 'a4' ? '210mm' : '216mm';
container.style.background = 'white';
document.body.appendChild(container);
```

---

## Solução

Modificar a abordagem para **NÃO adicionar o elemento ao DOM** antes de processar, seguindo o padrão do `GerarPdfButton.tsx` que funciona corretamente.

### Alteração no Arquivo

**Arquivo:** `src/components/contratos/ExportarPdfDialog.tsx`

#### Mudanças:

1. **Remover** a adição do container ao DOM antes do processamento
2. **Configurar** as opções do html2canvas para renderizar o elemento corretamente mesmo sem estar no DOM
3. **Adicionar** opção `onclone` do html2canvas para aplicar estilos adequados durante a renderização

### Código Corrigido:

```typescript
// Create a container with proper styling
const container = document.createElement('div');
container.style.width = tamanho === 'a4' ? '210mm' : '216mm';
container.style.background = 'white';
container.innerHTML = `
  <style>
    body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 12pt; line-height: 1.6; color: #333; }
    h1 { font-size: 18pt; font-weight: bold; margin-bottom: 12pt; }
    h2 { font-size: 16pt; font-weight: bold; margin-bottom: 10pt; }
    h3 { font-size: 14pt; font-weight: bold; margin-bottom: 8pt; }
    p { margin-bottom: 8pt; text-align: justify; }
    table { width: 100%; border-collapse: collapse; margin: 12pt 0; }
    th, td { border: 1px solid #ccc; padding: 8pt; text-align: left; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .page-break { page-break-after: always; }
    img { max-width: 100%; height: auto; }
  </style>
  <div style="padding: ${margens}mm; background: white; color: #333;">
    ${conteudoSanitizado}
    ${carimboHtml}
  </div>
`;

const opt = {
  margin: parseInt(margens),
  filename: `${fileName}.pdf`,
  image: { type: 'jpeg' as const, quality: 0.98 },
  html2canvas: { 
    scale: 2,
    useCORS: true,
    allowTaint: true,
    letterRendering: true,
    logging: false,
    backgroundColor: '#ffffff',
    // Força renderização com dimensões corretas
    width: tamanho === 'a4' ? 794 : 816,  // 210mm ou 216mm em pixels @96dpi
    windowWidth: tamanho === 'a4' ? 794 : 816,
  },
  jsPDF: { 
    unit: 'mm' as const, 
    format: tamanho, 
    orientation: orientacao,
  },
  pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
};

// NÃO adicionar ao DOM - passar diretamente
await html2pdf().set(opt).from(container).save();

toast.success('PDF gerado com sucesso!');
onOpenChange(false);
```

---

## Resumo das Alterações

| Arquivo | Modificação |
|---------|-------------|
| `src/components/contratos/ExportarPdfDialog.tsx` | Remover appendChild/removeChild do DOM e posicionamento fora da tela. Passar o container diretamente para html2pdf() sem anexar ao DOM. Adicionar configurações de width/windowWidth no html2canvas. |

---

## Detalhes Técnicos

### Por que html2canvas falha com elementos fora da tela?

A biblioteca `html2canvas` funciona capturando o estado visual de um elemento DOM. Quando um elemento está posicionado com `left: -9999px`:

1. O navegador pode otimizar e não renderizar o elemento (está fora do viewport)
2. O canvas gerado pode ter dimensões incorretas ou ser transparente
3. Em alguns navegadores/versões, o elemento pode ter "computed styles" zerados

### A solução do Simulador

O `GerarPdfButton.tsx` **não adiciona o elemento ao DOM** - ele cria um elemento "virtual" e passa diretamente para `html2pdf()`. A biblioteca consegue processar elementos não anexados ao DOM porque ela clona internamente o conteúdo antes de renderizar.

### Cálculo de Dimensões

Para garantir renderização correta:
- **A4**: 210mm de largura = ~794px @96dpi
- **Letter**: 216mm de largura = ~816px @96dpi

---

## Critérios de Aceite

1. Ao clicar em "Exportar PDF" no contrato CONT-00027, o PDF é gerado com conteúdo visível
2. O conteúdo do contrato (texto, tabelas, formatação) aparece corretamente no PDF
3. O carimbo de autenticidade digital (se habilitado) aparece no final do documento
4. As opções de tamanho (A4/Letter), orientação e margens continuam funcionando
5. Não há erros no console durante a geração

---

## Teste Recomendado

Após a correção:
1. Abrir o contrato CONT-00027_TESTE_MICHEL
2. Clicar em "Exportar PDF"
3. Manter as configurações padrão (A4, Retrato, 20mm de margem)
4. Clicar em "Gerar PDF"
5. Verificar que o PDF contém todo o conteúdo do contrato
