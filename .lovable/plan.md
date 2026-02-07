
# Plano: Exportar Unidades Disponiveis para Excel

## O que sera feito

Adicionar um botao "Exportar Disponiveis" na aba de Unidades/Lotes do empreendimento que gera uma planilha Excel (.xlsx) contendo apenas as unidades com status "disponivel", ordenadas por Quadra/Bloco e Lote/Numero.

## Nome do arquivo

O arquivo tera o formato:
```text
Unidades_Disponiveis_[NOME_EMPREENDIMENTO]_[DD-MM-YYYY].xlsx
```
Exemplo: `Unidades_Disponiveis_LIVTY_07-02-2026.xlsx`

## Colunas da planilha

| Coluna | Origem |
|--------|--------|
| Quadra/Bloco | `unidade.bloco?.nome` |
| Lote/Numero | `unidade.numero` |
| Tipologia | `unidade.tipologia?.nome` |
| Area Privativa (m2) | `unidade.area_privativa` |
| Valor (R$) | `unidade.valor` |
| Posicao | `unidade.posicao` |
| Observacoes | `unidade.observacoes` |

## Ordenacao

Utilizara a funcao ja existente `ordenarUnidadesPorBlocoENumero` de `src/lib/unidadeUtils.ts`, que ordena por nome do bloco (natural sort) e depois por numero da unidade.

## Onde o botao sera adicionado

No componente `src/components/empreendimentos/UnidadesTab.tsx`, junto aos botoes de acao existentes (Importar Excel, Venda Historica, etc.). O botao aparecera apenas fora do modo de selecao, com icone de download.

## Arquivos a modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/empreendimentos/UnidadesTab.tsx` | Adicionar botao "Exportar Disponiveis" e funcao `handleExportarDisponiveis` |

Nenhum arquivo novo sera criado. A biblioteca `xlsx` ja esta instalada no projeto.

## Detalhes tecnicos

A funcao `handleExportarDisponiveis`:
1. Filtra `unidades` para apenas `status === 'disponivel'`
2. Ordena usando `ordenarUnidadesPorBlocoENumero`
3. Mapeia para array de objetos com colunas legais
4. Usa `XLSX.utils.json_to_sheet` para criar a planilha
5. Usa `XLSX.writeFile` para salvar com o nome contendo a data atual
6. Exibe toast de sucesso ou aviso se nao houver unidades disponiveis

Os labels das colunas se adaptam ao tipo do empreendimento (Quadra/Bloco, Lote/Numero).
