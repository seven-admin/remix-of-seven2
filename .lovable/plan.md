

# Plano: Melhorias na Timeline Global e Calendário

## Resumo das Alterações

1. **Timeline Global**: Adicionar linha de meses acima dos dias
2. **Calendário de Planejamento**: Adicionar painel lateral de detalhamento do dia selecionado

---

## Alteração 1: Meses acima dos dias na Timeline Global

### Problema
No modo de zoom "Dia", o header só mostra números (01, 02, 03...) sem indicar a qual mês pertencem, dificultando a orientação temporal quando há muitas colunas.

### Solução
Adicionar uma linha extra no header (acima dos dias) mostrando os meses. Cada mês ocupará o espaço correspondente às suas colunas.

### Visualização

```text
┌────────────────────────┬──────────────────────────┬───────────────────────────┐
│ Empreendimento/Tarefa  │      Janeiro 2026        │      Fevereiro 2026       │  ← NOVO: Meses
├────────────────────────┼──┬──┬──┬──┬──┬──┬──┬──┬──┼──┬──┬──┬──┬──┬──┬──┬──┬──┤
│                        │27│28│29│30│31│01│02│03│04│05│06│07│08│09│10│11│12│13│  ← Dias
├────────────────────────┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┼──┤
```

### Implementação em `PlanejamentoGlobalTimeline.tsx`

**A) Calcular grupos de meses:**
```typescript
const monthGroups = useMemo(() => {
  if (zoom !== 'dia') return [];
  
  const groups: { month: string; width: number; label: string }[] = [];
  let currentMonth = '';
  let currentWidth = 0;
  
  columns.forEach((col) => {
    const monthKey = format(col.date, 'yyyy-MM');
    if (monthKey !== currentMonth) {
      if (currentMonth) {
        groups.push({ 
          month: currentMonth, 
          width: currentWidth,
          label: format(parseISO(currentMonth + '-01'), 'MMMM yyyy', { locale: ptBR })
        });
      }
      currentMonth = monthKey;
      currentWidth = unitWidth;
    } else {
      currentWidth += unitWidth;
    }
  });
  
  // Adiciona último grupo
  if (currentMonth) {
    groups.push({ 
      month: currentMonth, 
      width: currentWidth,
      label: format(parseISO(currentMonth + '-01'), 'MMMM yyyy', { locale: ptBR })
    });
  }
  
  return groups;
}, [columns, zoom, unitWidth]);
```

**B) Atualizar constantes de altura:**
```typescript
const MONTH_HEADER_HEIGHT = 24; // Nova constante
const HEADER_HEIGHT = 44;       // Mantém
```

**C) Adicionar header de meses no JSX:**
```tsx
{/* Header de datas - sticky top */}
<div className="sticky top-0 bg-muted/50 z-10">
  {/* Linha de meses (apenas no zoom dia) */}
  {zoom === 'dia' && monthGroups.length > 0 && (
    <div className="flex border-b" style={{ height: MONTH_HEADER_HEIGHT }}>
      {monthGroups.map((group, idx) => (
        <div
          key={group.month}
          className="shrink-0 border-r text-center text-xs font-medium flex items-center justify-center capitalize bg-muted/80"
          style={{ width: group.width }}
        >
          {group.label}
        </div>
      ))}
    </div>
  )}
  
  {/* Linha de dias/semanas/meses */}
  <div className="flex border-b" style={{ height: HEADER_HEIGHT }}>
    {/* ... colunas existentes ... */}
  </div>
</div>
```

**D) Ajustar sidebar para alinhar com novo header:**
```tsx
{/* Header da sidebar - deve ter mesma altura que header do timeline */}
<div 
  className="sticky top-0 z-30 border-b bg-muted/50 px-3 font-medium text-sm flex items-end pb-2"
  style={{ height: zoom === 'dia' ? HEADER_HEIGHT + MONTH_HEADER_HEIGHT : HEADER_HEIGHT }}
>
  Empreendimento / Tarefa
</div>
```

---

## Alteração 2: Painel de Detalhes no Calendário

### Problema
Atualmente o calendário só mostra HoverCard ao passar o mouse. O usuário quer clicar num dia e ver os detalhes numa área fixa (como no calendário de eventos).

### Solução
Reestruturar `PlanejamentoCalendario.tsx` para ter:
- Layout de 2 colunas (calendário + detalhes)
- Ao clicar num dia, o painel lateral mostra as tarefas daquele dia
- Cores por empreendimento mantidas

### Visualização

```text
┌────────────────────────────────────────────────┬──────────────────────────┐
│             CALENDÁRIO                          │    5 de Fevereiro        │
│  ┌────┬────┬────┬────┬────┬────┬────┐          │                          │
│  │ D  │ S  │ T  │ Q  │ Q  │ S  │ S  │          │   ▬ Residencial Aurora   │
│  ├────┼────┼────┼────┼────┼────┼────┤          │   └ Tarefa XYZ           │
│  │    │    │    │    │ [5]│    │    │          │     Início: 01/02        │
│  │    │    │    │    │ ▬▬ │    │    │  ←click  │     Fim: 10/02           │
│  │    │    │    │    │    │    │    │          │     Status: Em andamento │
│  └────┴────┴────┴────┴────┴────┴────┘          │                          │
│                                                 │   ▬ Comercial Centro     │
│  [Legenda: cores por empreendimento]           │   └ Outra tarefa         │
│                                                 │     ...                  │
└────────────────────────────────────────────────┴──────────────────────────┘
```

### Implementação em `PlanejamentoCalendario.tsx`

**A) Calcular tarefas do dia selecionado:**
```typescript
const itensDoDia = useMemo(() => {
  const key = format(selectedDate, 'yyyy-MM-dd');
  return itensPorDia.get(key) || [];
}, [selectedDate, itensPorDia]);
```

**B) Layout de duas colunas:**
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Calendário */}
  <div className="lg:col-span-2">
    <Card>
      {/* ... card do calendário existente ... */}
    </Card>
  </div>

  {/* Painel de detalhes do dia */}
  <div className="lg:col-span-1">
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {itensDoDia.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            Nenhuma tarefa neste dia
          </p>
        ) : (
          <div className="space-y-3">
            {itensDoDia.map((item) => {
              const empColor = empColors.get(item.empreendimento?.id || '');
              const color = empColor?.color || '#6b7280';
              const isAtrasada = !item.status?.is_final && 
                item.data_fim && parseISO(item.data_fim) < new Date();
              
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border transition-colors"
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: color
                  }}
                >
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {item.empreendimento?.nome}
                  </p>
                  <p className="font-medium">{item.item}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{format(parseISO(item.data_inicio!), 'dd/MM')} - {format(parseISO(item.data_fim!), 'dd/MM')}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {item.status && (
                      <Badge variant="secondary" className="text-xs">
                        {item.status.nome}
                      </Badge>
                    )}
                    {isAtrasada && (
                      <Badge variant="destructive" className="text-xs">
                        Atrasada
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
</div>
```

---

## Resumo de Arquivos

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planejamento/PlanejamentoGlobalTimeline.tsx` | Adicionar linha de meses acima dos dias + ajustar alinhamento da sidebar |
| `src/components/planejamento/PlanejamentoCalendario.tsx` | Layout 2 colunas com painel de detalhes do dia selecionado |

---

## Benefícios

1. **Orientação temporal**: Meses acima dos dias facilitam identificar períodos
2. **Visibilidade persistente**: Painel lateral mantém detalhes visíveis (sem precisar hover)
3. **Consistência**: Mesmo padrão do calendário de eventos
4. **Cores mantidas**: Identificação visual por empreendimento continua funcionando

