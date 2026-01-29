
# Plano: Filtro por Mês no Dashboard de Marketing

## Objetivo

Substituir o filtro de período (7d, 30d, 90d, todos) por um **seletor de mês** similar ao usado no Forecast, mantendo consistência visual com os outros dashboards do sistema.

---

## Comparação: Antes e Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Tipo de filtro | Período relativo (7d, 30d, 90d, all) | Mês calendário (Janeiro 2025, etc.) |
| Navegação | Dropdown select | Setas + botões de atalho |
| Lógica de dados | Data início/fim calculada com `subDays`/`subMonths` | `startOfMonth`/`endOfMonth` do mês selecionado |
| Comparação | Não tem | Pode adicionar variação vs mês anterior |

---

## Interface Proposta

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Dashboard Marketing                                                      │
│ Visão consolidada de tickets, prazos e produtividade                    │
│                                                                          │
│                     Atualizado: 14:21:18  [30s]                         │
│                                                                          │
│  [🔄] [<] Janeiro de 2025 [>] [Este mês] [Mês anterior]                 │
│       [Categoria ▼] [Tipo ▼]                        [📺 Modo TV]        │
│                                                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
│  │Ativos  │ │Produção│ │Aprovação│ │Concluídos│ │Atrasados│ │Tempo   │  │
│  │   12   │ │   5    │ │   3     │ │    8    │ │   2    │ │  4.5d  │   │
│  └────────┘ └────────┘ └────────┘ └────────────┘ └────────┘ └────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Alterações Técnicas

### 1. Estado de Competência (src/pages/DashboardMarketing.tsx)

```typescript
// REMOVER
type PeriodoFilter = '7d' | '30d' | '90d' | 'all';
const [periodo, setPeriodo] = useState<PeriodoFilter>('30d');

// ADICIONAR
const [competencia, setCompetencia] = useState(new Date());

// Calcular período baseado no mês selecionado
const filters = useMemo(() => {
  const periodoInicio = startOfMonth(competencia);
  const periodoFim = endOfMonth(competencia);
  
  return {
    periodoInicio,
    periodoFim,
    categoria: categoria === 'all' ? undefined : categoria,
    tipo: tipo === 'all' ? undefined : tipo,
  };
}, [competencia, categoria, tipo]);
```

### 2. Componente de Seletor de Mês (no PageHeader actions)

Reutilizar o mesmo padrão visual do Forecast:

```typescript
<div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
  <Button 
    variant="ghost" 
    size="icon" 
    className="h-8 w-8"
    onClick={() => setCompetencia(subMonths(competencia, 1))}
  >
    <ChevronLeft className="h-4 w-4" />
  </Button>
  <div className="min-w-[140px] text-center font-medium text-sm capitalize">
    {format(competencia, "MMMM 'de' yyyy", { locale: ptBR })}
  </div>
  <Button 
    variant="ghost" 
    size="icon" 
    className="h-8 w-8"
    onClick={() => setCompetencia(addMonths(competencia, 1))}
  >
    <ChevronRight className="h-4 w-4" />
  </Button>
</div>

{/* Atalhos rápidos */}
<div className="flex gap-1">
  <Button 
    variant={format(competencia, 'yyyy-MM') === format(new Date(), 'yyyy-MM') ? 'default' : 'outline'} 
    size="sm"
    onClick={() => setCompetencia(new Date())}
  >
    Este mês
  </Button>
  <Button 
    variant={format(competencia, 'yyyy-MM') === format(subMonths(new Date(), 1), 'yyyy-MM') ? 'default' : 'outline'} 
    size="sm"
    onClick={() => setCompetencia(subMonths(new Date(), 1))}
  >
    Mês anterior
  </Button>
</div>
```

### 3. Imports a Adicionar

```typescript
import { startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
```

### 4. Remover Código Obsoleto

- Remover a constante `PERIODO_OPTIONS`
- Remover o tipo `PeriodoFilter`
- Remover o estado `periodo`
- Remover o `<Select>` de período do PageHeader

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/DashboardMarketing.tsx` | Substituir filtro de período por seletor de mês |

---

## Comportamento do Hook (sem alterações)

O hook `useDashboardMarketing` já recebe `periodoInicio` e `periodoFim` como `Date`, portanto **não precisa de alterações**:

```typescript
// Hook já funciona assim:
const periodoInicio = filters?.periodoInicio || subWeeks(hoje, 4);
const periodoFim = filters?.periodoFim || hoje;
```

Apenas passaremos as datas do mês selecionado em vez de datas relativas.

---

## Modo TV

O modo TV também será atualizado para exibir o mês selecionado no header:

```typescript
<span className="text-sm font-medium text-primary uppercase">
  {format(competencia, "MMM/yyyy", { locale: ptBR })}
</span>
```

---

## Resultado Esperado

1. Seletor de mês com navegação por setas (← Janeiro de 2025 →)
2. Botões de atalho "Este mês" e "Mês anterior" com destaque visual quando ativos
3. Todos os KPIs e gráficos filtrados pelo mês selecionado
4. Consistência visual com o Dashboard de Forecast
5. Modo TV exibe o mês selecionado no header

---

## Critérios de Aceite

1. Navegação por setas funciona corretamente
2. Botões de atalho destacam quando o período correspondente está selecionado
3. KPIs refletem apenas dados do mês selecionado
4. Gráfico "Entregas por Semana" mostra semanas do mês selecionado
5. Listas de atrasados e próximas entregas respeitam o filtro de mês
6. Modo TV exibe o mês no header
