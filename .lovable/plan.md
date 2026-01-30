

# Plano: Exclusão de Tarefas em Lote

## Contexto

O módulo de Planejamento já possui edição em lote, mas não há opção para excluir múltiplas tarefas de uma vez. A exclusão atual é feita item a item (botão de lixeira em cada linha).

---

## Implementação

### 1. Adicionar Mutation de Exclusão em Lote no Hook

**Arquivo:** `src/hooks/usePlanejamentoItens.ts`

Adicionar nova mutation `deleteItemsBulk`:

```tsx
const deleteItemsBulk = useMutation({
  mutationFn: async (ids: string[]) => {
    const { error } = await supabase
      .from('planejamento_itens')
      .update({ is_active: false })
      .in('id', ids);

    if (error) throw error;
    return ids.length;
  },
  onSuccess: (count) => {
    queryClient.invalidateQueries({ queryKey: ['planejamento-itens'] });
    toast.success(`${count} item(ns) removido(s) com sucesso`);
  },
  onError: (error) => {
    toast.error('Erro ao remover itens: ' + error.message);
  }
});
```

---

### 2. Adicionar Botão de Exclusão na Barra Flutuante

**Arquivo:** `src/components/planejamento/PlanejamentoPlanilha.tsx`

Modificar a barra flutuante para incluir botão de exclusão com confirmação:

```tsx
{/* Barra flutuante de seleção */}
{!readOnly && selectedIds.size > 0 && (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
    <span className="text-sm font-medium">
      {selectedIds.size} item(ns) selecionado(s)
    </span>
    <Button size="sm" onClick={() => setEditEmLoteOpen(true)}>
      <Edit2 className="h-4 w-4 mr-2" />
      Editar em Lote
    </Button>
    <Button 
      size="sm" 
      variant="destructive"
      onClick={() => setExcluirEmLoteOpen(true)}  // NOVO
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Excluir
    </Button>
    <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
      Cancelar
    </Button>
  </div>
)}
```

---

### 3. Criar Dialog de Confirmação de Exclusão

**Arquivo:** `src/components/planejamento/ExcluirEmLoteDialog.tsx` (novo)

Modal de confirmação com lista resumida dos itens a serem excluídos:

```text
┌─────────────────────────────────────────────────────┐
│  Excluir Tarefas                                 ✕  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ⚠️ Atenção                                         │
│                                                     │
│  Você está prestes a excluir 5 tarefa(s).           │
│  Esta ação não pode ser desfeita.                   │
│                                                     │
│  Tarefas selecionadas:                              │
│  • Aprovar projeto arquitetônico                    │
│  • Validar memorial descritivo                      │
│  • Enviar documentação para cartório                │
│  • ...e mais 2 itens                                │
│                                                     │
│                    [Cancelar]  [Confirmar Exclusão] │
└─────────────────────────────────────────────────────┘
```

**Estrutura do componente:**

```tsx
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: Set<string>;
  items: PlanejamentoItemWithRelations[];
  empreendimentoId: string;
  onSuccess: () => void;
}

export function ExcluirEmLoteDialog({ ... }: Props) {
  const { deleteItemsBulk } = usePlanejamentoItens({ empreendimento_id: empreendimentoId });
  
  const selectedItems = items.filter(i => selectedIds.has(i.id));
  const displayLimit = 5;
  const remaining = selectedItems.length - displayLimit;

  const handleConfirm = async () => {
    await deleteItemsBulk.mutateAsync(Array.from(selectedIds));
    onSuccess();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/* Conteúdo do alert */}
    </AlertDialog>
  );
}
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/hooks/usePlanejamentoItens.ts` | Adicionar `deleteItemsBulk` mutation |
| `src/components/planejamento/PlanejamentoPlanilha.tsx` | Adicionar botão "Excluir" e integrar dialog |
| `src/components/planejamento/ExcluirEmLoteDialog.tsx` | **Criar** - Dialog de confirmação |

---

## Fluxo do Usuário

1. Usuário seleciona múltiplas tarefas via checkboxes
2. Barra flutuante aparece com opções "Editar em Lote" e "Excluir"
3. Ao clicar em "Excluir":
   - Modal de confirmação abre
   - Exibe lista resumida dos itens selecionados
   - Aviso de que a ação não pode ser desfeita
4. Ao confirmar:
   - Todas as tarefas são marcadas como `is_active: false` (soft delete)
   - Toast de sucesso é exibido
   - Seleção é limpa
   - Lista é atualizada

---

## Considerações de Segurança

- A exclusão é soft delete (mantém dados no banco)
- Apenas administradores podem ver/usar a funcionalidade (controlado por `readOnly`)
- RLS no banco já restringe DELETE/UPDATE para admins
- Confirmação obrigatória antes de executar

