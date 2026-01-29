

# Plano: Corrigir Discrepância de Status e Adicionar Lista de Tickets

## Problema Identificado

Tickets aparecem como **finalizados no Kanban** mas **atrasados no calendário/dashboard** devido a uma inconsistência na lógica de verificação:

| Local | Lógica atual |
|-------|--------------|
| **Kanban** | Usa `ticket_etapa_id` para posicionar na coluna |
| **Calendário/Dashboard** | Usa `status !== 'concluido'` para definir "atrasado" |

Quando um ticket é movido para uma etapa final (ex: "Entregue"), o `ticket_etapa_id` muda mas o `status` legado pode não ser atualizado para `'concluido'`, causando a discrepância.

---

## Solução em Duas Partes

### Parte 1: Corrigir Lógica de "Atrasado"

Atualizar o cálculo de "atrasado" em todos os locais para considerar **etapas finais**:

```typescript
// ANTES: Apenas verifica status legado
if (['concluido', 'arquivado'].includes(ticket.status)) return false;

// DEPOIS: Verifica status legado OU etapa final
if (['concluido', 'arquivado'].includes(ticket.status)) return false;
if (ticket.ticket_etapa_id && etapasFinais.has(ticket.ticket_etapa_id)) return false;
```

**Arquivos a modificar:**
1. `src/hooks/useDashboardMarketing.ts` - Buscar etapas finais e usar na lógica
2. `src/components/marketing/TicketsCalendario.tsx` - Receber prop de etapas finais
3. `src/pages/MarketingCalendario.tsx` - Passar etapas para o calendário

### Parte 2: Adicionar Aba "Lista" no Marketing

Criar uma visão em lista (similar a Atividades) para gerenciar tickets de forma rápida:

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Tickets de Produção                                                 │
│                                                                      │
│ [Kanban] [Lista] [Pendências]           [Filtros...] [+ Novo Ticket]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Aba Lista:                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ □  Código    Título          Etapa      Previsão    Ações       ││
│  │ ─────────────────────────────────────────────────────────────── ││
│  │ ☑  MKT-001   Render fachada  Produção   15/01       [▼ Etapa]   ││
│  │ □  MKT-002   Vídeo drone     Revisão    18/01       [▼ Etapa]   ││
│  │ ☑  MKT-003   Arte folder     Triagem    20/01       [▼ Etapa]   ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  [Alterar Etapa em Lote ▼]                                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/hooks/useDashboardMarketing.ts` | Modificar | Buscar etapas `is_final` e usar na lógica de atrasados |
| `src/components/marketing/TicketsCalendario.tsx` | Modificar | Receber `etapasFinais` como prop |
| `src/pages/MarketingCalendario.tsx` | Modificar | Buscar e passar etapas finais |
| `src/pages/Marketing.tsx` | Modificar | Adicionar abas (Kanban/Lista/Pendências) |
| `src/components/marketing/TicketsListaTab.tsx` | **Criar** | Componente de listagem com tabela |
| `src/hooks/useTickets.ts` | Modificar | Adicionar mutation para alterar etapa em lote |

---

## Detalhes Técnicos

### 1. Correção do Hook useDashboardMarketing

```typescript
// Buscar etapas finais no início
const { data: etapas } = await supabase
  .from('ticket_etapas')
  .select('id, nome, cor, ordem, is_final')
  .eq('is_active', true);

const etapasFinaisIds = new Set(
  (etapas || []).filter(e => e.is_final).map(e => e.id)
);

// Na lógica de ticketsAtrasados
const ticketsAtrasados = allTickets.filter(t => {
  // Ignorar se status é final
  if (['concluido', 'arquivado'].includes(t.status)) return false;
  // Ignorar se está numa etapa final
  if (t.ticket_etapa_id && etapasFinaisIds.has(t.ticket_etapa_id)) return false;
  // Verificar data
  if (!t.data_previsao) return false;
  return t.data_previsao < hojeStr;
});
```

### 2. Componente TicketsListaTab

```typescript
interface TicketsListaTabProps {
  tickets: Ticket[];
  etapas: TicketEtapa[];
  isLoading: boolean;
  onTicketClick: (id: string) => void;
  onAlterarEtapa: (ticketId: string, novaEtapaId: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onAlterarEtapaEmLote: (etapaId: string) => void;
}
```

**Funcionalidades:**
- Tabela com colunas: Checkbox, Código, Título, Categoria, Etapa, Previsão, Responsável, Ações
- Dropdown inline para alterar etapa rapidamente
- Seleção em lote via checkboxes
- Ação em lote para alterar etapa de múltiplos tickets
- Destaque visual para tickets atrasados
- Ordenação por data de previsão

### 3. Atualização da Página Marketing

```typescript
const [view, setView] = useState<'kanban' | 'lista' | 'pendencias'>('kanban');

// No JSX
<Tabs value={view} onValueChange={setView}>
  <TabsList>
    <TabsTrigger value="kanban">Kanban</TabsTrigger>
    <TabsTrigger value="lista">Lista</TabsTrigger>
    <TabsTrigger value="pendencias">
      Pendências
      {ticketsAtrasados.length > 0 && <Badge>{ticketsAtrasados.length}</Badge>}
    </TabsTrigger>
  </TabsList>
</Tabs>

{view === 'kanban' && <MarketingKanban ... />}
{view === 'lista' && <TicketsListaTab ... />}
{view === 'pendencias' && <TicketsPendenciasTab ... />}
```

### 4. Mutation para Alterar Etapa em Lote

```typescript
// Em useTickets.ts
const alterarEtapaEmLote = useMutation({
  mutationFn: async ({ ticketIds, etapaId }: { ticketIds: string[]; etapaId: string }) => {
    // Buscar info da etapa para atualizar status legado também
    const { data: etapa } = await supabase
      .from('ticket_etapas')
      .select('is_final, nome')
      .eq('id', etapaId)
      .single();
    
    const novoStatus = etapa?.is_final ? 'concluido' : 'em_producao';
    
    const { error } = await supabase
      .from('projetos_marketing')
      .update({ 
        ticket_etapa_id: etapaId,
        status: novoStatus,
        ...(etapa?.is_final && { data_entrega: new Date().toISOString().split('T')[0] })
      })
      .in('id', ticketIds);
    
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
    toast.success('Tickets atualizados!');
  }
});
```

---

## Fluxo de Uso

1. Usuário acessa `/marketing`
2. Clica na aba **"Lista"** para ver todos os tickets em tabela
3. Seleciona múltiplos tickets via checkboxes
4. Usa o dropdown **"Alterar Etapa em Lote"** para mover para "Concluído"
5. Sistema atualiza `ticket_etapa_id` E `status` simultaneamente
6. Dashboard e calendário refletem corretamente os tickets como finalizados

---

## Critérios de Aceite

1. Tickets em etapas `is_final = true` NÃO aparecem como "atrasados"
2. Nova aba "Lista" permite visualizar todos os tickets em formato tabular
3. É possível alterar a etapa de um ticket diretamente na lista (dropdown inline)
4. Seleção em lote permite alterar etapa de múltiplos tickets de uma vez
5. Aba "Pendências" mostra apenas tickets realmente atrasados (não em etapas finais)
6. Ao mover para etapa final, `status` legado é atualizado para `'concluido'`

