
# Plano: Corrigir Atualização dos Cards na Aba Visão Geral

## Problema Identificado

Os contadores dos cards na aba **Visão Geral** da página Financeiro não estão sendo atualizados após operações como criar, editar, excluir lançamentos ou registrar pagamentos.

### Causa Raiz

A query `financeiro-stats` que alimenta os dados dos cards **não está sendo invalidada** após a maioria das mutações no hook `useFinanceiro.ts`.

**Situação Atual:**
| Mutation | Invalida `lancamentos` | Invalida `financeiro-stats` |
|----------|------------------------|-----------------------------|
| useCreateLancamento | Sim | **NÃO** |
| useUpdateLancamento | Sim | **NÃO** |
| useRegistrarPagamentoLancamento | Sim | **NÃO** |
| useRegistrarPagamentoEmLote | Sim | Sim |
| useDeleteLancamento | Sim | **NÃO** |
| useAprovarLancamentos | Sim | **NÃO** |

Apenas `useRegistrarPagamentoEmLote` invalida a query `financeiro-stats`, por isso os cards só atualizam quando um pagamento em lote é registrado.

## Solução

Adicionar `queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] })` no callback `onSuccess` de todas as mutations que afetam dados financeiros.

## Alterações Necessárias

### Arquivo: `src/hooks/useFinanceiro.ts`

Adicionar invalidação da query `financeiro-stats` nas seguintes mutations:

**1. useCreateLancamento (linha 265)**
```typescript
onSuccess: (result) => {
  queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
  queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] }); // ADICIONAR
  // ...
}
```

**2. useUpdateLancamento (linha 376)**
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
  queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] }); // ADICIONAR
  toast.success('Lançamento atualizado');
}
```

**3. useRegistrarPagamentoLancamento (linha 413)**
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
  queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] }); // ADICIONAR
  toast.success('Pagamento registrado');
}
```

**4. useDeleteLancamento (linha 502)**
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
  queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] }); // ADICIONAR
  toast.success('Lançamento excluído');
}
```

**5. useAprovarLancamentos (linha 444)**
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
  queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] }); // ADICIONAR
  toast.success('Lançamentos aprovados com sucesso');
}
```

**6. useUpdateRecurringSeries (linha 315)**
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
  queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] }); // ADICIONAR
  toast.success('Série recorrente atualizada');
}
```

**7. useDeleteRecurringSeries (linha 351)**
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
  queryClient.invalidateQueries({ queryKey: ['financeiro-stats'] }); // ADICIONAR
  toast.success('Série recorrente excluída');
}
```

## Resultado Esperado

Após implementar as alterações:
- Os cards de **Saldo Inicial**, **Entradas**, **Saídas** e **Saldo Atual** serão atualizados automaticamente após qualquer operação
- Os gráficos da aba Visão Geral refletirão as mudanças em tempo real
- A experiência do usuário será consistente em toda a página

## Seção Técnica

### Query Keys Afetadas
- `lancamentos` - Lista de lançamentos filtrados por período
- `financeiro-stats` - Estatísticas agregadas (totais, saldos)

### Padrão de Invalidação
O React Query mantém as queries em cache. Ao chamar `invalidateQueries`, a query é marcada como "stale" e será refetchada quando acessada novamente ou imediatamente se estiver sendo observada por um componente ativo.

### Impacto de Performance
Mínimo - a query `financeiro-stats` é leve e retorna apenas agregações. A invalidação ocorre apenas após mutações bem-sucedidas.
