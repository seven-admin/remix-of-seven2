

# Plano: Filtro por Mês e Toggle de Concluídos no Kanban

## Objetivo

Adicionar controles de filtragem ao Kanban de Marketing para:
1. Filtrar tickets por mês (baseado na data de previsão ou data de criação)
2. Toggle para ocultar/exibir tickets concluídos

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Tickets de Produção                                                      │
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────────┐│
│ │ [<] Janeiro 2025 [>]  [Este mês] [Mês anterior]                      ││
│ │                                        □ Ocultar concluídos          ││
│ └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ [Buscar...] [Categoria ▼] [Tipo ▼]                    [+ Novo Ticket]   │
│                                                                          │
│ [Kanban] [Lista]                                                         │
│                                                                          │
│ ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐              │
│ │Triagem │  │Produção│  │Revisão │  │Aprovação│ │Entregue│              │
│ │        │  │        │  │        │  │         │ │(oculto)│              │
│ └────────┘  └────────┘  └────────┘  └─────────┘ └────────┘              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Lógica de Filtragem

### Por Mês
Filtrar tickets cujo **mês de referência** (configurável) corresponda ao mês selecionado:

| Campo de referência | Uso |
|---------------------|-----|
| `data_previsao` | Tickets com entrega prevista no mês |
| `data_solicitacao` | Tickets criados no mês |
| `data_entrega` | Tickets entregues no mês (para histórico) |

**Recomendação:** Usar `data_previsao` como padrão (similar ao calendário de previsões).

### Ocultar Concluídos
Quando ativado, filtrar tickets onde:
- `status !== 'concluido' && status !== 'arquivado'`
- OU `ticket_etapa_id` não está em `etapasFinaisIds`

---

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/Marketing.tsx` | Modificar | Adicionar estados de filtro de mês e toggle de concluídos |
| `src/components/marketing/MarketingKanban.tsx` | Modificar | Receber props de filtros e aplicar na renderização |

---

## Detalhes Técnicos

### 1. Novos Estados na Página Marketing

```typescript
// Estados para filtro de período
const [mesSelecionado, setMesSelecionado] = useState<Date>(new Date());
const [ocultarConcluidos, setOcultarConcluidos] = useState(false);

// Navegação entre meses
const irParaMesAnterior = () => setMesSelecionado(prev => subMonths(prev, 1));
const irParaProximoMes = () => setMesSelecionado(prev => addMonths(prev, 1));
const irParaMesAtual = () => setMesSelecionado(new Date());
```

### 2. Lógica de Filtragem Atualizada

```typescript
const projetosFiltrados = useMemo(() => {
  return tickets?.filter(p => {
    // Filtro de busca
    const matchSearch = 
      p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de tipo
    const matchTipo = 
      tipoFilter === 'all' ||
      (tipoFilter === 'interno' && p.is_interno) ||
      (tipoFilter === 'externo' && !p.is_interno);
    
    // Filtro por mês (baseado em data_previsao)
    let matchMes = true;
    if (p.data_previsao) {
      const dataPrev = new Date(p.data_previsao);
      matchMes = isSameMonth(dataPrev, mesSelecionado);
    } else {
      // Tickets sem previsão: mostrar apenas no mês atual ou "todos"
      matchMes = isSameMonth(new Date(), mesSelecionado);
    }
    
    // Filtro de concluídos
    let matchConcluido = true;
    if (ocultarConcluidos) {
      const isFinal = ['concluido', 'arquivado'].includes(p.status) ||
        (p.ticket_etapa_id && etapasFinaisIds.has(p.ticket_etapa_id));
      matchConcluido = !isFinal;
    }
    
    return matchSearch && matchTipo && matchMes && matchConcluido;
  });
}, [tickets, searchTerm, tipoFilter, mesSelecionado, ocultarConcluidos, etapasFinaisIds]);
```

### 3. Componente de Seletor de Mês

Reutilizar o padrão do Forecast:

```typescript
<div className="flex items-center gap-2 mb-4 p-3 bg-muted/50 rounded-lg">
  <div className="flex items-center gap-1">
    <Button variant="ghost" size="icon" onClick={irParaMesAnterior}>
      <ChevronLeft className="h-4 w-4" />
    </Button>
    
    <span className="font-medium min-w-[140px] text-center">
      {format(mesSelecionado, 'MMMM yyyy', { locale: ptBR })}
    </span>
    
    <Button variant="ghost" size="icon" onClick={irParaProximoMes}>
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
  
  <div className="flex gap-2 ml-4">
    <Button variant="outline" size="sm" onClick={irParaMesAtual}>
      Este mês
    </Button>
    <Button variant="outline" size="sm" onClick={() => setMesSelecionado(subMonths(new Date(), 1))}>
      Mês anterior
    </Button>
  </div>
  
  <div className="flex-1" />
  
  <div className="flex items-center gap-2">
    <Checkbox
      id="ocultar-concluidos"
      checked={ocultarConcluidos}
      onCheckedChange={(checked) => setOcultarConcluidos(checked === true)}
    />
    <label htmlFor="ocultar-concluidos" className="text-sm cursor-pointer">
      Ocultar concluídos
    </label>
  </div>
</div>
```

---

## Comportamento Esperado

1. **Ao abrir a página:** Mostra o mês atual, concluídos visíveis
2. **Navegação por mês:** Setas ou botões de atalho
3. **Toggle de concluídos:** Oculta tickets em etapas finais
4. **Tickets sem data:** Aparecem no mês atual
5. **Filtros acumulativos:** Mês + Busca + Categoria + Tipo + Concluídos

---

## Interface Visual Final

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [<] Janeiro 2025 [>]   [Este mês] [Mês anterior]               │
│                                           ☑ Ocultar concluídos  │
│                                                                  │
│  [🔍 Buscar...]  [Categoria ▼]  [Tipo ▼]         [+ Novo Ticket]│
│                                                                  │
│  [Kanban] [Lista (3 atrasados)]                                  │
│                                                                  │
│  Triagem(2)    Produção(5)    Revisão(1)    Aprovação(0)        │
│  ┌─────────┐   ┌─────────┐    ┌─────────┐   ┌─────────┐         │
│  │ MKT-001 │   │ MKT-003 │    │ MKT-008 │   │         │         │
│  │ MKT-002 │   │ MKT-004 │    └─────────┘   │ (vazio) │         │
│  └─────────┘   │ ...     │                  └─────────┘         │
│                └─────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Critérios de Aceite

1. Seletor de mês visível acima dos filtros existentes
2. Navegação por setas (anterior/próximo) funcional
3. Botões de atalho "Este mês" e "Mês anterior"
4. Checkbox "Ocultar concluídos" filtra tickets em etapas finais
5. Filtros são acumulativos (todos funcionam juntos)
6. Estado persiste ao trocar entre abas Kanban/Lista
7. Tickets sem `data_previsao` aparecem no mês atual

