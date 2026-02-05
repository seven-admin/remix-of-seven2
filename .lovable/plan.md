
# Plano: Preencher Total de Lotes Automaticamente na Importação

## Problema Identificado

Quando a importação de unidades via Excel cria novos blocos/quadras automaticamente, o campo `unidades_por_andar` (que exibe "Total Lotes" na tabela) fica vazio porque:

1. A função `useCreateBlocoSilent` (linha 102-118 de `useBlocos.ts`) só recebe `{ nome: m.valorExcel }` na importação
2. O `ImportarUnidadesDialog` (linha 332-335) não conta quantas unidades pertencem a cada bloco criado

## Solução Proposta

Após a importação das unidades ser concluída, **atualizar o campo `unidades_por_andar` de cada bloco** com a contagem real de unidades vinculadas a ele.

### Abordagem: Pós-processamento após importação

Após inserir/atualizar as unidades, calcular a contagem de lotes por quadra e atualizar os blocos correspondentes.

## Alterações

### 1. Criar hook para atualizar contagem de lotes

**Arquivo:** `src/hooks/useBlocos.ts`

Adicionar novo hook:

```typescript
export function useAtualizarContagemBlocos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (empreendimentoId: string) => {
      // Buscar todos os blocos do empreendimento
      const { data: blocos, error: blocosError } = await supabase
        .from('blocos')
        .select('id')
        .eq('empreendimento_id', empreendimentoId)
        .eq('is_active', true);

      if (blocosError) throw blocosError;
      if (!blocos || blocos.length === 0) return;

      // Para cada bloco, contar unidades e atualizar
      for (const bloco of blocos) {
        const { count, error: countError } = await supabase
          .from('unidades')
          .select('*', { count: 'exact', head: true })
          .eq('bloco_id', bloco.id)
          .eq('is_active', true);

        if (countError) continue;

        await supabase
          .from('blocos')
          .update({ unidades_por_andar: count })
          .eq('id', bloco.id);
      }
    },
    onSuccess: () => {
      // Invalidar queries de blocos para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['blocos'] });
      queryClient.invalidateQueries({ queryKey: ['blocos-contagem'] });
    },
  });
}
```

### 2. Chamar atualização após importação

**Arquivo:** `src/components/empreendimentos/ImportarUnidadesDialog.tsx`

Na função `handleImport` (após inserir/atualizar unidades com sucesso), adicionar:

```typescript
// Após o resultado da importação
await atualizarContagemBlocos.mutateAsync(empreendimentoId);
```

## Fluxo Corrigido

```text
Importação Excel
       ↓
Criar blocos novos (se marcado "Criar novo")
       ↓
Inserir/Atualizar unidades
       ↓
[NOVO] Calcular contagem de unidades por bloco
       ↓
[NOVO] Atualizar campo unidades_por_andar de cada bloco
       ↓
Resultado: Total de Lotes preenchido ✅
```

## Resumo de Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useBlocos.ts` | Adicionar hook `useAtualizarContagemBlocos()` |
| `src/components/empreendimentos/ImportarUnidadesDialog.tsx` | Chamar atualização de contagem após importação |

## Benefício Adicional

Esta solução também corrige blocos antigos que estão com o campo vazio, pois a contagem é recalculada com base nas unidades reais cadastradas.
