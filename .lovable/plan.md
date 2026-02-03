
# Plano: Exibir Título das Tarefas na Timeline Global

## Problema Identificado

Na timeline global (`PlanejamentoGlobalTimeline.tsx`), as tarefas são exibidas apenas como barras coloridas. O título da tarefa (`item.item`) só aparece quando a barra tem largura maior que 60 pixels (linha 328):

```typescript
{style.width > 60 && item.item}
```

Isso causa dois problemas:
1. Tarefas com duração curta não exibem nenhum texto
2. Mesmo quando exibido, o texto fica truncado dentro da barra estreita

## Solução

Alterar o layout para exibir o título da tarefa na **coluna da esquerda** (junto com a fase), em vez de dentro da barra. Isso garante que o título seja sempre visível, independente da largura da barra.

### Nova Estrutura Visual

```text
Antes:
┌──────────────────────┬────────────────────────────────┐
│ 🟢 Fase X (3)        │  [████]  [██████]  [███]       │
└──────────────────────┴────────────────────────────────┘

Depois:
┌──────────────────────┬────────────────────────────────┐
│ 🟢 Fase X            │                                │
│   └ Tarefa 1         │  [████████████]                │
│   └ Tarefa 2         │        [██████████]            │
│   └ Tarefa 3         │              [███████]         │
└──────────────────────┴────────────────────────────────┘
```

## Alterações Técnicas

### Arquivo: `src/components/planejamento/PlanejamentoGlobalTimeline.tsx`

1. **Separar linha da fase das linhas de tarefas**: Em vez de renderizar todas as barras dentro de uma única div, criar uma linha separada para cada tarefa

2. **Adicionar coluna com título**: Cada linha de tarefa terá o título na coluna da esquerda com indentação

3. **Manter barra na área do timeline**: A barra colorida continua na área do gráfico, mas agora sincronizada com sua linha

### Código a Modificar (linhas 285-336)

Reestruturar o loop de fases para:
- Renderizar primeiro a linha de cabeçalho da fase
- Renderizar uma linha separada para cada tarefa, com:
  - Coluna esquerda: título da tarefa (com indentação)
  - Coluna direita: barra no timeline

```typescript
{/* Linha da fase (cabeçalho) */}
<div className="flex bg-muted/5">
  <div className="w-[280px] shrink-0 p-2 pl-8 border-r flex items-center gap-2">
    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: fase?.cor }} />
    <span className="text-sm font-medium">{fase?.nome || 'Sem fase'}</span>
    <span className="text-xs text-muted-foreground ml-auto">({faseItens.length})</span>
  </div>
  <div className="flex-1 h-6" />
</div>

{/* Linhas das tarefas */}
{faseItens.map((item) => {
  const style = getBarStyle(item);
  const isAtrasada = !item.status?.is_final && item.data_fim && parseISO(item.data_fim) < new Date();
  
  return (
    <div key={item.id} className="flex hover:bg-muted/10">
      {/* Título da tarefa na coluna esquerda */}
      <div className="w-[280px] shrink-0 p-1 pl-12 border-r">
        <span className="text-xs truncate block" title={item.item}>
          {item.item}
        </span>
      </div>
      {/* Barra no timeline */}
      <div className="flex-1 relative h-6">
        {style && (
          <div
            className={cn(
              "absolute h-4 top-1 rounded",
              isAtrasada && "ring-2 ring-red-500"
            )}
            style={{
              left: style.left,
              width: style.width,
              backgroundColor: fase?.cor || 'hsl(var(--primary))'
            }}
            title={`${item.data_inicio} - ${item.data_fim}`}
          />
        )}
      </div>
    </div>
  );
})}
```

## Benefícios

1. **Títulos sempre visíveis**: Independente da largura da barra
2. **Melhor legibilidade**: Texto não fica cortado dentro de barras estreitas
3. **Alinhamento claro**: Cada linha corresponde a uma única tarefa
4. **Hover por linha**: Mais fácil de interagir e identificar tarefas

## Resumo

| Arquivo | Alteração |
|---------|-----------|
| `src/components/planejamento/PlanejamentoGlobalTimeline.tsx` | Reestruturar renderização para exibir cada tarefa em sua própria linha com título na coluna esquerda |
