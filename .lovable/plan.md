
# Plano de Correção: Usabilidade do Kanban de Negociações e Editor de Etapas

## Problemas Identificados

### 1. Cards Voltando à Origem ao Arrastar
**Sintoma:** Ao mover um card de uma coluna para outra, ele não permanece na nova posição - retorna à posição original.

**Causa Raiz:**
O componente `FunilKanbanBoard` não implementa **atualização otimista** do estado. O fluxo atual é:
1. Usuário arrasta card para nova coluna
2. `handleKanbanMove` é chamado (linha 171-195)
3. Se for etapa final, abre dialog (comportamento correto)
4. Se não for etapa final, chama `moverMutation.mutate()` 
5. **Problema:** O estado local dos cards NÃO é atualizado enquanto a mutation está pendente
6. O React Query invalida e re-busca os dados
7. Durante esse gap, o card "volta" visualmente porque o estado antigo ainda está ativo

O `KanbanBoard` genérico (linha 23-44 de KanbanBoard.tsx) chama `onMoveWithData`, mas não modifica o array `items` localmente. A biblioteca `@hello-pangea/dnd` espera que o estado seja atualizado de forma síncrona após o drop.

### 2. Ordem das Etapas Não Salva
**Sintoma:** Ao arrastar etapas para reordenar na página de Configuração de Negociações, a nova ordem não persiste.

**Causa Raiz:**
No `EtapasEditor.tsx`, o handler `handleDrop` (linhas 121-142):
1. Constrói corretamente a nova ordem localmente (`newEtapas`)
2. Chama `reordenarMutation.mutateAsync(updates)`
3. **Problema Potencial 1:** Não há atualização otimista do estado de exibição - a UI depende exclusivamente do `useQuery`
4. **Problema Potencial 2:** A query key de invalidação (`['funil_etapas']`) pode não estar sincronizada corretamente
5. **Problema Potencial 3:** Sem `staleTime` adequado, pode haver race condition entre invalidação e nova busca

O hook `useReordenarEtapas` (linhas 337-355 de useFunis.ts) executa updates individuais via `Promise.all`, o que é correto, mas a invalidação usa `queryKey: ['funil_etapas']` sem o `funilId` específico.

---

## Solução

### Correção 1: Atualização Otimista no Kanban de Negociações

**Arquivo:** `src/components/negociacoes/FunilKanbanBoard.tsx`

Implementar atualização otimista do estado para que o card permaneça visualmente na nova posição enquanto a mutation está em andamento:

```typescript
// Estado local para controlar a posição otimista
const [optimisticNegociacoes, setOptimisticNegociacoes] = useState<Negociacao[] | null>(null);

// Usar dados otimistas se disponíveis
const displayNegociacoes = optimisticNegociacoes ?? negociacoes;

// No handler de move:
const handleKanbanMove = (negociacao: Negociacao, sourceColumn: string, destinationColumn: string) => {
  if (sourceColumn === destinationColumn) return;

  const destEtapa = etapas.find(e => e.id === destinationColumn);
  if (!destEtapa) return;

  // Etapas finais: abrir dialog
  if (destEtapa.is_final_perda || destEtapa.is_final_sucesso) {
    setSelectedNegociacao(negociacao);
    setTargetEtapa(destEtapa);
    setMoverDialogOpen(true);
    return;
  }

  // ATUALIZAÇÃO OTIMISTA: Atualizar estado local imediatamente
  const updatedNegociacoes = negociacoes.map(n =>
    n.id === negociacao.id ? { ...n, funil_etapa_id: destinationColumn } : n
  );
  setOptimisticNegociacoes(updatedNegociacoes);

  // Fazer a mutation
  moverMutation.mutate(
    {
      id: negociacao.id,
      etapa_anterior_id: negociacao.funil_etapa_id,
      targetEtapa: { is_final_sucesso: false, is_final_perda: false },
      data: { funil_etapa_id: destinationColumn }
    },
    {
      onSettled: () => {
        // Limpar estado otimista após mutation (sucesso ou erro)
        setOptimisticNegociacoes(null);
      }
    }
  );
};
```

### Correção 2: Atualização Otimista no Editor de Etapas

**Arquivo:** `src/components/negociacoes/EtapasEditor.tsx`

O problema é similar: o estado visual depende da query que é invalidada, mas não há atualização otimista durante a mutation.

