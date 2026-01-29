

# Plano: Corrigir Lógica de Atrasados no Portal do Incorporador

## Problema Identificado

A página `/portal-incorporador/marketing` apresenta o **mesmo bug** que foi corrigido na página principal de Marketing:

| Verificação | Status Atual |
|-------------|--------------|
| Busca `ticket_etapa_id` | ✅ Sim |
| Busca `is_final` das etapas | ❌ Não |
| Verifica etapa final nos filtros | ❌ Não |

**Resultado:** Tickets movidos para etapas finais no Kanban (ex: "Entregue") aparecem como atrasados porque o `status` legado não foi atualizado para `'concluido'`.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/portal-incorporador/PortalIncorporadorMarketing.tsx` | Incluir `is_final` na query de etapas e usar na lógica de filtragem |

---

## Alterações Técnicas

### 1. Atualizar Query de Etapas (linha 76-80)

```typescript
// ANTES
const { data: etapas } = await supabase
  .from('ticket_etapas')
  .select('id, nome, cor, ordem')
  .eq('is_active', true)
  .order('ordem');

// DEPOIS
const { data: etapas } = await supabase
  .from('ticket_etapas')
  .select('id, nome, cor, ordem, is_final')  // Adicionar is_final
  .eq('is_active', true)
  .order('ordem');
```

### 2. Criar Set de Etapas Finais (após a query)

```typescript
// Criar conjunto de IDs de etapas finais
const etapasFinaisIds = new Set(
  (etapas || []).filter(e => e.is_final).map(e => e.id)
);
```

### 3. Atualizar Filtro de KPI "Tickets Ativos" (linha 94-96)

```typescript
// ANTES
const ticketsAtivos = allTickets.filter(t => 
  !['concluido', 'arquivado'].includes(t.status)
).length;

// DEPOIS
const ticketsAtivos = allTickets.filter(t => {
  if (['concluido', 'arquivado'].includes(t.status)) return false;
  if (t.ticket_etapa_id && etapasFinaisIds.has(t.ticket_etapa_id)) return false;
  return true;
}).length;
```

### 4. Atualizar Filtro de "Tickets Atrasados" (linha 103-108)

```typescript
// ANTES
const ticketsAtrasados: TicketResumo[] = allTickets
  .filter(t => {
    if (['concluido', 'arquivado'].includes(t.status)) return false;
    if (!t.data_previsao) return false;
    return t.data_previsao < hojeStr;
  })

// DEPOIS
const ticketsAtrasados: TicketResumo[] = allTickets
  .filter(t => {
    if (['concluido', 'arquivado'].includes(t.status)) return false;
    if (t.ticket_etapa_id && etapasFinaisIds.has(t.ticket_etapa_id)) return false;
    if (!t.data_previsao) return false;
    return t.data_previsao < hojeStr;
  })
```

### 5. Atualizar Filtro de "Próximas Entregas" (linha 123-127)

```typescript
// ANTES
.filter(t => {
  if (['concluido', 'arquivado'].includes(t.status)) return false;
  if (!t.data_previsao) return false;
  return t.data_previsao >= hojeStr && t.data_previsao <= seteDiasFrente;
})

// DEPOIS
.filter(t => {
  if (['concluido', 'arquivado'].includes(t.status)) return false;
  if (t.ticket_etapa_id && etapasFinaisIds.has(t.ticket_etapa_id)) return false;
  if (!t.data_previsao) return false;
  return t.data_previsao >= hojeStr && t.data_previsao <= seteDiasFrente;
})
```

---

## Resultado Esperado

Após a correção:

1. **KPI "Tickets Ativos"** - Não conta tickets em etapas finais
2. **Lista "Tickets Atrasados"** - Não exibe tickets em etapas finais (mesmo com data vencida)
3. **Lista "Próximas Entregas"** - Não exibe tickets já finalizados
4. **Consistência** - Comportamento idêntico à página principal de Marketing

---

## Critérios de Aceite

1. Tickets em etapas com `is_final = true` não aparecem como "atrasados"
2. KPI de tickets ativos não conta tickets em etapas finais
3. Lista de próximas entregas não exibe tickets já finalizados
4. Dados são consistentes entre Portal do Incorporador e página administrativa

