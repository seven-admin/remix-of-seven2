
# Plano: Melhorar Visualização da Timeline Global

## Problema Identificado

A Timeline Global (`PlanejamentoGlobalTimeline.tsx`) tem uma visualização muito mais simples comparada à Timeline por Empreendimento (`PlanejamentoTimeline.tsx`):

| Aspecto | Timeline Empreendimento | Timeline Global |
|---------|------------------------|-----------------|
| **Grid vertical** | Linhas de grade em cada coluna | Sem linhas de grade |
| **Header fixo** | Header com `sticky top-0` funcional | Apenas `sticky` no div, mas sem estrutura adequada |
| **Destaque de hoje** | Coluna de "hoje" destacada | Sem destaque |
| **Destaque de fim de semana** | Background diferenciado | Sem diferenciação |
| **Altura das linhas** | Constantes definidas (`ROW_HEIGHT`, `HEADER_HEIGHT`) | Valores inline variados |
| **Tooltips** | Tooltip rico com informações completas | Apenas `title` simples |

---

## Solução Proposta

Aplicar o mesmo padrão visual da Timeline por Empreendimento na Timeline Global:

### 1. Adicionar Grid Vertical
- Renderizar células de grid em cada linha de tarefa (como na Timeline por Empreendimento)
- Usar bordas verticais para criar a grade visual

### 2. Melhorar Header com Sticky Funcional
- Separar estrutura em coluna fixa + área scrollável
- Header das datas realmente fixo no topo durante scroll vertical

### 3. Adicionar Destaques Visuais
- Destacar coluna de "hoje" com background diferenciado
- Marcar fins de semana (quando zoom = dia)

### 4. Padronizar Alturas e Espaçamentos
- Usar constantes para `ROW_HEIGHT`, `HEADER_HEIGHT`, `FASE_ROW_HEIGHT`
- Manter consistência visual

### 5. Adicionar Tooltips Ricos
- Usar componente `Tooltip` do shadcn/ui
- Mostrar: tarefa, datas, status, responsável

---

## Alterações Técnicas

### Arquivo: `src/components/planejamento/PlanejamentoGlobalTimeline.tsx`

#### A) Adicionar constantes de altura (topo do arquivo)
```typescript
const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 48;
const FASE_ROW_HEIGHT = 28;
const EMP_ROW_HEIGHT = 36;
```

#### B) Adicionar cálculo de coluna "hoje" e fins de semana
```typescript
const columns = useMemo(() => {
  return timeUnits.map((unit, idx) => {
    const isToday = zoom === 'dia' 
      ? format(unit, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      : zoom === 'semana'
        ? isWithinInterval(new Date(), { start: unit, end: endOfWeek(unit, { weekStartsOn: 1 }) })
        : isSameMonth(unit, new Date());
    const isWeekend = zoom === 'dia' && (unit.getDay() === 0 || unit.getDay() === 6);
    
    return {
      date: unit,
      isToday,
      isWeekend,
      label: zoom === 'dia' ? format(unit, 'dd') : zoom === 'semana' ? format(unit, 'dd/MM') : format(unit, 'MMM yy')
    };
  });
}, [timeUnits, zoom]);
```

#### C) Reestruturar layout com coluna fixa real
```typescript
<div className="relative flex">
  {/* Coluna fixa de títulos */}
  <div className="w-[280px] shrink-0 border-r bg-card z-10">
    {/* Header */}
    <div className="border-b bg-muted/50 px-3 font-medium text-sm flex items-center"
         style={{ height: HEADER_HEIGHT }}>
      Empreendimento / Tarefa
    </div>
    
    {/* Linhas de títulos... */}
  </div>

  {/* Área scrollável horizontalmente */}
  <ScrollArea className="flex-1">
    <div style={{ width: totalWidth }}>
      {/* Header de datas - sticky */}
      <div className="flex border-b sticky top-0 bg-muted/50"
           style={{ height: HEADER_HEIGHT }}>
        {columns.map((col, idx) => (
          <div key={idx} 
               className={cn("border-r text-center", col.isToday && "bg-primary/10")}
               style={{ width: unitWidth }}>
            {col.label}
          </div>
        ))}
      </div>

      {/* Grid com células por linha... */}
    </div>
  </ScrollArea>
</div>
```

#### D) Renderizar grid em cada linha de tarefa
```typescript
{/* Linha de tarefa com grid */}
<div className="flex relative" style={{ height: ROW_HEIGHT }}>
  {/* Células do grid */}
  {columns.map((col, idx) => (
    <div
      key={idx}
      className={cn(
        "border-r border-b",
        col.isWeekend && "bg-muted/10",
        col.isToday && "bg-primary/5"
      )}
      style={{ width: unitWidth }}
    />
  ))}
  
  {/* Barra da tarefa (posição absoluta sobre o grid) */}
  {style && (
    <div className="absolute h-5 top-1 rounded ..." 
         style={{ left: style.left, width: style.width }}>
    </div>
  )}
</div>
```

#### E) Adicionar Tooltips
```typescript
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Na barra da tarefa:
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="absolute h-5 ..." style={{ left, width }}>
        {/* barra */}
      </div>
    </TooltipTrigger>
    <TooltipContent>
      <p className="font-medium">{item.item}</p>
      <p className="text-muted-foreground text-xs">
        {item.data_inicio} - {item.data_fim}
      </p>
      <p className="text-xs">{item.status?.nome}</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planejamento/PlanejamentoGlobalTimeline.tsx` | Reestruturar layout com grid vertical, header fixo, destaques de hoje/fim de semana, e tooltips |

---

## Resultado Esperado

```
┌────────────────────────┬────┬────┬────┬────┬────┬────┬────┐
│ Empreendimento/Tarefa  │ 01 │ 02 │ 03 │ 04 │ 05 │ 06 │ 07 │  ← Header fixo
├────────────────────────┼────┼────┼────┼────┼────┼────┼────┤
│ ▼ Residencial Aurora   │    │    │    │    │    │    │    │  ← Empreendimento
├────────────────────────┼────┼────┼────┼────┼────┼────┼────┤
│   ● Fase 1 (3)         │    │    │    │    │    │    │    │  ← Fase
├────────────────────────┼────┼────┼────┼────┼████████│────┤
│     └ Tarefa A         │    │    │ ██████████████│    │    │  ← Tarefa com grid
├────────────────────────┼────┼────┼────┼────┼────┼────┼────┤
│     └ Tarefa B         │    │    │    │    │████│    │    │
└────────────────────────┴────┴────┴────┴────┴────┴────┴────┘
                                       ↑
                              Coluna "hoje" destacada
```

---

## Benefícios

1. **Legibilidade**: Grid facilita associar barra à data
2. **Consistência**: Mesmo padrão visual das duas timelines
3. **Orientação temporal**: Destaque de "hoje" ajuda a se localizar
4. **Informações**: Tooltips mostram detalhes sem poluir a tela