```typescript
// Estado local para ordem visual durante drag
const [localEtapas, setLocalEtapas] = useState<FunilEtapa[] | null>(null);

// Usar etapas locais se disponíveis
const displayEtapas = localEtapas ?? etapas;

// Sincronizar quando a query atualiza
useEffect(() => {
  if (etapas.length > 0) {
    setLocalEtapas(null); // Limpar estado local quando dados frescos chegam
  }
}, [etapas]);

// No handleDrop:
const handleDrop = async (e: React.DragEvent, targetId: string) => {
  e.preventDefault();
  if (!draggedId || draggedId === targetId) {
    setDraggedId(null);
    return;
  }

  const draggedIndex = displayEtapas.findIndex((e) => e.id === draggedId);
  const targetIndex = displayEtapas.findIndex((e) => e.id === targetId);

  // Criar nova ordem
  const newEtapas = [...displayEtapas];
  const [dragged] = newEtapas.splice(draggedIndex, 1);
  newEtapas.splice(targetIndex, 0, dragged);

  // ATUALIZAÇÃO OTIMISTA: Atualizar estado local imediatamente
  const updatedEtapas = newEtapas.map((etapa, index) => ({
    ...etapa,
    ordem: index,
  }));
  setLocalEtapas(updatedEtapas);

  // Preparar updates para o banco
  const updates = newEtapas.map((etapa, index) => ({
    id: etapa.id,
    ordem: index,
  }));

  try {
    await reordenarMutation.mutateAsync(updates);
  } catch (error) {
    // Em caso de erro, reverter para os dados da query
    setLocalEtapas(null);
  }
  
  setDraggedId(null);
};
```

### Correção 3: Melhorar Hook useReordenarEtapas

**Arquivo:** `src/hooks/useFunis.ts`

A invalidação atual usa `['funil_etapas']` que invalida TODAS as queries de etapas. Devemos ser mais específicos:

```typescript
export function useReordenarEtapas(funilId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (etapas: { id: string; ordem: number }[]) => {
      const promises = etapas.map(({ id, ordem }) =>
        supabase.from('funil_etapas').update({ ordem }).eq('id', id)
      );

      await Promise.all(promises);
    },
    onSuccess: () => {
      // Invalidar query específica do funil
      queryClient.invalidateQueries({ queryKey: ['funil_etapas', funilId] });
      // E também a de etapas padrão (usada no Kanban)
      queryClient.invalidateQueries({ queryKey: ['funil_etapas', 'padrao'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao reordenar etapas: ' + error.message);
    },
  });
}
```

E atualizar a chamada no `EtapasEditor`:
```typescript
const reordenarMutation = useReordenarEtapas(funilId);
```

---

## Resumo das Alterações

| Arquivo | Modificação |
|---------|-------------|
| `src/components/negociacoes/FunilKanbanBoard.tsx` | Adicionar estado `optimisticNegociacoes` e atualização otimista no `handleKanbanMove` |
| `src/components/negociacoes/EtapasEditor.tsx` | Adicionar estado `localEtapas` para ordem visual e atualização otimista no `handleDrop` |
| `src/hooks/useFunis.ts` | Modificar `useReordenarEtapas` para receber `funilId` e invalidar queries específicas |

---

## Detalhes Técnicos

### Por que a Atualização Otimista é Necessária?

A biblioteca `@hello-pangea/dnd` espera que a lista de itens seja atualizada de forma síncrona após um drop. Se a lista não mudar imediatamente:

1. O React reconcilia o DOM baseado no estado atual (inalterado)
2. O item arrastado é renderizado na posição original
3. Quando a query é invalidada e os novos dados chegam, o item "pula" para a nova posição

Com atualização otimista:
1. O estado local é atualizado imediatamente
2. O React reconcilia usando o novo estado
3. O item permanece na nova posição
4. Quando a mutation completa, os dados reais substituem o estado otimista

### Padrão de Implementação

```text
┌───────────────────┐
│   Usuário arrasta │
│      card         │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ handleDragEnd()   │
│ atualiza estado   │◄──── Atualização Otimista (SÍNCRONA)
│ local             │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ moverMutation()   │
│ (assíncrona)      │◄──── Chamada ao Backend
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ onSettled()       │
│ limpa estado      │◄──── Sincronização com dados reais
│ otimista          │
└───────────────────┘
```

---

## Critérios de Aceite

1. Ao arrastar um card de negociação para outra coluna, o card permanece visualmente na nova posição imediatamente
2. Se a mutation falhar, o card retorna à posição original com feedback visual
3. Ao arrastar uma etapa no editor de configuração, a nova ordem é mantida visualmente
4. A nova ordem das etapas persiste após refresh da página
5. Não há warnings de React relacionados a refs no console (corrigir console logs existentes)

---

## Correção Adicional: Warnings de forwardRef no Console

Os logs de console mostram warnings de refs em `PropostaDialog` e `AlertDialog`. Isso pode contribuir para instabilidade visual. Será necessário verificar se esses componentes usam `forwardRef` corretamente.
