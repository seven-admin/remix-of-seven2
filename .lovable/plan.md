

# Plano: Editar Status de Unidades em Lote

## Objetivo

Adicionar um novo modo de selecao em lote na aba de Unidades/Lotes para permitir alterar o status de multiplas unidades de uma vez.

## Contexto Atual

A aba de Unidades (`UnidadesTab.tsx`) ja possui dois modos de selecao em lote:
- **Venda Historica** (`selectionMode === 'venda'`): seleciona unidades disponiveis para registrar vendas passadas
- **Excluir em Lote** (`selectionMode === 'delete'`): seleciona unidades para exclusao

O novo modo seguira o mesmo padrao visual e de interacao.

## Alteracoes

### 1. Criar hook para atualizar status em lote

**Arquivo:** `src/hooks/useUnidades.ts`

Adicionar novo hook `useUpdateUnidadesStatusBatch`:

```typescript
export function useUpdateUnidadesStatusBatch() {
  return useMutation({
    mutationFn: async ({ ids, empreendimentoId, status }) => {
      const { error } = await supabase
        .from('unidades')
        .update({ status })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: (_, { empreendimentoId, ids, status }) => {
      // Invalidar queries relevantes
      toast.success(`Status de ${ids.length} unidade(s) atualizado!`);
    },
  });
}
```

### 2. Criar dialog de selecao de status

**Novo arquivo:** `src/components/empreendimentos/AlterarStatusLoteDialog.tsx`

Dialog simples seguindo o padrao existente (`AcaoEmLoteDialog`):
- Exibe quantas unidades foram selecionadas
- Permite selecionar o novo status via Select com todas as opcoes (Disponivel, Reservada, Em Negociacao, Em Contrato, Vendida, Bloqueada)
- Exibe preview visual com a cor do status selecionado
- Botao de confirmar com loading state

### 3. Adicionar modo de selecao "status" na UnidadesTab

**Arquivo:** `src/components/empreendimentos/UnidadesTab.tsx`

Alteracoes:
- Expandir `selectionMode` de `'venda' | 'delete' | false` para `'venda' | 'delete' | 'status' | false`
- Adicionar botao "Alterar Status" na barra de acoes (fora do modo de selecao)
- No modo `status`: permitir selecionar qualquer unidade (sem restricao por status atual)
- Exibir barra de acoes com botao "Alterar Status (N)" que abre o dialog
- Mensagem de instrucao: "Clique nas unidades cujo status deseja alterar."

## Fluxo do Usuario

```text
1. Clica em "Alterar Status" na barra de acoes
2. Entra no modo de selecao (visual identico ao de exclusao)
3. Clica nas unidades desejadas (todas clicaveis, independente do status)
4. Clica no botao "Alterar Status (N)"
5. Dialog abre com Select de status
6. Seleciona novo status e confirma
7. Unidades sao atualizadas e a interface reflete as mudancas
```

## Resumo de Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useUnidades.ts` | Adicionar hook `useUpdateUnidadesStatusBatch` |
| `src/components/empreendimentos/AlterarStatusLoteDialog.tsx` | Novo dialog para selecao de status |
| `src/components/empreendimentos/UnidadesTab.tsx` | Adicionar modo de selecao `status` e botao na toolbar |

## Detalhes Tecnicos

- O tipo `selectionMode` sera expandido para incluir `'status'`
- O dialog usara os mesmos `UNIDADE_STATUS_LABELS` e `UNIDADE_STATUS_COLORS` ja existentes em `empreendimentos.types.ts`
- Nenhuma alteracao no banco de dados e necessaria - a coluna `status` ja existe com o enum correto
- As queries invalidadas apos a atualizacao incluem: `unidades`, `empreendimento` e `empreendimentos` (para atualizar contagens nos cards)

