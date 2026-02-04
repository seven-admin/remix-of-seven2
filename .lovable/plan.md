

# Plano: Corrigir Timeline Global + Criar Calendário do Planejamento

## Problema 1: Linhas desvinculadas na Timeline Global

### Diagnóstico
A Timeline Global usa **dois ScrollAreas independentes**:
- Sidebar (coluna de títulos) com seu próprio scroll vertical
- Área de timeline com scroll separado

Isso causa o problema de as linhas rolarem independentemente dos seus títulos.

### Solução
Reestruturar para um **layout unificado** igual à Timeline por Empreendimento:

```text
┌──────────────────────────────────────────────────────────┐
│  Controles (Zoom, etc)                                   │
├────────────────┬─────────────────────────────────────────┤
│                │  ScrollArea horizontal                  │
│   Sidebar      │  ┌─────────────────────────────────────┐│
│   (fixed)      │  │ Header sticky (datas)               ││
│                │  ├─────────────────────────────────────┤│
│   Empreend.    │  │ Grid + Barras                       ││
│   Fase         │  │ (scroll vertical junto)             ││
│   Tarefa       │  └─────────────────────────────────────┘│
└────────────────┴─────────────────────────────────────────┘
```

Alterações técnicas em `PlanejamentoGlobalTimeline.tsx`:
1. Remover ScrollArea da sidebar
2. Usar `overflow-y-auto` no container pai que envolve sidebar + timeline
3. Manter `overflow-x-auto` apenas na área de timeline
4. Sidebar fica com `position: sticky; left: 0` para não rolar horizontalmente

---

## Requisito 2: Criar Calendário de Planejamento

### Funcionalidade
Criar uma nova visualização de calendário mensal similar a `/eventos/calendario`, mostrando as tarefas de planejamento agrupadas por data.

### Diferenciação por Empreendimento
Cada empreendimento terá uma cor única (gerada ou configurável) para facilitar identificação visual.

### Estrutura

```text
┌────────────────────────────────────────────────────────────────┐
│  Calendário de Planejamento     [Hoje] [<] [>]  Fev 2026       │
├────────────────────────────────────────────────────────────────┤
│  Dom │ Seg │ Ter │ Qua │ Qui │ Sex │ Sáb                       │
├──────┼─────┼─────┼─────┼─────┼─────┼─────┤                     │
│      │  1  │  2  │  3  │  4  │  5  │  6  │                     │
│      │ ▬▬▬ │ ▬▬▬ │     │ ▬▬▬ │     │     │                     │
│      │(Res)│(Res)│     │(Com)│     │     │                     │
├──────┼─────┼─────┼─────┼─────┼─────┼─────┤                     │
│  ...                                                           │
└────────────────────────────────────────────────────────────────┘
      │
      └─ Cores por empreendimento (Residencial Aurora = azul, Comercial Centro = verde)

Legenda:
  [▬ Residencial Aurora] [▬ Comercial Centro] [▬ Outro Emp]
```

### Componente
Criar `PlanejamentoCalendario.tsx`:
- Usa estrutura similar a `EventosCalendario.tsx`
- Recebe itens do hook `usePlanejamentoGlobal`
- Gera cores para empreendimentos via hash do ID ou paleta pré-definida
- HoverCard para detalhes ao passar mouse
- Filtra tarefas que estão no intervalo de cada dia (data_inicio <= dia <= data_fim)

### Geração de Cores por Empreendimento
```typescript
// Paleta de cores distintas para empreendimentos
const EMPREENDIMENTO_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
];

// Função para obter cor consistente por ID
function getEmpreendimentoColor(empId: string, index: number): string {
  return EMPREENDIMENTO_COLORS[index % EMPREENDIMENTO_COLORS.length];
}
```

---

## Alterações de Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/planejamento/PlanejamentoGlobalTimeline.tsx` | Corrigir layout para scroll sincronizado |
| `src/components/planejamento/PlanejamentoCalendario.tsx` | **Criar** - Nova visualização calendário |
| `src/components/planejamento/PlanejamentoGlobal.tsx` | Adicionar tab "Calendário" |

---

## Detalhamento Técnico

### 1. PlanejamentoGlobalTimeline.tsx - Layout corrigido

```tsx
// Estrutura corrigida (conceito)
<Card>
  <CardHeader>{/* controles */}</CardHeader>
  <CardContent className="p-0">
    {/* Container com max-height e overflow-y-auto */}
    <div className="flex max-h-[600px] overflow-y-auto border-t">
      {/* Sidebar fixa horizontalmente mas rola verticalmente junto */}
      <div className="shrink-0 sticky left-0 bg-card z-20 border-r"
           style={{ width: SIDEBAR_WIDTH }}>
        {/* Header */}
        <div className="sticky top-0 bg-muted/50 z-30 border-b" 
             style={{ height: HEADER_HEIGHT }}>
          Empreendimento / Tarefa
        </div>
        {/* Linhas de títulos (sem scroll próprio) */}
        {linhas.map(...)}
      </div>
      
      {/* Área de timeline com scroll horizontal */}
      <div className="flex-1 overflow-x-auto">
        <div style={{ width: totalWidth }}>
          {/* Header de datas sticky */}
          <div className="sticky top-0 bg-muted/50 z-10">...</div>
          {/* Grid + barras (mesmas linhas que sidebar) */}
          {linhas.map(...)}
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

### 2. PlanejamentoCalendario.tsx - Novo componente

```tsx
interface Props {
  filters: PlanejamentoGlobalFilters;
  onFiltersChange: (f: PlanejamentoGlobalFilters) => void;
}

export function PlanejamentoCalendario({ filters, onFiltersChange }: Props) {
  const { itens } = usePlanejamentoGlobal(filters);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Mapear empreendimentos para cores
  const empColors = useMemo(() => {
    const map = new Map<string, string>();
    const uniqueEmps = [...new Set(itens?.map(i => i.empreendimento?.id))];
    uniqueEmps.forEach((id, idx) => {
      if (id) map.set(id, EMPREENDIMENTO_COLORS[idx % EMPREENDIMENTO_COLORS.length]);
    });
    return map;
  }, [itens]);
  
  // Agrupar por dia (tarefas ativas naquele dia)
  const itensPorDia = useMemo(() => {
    // Para cada dia, inclui tarefas onde data_inicio <= dia <= data_fim
    // OU data_inicio == dia OU data_fim == dia
  }, [itens]);
  
  return (
    <Card>
      {/* Header com navegação */}
      {/* Grid do calendário */}
      {/* Legenda de empreendimentos com cores */}
    </Card>
  );
}
```

### 3. PlanejamentoGlobal.tsx - Adicionar tab

```tsx
<TabsTrigger value="calendario" className="gap-2">
  <Calendar className="h-4 w-4" />
  Calendário
</TabsTrigger>

<TabsContent value="calendario" className="mt-4">
  <PlanejamentoCalendario filters={filters} onFiltersChange={setFilters} />
</TabsContent>
```

---

## Resultado Esperado

1. **Timeline Global**: Scroll vertical sincronizado - títulos e barras rolam juntos
2. **Novo Calendário**: Visualização mensal com tarefas coloridas por empreendimento
3. **Legenda**: Cores identificando cada empreendimento no calendário

---

## Benefícios

- **Usabilidade**: Timeline fica muito mais fácil de acompanhar
- **Visão temporal**: Calendário oferece perspectiva diferente do cronograma
- **Identificação visual**: Cores por empreendimento facilitam leitura rápida

