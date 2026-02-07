

# Plano: Trocar Exportacao de Unidades Disponiveis de Excel para PDF

## O que sera feito

Substituir a funcao `handleExportarDisponiveis` atual (que gera .xlsx) por uma versao que gera um arquivo PDF contendo a tabela de unidades disponiveis. O botao na interface permanece no mesmo lugar, apenas muda o formato de saida.

## Nome do arquivo

```text
Unidades_Disponiveis_[NOME_EMPREENDIMENTO]_[DD-MM-YYYY].pdf
```
Exemplo: `Unidades_Disponiveis_LIVTY_07-02-2026.pdf`

## Conteudo do PDF

O PDF contera:
- Titulo: "Unidades Disponiveis - [NOME DO EMPREENDIMENTO]"
- Data de geracao
- Tabela com as colunas:

| Coluna | Origem |
|--------|--------|
| Quadra/Bloco | `unidade.bloco?.nome` |
| Lote/Numero | `unidade.numero` |
| Tipologia | `unidade.tipologia?.nome` |
| Area Privativa (m2) | `unidade.area_privativa` |
| Valor (R$) | `unidade.valor` (formatado como moeda) |
| Posicao | `unidade.posicao` |
| Observacoes | `unidade.observacoes` |

- Rodape com total de unidades disponiveis

## Ordenacao

Mesma logica atual: `ordenarUnidadesPorBlocoENumero` (ordena por bloco com natural sort, depois por numero).

## Detalhes tecnicos

### Arquivo a modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/empreendimentos/UnidadesTab.tsx` | Reescrever `handleExportarDisponiveis` para gerar PDF em vez de Excel |

### Mudancas no codigo

1. **Remover** importacao do `xlsx` (`import * as XLSX from 'xlsx'`)
2. **Adicionar** importacao do `html2pdf` (ja instalado no projeto, usado em `ExportarPdfDialog.tsx`)
3. **Reescrever** `handleExportarDisponiveis`:
   - Filtra e ordena unidades disponiveis (sem mudanca)
   - Constroi um HTML com titulo, data e tabela estilizada
   - Formata valores monetarios com `toLocaleString('pt-BR')`
   - Usa `html2pdf.js` para gerar o PDF diretamente (sem dialog intermediario)
   - Configuracao: A4, retrato, margens de 15mm, escala 2
4. **Trocar** icone do botao de `Download` para `FileText` (indicar PDF)
5. **Atualizar** texto do botao para "Exportar Disponiveis (PDF)"

### Estilo da tabela no PDF

- Cabecalho com fundo cinza claro e texto em negrito
- Bordas em todas as celulas
- Linhas alternadas com fundo levemente diferente para facilitar leitura
- Fonte 10pt para caber mais dados na pagina
- Valores monetarios alinhados a direita

A geracao e instantanea (um clique), sem necessidade de dialog de configuracao.

